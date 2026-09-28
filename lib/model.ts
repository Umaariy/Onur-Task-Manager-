export type Role = {
    id: string;
    name: string;
    nameCyrl?: string;
    nameRu?: string;
    scope: 'workspace' | 'board';
    permissions: string[];
};
export type Member = {
    id: string;
    name: string;
    email: string;
    role: string;
    boardRole?: string;
    color: string;
    active: boolean;
    team: string;
};
export type Column = {
    id: string;
    name: string;
    color: string;
    limit: number;
    locked: boolean;
    addRoles: string[];
    moveRoles: string[];
};
export type Board = {
    id: string;
    name: string;
    description: string;
    color: string;
    visibility: 'closed' | 'workspace';
    members: Record<string, string>;
    columns: Column[];
    startColumnId?: string;
    doneColumnId?: string;
    archived: boolean;
    template: boolean;
    contributorCreate: boolean;
    viewerDownload: boolean;
};
export type Card = {
    id: string;
    number: string;
    boardId: string;
    columnId: string;
    title: string;
    description: string;
    assignees: string[];
    watchers: string[];
    labels: string[];
    priority: string;
    start: string;
    due: string;
    checklist: {
        id: string;
        text: string;
        done: boolean;
    }[];
    comments: {
        id: string;
        author: string;
        text: string;
        at: string;
    }[];
    files: {
        id: string;
        name: string;
        type: string;
        size: number;
    }[];
    private: boolean;
    allowed: string[];
    acl: Record<string, string>;
    locked: boolean;
    archived: boolean;
    dependencies: string[];
    parent: string;
    estimate: number;
    spent: number;
    createdBy: string;
    createdAt: string;
};
export type State = {
    name: string;
    description: string;
    members: Member[];
    roles: Role[];
    boards: Board[];
    cards: Card[];
    nextNumber: number;
    notifications: {
        id: string;
        userId: string;
        text: string;
        cardId: string;
        read: boolean;
        at: string;
    }[];
};
export const boardPermissions = ['view', 'column.manage', 'column.reorder', 'card.create', 'card.edit', 'card.move', 'card.delete', 'card.transfer', 'comment', 'file.upload', 'file.download', 'assign', 'deadline', 'members', 'settings', 'audit', 'export', 'share', 'acl'];
export function startColumnId(board: Board) { return board.columns.some(column => column.id === board.startColumnId) ? board.startColumnId : board.columns[0]?.id; }
export function doneColumnId(board: Board) { return board.columns.some(column => column.id === board.doneColumnId) ? board.doneColumnId : board.columns.at(-1)?.id; }
export const defaultRoles: Role[] = [{ id: 'owner', name: 'Owner', scope: 'workspace', permissions: ['*'] }, { id: 'admin', name: 'Admin', scope: 'workspace', permissions: ['manage'] }, { id: 'member', name: 'A’zo', scope: 'workspace', permissions: [] }, { id: 'guest', name: 'Mehmon', scope: 'workspace', permissions: [] }, { id: 'observer', name: 'Kuzatuvchi', scope: 'workspace', permissions: ['read'] }, { id: 'board-admin', name: 'Board Admin', scope: 'board', permissions: [...boardPermissions] }, { id: 'editor', name: 'Muharrir', scope: 'board', permissions: ['view', 'column.reorder', 'card.create', 'card.edit', 'card.move', 'card.delete', 'comment', 'file.upload', 'file.download', 'assign', 'deadline', 'audit'] }, { id: 'contributor', name: 'Hissa qo‘shuvchi', scope: 'board', permissions: ['view', 'own.edit', 'own.move', 'own.deadline', 'comment', 'file.upload', 'file.download', 'audit'] }, { id: 'commenter', name: 'Izohchi', scope: 'board', permissions: ['view', 'comment', 'file.upload', 'file.download'] }, { id: 'viewer', name: 'Ko‘ruvchi', scope: 'board', permissions: ['view'] }, { id: 'none', name: 'Kirish yo‘q', scope: 'board', permissions: [] }];
export function boardRole(s: State, u: string, b: Board) { const m = s.members.find(x => x.id === u && x.active); if (!m)
    return 'none'; if (m.role === 'owner')
    return 'board-admin'; if (m.role === 'admin')
    return b.members[u] ?? 'board-admin'; return b.members[u] ?? (b.visibility === 'workspace' && m.role !== 'guest' ? 'viewer' : 'none'); }
export function can(s: State, u: string, b: Board, action: string, c?: Card): boolean { const m = s.members.find(x => x.id === u && x.active); if (!m)
    return false; const r = boardRole(s, u, b); const base = s.roles.find(x => x.id === r)?.permissions ?? []; if (!base.includes('view'))
    return false; if (c?.private && !c.allowed.includes(u) && m.role !== 'owner' && r !== 'board-admin')
    return false; if (action === 'view')
    return true; if (b.archived && action !== 'settings')
    return false; if (c?.locked && !['acl', 'file.download', 'audit', 'export'].includes(action))
    return false; if (c && b.columns.find(x => x.id === c.columnId)?.locked && ['card.edit', 'card.move', 'card.delete', 'assign', 'deadline', 'comment', 'file.upload'].includes(action))
    return false; if (action === 'acl')
    return r === 'board-admin'; const permissions = c?.acl[u] !== undefined ? (s.roles.find(x => x.id === c.acl[u])?.permissions ?? []) : base; if (action === 'file.download' && r === 'viewer' && b.viewerDownload && c?.acl[u] === undefined)
    return true; if (action === 'card.create' && r === 'contributor' && b.contributorCreate)
    return true; if (permissions.includes(action))
    return true; return !!c && c.assignees.includes(u) && permissions.includes(action.replace('card.', 'own.').replace(/^deadline$/, 'own.deadline')); }
export function canManage(s: State, u: string) { return s.members.some(x => x.id === u && x.active && ['owner', 'admin'].includes(x.role)); }
export function emptyCard(boardId: string, columnId: string): Card { return { id: '', number: '', boardId, columnId, title: '', description: '', assignees: [], watchers: [], labels: [], priority: 'medium', start: '', due: '', checklist: [], comments: [], files: [], private: false, allowed: [], acl: {}, locked: false, archived: false, dependencies: [], parent: '', estimate: 0, spent: 0, createdBy: '', createdAt: '' }; }
export function initialState(userId = 'demo', email = 'demo@example.test', name = 'Siz'): State { const columns: Column[] = [{ id: 'plan', name: 'Rejada', color: '#8490a3', limit: 0, locked: false, addRoles: [], moveRoles: [] }, { id: 'progress', name: 'Jarayonda', color: '#377bea', limit: 5, locked: false, addRoles: [], moveRoles: [] }, { id: 'review', name: 'Tekshiruvda', color: '#e5a33b', limit: 3, locked: false, addRoles: [], moveRoles: [] }, { id: 'done', name: 'Bajarildi', color: '#20a887', limit: 0, locked: false, addRoles: [], moveRoles: ['board-admin'] }]; const members: Member[] = [{ id: userId, name, email, role: 'owner', color: '#0f9d8a', active: true, team: 'Boshqaruv' }, { id: 'sample-aziza', name: 'Aziza Karimova', email: 'aziza@example.test', role: 'member', color: '#bd75d0', active: true, team: 'Dizayn' }, { id: 'sample-javohir', name: 'Javohir Aliyev', email: 'javohir@example.test', role: 'member', color: '#538bd7', active: true, team: 'Dasturlash' }, { id: 'sample-madina', name: 'Madina Sobirova', email: 'madina@example.test', role: 'observer', color: '#dc9a51', active: true, team: 'Marketing' }]; const boards: Board[] = [{ id: 'product', name: 'Mahsulot rivojlantirish', description: 'G‘oyadan natijagacha — keyingi versiyani birga yaratamiz.', color: '#0e9f8d', visibility: 'closed', members: { [userId]: 'board-admin', 'sample-aziza': 'editor', 'sample-javohir': 'contributor', 'sample-madina': 'viewer' }, columns, archived: false, template: false, contributorCreate: true, viewerDownload: false }, { id: 'marketing', name: 'Marketing va kontent', description: 'Kontent reja, kampaniyalar va yangi g‘oyalar.', color: '#aa78db', visibility: 'workspace', members: { [userId]: 'board-admin' }, columns: structuredClone(columns), archived: false, template: false, contributorCreate: true, viewerDownload: false }, { id: 'operations', name: 'Ichki jarayonlar', description: 'Jamoaning kundalik ishlarini tartibga solamiz.', color: '#db9548', visibility: 'workspace', members: { [userId]: 'board-admin' }, columns: structuredClone(columns), archived: false, template: false, contributorCreate: true, viewerDownload: false }]; const titles = ['Foydalanuvchi intervyularini rejalash', 'Raqobatchilar tahlili', 'Bildirishnomalar markazi', 'Bosh sahifa dizaynini yangilash', 'API huquqlarini tekshirish', 'Mobil ko‘rinishni moslashtirish', 'Dizayn tizimini ko‘rib chiqish', 'Kirish sahifasini test qilish', 'Loyiha talablarini yig‘ish', 'Ish maydonini tayyorlash']; const col = ['plan', 'plan', 'plan', 'progress', 'progress', 'progress', 'review', 'review', 'done', 'done']; const dates = [3, 5, 7, 1, -1, 4, 2, 3, -3, -2]; const cards: Card[] = titles.map((title, i) => { const date = new Date(); date.setDate(date.getDate() + dates[i]); return { ...emptyCard('product', col[i]), id: 'sample-' + i, number: 'ONR-' + (101 + i), title, description: 'Maqsad va kutilayotgan natijani jamoa bilan kelishish.\n\nQabul qilish mezonlari:\n- Asosiy jarayon ko‘rib chiqilgan\n- Jamoa fikrlari hisobga olingan', assignees: [members[i % 3].id], priority: i === 4 ? 'urgent' : i % 3 === 0 ? 'high' : 'medium', due: date.toISOString().slice(0, 10), labels: [['Tadqiqot', 'Strategiya'], ['Tadqiqot'], ['Mahsulot'], ['Dizayn', 'UI/UX'], ['Dasturlash'], ['Dasturlash', 'UI/UX'], ['Dizayn'], ['Test'], ['Strategiya'], ['Mahsulot']][i], checklist: [{ id: 'a' + i, text: 'Tayyorlash', done: i > 5 }, { id: 'b' + i, text: 'Jamoa bilan tekshirish', done: i > 7 }, { id: 'c' + i, text: 'Yakunlash', done: i > 7 }], createdBy: userId, createdAt: new Date().toISOString() }; }); return { name: 'ONUR jamoasi', description: 'Birga ishlaymiz. Birga o‘samiz.', members, roles: structuredClone(defaultRoles), boards, cards, nextNumber: 111, notifications: [] }; }
