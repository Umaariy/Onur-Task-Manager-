import { identity, loadWorkspace, response, errorResponse } from '@/lib/server';
import { visibleState } from '@/lib/actions';
import { z } from 'zod';
export async function GET(req: Request) { try {
    const user = await identity();
    const q = new URL(req.url).searchParams;
    const { state } = await loadWorkspace(q.get('workspace') ?? '', user.userId);
    const page = z.coerce.number().int().min(1).parse(q.get('page') ?? 1);
    const pageSize = z.coerce.number().int().min(1).max(100).parse(q.get('pageSize') ?? 50);
    const search = (q.get('q') ?? '').toLowerCase();
    const sort = z.enum(['title', 'due', 'createdAt', 'priority']).parse(q.get('sort') ?? 'createdAt');
    const order = z.enum(['asc', 'desc']).parse(q.get('order') ?? 'desc');
    const filtered = visibleState(state, user.userId).cards.filter(c => (q.get('archived') === 'true' ? c.archived : !c.archived) && (!q.get('board') || c.boardId === q.get('board')) && (!q.get('assignee') || c.assignees.includes(q.get('assignee')!)) && (!q.get('priority') || c.priority === q.get('priority')) && (!q.get('column') || c.columnId === q.get('column')) && (!search || [c.title, c.description, c.number, ...c.comments.map(x => x.text), ...c.files.map(f => f.name)].join(' ').toLowerCase().includes(search))).sort((a, b) => String(a[sort]).localeCompare(String(b[sort])) * (order === 'asc' ? 1 : -1));
    return response({ data: filtered.slice((page - 1) * pageSize, page * pageSize), pagination: { page, pageSize, total: filtered.length, pages: Math.ceil(filtered.length / pageSize) } });
}
catch (e) {
    return errorResponse(e);
} }
