import { z } from 'zod';
import { identity, csrf, rateLimit, loadWorkspace, commit, payload, response, errorResponse, db, hash, denied } from '@/lib/server';
import { applyAction, fail } from '@/lib/actions';
import { initialState } from '@/lib/model';
import { passwordHash, validPassword } from '@/lib/auth';
export async function POST(req: Request) {
    let user;
    let workspace = '';
    let action = '';
    try {
        csrf(req);
        user = await identity();
        await rateLimit(user.userId);
        if (!req.headers.get('content-type')?.startsWith('application/json'))
            fail(415, 'CONTENT_TYPE', 'JSON kerak');
        const raw = await req.text();
        if (raw.length > 250000)
            fail(413, 'TOO_LARGE', 'So‘rov juda katta');
        const input = z.object({ workspaceId: z.string().max(100), version: z.number().int().nonnegative(), action: z.string().max(80), payload: z.record(z.any()) }).parse(JSON.parse(raw));
        workspace = input.workspaceId;
        action = input.action;
        if (action === 'workspace.create') {
            if (!user.platformAdmin) fail(403, 'FORBIDDEN', 'Yangi ish maydonini faqat asosiy administrator ochadi');
            const name = z.string().trim().min(1).max(100).parse(input.payload.name);
            const id = crypto.randomUUID();
            const state = initialState(user.userId, user.email, user.displayName);
            state.name = name;
            state.members = state.members.filter(m => m.id === user!.userId);
            state.boards = [];
            state.cards = [];
            state.nextNumber = 1;
            await db().batch([db().prepare('INSERT INTO workspaces (id,name,owner,state,version,updated_at) VALUES (?,?,?,?,1,?)').bind(id, name, user.userId, JSON.stringify(state), new Date().toISOString()), db().prepare('INSERT INTO memberships (workspace_id,user_id) VALUES (?,?)').bind(id, user.userId)]);
            return response(await payload(id, state, user, 1));
        }
        if (action === 'file.add')
            fail(400, 'INVALID_ACTION', 'Fayllar uchun alohida endpointdan foydalaning');
        if (['member.create', 'member.sessions.revoke', 'member.password.reset', 'member.password.set'].includes(action) && !user.platformAdmin)
            fail(403, 'FORBIDDEN', 'Bu amal uchun asosiy administrator huquqi kerak');
        if (['member.create', 'member.password.set'].includes(action) && !validPassword(input.payload.password))
            fail(400, 'PASSWORD', 'Parol kamida 8 belgidan iborat bo‘lsin');
        const { row, state } = await loadWorkspace(workspace, user.userId);
        if (row.version !== input.version)
            fail(409, 'VERSION_CONFLICT', 'Ma’lumot yangilangan. Qayta tekshirib saqlang.');
        const safePayload = { ...input.payload };
        delete safePayload.password;
        const change = applyAction(state, user.userId, action, safePayload);
        let inviteUrl: string | undefined;
        let resetUrl: string | undefined;
        let extra: any;
        if (action === 'member.invite') {
            const token = crypto.randomUUID() + crypto.randomUUID();
            const tokenHash = await hash(token);
            inviteUrl = '/invite?token=' + token;
            extra = (mutation: string) => [db().prepare('INSERT INTO invites (token_hash,workspace_id,member_id,email,expires_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(tokenHash, workspace, change.after.id, change.after.email, Date.now() + 7 * 86400000, workspace, mutation)];
        }
        if (action === 'member.create') {
            const exists = await db().prepare('SELECT id FROM accounts WHERE email=?').bind(change.after.email).first();
            if (exists) fail(409, 'ACCOUNT_EXISTS', 'Bu email uchun hisob allaqachon mavjud');
            const encoded = await passwordHash(input.payload.password);
            inviteUrl = '/login?email=' + encodeURIComponent(change.after.email);
            extra = (mutation: string) => [
                db().prepare('INSERT INTO accounts (id,email,password_hash,active,platform_admin,created_at) SELECT ?,?,?,1,0,? WHERE EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(change.after.id, change.after.email, encoded, new Date().toISOString(), workspace, mutation),
                db().prepare('INSERT INTO memberships (workspace_id,user_id) SELECT ?,? WHERE EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(workspace, change.after.id, workspace, mutation)
            ];
        }
        if (action === 'member.sessions.revoke')
            extra = (mutation: string) => [db().prepare('DELETE FROM sessions WHERE user_id=? AND EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(change.after.id, workspace, mutation)];
        if (action === 'member.password.reset') {
            const account = await db().prepare('SELECT id FROM accounts WHERE id=? AND active=1').bind(change.after.id).first();
            if (!account) fail(404, 'NOT_FOUND', 'Faol hisob topilmadi');
            const token = crypto.randomUUID() + crypto.randomUUID();
            resetUrl = '/reset?token=' + token;
            const tokenHash = await hash(token);
            extra = (mutation: string) => [
                db().prepare('UPDATE password_resets SET used_at=? WHERE user_id=? AND used_at IS NULL AND EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(new Date().toISOString(), change.after.id, workspace, mutation),
                db().prepare('INSERT INTO password_resets (token_hash,user_id,expires_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(tokenHash, change.after.id, Date.now() + 3600000, workspace, mutation)
            ];
        }
        if (action === 'member.password.set') {
            const account = await db().prepare('SELECT id FROM accounts WHERE id=? AND active=1').bind(change.after.id).first();
            if (!account) fail(404, 'NOT_FOUND', 'Faol hisob topilmadi');
            const encoded = await passwordHash(input.payload.password);
            extra = (mutation: string) => [
                db().prepare('UPDATE accounts SET password_hash=? WHERE id=? AND EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(encoded, change.after.id, workspace, mutation),
                db().prepare('DELETE FROM sessions WHERE user_id=? AND EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(change.after.id, workspace, mutation),
                db().prepare('UPDATE password_resets SET used_at=? WHERE user_id=? AND used_at IS NULL AND EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(new Date().toISOString(), change.after.id, workspace, mutation)
            ];
        }
        const version = await commit(workspace, input.version, user, action, change, extra);
        return response({ ...await payload(workspace, change.state, user, version), inviteUrl, resetUrl });
    }
    catch (e: any) {
        if (user && e.status === 403)
            await denied(workspace, user, action).catch(() => { });
        if (e instanceof SyntaxError)
            return response({ code: 'INVALID_JSON', message: 'JSON noto‘g‘ri', details: null }, 400);
        return errorResponse(e);
    }
}
