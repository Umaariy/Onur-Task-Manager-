import { z } from 'zod';
import { State, Board, Card, can, canManage, boardRole, emptyCard, boardPermissions, initialState, startColumnId, doneColumnId } from './model';
export class AppError extends Error {
    constructor(public status: number, public code: string, message: string) { super(message); }
}
export function fail(status: number, code: string, message: string): never { throw new AppError(status, code, message); }
const str = z.string().trim().min(1).max(200);
const ids = z.array(z.string().min(1).max(100)).max(100);
const date = z.string().refine(s => !s || /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T12:00:00Z')) && new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s, 'Sana noto‘g‘ri');
const fields = z.object({ title: str, description: z.string().max(30000), assignees: ids, watchers: ids, labels: z.array(z.string().max(40)).max(12), priority: z.enum(['low', 'medium', 'high', 'urgent']), columnId: str, start: date, due: date, checklist: z.array(z.object({ id: str, text: z.string().trim().min(1).max(500), done: z.boolean() })).max(200), dependencies: ids, parent: z.string().max(100), estimate: z.number().min(0).max(100000), spent: z.number().min(0).max(100000) });
const diff = (a: any, b: any) => JSON.stringify(a) !== JSON.stringify(b);
export type Change = {
    state: State;
    boardId: string | null;
    cardId: string | null;
    summary: string;
    before: any;
    after: any;
    security: boolean;
};
export function applyAction(original: State, user: string, action: string, p: any): Change {
    const s = structuredClone(original);
    const actor = s.members.find(m => m.id === user && m.active);
    if (!actor)
        fail(403, 'FORBIDDEN', 'Ish maydoniga kirish huquqi yo‘q');
    let boardId: string | null = null, cardId: string | null = null, before: any = null, after: any = null, summary = '', security = false;
    const getBoard = (id: string) => { const b = s.boards.find(b => b.id === id); if (!b || !can(s, user, b, 'view'))
        fail(403, 'FORBIDDEN', 'Doskaga kirish huquqi yo‘q'); boardId = b.id; return b; };
    const getCard = (id: string) => { const c = s.cards.find(c => c.id === id); if (!c)
        fail(403, 'FORBIDDEN', 'Vazifaga kirish huquqi yo‘q'); const b = getBoard(c.boardId); if (!can(s, user, b, 'view', c))
        fail(403, 'FORBIDDEN', 'Vazifaga kirish huquqi yo‘q'); cardId = c.id; return { c, b }; };
    const authorize = (b: Board, a: string, c?: Card) => { if (!can(s, user, b, a, c))
        fail(403, 'FORBIDDEN', 'Bu amal uchun huquqingiz yo‘q: ' + a); };
    const manage = () => { if (!canManage(s, user))
        fail(403, 'FORBIDDEN', 'Owner yoki Admin huquqi kerak'); };
    const membership = (list: string[]) => { if (list.some(id => !s.members.some(m => m.id === id && m.active)))
        fail(400, 'INVALID_MEMBER', 'Faol a’zoni tanlang'); };
    function target(b: Board, columnId: string, c: Card | undefined, mode: 'add' | 'move') {
        const col = b.columns.find(x => x.id === columnId);
        if (!col)
            fail(400, 'INVALID_COLUMN', 'Ustun topilmadi');
        if (col.locked)
            fail(403, 'COLUMN_LOCKED', 'Ustun qulflangan');
        const roles = mode === 'add' ? col.addRoles : col.moveRoles;
        if (roles.length && !roles.includes(boardRole(s, user, b)))
            fail(403, 'COLUMN_ROLE', 'Bu ustun uchun alohida huquq kerak');
        if (col.limit && s.cards.filter(x => x.boardId === b.id && x.columnId === col.id && !x.archived && x.id !== c?.id).length >= col.limit)
            fail(409, 'WIP_LIMIT', 'Ustundagi WIP limitga yetildi');
        if (c && col.id !== startColumnId(b) && c.dependencies.some(id => { const dep = s.cards.find(x => x.id === id); const db = s.boards.find(x => x.id === dep?.boardId); return !dep || !db || dep.columnId !== doneColumnId(db); }))
            fail(409, 'DEPENDENCY_BLOCKED', 'Avval bog‘liq vazifani yakunlang');
    }
    function notify(c: Card, text: string) { const recipients = new Set([...c.assignees, ...c.watchers]); for (const u of recipients) {
        if (u !== user)
            s.notifications.push({ id: crypto.randomUUID(), userId: u, text, cardId: c.id, read: false, at: new Date().toISOString() });
    } s.notifications = s.notifications.slice(-1000); }
    if (action === 'card.create') {
        const data = fields.parse(p);
        const b = getBoard(str.parse(p.boardId));
        authorize(b, 'card.create');
        if (!can(s, user, b, 'assign') && data.assignees.some(id => id !== user))
            fail(403, 'FORBIDDEN', 'Faqat o‘zingizga vazifa biriktira olasiz');
        membership(data.assignees);
        membership(data.watchers);
        target(b, data.columnId, undefined, 'add');
        if (data.start && data.due && data.start > data.due)
            fail(400, 'INVALID_DATE', 'Tugash sanasi boshlanishdan oldin bo‘lmasin');
        if (data.dependencies.some(id => !s.cards.some(c => c.id === id && c.boardId === b.id && can(s, user, b, 'view', c))))
            fail(400, 'INVALID_DEPENDENCY', 'Bog‘liq vazifa noto‘g‘ri');
        const c: Card = { ...emptyCard(b.id, data.columnId), ...data, id: crypto.randomUUID(), number: 'ONR-' + s.nextNumber++, createdBy: user, createdAt: new Date().toISOString() };
        s.cards.push(c);
        cardId = c.id;
        after = c;
        summary = c.number + ' · ' + c.title;
        notify(c, 'Sizga vazifa biriktirildi: ' + c.title);
    }
    else if (action === 'card.save') {
        const { c, b } = getCard(str.parse(p.id));
        const data = fields.parse(p);
        authorize(b, 'card.edit', c);
        if (diff(c.assignees, data.assignees))
            authorize(b, 'assign', c);
        if (c.due !== data.due || c.start !== data.start)
            authorize(b, 'deadline', c);
        if (c.columnId !== data.columnId) {
            authorize(b, 'card.move', c);
            target(b, data.columnId, c, 'move');
        }
        membership(data.assignees);
        membership(data.watchers);
        if (data.start && data.due && data.start > data.due)
            fail(400, 'INVALID_DATE', 'Sanalar noto‘g‘ri');
        if (data.dependencies.some(id => id === c.id || !s.cards.some(x => x.id === id && x.boardId === b.id && can(s, user, b, 'view', x))))
            fail(400, 'INVALID_DEPENDENCY', 'Bog‘liqlik noto‘g‘ri');
        const seen = new Set<string>();
        const hasCycle = (id: string): boolean => { if (id === c.id)
            return true; if (seen.has(id))
            return false; seen.add(id); return (s.cards.find(x => x.id === id)?.dependencies ?? []).some(hasCycle); };
        if (data.dependencies.some(hasCycle))
            fail(400, 'DEPENDENCY_CYCLE', 'Aylana bog‘liqlik mumkin emas');
        before = structuredClone(c);
        Object.assign(c, data);
        after = c;
        summary = c.number + ' · ' + c.title;
        notify(c, 'Vazifa yangilandi: ' + c.title);
    }
    else if (action === 'card.move') {
        const { c, b } = getCard(str.parse(p.id));
        authorize(b, 'card.move', c);
        target(b, str.parse(p.columnId), c, 'move');
        before = { columnId: c.columnId };
        c.columnId = p.columnId;
        after = { columnId: c.columnId };
        summary = c.number + ' → ' + b.columns.find(x => x.id === c.columnId)?.name;
        notify(c, 'Vazifa ko‘chirildi: ' + c.title);
    }
    else if (action === 'card.reorder') {
        const { c, b } = getCard(str.parse(p.id));
        authorize(b, 'card.move', c);
        const columnId = str.parse(p.columnId);
        if (columnId !== c.columnId)
            target(b, columnId, c, 'move');
        else if (!b.columns.some(column => column.id === columnId))
            fail(400, 'INVALID_COLUMN', 'Ustun topilmadi');
        const targetId = p.targetId == null ? null : str.parse(p.targetId);
        const afterTarget = p.after === true;
        const targetCard = targetId ? s.cards.find(card => card.id === targetId) : null;
        if (targetId && (!targetCard || targetCard.id === c.id || targetCard.boardId !== b.id || targetCard.columnId !== columnId || targetCard.archived || !can(s, user, b, 'view', targetCard)))
            fail(400, 'INVALID_TARGET', 'Vazifa joyi noto‘g‘ri');
        before = { columnId: c.columnId, index: s.cards.indexOf(c) };
        const fromColumn = c.columnId;
        s.cards.splice(s.cards.indexOf(c), 1);
        c.columnId = columnId;
        if (targetCard) {
            const index = s.cards.indexOf(targetCard) + (afterTarget ? 1 : 0);
            s.cards.splice(index, 0, c);
        }
        else {
            const last = s.cards.findLastIndex(card => card.boardId === b.id && card.columnId === columnId && !card.archived);
            s.cards.splice(last < 0 ? s.cards.length : last + 1, 0, c);
        }
        after = { columnId, index: s.cards.indexOf(c) };
        summary = c.number + ' · tartibi o‘zgardi';
        if (fromColumn !== columnId)
            notify(c, 'Vazifa ko‘chirildi: ' + c.title);
    }
    else if (action === 'card.archive' || action === 'card.delete') {
        const { c, b } = getCard(str.parse(p.id));
        authorize(b, 'card.delete', c);
        before = structuredClone(c);
        if (action === 'card.delete')
            s.cards = s.cards.filter(x => x.id !== c.id);
        else {
            const archived = z.boolean().parse(p.archived);
            if (!archived)
                target(b, c.columnId, c, 'add');
            c.archived = archived;
            after = c;
        }
        summary = c.number + ' · ' + c.title;
    }
    else if (action === 'cards.bulk') {
        const cardIds = ids.min(1).parse(p.ids);
        const rows = cardIds.map(getCard);
        if (new Set(rows.map(x => x.b.id)).size > 1)
            fail(400, 'SAME_BOARD', 'Bir doskadagi vazifalarni tanlang');
        before = rows.map(x => structuredClone(x.c));
        for (const { c, b } of rows) {
            if (p.archive) {
                authorize(b, 'card.delete', c);
                c.archived = true;
            }
            else {
                authorize(b, 'card.move', c);
                target(b, str.parse(p.columnId), c, 'move');
                c.columnId = p.columnId;
            }
        }
        after = rows.map(x => x.c);
        summary = cardIds.length + ' ta vazifa';
        cardId = null;
    }
    else if (action === 'card.acl') {
        const { c, b } = getCard(str.parse(p.id));
        authorize(b, 'acl', c);
        const data = z.object({ private: z.boolean(), locked: z.boolean(), allowed: ids, acl: z.record(z.string(), z.string()) }).parse(p);
        membership(data.allowed);
        for (const [id, role] of Object.entries(data.acl)) {
            membership([id]);
            if (!s.roles.some(r => r.id === role && r.scope === 'board' && !['none', 'board-admin'].includes(role)))
                fail(400, 'INVALID_ROLE', 'Kartochka roli noto‘g‘ri');
        }
        before = { private: c.private, locked: c.locked, allowed: c.allowed, acl: c.acl };
        Object.assign(c, data);
        after = data;
        summary = c.number + ' · huquqlar';
        security = true;
    }
    else if (action === 'comment.add' || action === 'comment.delete') {
        const { c, b } = getCard(str.parse(p.id));
        authorize(b, 'comment', c);
        if (action === 'comment.add') {
            const text = z.string().trim().min(1).max(5000).parse(p.text);
            const item = { id: crypto.randomUUID(), author: user, text, at: new Date().toISOString() };
            c.comments.push(item);
            after = item;
            for (const m of s.members)
                if (text.toLowerCase().includes('@' + m.name.split(' ')[0].toLowerCase()) && !c.watchers.includes(m.id))
                    c.watchers.push(m.id);
            notify(c, 'Yangi izoh: ' + c.title);
        }
        else {
            const comment = c.comments.find(x => x.id === p.commentId);
            if (!comment)
                fail(404, 'NOT_FOUND', 'Izoh topilmadi');
            if (comment.author !== user && boardRole(s, user, b) !== 'board-admin')
                fail(403, 'FORBIDDEN', 'Faqat o‘z izohingizni o‘chira olasiz');
            before = comment;
            c.comments = c.comments.filter(x => x.id !== p.commentId);
        }
        summary = c.number + ' · izoh';
    }
    else if (action === 'file.add') {
        const { c, b } = getCard(str.parse(p.id));
        authorize(b, 'file.upload', c);
        const data = z.object({ id: str, name: str, type: str, size: z.number().int().positive().max(10 * 1024 * 1024) }).parse(p.file);
        c.files.push(data);
        after = data;
        summary = c.number + ' · ' + data.name;
    }
    else if (action === 'board.create' || action === 'board.copy') {
        manage();
        if (s.boards.length >= 100)
            fail(400, 'LIMIT', '100 ta doska limiti');
        const src = p.template ? getBoard(p.template) : action === 'board.copy' ? getBoard(str.parse(p.id)) : null;
        if (src)
            authorize(src, 'settings');
        const b: Board = src ? structuredClone(src) : structuredClone(initialState(user).boards[0]);
        b.id = crypto.randomUUID();
        b.name = action === 'board.copy' ? src!.name + ' (nusxa)' : str.parse(p.name);
        b.description = z.string().max(2000).parse(p.description ?? src?.description ?? '');
        b.members = Object.fromEntries(s.members.filter(member => member.active && member.boardRole && s.roles.some(role => role.scope === 'board' && role.id === member.boardRole)).map(member => [member.id, member.boardRole!]));
        b.members[user] = 'board-admin';
        b.visibility = 'closed';
        b.archived = false;
        b.template = false;
        const oldCols = b.columns.map(c => c.id);
        const oldStart = startColumnId(b);
        const oldDone = doneColumnId(b);
        b.columns = b.columns.map(c => ({ ...c, id: crypto.randomUUID() }));
        b.startColumnId = b.columns[oldCols.indexOf(oldStart ?? '')]?.id ?? b.columns[0]?.id;
        b.doneColumnId = b.columns[oldCols.indexOf(oldDone ?? '')]?.id ?? b.columns.at(-1)?.id;
        s.boards.push(b);
        if (action === 'board.copy' && p.withCards) {
            for (const c of s.cards.filter(c => c.boardId === src!.id && can(s, user, src!, 'view', c))) {
                s.cards.push({ ...structuredClone(c), id: crypto.randomUUID(), number: 'ONR-' + s.nextNumber++, boardId: b.id, columnId: b.columns[oldCols.indexOf(c.columnId)]?.id ?? startColumnId(b)!, comments: [], files: [], private: false, allowed: [], acl: {}, locked: false, dependencies: [], createdBy: user, createdAt: new Date().toISOString() });
            }
        }
        boardId = b.id;
        after = b;
        summary = b.name;
    }
    else if (action === 'board.save') {
        const b = getBoard(str.parse(p.id));
        authorize(b, 'settings');
        const data = z.object({ name: str, description: z.string().max(2000), visibility: z.enum(['closed', 'workspace']), members: z.record(z.string(), z.string()), archived: z.boolean(), template: z.boolean(), contributorCreate: z.boolean(), viewerDownload: z.boolean() }).parse(p);
        for (const [id, role] of Object.entries(data.members)) {
            if (!s.members.some(m => m.id === id) || !s.roles.some(r => r.id === role && r.scope === 'board'))
                fail(400, 'INVALID_ROLE', 'Doska a’zosi yoki roli noto‘g‘ri');
        }
        if (actor.role !== 'owner' && data.members[user] !== b.members[user])
            fail(403, 'SELF_ROLE', 'O‘z doska huquqingizni o‘zgartira olmaysiz');
        before = structuredClone(b);
        Object.assign(b, data);
        after = b;
        summary = b.name;
        security = true;
    }
    else if (action === 'column.save' || action === 'column.delete' || action === 'column.reorder') {
        const b = getBoard(str.parse(p.boardId));
        authorize(b, action === 'column.reorder' ? 'column.reorder' : 'column.manage');
        before = structuredClone(b.columns);
        const col = b.columns.find(c => c.id === p.id);
        if (action === 'column.delete') {
            if (!col)
                fail(404, 'NOT_FOUND', 'Ustun topilmadi');
            if (b.columns.length === 1 || s.cards.some(c => c.boardId === b.id && c.columnId === col.id))
                fail(409, 'COLUMN_NOT_EMPTY', 'Oxirgi yoki vazifasi bor ustunni o‘chirib bo‘lmaydi');
            b.startColumnId = startColumnId(b);
            b.doneColumnId = doneColumnId(b);
            b.columns = b.columns.filter(c => c.id !== p.id);
            if (b.startColumnId === p.id) b.startColumnId = b.columns[0]?.id;
            if (b.doneColumnId === p.id) b.doneColumnId = b.columns.at(-1)?.id;
        }
        else if (action === 'column.reorder') {
            if (!col)
                fail(404, 'NOT_FOUND', 'Ustun topilmadi');
            b.startColumnId = startColumnId(b);
            b.doneColumnId = doneColumnId(b);
            const from = b.columns.indexOf(col);
            const targetId = p.targetId == null ? null : str.parse(p.targetId);
            if (targetId) {
                const target = b.columns.find(column => column.id === targetId);
                if (!target || target.id === col.id)
                    fail(400, 'INVALID_TARGET', 'Ustun joyi noto‘g‘ri');
                b.columns.splice(from, 1);
                b.columns.splice(b.columns.indexOf(target) + (p.after === true ? 1 : 0), 0, col);
            }
            else {
                const to = Math.max(0, Math.min(b.columns.length - 1, from + z.union([z.literal(-1), z.literal(1)]).parse(p.direction)));
                b.columns.splice(from, 1);
                b.columns.splice(to, 0, col);
            }
        }
        else {
            const data = z.object({ name: str, limit: z.number().int().min(0).max(1000), locked: z.boolean(), color: z.string().regex(/^#[0-9a-f]{6}$/i), addRoles: ids, moveRoles: ids }).parse(p);
            for (const role of [...data.addRoles, ...data.moveRoles])
                if (!s.roles.some(r => r.id === role && r.scope === 'board'))
                    fail(400, 'INVALID_ROLE', 'Rol noto‘g‘ri');
            if (col)
                Object.assign(col, data);
            else {
                b.startColumnId = startColumnId(b);
                b.doneColumnId = doneColumnId(b);
                b.columns.push({ ...data, id: crypto.randomUUID() });
            }
        }
        after = b.columns;
        summary = b.name + ' · ustunlar';
    }
    else if (action === 'member.save') {
        manage();
        const m = s.members.find(m => m.id === p.id);
        if (!m)
            fail(404, 'NOT_FOUND', 'A’zo topilmadi');
        const data = z.object({ name: str.optional(), role: z.enum(['owner', 'admin', 'member', 'guest', 'observer']), boardRole: z.string().max(100).optional(), active: z.boolean(), team: z.string().max(100) }).parse(p);
        if (actor.role !== 'owner' && (m.role === 'owner' || data.role === 'owner'))
            fail(403, 'OWNER_PROTECTED', 'Owner rolini faqat Owner o‘zgartiradi');
        if (m.role === 'owner' && (!data.active || data.role !== 'owner') && s.members.filter(x => x.active && x.role === 'owner').length <= 1)
            fail(409, 'LAST_OWNER', 'Oxirgi Owner huquqini olib bo‘lmaydi');
        if (data.boardRole !== undefined) {
            if (m.role === 'owner' || !s.roles.some(r => r.scope === 'board' && r.id === data.boardRole))
                fail(400, 'INVALID_ROLE', 'Doska roli noto‘g‘ri');
            for (const board of s.boards) board.members[m.id] = data.boardRole;
        }
        before = structuredClone(m);
        Object.assign(m, data);
        after = m;
        security = true;
        summary = m.name + ' → ' + data.role;
    }
    else if (action === 'member.create') {
        manage();
        const data = z.object({ name: str, email: z.string().email().max(254).transform(e => e.toLowerCase()), role: z.enum(['admin', 'member', 'guest', 'observer']), boardRole: z.string().min(1).max(100), team: z.string().max(100) }).parse(p);
        if (s.members.some(member => member.email.toLowerCase() === data.email)) fail(409, 'ALREADY_MEMBER', 'Bu email allaqachon qo‘shilgan');
        if (!s.roles.some(r => r.scope === 'board' && r.id === data.boardRole)) fail(400, 'INVALID_ROLE', 'Doska roli noto‘g‘ri');
        const member = { ...data, id: crypto.randomUUID(), color: '#668eb0', active: true };
        s.members.push(member);
        for (const board of s.boards) board.members[member.id] = data.boardRole;
        after = member;
        summary = member.email + ' · hisob yaratildi';
        security = true;
    }
    else if (action === 'member.sessions.revoke' || action === 'member.password.reset' || action === 'member.password.set') {
        manage();
        const m = s.members.find(member => member.id === p.id && member.active && !member.id.startsWith('invite-'));
        if (!m) fail(404, 'NOT_FOUND', 'Faol foydalanuvchi topilmadi');
        after = { id: m.id };
        summary = m.name + (action === 'member.sessions.revoke' ? ' · sessiyalar yopildi' : action === 'member.password.set' ? ' · parol yangilandi' : ' · parol tiklash havolasi');
        security = true;
    }
    else if (action === 'member.invite') {
        manage();
        const data = z.object({ name: str, email: z.string().email().max(254).transform(e => e.toLowerCase()), role: z.enum(['admin', 'member', 'guest', 'observer']), team: z.string().max(100) }).parse(p);
        if (s.members.some(m => m.email.toLowerCase() === data.email))
            fail(409, 'ALREADY_MEMBER', 'Bu email allaqachon qo‘shilgan');
        const m = { ...data, id: 'invite-' + crypto.randomUUID(), color: '#668eb0', active: true };
        s.members.push(m);
        after = m;
        summary = m.email + ' · taklif';
        security = true;
    }
    else if (action === 'role.save') {
        manage();
        const data = z.object({ name: str, nameCyrl: str, nameRu: str, permissions: z.array(z.enum([...boardPermissions, 'own.edit', 'own.move', 'own.deadline'] as unknown as [
                string,
                ...string[]
            ])).max(30) }).parse(p);
        if (['board-admin', 'none'].includes(p.id))
            fail(403, 'PROTECTED_ROLE', 'Asosiy boshqaruv rollari o‘zgarmaydi');
        const r = s.roles.find(r => r.id === p.id && r.scope === 'board');
        if (p.id && !r)
            fail(400, 'INVALID_ROLE', 'Rol topilmadi');
        if (r) {
            before = structuredClone(r);
            Object.assign(r, data);
            after = r;
        }
        else {
            s.roles.push({ id: crypto.randomUUID(), scope: 'board', ...data });
            after = s.roles.at(-1);
        }
        security = true;
        summary = data.name;
    }
    else if (action === 'workspace.save') {
        manage();
        const data = z.object({ name: str, description: z.string().max(2000) }).parse(p);
        before = { name: s.name, description: s.description };
        Object.assign(s, data);
        after = data;
        summary = s.name;
    }
    else if (action === 'profile.save') {
        before = { name: actor.name };
        actor.name = str.parse(p.name);
        after = { name: actor.name };
        summary = actor.name;
    }
    else if (action === 'notifications.read') {
        s.notifications.filter(n => n.userId === user).forEach(n => n.read = true);
        summary = 'Bildirishnomalar o‘qildi';
    }
    else
        fail(400, 'UNKNOWN_ACTION', 'Noma’lum amal');
    if (s.cards.length > 5000)
        fail(400, 'LIMIT', 'Ish maydonida vazifalar limiti');
    return { state: s, boardId, cardId, summary, before, after, security };
}
export function visibleState(s: State, user: string): State { const boards = s.boards.filter(b => can(s, user, b, 'view')); const cards = s.cards.filter(c => { const b = boards.find(b => b.id === c.boardId); return b && can(s, user, b, 'view', c); }); const visibleIds = new Set(cards.map(c => c.id)); const guest = s.members.find(m => m.id === user)?.role === 'guest'; return { ...s, boards: boards.map(b => ({ ...b, members: can(s, user, b, 'members') ? b.members : { [user]: boardRole(s, user, b) } })), cards: cards.map(c => ({ ...c, dependencies: c.dependencies.filter(id => visibleIds.has(id)), parent: visibleIds.has(c.parent) ? c.parent : '', acl: c.acl, allowed: c.allowed })), members: guest ? s.members.filter(m => m.id === user).map(m => ({ ...m, email: '' })) : s.members, notifications: s.notifications.filter(n => n.userId === user && (!n.cardId || visibleIds.has(n.cardId))) }; }
