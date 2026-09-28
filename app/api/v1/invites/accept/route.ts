import { currentUser, issueSession, passwordHash, sessionCookie, validPassword } from '@/lib/auth';
import { csrf, rateLimit, db, hash, commit, response, errorResponse } from '@/lib/server';
import { State } from '@/lib/model';
import { fail } from '@/lib/actions';
import { transferIdentity } from '@/lib/legacy';

export async function POST(req: Request) {
    try {
        csrf(req);
        const body = await req.json() as { token?: unknown; password?: unknown };
        if (typeof body.token !== 'string' || body.token.length < 20 || body.token.length > 200) fail(400, 'INVALID_TOKEN', 'Taklif noto‘g‘ri');
        const th = await hash(body.token);
        await rateLimit('invite:' + th);
        const invite = await db().prepare('SELECT * FROM invites WHERE token_hash=?').bind(th).first<{ workspace_id: string; member_id: string; email: string; expires_at: number; used_by: string | null }>();
        if (!invite || invite.expires_at < Date.now()) fail(403, 'EXPIRED', 'Taklif eskirgan yoki topilmadi');
        if (invite.used_by) fail(403, 'USED', 'Taklif ishlatilgan');
        const row = await db().prepare('SELECT * FROM workspaces WHERE id=?').bind(invite.workspace_id).first<{ id: string; version: number; state: string }>();
        if (!row) fail(404, 'NOT_FOUND', 'Ish maydoni topilmadi');
        const state = JSON.parse(row.state) as State;
        const member = state.members.find(item => item.id === invite.member_id);
        if (!member || !member.active) fail(403, 'REVOKED', 'Taklif bekor qilingan');
        const account = await db().prepare('SELECT id,email,active FROM accounts WHERE email=?').bind(invite.email.toLowerCase()).first<{ id: string; email: string; active: number }>();
        const signedIn = await currentUser();
        if (account && (!account.active || signedIn?.userId !== account.id)) fail(401, 'SIGN_IN_REQUIRED', 'Bu emailda hisob bor. Avval shu hisobga kiring.');
        if (!account && !validPassword(body.password)) fail(400, 'PASSWORD', 'Parol kamida 8 belgidan iborat bo‘lsin');
        const newId = account?.id ?? crypto.randomUUID();
        if (state.members.some(item => item.id === newId)) fail(409, 'ALREADY_MEMBER', 'Siz allaqachon a’zosiz');
        const changed = transferIdentity(state, invite.member_id, newId, invite.email);
        const actor = { userId: newId, email: invite.email, displayName: member.name, fullName: null, platformAdmin: false };
        const password = account ? null : await passwordHash(body.password as string);
        await commit(row.id, row.version, actor, 'invite.accept', { state: changed, boardId: null, cardId: null, before: null, after: { id: newId }, summary: member.name + ' jamoaga qo‘shildi', security: true }, mutation => [
            ...(password ? [db().prepare('INSERT INTO accounts (id,email,password_hash,active,platform_admin,created_at) SELECT ?,?,?,1,0,? WHERE EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(newId, invite.email, password, new Date().toISOString(), row.id, mutation)] : []),
            db().prepare('INSERT INTO memberships (workspace_id,user_id) SELECT ?,? WHERE EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(row.id, newId, row.id, mutation),
            db().prepare('UPDATE invites SET used_by=? WHERE token_hash=? AND used_by IS NULL AND EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(newId, th, row.id, mutation)
        ]);
        if (account) return response({ workspaceId: row.id });
        const token = await issueSession(db(), newId);
        return new Response(JSON.stringify({ workspaceId: row.id }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Set-Cookie': sessionCookie(req, token) } });
    } catch (error) { return errorResponse(error); }
}
