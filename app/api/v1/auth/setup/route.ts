import { env } from 'cloudflare:workers';
import { csrf, db, errorResponse, response } from '@/lib/server';
import { fail } from '@/lib/actions';
import { initialState } from '@/lib/model';
import { transferIdentity } from '@/lib/legacy';
import { issueSession, passwordHash, sessionCookie, validPassword } from '@/lib/auth';

export async function GET() {
    try {
        const row = await db().prepare('SELECT COUNT(*) AS count FROM accounts').first<{ count: number }>();
        return response({ setupRequired: !row?.count });
    } catch (error) { return errorResponse(error); }
}

export async function POST(req: Request) {
    try {
        csrf(req);
        if (!req.headers.get('content-type')?.startsWith('application/json')) fail(415, 'CONTENT_TYPE', 'JSON kerak');
        const body = await req.json() as Record<string, unknown>;
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) fail(400, 'EMAIL', 'Email noto‘g‘ri');
        if (!validPassword(body.password)) fail(400, 'PASSWORD', 'Parol kamida 8 belgidan iborat bo‘lsin');
        if (!env.OTM_SETUP_SECRET || body.setupSecret !== env.OTM_SETUP_SECRET) fail(403, 'SETUP_SECRET', 'Boshlang‘ich sozlash kaliti noto‘g‘ri');
        const existing = await db().prepare('SELECT COUNT(*) AS count FROM accounts').first<{ count: number }>();
        if (existing?.count) fail(409, 'ALREADY_SETUP', 'Bosh administrator allaqachon yaratilgan');
        const owners = await db().prepare('SELECT DISTINCT owner FROM workspaces').all<{ owner: string }>();
        if (owners.results.length > 1) fail(409, 'MULTIPLE_LEGACY_OWNERS', 'Bir nechta eski Owner topildi; ma’lumotlarni qo‘lda ko‘chirish kerak');
        const oldId = owners.results[0]?.owner;
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const encoded = await passwordHash(body.password);
        const queries: D1PreparedStatement[] = [db().prepare('INSERT INTO accounts (id,email,password_hash,active,platform_admin,created_at) VALUES (?,?,?,1,1,?)').bind(id, email, encoded, now)];
        if (oldId) {
            const rows = await db().prepare('SELECT id,owner,state FROM workspaces').all<{ id: string; owner: string; state: string }>();
            for (const row of rows.results) {
                const state = JSON.parse(row.state);
                if (!state.members?.some((member: { id: string }) => member.id === oldId)) continue;
                queries.push(db().prepare('UPDATE workspaces SET owner=?,state=?,updated_at=? WHERE id=?').bind(row.owner === oldId ? id : row.owner, JSON.stringify(transferIdentity(state, oldId, id, email)), now, row.id));
                queries.push(db().prepare('INSERT OR IGNORE INTO memberships (workspace_id,user_id) VALUES (?,?)').bind(row.id, id));
                queries.push(db().prepare('DELETE FROM memberships WHERE workspace_id=? AND user_id=?').bind(row.id, oldId));
            }
            queries.push(db().prepare('UPDATE file_links SET user_id=? WHERE user_id=?').bind(id, oldId));
        } else {
            const state = initialState(id, email, email);
            const workspaceId = 'w_' + crypto.randomUUID();
            queries.push(db().prepare('INSERT INTO workspaces (id,name,owner,state,version,updated_at) VALUES (?,?,?,?,1,?)').bind(workspaceId, state.name, id, JSON.stringify(state), now));
            queries.push(db().prepare('INSERT INTO memberships (workspace_id,user_id) VALUES (?,?)').bind(workspaceId, id));
        }
        await db().batch(queries);
        const token = await issueSession(db(), id);
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Set-Cookie': sessionCookie(req, token) } });
    } catch (error) { return errorResponse(error); }
}
