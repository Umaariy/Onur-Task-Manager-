import { identity, loadWorkspace, response, errorResponse, denied } from '@/lib/server';
import { can } from '@/lib/model';
import { fail } from '@/lib/actions';
export async function GET(req: Request) { let user; let id = ''; try {
    user = await identity();
    const q = new URL(req.url).searchParams;
    id = q.get('workspace') ?? '';
    const { state } = await loadWorkspace(id, user.userId);
    const b = state.boards.find(b => b.id === q.get('board'));
    if (!b || !can(state, user.userId, b, 'export'))
        fail(403, 'FORBIDDEN', 'Eksport qilish huquqi yo‘q');
    const escape = (v: unknown) => '"' + String(v ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"';
    const rows = [['Raqam', 'Vazifa', 'Ustun', 'Mas’ullar', 'Prioritet', 'Boshlanish', 'Muddat', 'Reja soat', 'Sarflangan soat'], ...state.cards.filter(c => c.boardId === b.id && !c.archived && can(state, user!.userId, b, 'view', c)).map(c => [c.number, c.title, b.columns.find(l => l.id === c.columnId)?.name, c.assignees.map(id => state.members.find(m => m.id === id)?.name).join(', '), c.priority, c.start, c.due, c.estimate, c.spent])];
    return new Response('\uFEFF' + rows.map(r => r.map(escape).join(',')).join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="onur-task-report.csv"', 'Cache-Control': 'private, no-store' } });
}
catch (e: any) {
    if (user && e.status === 403)
        await denied(id, user, 'export').catch(() => { });
    return errorResponse(e);
} }
