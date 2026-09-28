import { env } from 'cloudflare:workers';
import { identity, csrf, rateLimit, loadWorkspace, commit, payload, response, errorResponse, db, hash, denied } from '@/lib/server';
import { applyAction, fail } from '@/lib/actions';
import { can } from '@/lib/model';
const types: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', txt: 'text/plain', csv: 'text/csv' };
export async function POST(req: Request) { let user; let workspace = ''; let storedKey = ''; try {
    csrf(req);
    user = await identity();
    await rateLimit(user.userId);
    if (Number(req.headers.get('content-length') ?? 0) > 11 * 1024 * 1024)
        fail(413, 'FILE_SIZE', '10 MB gacha fayl yuklang');
    const form = await req.formData();
    const f = form.get('file');
    workspace = String(form.get('workspaceId') ?? '');
    const cardId = String(form.get('cardId') ?? '');
    const version = Number(form.get('version'));
    if (!(f instanceof File) || f.size < 1 || f.size > 10 * 1024 * 1024)
        fail(400, 'FILE_SIZE', 'Fayl hajmi 1 bayt–10 MB bo‘lsin');
    const ext = f.name.split('.').at(-1)?.toLowerCase() ?? '';
    if (!types[ext])
        fail(400, 'FILE_TYPE', 'Bu fayl turi qo‘llanmaydi');
    const { row, state } = await loadWorkspace(workspace, user.userId);
    if (row.version !== version)
        fail(409, 'VERSION_CONFLICT', 'Doska yangilangan. Qayta urinib ko‘ring.');
    const c = state.cards.find(c => c.id === cardId);
    const b = state.boards.find(b => b.id === c?.boardId);
    if (!c || !b || !can(state, user.userId, b, 'file.upload', c))
        fail(403, 'FORBIDDEN', 'Fayl yuklash huquqi yo‘q');
    if (!env.BUCKET)
        fail(503, 'STORAGE_UNAVAILABLE', 'Fayl xizmati ishlamayapti');
    const bytes = new Uint8Array(await f.arrayBuffer());
    const signature = Array.from(bytes.slice(0, 4)).map(x => x.toString(16).padStart(2, '0')).join('');
    const ok = ext === 'png' ? signature === '89504e47' : ['jpg', 'jpeg'].includes(ext) ? signature.startsWith('ffd8ff') : ext === 'pdf' ? signature === '25504446' : ['docx', 'xlsx'].includes(ext) ? signature === '504b0304' : ext === 'webp' ? new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP' : !bytes.slice(0, 4096).includes(0);
    if (!ok)
        fail(400, 'FILE_SIGNATURE', 'Fayl tarkibi kengaytmasiga mos emas');
    const file = { id: crypto.randomUUID(), name: f.name.replace(/[\x00-\x1f\\/]/g, '_').slice(0, 180), type: types[ext], size: f.size };
    const change = applyAction(state, user.userId, 'file.add', { id: cardId, file });
    storedKey = workspace + '/' + file.id;
    await env.BUCKET.put(storedKey, bytes, { httpMetadata: { contentType: file.type } });
    const next = await commit(workspace, version, user, 'file.add', change);
    storedKey = '';
    return response(await payload(workspace, change.state, user, next));
}
catch (e: any) {
    if (storedKey && env.BUCKET)
        await env.BUCKET.delete(storedKey).catch(() => { });
    if (user && e.status === 403)
        await denied(workspace, user, 'file.upload').catch(() => { });
    return errorResponse(e);
} }
export async function GET(req: Request) { let user; let workspace = ''; try {
    user = await identity();
    await rateLimit(user.userId);
    const q = new URL(req.url).searchParams;
    workspace = q.get('workspace') ?? '';
    const { state } = await loadWorkspace(workspace, user.userId);
    const c = state.cards.find(c => c.id === q.get('card'));
    const b = state.boards.find(b => b.id === c?.boardId);
    if (!c || !b || !can(state, user.userId, b, 'file.download', c))
        fail(403, 'FORBIDDEN', 'Faylni yuklab olish huquqi yo‘q');
    const file = c.files.find(f => f.id === q.get('file'));
    if (!file)
        fail(404, 'NOT_FOUND', 'Fayl topilmadi');
    const token = crypto.randomUUID() + crypto.randomUUID();
    await db().batch([db().prepare('INSERT INTO file_links (token_hash,workspace_id,user_id,card_id,file_id,expires_at) VALUES (?,?,?,?,?,?)').bind(await hash(token), workspace, user.userId, c.id, file.id, Date.now() + 300000), db().prepare('DELETE FROM file_links WHERE expires_at < ?').bind(Date.now())]);
    return response({ url: '/api/v1/download?token=' + token, expiresIn: 300 });
}
catch (e: any) {
    if (user && e.status === 403)
        await denied(workspace, user, 'file.download').catch(() => { });
    return errorResponse(e);
} }
