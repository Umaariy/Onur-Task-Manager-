import { identity, spaces, loadWorkspace, payload, response, errorResponse, denied } from '@/lib/server';
import { fail } from '@/lib/actions';
export async function GET(req: Request) { let user; let id = ''; try {
    user = await identity();
    const list = await spaces(user.userId);
    id = new URL(req.url).searchParams.get('workspace') ?? list[0]?.id ?? '';
    if (!id) fail(403, 'NO_WORKSPACE', 'Sizga hali ish maydoniga ruxsat berilmagan');
    const { row, state } = await loadWorkspace(id, user.userId);
    return response(await payload(id, state, user, row.version));
}
catch (e: any) {
    if (user && e.status === 403)
        await denied(id, user, 'workspace.read').catch(() => { });
    return errorResponse(e);
} }
