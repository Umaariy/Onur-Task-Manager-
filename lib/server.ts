import { env } from 'cloudflare:workers';
import { currentUser, AuthUser } from './auth';
import { State, can, canManage } from './model';
import { AppError, fail, visibleState, Change } from './actions';
import { ZodError } from 'zod';
export function db() { if (!env.DB)
    fail(503, 'STORAGE_UNAVAILABLE', 'Ma’lumotlar xizmati vaqtincha ishlamayapti'); return env.DB!; }
export async function identity() { const user = await currentUser(); if (!user)
    fail(401, 'UNAUTHENTICATED', 'Hisobga kirish kerak'); return user; }
export async function hash(value: string) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(b => b.toString(16).padStart(2, '0')).join(''); }
export function response(body: unknown, status = 200) { return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } }); }
export function errorResponse(error: unknown) { if (error instanceof AppError)
    return response({ code: error.code, message: error.message, details: null }, error.status); if (error instanceof ZodError)
    return response({ code: 'VALIDATION', message: 'Kiritilgan ma’lumotni tekshiring', details: error.issues.map(x => ({ path: x.path, message: x.message })) }, 400); console.error('ONUR Task Manager request failed', error instanceof Error ? error.message : 'unknown'); return response({ code: 'INTERNAL_ERROR', message: 'Amal bajarilmadi. Qayta urinib ko‘ring.', details: null }, 500); }
export function csrf(req: Request) { const origin = req.headers.get('Origin'); if (origin && origin !== new URL(req.url).origin)
    fail(403, 'CROSS_ORIGIN', 'Boshqa saytdan yozish taqiqlangan'); if (req.headers.get('Sec-Fetch-Site') === 'cross-site')
    fail(403, 'CROSS_ORIGIN', 'Boshqa saytdan yozish taqiqlangan'); }
export async function rateLimit(user: string) { const now = Date.now(); const key = user + ':' + Math.floor(now / 60000); const row = await db().prepare('INSERT INTO rate_windows (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key, now + 120000).first<{
    count: number;
}>(); if ((row?.count ?? 0) > 120)
    fail(429, 'RATE_LIMIT', 'Juda ko‘p so‘rov. Bir daqiqadan keyin urinib ko‘ring.'); await db().prepare('DELETE FROM rate_windows WHERE expires_at < ?').bind(now).run(); }
export type WorkspaceRow = {
    id: string;
    name: string;
    owner: string;
    state: string;
    version: number;
    updated_at: string;
};
export async function loadWorkspace(id: string, user: string) { const row = await db().prepare('SELECT w.* FROM workspaces w JOIN memberships m ON m.workspace_id=w.id WHERE w.id=? AND m.user_id=?').bind(id, user).first<WorkspaceRow>(); if (!row)
    fail(403, 'FORBIDDEN', 'Ish maydoniga ruxsat yo‘q'); const state = JSON.parse(row.state) as State; if (!state.members.some(m => m.id === user && m.active))
    fail(403, 'DEACTIVATED', 'Hisob bu ish maydonida bloklangan'); return { row, state }; }
export async function spaces(user: string) { const result = await db().prepare('SELECT w.id,w.name,w.state FROM workspaces w JOIN memberships m ON m.workspace_id=w.id WHERE m.user_id=? ORDER BY w.updated_at DESC').bind(user).all<{
    id: string;
    name: string;
    state: string;
}>(); return result.results.filter(w => (JSON.parse(w.state) as State).members.some(m => m.id === user && m.active)).map(w => ({ id: w.id, name: w.name })); }
export async function denied(workspace: string, user: AuthUser, action: string) { await db().prepare('INSERT INTO audit (id,workspace_id,actor,actor_name,action,summary,security,created_at) VALUES (?,?,?,?,?,?,1,?)').bind(crypto.randomUUID(), workspace, user.userId, user.displayName, 'denied:' + action, 'Ruxsatsiz amal bloklandi', new Date().toISOString()).run(); }
export async function getActivity(id: string, state: State, user: string) { const result = await db().prepare('SELECT id,actor,actor_name,action,board_id,card_id,summary,security,created_at FROM audit WHERE workspace_id=? ORDER BY created_at DESC LIMIT 200').bind(id).all<any>(); return result.results.filter(a => { if (a.board_id) {
    const b = state.boards.find(b => b.id === a.board_id);
    if (!b || !can(state, user, b, 'view'))
        return false;
    if (a.card_id) {
        const c = state.cards.find(c => c.id === a.card_id);
        if (c && !can(state, user, b, 'view', c))
            return false;
    }
} if (a.security)
    return canManage(state, user); if (!a.board_id)
    return canManage(state, user) || a.actor === user; const b = state.boards.find(b => b.id === a.board_id); if (!b || !can(state, user, b, 'audit'))
    return false; if (a.card_id) {
    const c = state.cards.find(c => c.id === a.card_id);
    return c ? can(state, user, b, 'view', c) : canManage(state, user);
} return true; }); }
export async function payload(id: string, state: State, user: AuthUser, version: number) { return { workspaceId: id, userId: user.userId, platformAdmin: user.platformAdmin, version, state: visibleState(state, user.userId), workspaces: await spaces(user.userId), activity: await getActivity(id, state, user.userId) }; }
export async function commit(id: string, version: number, user: AuthUser, action: string, change: Change, extras?: (mutation: string) => D1PreparedStatement[]) { const mutation = crypto.randomUUID(); const now = new Date().toISOString(); const queries = [db().prepare('UPDATE workspaces SET state=?,name=?,version=version+1,updated_at=?,last_mutation=? WHERE id=? AND version=?').bind(JSON.stringify(change.state), change.state.name, now, mutation, id, version), db().prepare('INSERT INTO audit (id,workspace_id,actor,actor_name,action,board_id,card_id,summary,before,after,security,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM workspaces WHERE id=? AND last_mutation=?)').bind(crypto.randomUUID(), id, user.userId, user.displayName, action, change.boardId, change.cardId, change.summary, change.before ? JSON.stringify(change.before) : null, change.after ? JSON.stringify(change.after) : null, change.security ? 1 : 0, now, id, mutation), ...(extras?.(mutation) ?? [])]; const result = await db().batch(queries); if (result[0].meta.changes !== 1)
    fail(409, 'VERSION_CONFLICT', 'Boshqa foydalanuvchi ma’lumotni yangiladi. O‘zgarishingizni tekshirib, qayta saqlang.'); return version + 1; }
