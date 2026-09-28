import { env } from 'cloudflare:workers';
import { db, hash, loadWorkspace, errorResponse } from '@/lib/server';
import { fail } from '@/lib/actions';
import { can } from '@/lib/model';
export async function GET(req: Request) { try {
    const token = new URL(req.url).searchParams.get('token') ?? '';
    if (token.length > 200)
        fail(403, 'INVALID_LINK', 'Havola noto‘g‘ri');
    const link = await db().prepare('SELECT * FROM file_links WHERE token_hash=? AND expires_at>?').bind(await hash(token), Date.now()).first<any>();
    if (!link)
        fail(403, 'LINK_EXPIRED', 'Havola eskirgan. Faylni qayta oching.');
    const { state } = await loadWorkspace(link.workspace_id, link.user_id);
    const c = state.cards.find(c => c.id === link.card_id);
    const b = state.boards.find(b => b.id === c?.boardId);
    if (!c || !b || !can(state, link.user_id, b, 'file.download', c))
        fail(403, 'FORBIDDEN', 'Faylga ruxsat bekor qilingan');
    const f = c.files.find(f => f.id === link.file_id);
    if (!f)
        fail(404, 'NOT_FOUND', 'Fayl topilmadi');
    const object = await env.BUCKET?.get(link.workspace_id + '/' + f.id);
    if (!object)
        fail(404, 'NOT_FOUND', 'Fayl topilmadi');
    return new Response(object.body, { headers: { 'Content-Type': f.type, 'Content-Length': String(f.size), 'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(f.name), 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox" } });
}
catch (e) {
    return errorResponse(e);
} }
