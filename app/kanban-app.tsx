'use client';
import { shortDate, fullDate, monthTitle } from '@/lib/dates';
import { createContext, useContext, useEffect, useLayoutEffect, useState, useRef } from 'react';
import { LayoutDashboard, Columns3, CheckCheck, CalendarDays, Users, ChartNoAxesCombined, Settings, Search, Plus, ChevronDown, ChevronRight, Bell, Star, LockKeyhole, SlidersHorizontal, List, MoreHorizontal, MessageSquare, Paperclip, ArrowUpRight, X, Check, Menu, Layers, ArrowRight, History, LogOut, Moon, Sun, Home, FolderKanban, Trash2, Archive, Copy, Download, GripVertical, ShieldCheck, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { initialState, State, Card, Board, Member, can, canManage, emptyCard, boardRole, boardPermissions, startColumnId, doneColumnId } from '@/lib/model';
import { languageOptions, Locale, countLabel, permissionLabel, roleLabel, roleNameFields, translate, translateNotice, translatePreset } from '@/lib/i18n';
import { LanguageMenu, PasswordField } from './auth-controls';
import StyledSelect from './styled-select';
const LanguageContext = createContext<Locale>('uz-Latn');
const DesignContext = createContext<'a' | 'b'>('a');
const useT = () => { const locale = useContext(LanguageContext); return (source: string) => translate(source, locale); };
/** Element under the pointer, ignoring the element being dragged. */
const hitAt = (x: number, y: number, skip: HTMLElement) => document.elementsFromPoint(x, y).find(node => !skip.contains(node));
let lastMoved = { id: '', at: 0 };
function useDragAutoScroll() {
    const frame = useRef<number | null>(null);
    const point = useRef<{ board: HTMLElement; x: number } | null>(null);
    const highlighted = useRef<HTMLElement | null>(null);
    const stop = () => { if (frame.current !== null) cancelAnimationFrame(frame.current); highlighted.current?.classList.remove('drop-target'); highlighted.current = null; frame.current = null; point.current = null; };
    const update = (element: HTMLElement, x: number, y: number, kind: 'card' | 'column') => {
        const board = element.closest<HTMLElement>('.kanban');
        point.current = board ? { board, x } : null;
        const target = hitAt(x, y, element)?.closest<HTMLElement>(kind === 'column' ? '[data-column]' : '[data-card-id], [data-column]') ?? null;
        if (highlighted.current !== target) { highlighted.current?.classList.remove('drop-target'); target?.classList.add('drop-target'); highlighted.current = target; }
        if (frame.current !== null || !board) return;
        const tick = () => {
            const current = point.current;
            if (!current) { frame.current = null; return; }
            const rect = current.board.getBoundingClientRect();
            if (current.x < rect.left + 56) current.board.scrollLeft -= 18;
            else if (current.x > rect.right - 56) current.board.scrollLeft += 18;
            frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
    };
    useEffect(() => stop, []);
    return { update, stop };
}
const names: Record<string, string> = { home: 'Bosh sahifa', boards: 'Barcha doskalar', mine: 'Mening vazifalarim', calendar: 'Kalendar', members: 'Jamoa a’zolari', reports: 'Hisobotlar', activity: 'Faoliyat tarixi', settings: 'Sozlamalar', notifications: 'Bildirishnomalar', archive: 'Arxiv' };
type Dialog = {
    kind: string;
    data: any;
};
export default function KanbanApp({ design = 'a' }: { design?: 'a' | 'b' }) {
    const [state, setState] = useState<State>(() => initialState());
    const [user, setUser] = useState('demo');
    const [platformAdmin, setPlatformAdmin] = useState(false);
    const [workspace, setWorkspace] = useState('');
    const [spaces, setSpaces] = useState<{
        id: string;
        name: string;
    }[]>([]);
    const [version, setVersion] = useState(0);
    const [boardId, setBoardId] = useState('product');
    const [view, setView] = useState(design === 'b' ? 'kanban' : 'home');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Card | null>(null);
    const [draftVersion, setDraftVersion] = useState(0);
    const [notice, setNotice] = useState('');
    const [nav, setNav] = useState(false);
    const [priority, setPriority] = useState('');
    const [assignee, setAssignee] = useState('');
    const [deadline, setDeadline] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [activity, setActivity] = useState<any[]>([]);
    const [comment, setComment] = useState('');
    const [checkText, setCheckText] = useState('');
    const [favorites, setFavorites] = useState<string[]>([]);
    const [dark, setDark] = useState(false);
    const [locale, setLocale] = useState<Locale>('uz-Latn');
    const t = (source: string) => translate(source, locale);
    const [month, setMonth] = useState(new Date());
    const [chosen, setChosen] = useState<string[]>([]);
    const [inviteResult, setInviteResult] = useState('');
    const board = state.boards.find(b => b.id === boardId) ?? state.boards[0];
    const boardView = ['kanban', 'list'].includes(view);
    const me = state.members.find(m => m.id === user);
    const memberBoardRoleId = (member: Member) => member.boardRole ?? state.boards.map(item => item.members[member.id]).find(Boolean) ?? (member.role === 'admin' ? 'board-admin' : '');
    const memberRoleLabel = (member?: Member) => { if (!member) return t('Namuna rejimi'); const id = member.role === 'owner' ? 'owner' : memberBoardRoleId(member); if (!id) return t('Rol berilmagan'); const role = state.roles.find(item => item.id === id); return roleLabel(id, role?.name ?? id, locale, role); };
    const unread = state.notifications.filter(n => !n.read).length;
    const prevUnread = useRef(unread);
    const [ringing, setRinging] = useState(false);
    useEffect(() => { const before = prevUnread.current; prevUnread.current = unread; if (unread <= before) return; setRinging(true); const timer = setTimeout(() => setRinging(false), 1300); return () => clearTimeout(timer); }, [unread]);
    const stateRef = useRef(state);
    stateRef.current = state;
    const refreshRef = useRef<() => Promise<void>>(async () => { });
    async function refresh(id = workspace) { try {
        const r = await fetch('/api/v1/workspace' + (id ? '?workspace=' + encodeURIComponent(id) : ''));
        if (r.status === 401) {
            location.href = '/login';
            return;
        }
        const d: any = await r.json();
        if (!r.ok) {
            if (r.status === 403) {
                setState({ ...initialState(user), boards: [], cards: [], members: [], notifications: [] });
                setSelected(null);
                setDialog(null);
                setView('boards');
            }
            throw Error(d.message);
        }
        setState(d.state);
        setSelected(current => current?.id && !d.state.cards.some((card: Card) => card.id === current.id) ? null : current);
        setUser(d.userId);
        setPlatformAdmin(Boolean(d.platformAdmin));
        setWorkspace(d.workspaceId);
        setSpaces(d.workspaces);
        setVersion(d.version);
        setActivity(d.activity ?? []);
    }
    catch (e: any) {
        setNotice(e.message || 'Ma’lumotlarni yuklab bo‘lmadi');
    }
    finally {
        setLoading(false);
    } }
    refreshRef.current = () => refresh();
    // Pull down at the top of the page to reload the data (phones and installed app have no reload button).
    const [pull, setPull] = useState(0);
    const [pulling, setPulling] = useState(false);
    const pullStart = useRef<{ x: number; y: number; active: boolean } | null>(null);
    const pullDistance = useRef(0);
    const blocked = useRef(false);
    blocked.current = !!selected || !!dialog || pulling;
    useEffect(() => {
        const start = (e: TouchEvent) => {
            if (blocked.current || window.scrollY > 0 || e.touches.length !== 1) { pullStart.current = null; return; }
            if ((e.target as Element).closest('.kanban, .modal, .user-pop, input, textarea')) { pullStart.current = null; return; }
            pullStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: false };
        };
        const move = (e: TouchEvent) => {
            const s = pullStart.current;
            if (!s) return;
            const dx = e.touches[0].clientX - s.x, dy = e.touches[0].clientY - s.y;
            if (!s.active) { if (Math.abs(dx) > Math.abs(dy) || dy < 8) { if (Math.abs(dx) > 10 || dy < -4) pullStart.current = null; return; } s.active = true; }
            if (e.cancelable) e.preventDefault();
            pullDistance.current = Math.min(110, dy * 0.5);
            setPull(pullDistance.current);
        };
        const end = () => {
            const s = pullStart.current; pullStart.current = null;
            if (!s?.active) return;
            if (pullDistance.current >= 64) {
                setPull(64); setPulling(true);
                void refreshRef.current().finally(() => { setPulling(false); setPull(0); pullDistance.current = 0; setNotice('Ma’lumotlar yangilandi'); });
            } else { setPull(0); pullDistance.current = 0; }
        };
        document.addEventListener('touchstart', start, { passive: true });
        document.addEventListener('touchmove', move, { passive: false });
        document.addEventListener('touchend', end);
        document.addEventListener('touchcancel', end);
        return () => { document.removeEventListener('touchstart', start); document.removeEventListener('touchmove', move); document.removeEventListener('touchend', end); document.removeEventListener('touchcancel', end); };
    }, []);
    useEffect(() => { const q = new URLSearchParams(location.search); const id = q.get('workspace') ?? ''; const b = q.get('board'); if (b)
        setBoardId(b); setSearch(q.get('q') ?? ''); setPriority(q.get('priority') ?? ''); setAssignee(q.get('assignee') ?? ''); setDeadline(q.get('deadline') ?? ''); const startView = q.get('view'); if (startView && names[startView] && !(design === 'b' && startView === 'home')) setView(startView); void refresh(id); try {
        setFavorites(JSON.parse(localStorage.getItem('oqim-favorites') ?? '[]'));
        setDark(localStorage.getItem('oqim-dark') === 'true');
        const savedLocale = localStorage.getItem('onur-locale');
        if (languageOptions.some(option => option.value === savedLocale)) setLocale(savedLocale as Locale);
    }
    catch { } }, []);
    useEffect(() => { if (user === 'demo')
        return; const t = setInterval(() => { void refreshRef.current(); }, 15000); return () => clearInterval(t); }, [user]);
    useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 3000); return () => clearTimeout(timer); }, [notice]);
    useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('oqim-dark', String(dark)); }, [dark]);
    useEffect(() => { document.documentElement.lang = locale; localStorage.setItem('onur-locale', locale); }, [locale]);
    useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') {
        setSelected(null);
        setDialog(null);
        setNav(false);
    } if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search')?.focus();
    } }; document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler); }, []);
    useEffect(() => { if (!selected && user !== 'demo') {
        const id = new URLSearchParams(location.search).get('card');
        const card = state.cards.find(c => c.id === id);
        if (card) {
            setSelected(structuredClone(card));
            setDraftVersion(version);
        }
    } }, [user]);
    useEffect(() => { const ctx = (document as any).modelContext; if (!ctx?.registerTool)
        return; const life = new AbortController(); try {
        Promise.resolve(ctx.registerTool({ name: 'search_tasks', description: 'Search visible tasks in the current workspace; does not change tasks.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: (input: any) => { if (typeof input?.query !== 'string')
                throw Error('query must be a string'); setSearch(input.query); setView('list'); return { tasks: stateRef.current.cards.filter(c => !c.archived && c.title.toLowerCase().includes(input.query.toLowerCase())).map(c => ({ id: c.id, title: c.title, number: c.number })) }; } }, { signal: life.signal })).catch(() => { });
    }
    catch { } return () => life.abort(); }, []);
    async function logout() { await fetch('/api/v1/auth/logout', { method: 'POST' }); location.href = '/login'; }
    async function mutate(action: string, payload: any = {}, close = true, expectedVersion = version) { if (user === 'demo') {
        setNotice('Saqlash uchun hisobingizga kiring.');
        return null;
    } if (busy)
        return null; setBusy(true); try {
        const r = await fetch('/api/v1/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId: workspace, version: expectedVersion, action, payload }) });
        const d: any = await r.json();
        if (!r.ok) {
            if (r.status === 409)
                await refresh();
            throw Error(d.message ?? 'Amal bajarilmadi');
        }
        setState(d.state);
        setPlatformAdmin(Boolean(d.platformAdmin));
        setVersion(d.version);
        setActivity(d.activity ?? []);
        if (close) {
            setDialog(null);
            setSelected(null);
        }
        if (d.inviteUrl)
            setInviteResult(new URL(d.inviteUrl, location.origin).href);
        if (d.resetUrl)
            setInviteResult(new URL(d.resetUrl, location.origin).href);
        setNotice('O‘zgarish saqlandi');
        return d;
    }
    catch (e: any) {
        setNotice(e.message);
        return null;
    }
    finally {
        setBusy(false);
    } }
    function openCard(c: Card) { setDraftVersion(version); setSelected(structuredClone(c)); setComment(''); setCheckText(''); }
    function newCard(col?: string) { if (!board)
        return; openCard(emptyCard(board.id, col ?? startColumnId(board) ?? '')); }
    function switchView(v: string) { setView(v); setNav(false); setChosen([]); }
    function toggleFavorite() { const next = favorites.includes(board.id) ? favorites.filter(x => x !== board.id) : [...favorites, board.id]; setFavorites(next); localStorage.setItem('oqim-favorites', JSON.stringify(next)); }
    function reorderCard(id: string, columnId: string, targetId?: string, after = false) {
        if (id === targetId || !board || !state.cards.some(card => card.id === id && card.boardId === board.id)) return;
        void mutate('card.reorder', { id, columnId, targetId, after }, false);
    }
    function reorderColumn(id: string, targetId: string, after: boolean) {
        if (id === targetId || !board || !board.columns.some(column => column.id === id)) return;
        void mutate('column.reorder', { boardId: board.id, id, targetId, after }, false);
    }
    const today = new Date().toISOString().slice(0, 10);
    const cards = state.cards.filter(c => !c.archived && (view === 'mine' ? c.assignees.includes(user) : search ? true : c.boardId === board?.id) && (!search || [c.title, c.description, c.number, ...c.comments.map(x => x.text), ...c.files.map(x => x.name)].join(' ').toLowerCase().includes(search.toLowerCase())) && (!priority || c.priority === priority) && (!assignee || c.assignees.includes(assignee)) && (!deadline || (deadline === 'late' ? c.due && c.due < today : c.due === today)));
    const selectedBoard = state.boards.find(b => b.id === selected?.boardId);
    const authCard = state.cards.find(c => c.id === selected?.id) ?? selected ?? undefined;
    const editable = !!selected && !!selectedBoard && (selected.id ? can(state, user, selectedBoard, 'card.edit', authCard) : can(state, user, selectedBoard, 'card.create'));
    const sidebarItems = [[LayoutDashboard, 'Barcha doskalar', 'boards'], [CheckCheck, 'Mening vazifalarim', 'mine'], [CalendarDays, 'Kalendar', 'calendar']];
    const managementItems = [[Users, canManage(state, user) ? 'Admin panel' : 'Jamoa a’zolari', 'members'], [ChartNoAxesCombined, 'Hisobotlar', 'reports'], [History, 'Faoliyat tarixi', 'activity'], [Archive, 'Arxiv', 'archive'], [Settings, 'Sozlamalar', 'settings']];
    async function upload(file: File) { if (!selected?.id)
        return; if (JSON.stringify(selected) !== JSON.stringify(state.cards.find(c => c.id === selected.id))) {
        setNotice("Avval vazifa o‘zgarishlarini saqlang yoki yangi nusxani oching.");
        return;
    } if (file.size > 10 * 1024 * 1024) {
        setNotice('Fayl 10 MB dan oshmasin');
        return;
    } setBusy(true); try {
        const f = new FormData();
        f.set('file', file);
        f.set('workspaceId', workspace);
        f.set('cardId', selected.id);
        f.set('version', String(version));
        const r = await fetch('/api/v1/files', { method: 'POST', body: f });
        const d: any = await r.json();
        if (!r.ok)
            throw Error(d.message);
        setState(d.state);
        setVersion(d.version);
        setSelected(d.state.cards.find((c: Card) => c.id === selected.id));
        setDraftVersion(d.version);
        setNotice('Fayl yuklandi');
    }
    catch (e: any) {
        setNotice(e.message);
    }
    finally {
        setBusy(false);
    } }
    async function download(c: Card, id: string) { const r = await fetch('/api/v1/files?workspace=' + encodeURIComponent(workspace) + '&card=' + encodeURIComponent(c.id) + '&file=' + encodeURIComponent(id)); const d: any = await r.json(); if (!r.ok) {
        setNotice(d.message);
        return;
    } window.open(d.url, '_blank', 'noopener'); }
    async function copyLink(card?: Card) { const q = new URLSearchParams({ workspace, board: card?.boardId ?? board?.id ?? '', ...(card ? { card: card.id } : { q: search, priority, assignee, deadline }) }); try {
        await navigator.clipboard.writeText(location.origin + '/?' + q);
        setNotice('Havola nusxalandi. Faqat ruxsati bor a’zolar ochishi mumkin.');
    }
    catch {
        setNotice('Havola: ' + location.origin + '/?' + q);
    } }
    async function exportData() { const r = await fetch('/api/v1/export?workspace=' + encodeURIComponent(workspace) + '&board=' + encodeURIComponent(board.id)); if (!r.ok) {
        setNotice(((await r.json()) as any).message);
        return;
    } const blob = await r.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = board.name + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    const myOpen = state.cards.filter(c => c.assignees.includes(user) && !c.archived).length;
    const navItems = [
        { id: 'home', label: t('Bosh sahifa'), icon: Home },
        { id: 'kanban', label: t('Doskalar'), icon: FolderKanban },
        { id: 'mine', label: t('Mening vazifalarim'), icon: CheckCheck, badge: myOpen },
        { id: 'calendar', label: t('Kalendar'), icon: CalendarDays },
        { id: 'reports', label: t('Hisobotlar'), icon: ChartNoAxesCombined },
        ...(me?.role !== 'guest' ? [{ id: 'members', label: t(canManage(state, user) ? 'Admin panel' : 'Jamoa'), icon: Users }] : []),
    ];
    const navActive = ['kanban', 'list', 'boards'].includes(view) ? 'kanban' : view;
    const boardStrip = <div className="board-strip" aria-label={t('Doskalar')}>{state.boards.filter(b => !b.archived).map(b => <button key={b.id} className={b.id === board?.id ? 'active' : ''} aria-pressed={b.id === board?.id} onClick={() => { setBoardId(b.id); setSearch(''); }}><span className="board-dot" style={{ background: b.color }}/>{translatePreset(b.name, locale)}{favorites.includes(b.id) && <Star size={11}/>}</button>)}{canManage(state, user) && <button className="add" aria-label={t('Doska yaratish')} onClick={() => setDialog({ kind: 'board-new', data: { name: '', description: '', template: '' } })}><Plus size={15}/></button>}</div>;
    const body = <>{loading ? <Skeleton /> : <div className="view-enter" key={['kanban', 'list', 'calendar'].includes(view) ? 'board' : view}>{view === 'home' && <Dashboard state={state} user={user} board={board} me={me} onOpen={openCard} />}{view === 'home' && design === 'a' && boardStrip}{design === 'b' && boardView && board && !search && <div className="b-board-head"><div><h1>{translatePreset(board.name, locale)}</h1><p>{translatePreset(board.description, locale)}</p></div><div className="b-head-actions"><div className="avatar-stack">{state.members.filter(m => m.active).slice(0, 2).map(m => <Avatar key={m.id} state={state} id={m.id}/>)}{state.members.filter(m => m.active).length > 2 && <span className="avatar more">+{state.members.filter(m => m.active).length - 2}</span>}</div><button className="b-invite" onClick={() => { if (platformAdmin) { setInviteResult(''); setDialog({ kind: 'invite', data: { email: '', name: '', password: '', role: 'member', boardRole: '', team: '' } }); } else switchView('members'); }}><Plus size={14}/>{t('Taklif qilish')}</button></div></div>}{view !== 'home' && !(design === 'b' && (boardView || view === 'mine')) && <div className="page-heading"><div><div className="eyebrow">{t(boardView ? 'LOYIHA DOSKASI' : 'ONUR TASK MANAGER')}</div><div className="title-row"><h1>{search ? t('Qidiruv natijalari') : boardView ? translatePreset(board?.name ?? 'Doskalar', locale) : t(view === 'members' && canManage(state, user) ? 'Admin panel' : names[view])}</h1>{boardView && board && <button className={'icon-button ' + (favorites.includes(board.id) ? 'is-favorite' : '')} aria-label={t("Sevimlilarga qo‘shish")} onClick={toggleFavorite}><Star size={20}/></button>}</div><p>{boardView ? translatePreset(board?.description ?? '', locale) : t('Jamoa ishlarini bir joyda kuzating va boshqaring.')}</p></div><div className="heading-actions"><div className="avatar-stack">{state.members.filter(m => m.active).slice(0, 4).map(m => <Avatar key={m.id} state={state} id={m.id}/>)}</div><button className="button secondary" onClick={() => switchView('members')}><Users size={16}/> {t("Jamoa")}</button></div></div>}{['kanban', 'list', 'calendar'].includes(view) && !search && design === 'a' && boardStrip}{user === 'demo' && <div className="demo-banner"><span>{t(loading ? 'Ish maydoni yuklanmoqda…' : 'Namuna doska. Hisobingizga kirib o‘z ish maydoningizda ishlang.')}</span><a href="/login">{t("Hisobga kirish ")}<ArrowRight size={15}/></a></div>}{(design === 'b' ? ['kanban', 'list', 'calendar'] : ['home', 'kanban', 'list', 'mine', 'calendar']).includes(view) && board && <><div className="board-toolbar">{view === 'home' && <h2 className="board-section-title">{translatePreset(board.name, locale)}</h2>}<PillTabs className="view-pills" label={t('Ko‘rinish')} items={[{ id: 'kanban', label: t(design === 'b' ? 'Doska' : 'Kanban'), icon: Columns3 }, { id: 'list', label: t('Ro‘yxat'), icon: List }, { id: 'calendar', label: t('Kalendar'), icon: CalendarDays }]} active={view === 'home' ? 'kanban' : view} onSelect={switchView}/><div className="toolbar-actions"><span className="private-label"><LockKeyhole size={14}/>{t(board.visibility === 'closed' ? 'Yopiq doska' : 'Ish maydoniga ochiq')}</span><button className={'filter-button ' + (priority || assignee || deadline ? 'filtered' : '')} onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={16}/>{t("Filtrlar")}</button><button className="button" disabled={!can(state, user, board, 'card.create') && user !== 'demo'} onClick={() => newCard()}><Plus size={17}/> {t("Vazifa qo‘shish")}</button><button className="icon-button" aria-label={t("Doska sozlamalari")} onClick={() => setDialog({ kind: 'board-settings', data: structuredClone(board) })}><MoreHorizontal size={20}/></button></div></div>{filterOpen && <div className="filter-panel"><StyledSelect ariaLabel={t("Prioritet filtri")} value={priority} onChange={setPriority} options={[{value:'',label:t('Barcha prioritetlar')},{value:'low',label:t('Past')},{value:'medium',label:t('O‘rta')},{value:'high',label:t('Yuqori')},{value:'urgent',label:t('Shoshilinch')}]} /><StyledSelect ariaLabel={t("Mas’ul filtri")} value={assignee} onChange={setAssignee} options={[{value:'',label:t('Barcha mas’ullar')},...state.members.map(m => ({value:m.id,label:m.name}))]} /><StyledSelect ariaLabel={t("Muddat filtri")} value={deadline} onChange={setDeadline} options={[{value:'',label:t('Barcha muddatlar')},{value:'today',label:t('Bugun')},{value:'late',label:t('Muddati o‘tgan')}]} /><button className="button secondary" onClick={() => { setPriority(''); setAssignee(''); setDeadline(''); setSearch(''); }}>{t("Tozalash")}</button><button className="button secondary" onClick={() => copyLink()}><LinkIcon size={15}/> {t("Filtr havolasi")}</button></div>}{design === 'a' && <div className="board-meta"><span><span className="live-dot"/>{countLabel(cards.length, "tasks", locale)}</span><span><ShieldCheck size={13}/>{t(user === 'demo' ? 'Namuna ma’lumotlar' : 'Huquqlar himoyalangan · 15 soniyada yangilanadi')}</span></div>}</>}
 <div className="view-body" key={view + ':' + boardId}>{(view === 'kanban' || view === 'home') && board ? <KanbanBoard board={board} cards={cards} state={state} user={user} onOpen={openCard} onAdd={newCard} onNewColumn={() => setDialog({ kind: 'column', data: { id: '', boardId: board.id, name: '', limit: 0, locked: false, color: '#8296ac', addRoles: [], moveRoles: [] } })} onSettings={col => setDialog({ kind: 'column', data: { ...structuredClone(col), boardId: board.id } })} onReorderCard={reorderCard} onReorderColumn={reorderColumn}/> : view === 'boards' ? <div className="boards-grid">{state.boards.filter(b => !b.archived).map(b => <button className="board-tile" key={b.id} onClick={() => { setBoardId(b.id); switchView('kanban'); }}><span className="tile-icon" style={{ color: b.color, background: b.color + '16' }}><Columns3 size={26}/></span><h2>{translatePreset(b.name, locale)}</h2><p>{translatePreset(b.description, locale)}</p><div><span>{countLabel(state.cards.filter(c => c.boardId === b.id && !c.archived).length, "tasks", locale)}</span><ArrowUpRight size={18}/></div></button>)}{canManage(state, user) && <button className="board-tile new-board" onClick={() => setDialog({ kind: 'board-new', data: { name: '', description: '', template: '' } })}><Plus size={28}/><h2>{t("Yangi doska")}</h2><p>{t("Yangi loyiha uchun joy oching")}</p></button>}</div> : view === 'mine' && design === 'b' ? <MyTasks cards={cards} state={state} onOpen={openCard}/> : ['list', 'mine'].includes(view) ? <><div className="bulk-bar">{chosen.length > 0 && <><span>{chosen.length} {t("ta tanlandi")}</span><StyledSelect ariaLabel={t("Guruh holda ko‘chirish")} value="" onChange={value => { if (value) void mutate('cards.bulk', { ids: chosen, columnId: value }, false).then(() => setChosen([])); }} options={[{value:'',label:t('Ustunga ko‘chirish')},...(board?.columns.map(c => ({value:c.id,label:translatePreset(c.name,locale)})) ?? [])]} /><button className="button secondary" onClick={() => setDialog({ kind: 'confirm', data: { title: 'Tanlangan vazifalar arxivlansinmi?', action: 'cards.bulk', payload: { ids: chosen, archive: true } } })}><Archive size={14}/> {t("Arxivlash")}</button></>}</div><div className="table-wrap"><table><thead><tr><th /><th>{t("Vazifa")}</th><th>{t("Holat")}</th><th>{t("Mas’ul")}</th><th>{t("Muddat")}</th><th>{t("Prioritet")}</th></tr></thead><tbody>{cards.map(c => <tr key={c.id}><td><input type="checkbox" aria-label={c.title + ' tanlash'} checked={chosen.includes(c.id)} onChange={e => setChosen(e.target.checked ? [...chosen, c.id] : chosen.filter(x => x !== c.id))}/></td><td><button className="text-left" onClick={() => openCard(c)}><small>{c.number}</small><strong>{c.title}</strong></button></td><td>{state.boards.find(b => b.id === c.boardId)?.columns.find(l => l.id === c.columnId)?.name ? translatePreset(state.boards.find(b => b.id === c.boardId)!.columns.find(l => l.id === c.columnId)!.name, locale) : ''}</td><td><div className="avatar-stack">{c.assignees.map(id => <Avatar key={id} state={state} id={id}/>)}</div></td><td>{c.due || '—'}</td><td><Priority value={c.priority}/></td></tr>)}</tbody></table>{!cards.length && <Empty text="Filtrga mos vazifa topilmadi"/>}</div></> : view === 'calendar' ? <div className="calendar-panel"><header><h2>{monthTitle(month, locale)}</h2><div><button className="button secondary" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>{t("←")}</button><button className="button secondary" onClick={() => setMonth(new Date())}>{t("Bugun")}</button><button className="button secondary" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>{t("→")}</button></div></header><div className="calendar-grid">{['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(d => <div className="weekday" key={d}>{t(d)}</div>)}{Array.from({ length: 42 }, (_, i) => { const date = new Date(month.getFullYear(), month.getMonth(), 1); date.setDate(1 - ((date.getDay() + 6) % 7) + i); const ds = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'); return <div className={'calendar-day ' + (date.getMonth() !== month.getMonth() ? 'muted-day' : '') + (ds === today ? ' today' : '')} key={ds}><span>{date.getDate()}</span>{cards.filter(c => c.due === ds).map(c => <button key={c.id} onClick={() => openCard(c)} title={c.title}>{c.title}</button>)}</div>; })}</div></div> : view === 'members' ? <div className="panel"><div className="panel-heading"><h2>{t("Jamoa · ")}{state.members.length} {t("a’zo")}</h2>{platformAdmin && <button className="button" onClick={() => { setInviteResult(''); setDialog({ kind: 'invite', data: { email: '', name: '', password: '', role: 'member', boardRole: '', team: '' } }); }}><Plus size={16}/> {t("Foydalanuvchi yaratish")}</button>}</div>{platformAdmin && <div className="admin-summary"><div><strong>{state.members.filter(m => m.active && !m.id.startsWith('invite-')).length}</strong><span>{t('Faol foydalanuvchi')}</span></div><div><strong>{state.members.filter(m => m.id.startsWith('invite-') && m.active).length}</strong><span>{t('Taklif kutilmoqda')}</span></div><div><strong>{state.members.filter(m => !m.active).length}</strong><span>{t('Bloklangan')}</span></div></div>}{state.members.map(m => <div className="member-row" key={m.id}><Avatar state={state} id={m.id}/><div><strong>{m.name}</strong><p>{m.email}{m.id.startsWith('sample-') ? ' · Namuna a’zo' : ''}</p></div><span>{m.team}</span><span className="role-tag">{memberRoleLabel(m)}{!m.active ? ' · ' + t('Bloklangan') : m.id.startsWith('invite-') ? ' · ' + t('Taklif kutilmoqda') : ''}</span>{canManage(state, user) && <button className="icon-button" aria-label={m.name + ' huquqlari'} onClick={() => { setInviteResult(''); setDialog({ kind: 'member', data: { ...structuredClone(m), boardRole: memberBoardRoleId(m), boardRoleChanged: false, password: '' } }); }}><Settings size={17}/></button>}</div>)}</div> : view === 'reports' ? <div className="panel"><div className="panel-heading"><h2>{board?.name} {t("· Hisobot")}</h2><button className="button secondary" disabled={!board || !can(state, user, board, 'export')} onClick={exportData}><Download size={16}/> {t("CSV eksport")}</button></div><div className="stats-grid">{board?.columns.map(col => <div className="stat" key={col.id}><span>{translatePreset(col.name, locale)}</span><strong style={{ color: col.color }}>{state.cards.filter(c => c.boardId === board.id && c.columnId === col.id && !c.archived).length}</strong></div>)}</div><h3 className="section-heading">{t("Xodimlar kesimida")}</h3><table><thead><tr><th>{t("A’zo")}</th><th>{t("Ochiq")}</th><th>{t("Bajarildi")}</th><th>{t("Kechikkan")}</th></tr></thead><tbody>{state.members.map(m => { const own = state.cards.filter(c => c.assignees.includes(m.id) && !c.archived); const done = (c: Card) => doneColumnId(state.boards.find(b => b.id === c.boardId)!) === c.columnId; return <tr key={m.id}><td>{m.name}</td><td>{own.filter(c => !done(c)).length}</td><td>{own.filter(done).length}</td><td>{own.filter(c => !done(c) && c.due && c.due < today).length}</td></tr>; })}</tbody></table></div> : view === 'activity' ? <div className="panel"><h2>{t("O‘zgarishlar va xavfsizlik jurnali")}</h2>{activity.length ? activity.map(a => <div className="activity-row" key={a.id}><History size={18}/><div><strong>{a.actor_name}</strong> <span>{a.action}</span><p>{a.summary}</p></div><time>{new Date(a.created_at).toLocaleString(locale === 'ru' ? 'ru-RU' : locale === 'uz-Cyrl' ? 'uz-Cyrl-UZ' : 'uz-Latn-UZ')}</time></div>) : <Empty text="Hozircha faoliyat yo‘q"/>}</div> : view === 'notifications' ? <div className="panel"><div className="panel-heading"><h2>{t("Siz uchun xabarlar")}</h2><button className="button secondary" onClick={() => mutate('notifications.read', {}, false)}>{t("O‘qilgan deb belgilash")}</button></div>{state.notifications.length ? state.notifications.map(n => <button className={'notification-row ' + (!n.read ? 'unread' : '')} key={n.id} onClick={() => { const c = state.cards.find(c => c.id === n.cardId); if (c)
        openCard(c); }}><Bell size={18}/><span>{n.text}<small>{new Date(n.at).toLocaleString(locale === 'ru' ? 'ru-RU' : locale === 'uz-Cyrl' ? 'uz-Cyrl-UZ' : 'uz-Latn-UZ')}</small></span></button>) : <Empty text="Yangi bildirishnomalar yo‘q"/>}</div> : view === 'archive' ? <div className="panel"><h2>{t("Arxivlangan doskalar va vazifalar")}</h2>{state.boards.filter(b => b.archived).map(b => <div className="member-row" key={b.id}><Columns3 size={20}/><strong>{b.name}</strong><button className="button secondary" onClick={() => mutate('board.save', { ...b, archived: false }, false)}>{t("Qaytarish")}</button></div>)}{state.cards.filter(c => c.archived).map(c => <div className="member-row" key={c.id}><Archive size={20}/><strong>{c.title}</strong><button className="button secondary" onClick={() => mutate('card.archive', { id: c.id, archived: false }, false)}>{t("Qaytarish")}</button></div>)}{!state.boards.some(b => b.archived) && !state.cards.some(c => c.archived) && <Empty text="Arxiv bo‘sh"/>}</div> : view === 'settings' ? <div className="settings-grid"><div className="panel"><h2>{t("Ish maydoni")}</h2><label>{t("Nomi")}<input defaultValue={state.name} key={state.name} id="ws-name"/></label><label>{t("Tavsif")}<textarea defaultValue={state.description} key={state.description} id="ws-description"/></label><button className="button" disabled={!canManage(state, user)} onClick={() => mutate('workspace.save', { name: (document.getElementById('ws-name') as HTMLInputElement).value, description: (document.getElementById('ws-description') as HTMLTextAreaElement).value }, false)}>{t("Saqlash")}</button></div><div className="panel"><h2>{t("Profil va ko‘rinish")}</h2><label>{t("Ism-familiya")}<input defaultValue={me?.name} key={me?.name} id="profile-name"/></label><button className="button secondary" onClick={() => mutate('profile.save', { name: (document.getElementById('profile-name') as HTMLInputElement).value }, false)}>{t("Profilni saqlash")}</button><div className="language-setting">{t("Platforma tili")}<LanguageMenu locale={locale} onChange={setLocale} t={t} /></div><button className="settings-toggle" onClick={() => setDark(!dark)}>{dark ? <Sun size={19}/> : <Moon size={19}/>} {t(dark ? 'Yorug‘ rejim' : 'Qorong‘i rejim')}<span>{t(dark ? 'Yoqilgan' : 'O‘chirilgan')}</span></button><button className="settings-toggle" onClick={logout}><LogOut size={18}/>{t("Hisobdan chiqish")}</button></div>{canManage(state, user) && <div className="panel roles-panel"><div className="panel-heading"><h2>{t("Doska rollari va huquqlar")}</h2><button className="button secondary" onClick={() => setDialog({ kind: 'role', data: { id: '', name: '', nameCyrl: '', nameRu: '', scope: 'board', permissions: ['view'] } })}><Plus size={16}/> {t("Yangi rol")}</button></div>{state.roles.filter(r => r.scope === 'board').map(r => <button className="role-line" key={r.id} onClick={() => setDialog({ kind: 'role', data: { ...structuredClone(r), ...roleNameFields(r) } })}><ShieldCheck size={18}/><strong>{roleLabel(r.id, r.name, locale, r)}</strong><span>{countLabel(r.permissions.length, "permissions", locale)}</span><ChevronRight size={16}/></button>)}</div>}</div> : null}</div></div>}
 <footer className="page-footer"><span>{t("ONUR Task Manager")}</span><span>{fullDate(new Date(), locale)}</span></footer></>;
    const shellA = <div className="shell"><header className="topnav"><a className="brand-pill" href="/" aria-label={t("ONUR Task Manager")}><img src="/onur-logo.png" alt="ONUR"/><span>Tasks</span></a><PillTabs className="main-nav" label={t('Asosiy menyu')} items={navItems} active={navActive} onSelect={id => { if (id === 'kanban') setSearch(''); switchView(id); }}/><div className="top-tools"><label className="search-pill"><Search size={16}/><input id="search" aria-label={t("Vazifalarni qidirish")} placeholder={t("Vazifa qidirish...")} value={search} onChange={e => { setSearch(e.target.value); if (e.target.value)
        setView('list'); }}/><kbd>Ctrl K</kbd></label><button className={'round-button notification-bell' + (ringing ? ' ringing' : '')} aria-label={t("Bildirishnomalar")} onClick={() => switchView('notifications')}><Bell size={18}/>{unread > 0 && <i />}</button><UserMenu state={state} user={user} name={me?.name ?? t('Siz')} role={memberRoleLabel(me)} dark={dark} onDark={() => setDark(!dark)} onView={switchView} onSpaces={() => setDialog({ kind: 'spaces', data: { name: '' } })} onLogout={logout} language={<LanguageMenu locale={locale} onChange={setLocale} t={t} compact />}/></div></header><main className="content">{body}</main><PillTabs className="tabbar" stacked draggable label={t('Asosiy menyu')} items={navItems.filter(item => item.id !== 'members').map(item => ({ ...item, short: ({ home: t('Asosiy'), mine: t('Vazifalarim'), reports: t('Hisobot') } as Record<string, string>)[item.id] }))} active={navActive} onSelect={id => { if (id === 'kanban') setSearch(''); switchView(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}/></div>;
    const shellB = <div className="b-window"><header className="b-top"><a className="brand-pill" href="/" aria-label={t("ONUR Task Manager")}><img src="/onur-logo.png" alt="ONUR"/><span>Tasks</span></a><div className="b-top-tools"><label className="search-pill"><Search size={16}/><input id="search" aria-label={t("Vazifalarni qidirish")} placeholder={t("Vazifa qidirish...")} value={search} onChange={e => { setSearch(e.target.value); if (e.target.value)
        setView('list'); }}/><kbd>Ctrl K</kbd></label><button className={'round-button notification-bell' + (ringing ? ' ringing' : '')} aria-label={t("Bildirishnomalar")} onClick={() => switchView('notifications')}><Bell size={18}/>{unread > 0 && <i />}</button><UserMenu state={state} user={user} name={me?.name ?? t('Siz')} role={memberRoleLabel(me)} dark={dark} onDark={() => setDark(!dark)} onView={switchView} onSpaces={() => setDialog({ kind: 'spaces', data: { name: '' } })} onLogout={logout} language={<LanguageMenu locale={locale} onChange={setLocale} t={t} compact />}/></div></header><div className="b-frame"><aside className="b-side"><div className="b-group"><div className="b-caption">{t('Umumiy')}</div>{navItems.filter(item => ['kanban', 'mine', 'calendar'].includes(item.id)).map(({ id, label, icon: Icon, badge }) => <button key={id} className={navActive === id ? 'active' : ''} aria-current={navActive === id ? 'page' : undefined} onClick={() => { if (id === 'kanban') setSearch(''); switchView(id); }}><Icon size={17}/><span>{label}</span>{!!badge && <em>{badge}</em>}</button>)}</div><div className="b-group"><div className="b-caption">{t('Barcha doskalar')}{canManage(state, user) && <button aria-label={t('Doska yaratish')} onClick={() => setDialog({ kind: 'board-new', data: { name: '', description: '', template: '' } })}><Plus size={14}/></button>}</div>{state.boards.filter(b => !b.archived).map(b => <button key={b.id} className={boardId === b.id && ['kanban', 'list', 'calendar'].includes(view) ? 'active' : ''} onClick={() => { setBoardId(b.id); setSearch(''); if (!['kanban', 'list', 'calendar'].includes(view)) switchView('kanban'); }}><span className="b-hash">#</span><span>{translatePreset(b.name, locale)}</span>{favorites.includes(b.id) && <Star size={11}/>}</button>)}</div><div className="b-side-bottom">{me?.role !== 'guest' && <button className={view === 'members' ? 'active' : ''} onClick={() => switchView('members')}><Users size={17}/><span>{t(canManage(state, user) ? 'Jamoa va huquqlar' : 'Jamoa')}</span></button>}<button className={view === 'settings' ? 'active' : ''} onClick={() => switchView('settings')}><Settings size={17}/><span>{t('Sozlamalar')}</span></button></div></aside><main className="content b-main">{body}</main></div></div>;
    return <LanguageContext.Provider value={locale}><DesignContext.Provider value={design}><div className={design === 'b' ? 'app-b' : 'app-a'}>{(pull > 0 || pulling) && <div className={'ptr' + (pulling ? ' loading' : pull >= 64 ? ' ready' : '')} style={{ transform: `translate(-50%, ${pull}px)` }} role="status" aria-label={t('Yangilanmoqda')}><RefreshCw size={18} style={pulling ? undefined : { transform: `rotate(${pull * 4}deg)` }}/></div>}{design === 'b' ? shellB : shellA}
 {selected && selectedBoard && <Modal sheet title={selected.number || 'YANGI VAZIFA'} close={() => setSelected(null)}>{selected.id && draftVersion !== version && <div className="inline-note">{t("Doska yangilandi. Yangi nusxani tekshiring yoki o‘z nusxangizni saqlashni tanlang.")}<button className="button secondary" onClick={() => { const latest = state.cards.find(c => c.id === selected.id); if (latest)
        openCard(latest); }}>{t("Yangi nusxa")}</button><button className="button secondary" onClick={() => setDraftVersion(version)}>{t("Mening nusxam")}</button></div>}<input className="card-title-input" aria-label={t("Vazifa nomi")} placeholder={t("Vazifa nomi")} disabled={!editable} value={selected.title} onChange={e => setSelected({ ...selected, title: e.target.value })}/><div className="card-actions">{selected.id && <><button className="button secondary" onClick={() => copyLink(selected)}><LinkIcon size={14}/> {t("Havola")}</button><button className="button secondary" disabled={!can(state, user, selectedBoard, 'card.create')} onClick={() => { const copy = { ...structuredClone(selected), id: '', number: '', title: selected.title + ' (nusxa)', comments: [], files: [], locked: false, private: false, acl: {} }; setSelected(copy); }}><Copy size={14}/> {t("Nusxalash")}</button><button className="button secondary" disabled={!can(state, user, selectedBoard, 'acl', authCard)} onClick={() => setDialog({ kind: 'acl', data: structuredClone(selected) })}><LockKeyhole size={14}/> {t("Huquqlar")}</button><button className="button secondary" disabled={!can(state, user, selectedBoard, 'card.delete', authCard)} onClick={() => setDialog({ kind: 'confirm', data: { title: 'Vazifa arxivlansinmi?', action: 'card.archive', payload: { id: selected.id, archived: true } } })}><Archive size={14}/></button><button className="icon-button danger" aria-label={t("Vazifani o‘chirish")} disabled={!can(state, user, selectedBoard, 'card.delete', authCard)} onClick={() => setDialog({ kind: 'confirm', data: { title: 'Vazifa butunlay o‘chirilsinmi?', action: 'card.delete', payload: { id: selected.id } } })}><Trash2 size={17}/></button></>}</div>{selected.locked && <div className="inline-note"><LockKeyhole size={16}/> {t("Vazifa qulflangan. Board Admin huquqlar oynasidan ochishi mumkin.")}</div>}<label>{t("Tavsif")}<textarea rows={5} disabled={!editable} value={selected.description} onChange={e => setSelected({ ...selected, description: e.target.value })} placeholder={t("Vazifa haqida batafsil yozing…")}/></label><div className="form-row"><label>{t("Ustun")}<StyledSelect ariaLabel={t('Ustun')} value={selected.columnId} disabled={!!selected.id && !can(state, user, selectedBoard, 'card.move', authCard)} onChange={value => setSelected({ ...selected, columnId: value })} options={selectedBoard.columns.map(c => ({value:c.id,label:translatePreset(c.name,locale)}))} /></label><label>{t("Boshlanish")}<input type="date" disabled={!editable} value={selected.start} onChange={e => setSelected({ ...selected, start: e.target.value })}/></label><label>{t("Muddat")}<input type="date" disabled={!editable} value={selected.due} onChange={e => setSelected({ ...selected, due: e.target.value })}/></label><label>{t("Prioritet")}<StyledSelect ariaLabel={t('Prioritet')} disabled={!editable} value={selected.priority} onChange={value => setSelected({ ...selected, priority: value })} options={[{value:'low',label:t('Past')},{value:'medium',label:t('O‘rta')},{value:'high',label:t('Yuqori')},{value:'urgent',label:t('Shoshilinch')}]} /></label></div><label>{t("Mas’ullar")}</label><div className="assignee-options">{state.members.filter(m => m.active).map(m => <button className={'assignee-chip ' + (selected.assignees.includes(m.id) ? 'picked' : '')} disabled={!editable} key={m.id} onClick={() => setSelected({ ...selected, assignees: selected.assignees.includes(m.id) ? selected.assignees.filter(x => x !== m.id) : [...selected.assignees, m.id] })}><Avatar state={state} id={m.id}/>{m.name}{selected.assignees.includes(m.id) && <Check size={13}/>}</button>)}</div><label>{t("Yorliqlar (vergul bilan)")}<input disabled={!editable} value={selected.labels.join(', ')} onChange={e => setSelected({ ...selected, labels: e.target.value.split(',').map(s => s.trim()) })}/></label><h3>{t("Checklist ")}<span className="muted">{selected.checklist.filter(x => x.done).length}{t("/")}{selected.checklist.length}</span></h3>{selected.checklist.map(item => <label className="check-row" key={item.id}><input type="checkbox" disabled={!editable} checked={item.done} onChange={e => { const checklist = selected.checklist.map(i => i.id === item.id ? { ...i, done: !i.done } : i); setSelected({ ...selected, checklist }); if (!item.done && checklist.every(i => i.done)) { const r = e.currentTarget.getBoundingClientRect(); fireSalute(r.left + r.width / 2, r.top + r.height / 2); } }}/>{translatePreset(item.text, locale)}<button className="icon-button" disabled={!editable} aria-label={t("Bandni olib tashlash")} onClick={() => setSelected({ ...selected, checklist: selected.checklist.filter(i => i.id !== item.id) })}><X size={13}/></button></label>)}{editable && <form className="inline-form" onSubmit={e => { e.preventDefault(); if (checkText.trim()) {
        setSelected({ ...selected, checklist: [...selected.checklist, { id: crypto.randomUUID(), text: checkText.trim(), done: false }] });
        setCheckText('');
    } }}><input aria-label={t("Checklist bandi")} value={checkText} onChange={e => setCheckText(e.target.value)} placeholder={t("Yangi band...")}/><button className="button secondary" type="submit"><Plus size={15}/></button></form>}<div className="form-row"><label>{t("Reja (soat)")}<input type="number" min="0" disabled={!editable} value={selected.estimate} onChange={e => setSelected({ ...selected, estimate: Number(e.target.value) })}/></label><label>{t("Sarflandi (soat)")}<input type="number" min="0" disabled={!editable} value={selected.spent} onChange={e => setSelected({ ...selected, spent: Number(e.target.value) })}/></label><label>{t("Bog‘liq vazifa")}<StyledSelect ariaLabel={t('Bog‘liq vazifa')} value={selected.dependencies[0] ?? ''} disabled={!editable} onChange={value => setSelected({ ...selected, dependencies: value ? [value] : [] })} options={[{value:'',label:t('Bog‘liqlik yo‘q')},...state.cards.filter(c => c.id !== selected.id && c.boardId === selected.boardId).map(c => ({value:c.id,label:c.number + ' · ' + c.title}))]} /></label></div>{selected.id && <><h3>{t("Fayllar")}</h3>{selected.files.map(f => <button className="file-line" key={f.id} onClick={() => download(selected, f.id)}><Paperclip size={15}/>{f.name}<span>{Math.ceil(f.size / 1024)} {t("KB")}</span><Download size={15}/></button>)}<label className="upload-box"><Paperclip size={18}/> {t("Fayl biriktirish · 10 MB gacha")}<input type="file" disabled={busy || !can(state, user, selectedBoard, 'file.upload', authCard)} accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.xlsx,.txt,.csv" onChange={e => { if (e.target.files?.[0])
        void upload(e.target.files[0]); e.target.value = ''; }}/></label><h3>{t("Izohlar · ")}{selected.comments.length}</h3>{selected.comments.map(c => <div className="comment" key={c.id}><Avatar state={state} id={c.author}/><div><strong>{state.members.find(m => m.id === c.author)?.name ?? 'A’zo'} <small>{new Date(c.at).toLocaleString(locale === 'ru' ? 'ru-RU' : locale === 'uz-Cyrl' ? 'uz-Cyrl-UZ' : 'uz-Latn-UZ')}</small></strong><p>{c.text}</p></div>{(c.author === user || boardRole(state, user, selectedBoard) === 'board-admin') && <button className="icon-button" aria-label={t("Izohni o‘chirish")} onClick={() => setDialog({ kind: 'confirm', data: { title: 'Izoh o‘chirilsinmi?', action: 'comment.delete', payload: { id: selected.id, commentId: c.id } } })}><X size={14}/></button>}</div>)}<form className="inline-form" onSubmit={async (e) => { e.preventDefault(); if (!comment.trim())
        return; if (JSON.stringify(selected) !== JSON.stringify(state.cards.find(c => c.id === selected.id))) {
        setNotice('Avval vazifa o‘zgarishlarini saqlang yoki yangi nusxani oching.');
        return;
    } const d = await mutate('comment.add', { id: selected.id, text: comment }, false); if (d) {
        setSelected(d.state.cards.find((c: Card) => c.id === selected.id));
        setDraftVersion(d.version);
        setComment('');
    } }}><input aria-label={t("Izoh")} disabled={!can(state, user, selectedBoard, 'comment', authCard)} value={comment} onChange={e => setComment(e.target.value)} placeholder={t("Izoh yozing… @ism")}/><button className="button" disabled={busy || !comment.trim()} type="submit">{t("Yuborish")}</button></form></>}<footer><button className="button secondary" onClick={() => setSelected(null)}>{t("Yopish")}</button><button className="button" disabled={busy || !editable || !selected.title.trim()} onClick={() => mutate(selected.id ? 'card.save' : 'card.create', selected, true, selected.id ? draftVersion : version)}>{busy ? <RefreshCw className="spin" size={16}/> : <Check size={16}/>} {t("Saqlash")}</button></footer></Modal>}
 {dialog && <Modal title={dialog.kind === 'confirm' ? 'Tasdiqlash' : dialog.kind === 'spaces' ? 'Ish maydonlari' : dialog.kind === 'board-new' ? 'Yangi doska' : dialog.kind === 'invite' ? 'Foydalanuvchi yaratish' : dialog.kind === 'column' ? 'Ustun sozlamalari' : dialog.kind === 'acl' ? 'Vazifa huquqlari' : dialog.kind === 'member' ? 'A’zo huquqlari' : dialog.kind === 'role' ? 'Rol sozlamalari' : 'Doska sozlamalari'} close={() => setDialog(null)}>{dialog.kind === 'confirm' ? <><h2>{t(dialog.data.title)}</h2><p className="muted">{t("Amal faoliyat tarixiga yoziladi.")}</p><footer><button className="button secondary" onClick={() => setDialog(null)}>{t("Bekor qilish")}</button><button className="button danger-bg" disabled={busy} onClick={() => mutate(dialog.data.action, dialog.data.payload)}>{t("Tasdiqlash")}</button></footer></> : <><DialogFields dialog={dialog} setDialog={setDialog} state={state} board={board} spaces={spaces} inviteResult={inviteResult} onSwitch={(id: string) => { setWorkspace(id); setView('boards'); void refresh(id); setDialog(null); }}/>{dialog.kind === 'board-settings' && <div className="card-actions"><button className="button secondary" disabled={!can(state, user, board, 'settings')} onClick={() => mutate('board.copy', { id: board.id, withCards: true })}><Copy size={14}/> {t("Nusxalash")}</button><button className="button secondary" disabled={!can(state, user, board, 'settings')} onClick={() => mutate('board.save', { ...board, template: !board.template })}>{t("Shablon ")}{t(board.template ? 'o‘chirish' : 'saqlash')}</button><button className="button secondary" disabled={!can(state, user, board, 'settings')} onClick={() => setDialog({ kind: 'confirm', data: { title: 'Doska arxivlansinmi?', action: 'board.save', payload: { ...board, archived: true } } })}><Archive size={15}/> {t("Arxivlash")}</button></div>}{dialog.kind === 'member' && platformAdmin && !dialog.data.id.startsWith('invite-') && !dialog.data.id.startsWith('sample-') && <div className="admin-password-controls"><PasswordField label={t('Yangi parol')} value={dialog.data.password ?? ''} onChange={value => setDialog({ ...dialog, data: { ...dialog.data, password: value } })} autoComplete="new-password" t={t} /><p className="muted">{t('Parol o‘zgarsa, foydalanuvchi barcha qurilmalardan chiqariladi.')}</p><div className="card-actions"><button className="button secondary" disabled={busy || (dialog.data.password?.length ?? 0) < 8} onClick={async () => { const result = await mutate('member.password.set', { id: dialog.data.id, password: dialog.data.password }, false); if (result) setDialog(current => current?.kind === 'member' ? { ...current, data: { ...current.data, password: '' } } : current); }}>{t('Parolni o‘zgartirish')}</button><button className="button secondary" onClick={() => { void mutate('member.sessions.revoke', { id: dialog.data.id }, false); }}>{t('Sessiyalarni yopish')}</button></div></div>}{dialog.kind === 'column' && dialog.data.id && <div className="card-actions"><button className="button secondary" onClick={() => mutate('column.reorder', { boardId: board.id, id: dialog.data.id, direction: -1 })}>{t("← Chapga")}</button><button className="button secondary" onClick={() => mutate('column.reorder', { boardId: board.id, id: dialog.data.id, direction: 1 })}>{t("O‘ngga →")}</button><button className="button secondary danger" onClick={() => setDialog({ kind: 'confirm', data: { title: 'Bo‘sh ustun o‘chirilsinmi?', action: 'column.delete', payload: { boardId: board.id, id: dialog.data.id } } })}><Trash2 size={15}/> {t("O‘chirish")}</button></div>}<footer><button className="button secondary" onClick={() => setDialog(null)}>{t("Bekor qilish")}</button><button className="button" disabled={busy || (dialog.kind === 'invite' && (!!inviteResult || !dialog.data.boardRole)) || (dialog.kind === 'role' && (!dialog.data.name?.trim() || !dialog.data.nameCyrl?.trim() || !dialog.data.nameRu?.trim()))} onClick={async () => { const actions: Record<string, string> = { spaces: 'workspace.create', 'board-new': 'board.create', 'board-settings': 'board.save', column: 'column.save', invite: 'member.create', member: 'member.save', role: 'role.save', acl: 'card.acl' }; const payload = dialog.kind === 'member' ? (({ password, boardRoleChanged, boardRole, ...member }) => boardRoleChanged ? { ...member, boardRole } : member)(dialog.data) : dialog.data; const d = await mutate(actions[dialog.kind], payload, dialog.kind !== 'invite'); if (dialog.kind === 'spaces' && d?.workspaceId) {
        setWorkspace(d.workspaceId);
        void refresh(d.workspaceId);
    } if (dialog.kind === 'invite' && d) { setInviteResult(new URL(d.inviteUrl, location.origin).href); setDialog(current => current?.kind === 'invite' ? { ...current, data: { ...current.data, password: '' } } : current); } }}>{t(busy ? 'Saqlanmoqda…' : dialog.kind === 'invite' ? (inviteResult ? 'Hisob yaratildi' : 'Foydalanuvchi yaratish') : 'Saqlash')}</button></footer></>}</Modal>}
 {notice && <div className="toast" role="status">{translateNotice(notice, locale)}<button onClick={() => setNotice('')} aria-label={t("Xabarni yopish")}><X size={16}/></button></div>}</div></DesignContext.Provider></LanguageContext.Provider>;
}
function DialogFields({ dialog: d, setDialog, state, board, spaces, inviteResult, onSwitch }: any) { const locale = useContext(LanguageContext); const t = useT(); const set = (k: string, v: any) => setDialog({ ...d, data: { ...d.data, [k]: v } }); const text = (label: string, k: string, type = 'text') => <label>{t(label)}<input type={type} value={d.data[k] ?? ''} onChange={e => set(k, type === 'number' ? Number(e.target.value) : e.target.value)}/></label>; return <>{d.kind === 'spaces' && <>{spaces.map((s: any) => <button className="role-line" key={s.id} onClick={() => onSwitch(s.id)}><Layers size={18}/>{s.name}<ArrowRight size={16}/></button>)}<h3>{t("Yangi ish maydoni")}</h3>{text('Nomi', 'name')}</>}{['board-new', 'board-settings', 'column'].includes(d.kind) && text('Nomi', 'name')}{['board-new', 'board-settings'].includes(d.kind) && text('Tavsif', 'description')}{d.kind === 'board-new' && <label>{t("Shablon")}<StyledSelect ariaLabel={t('Shablon')} value={d.data.template} onChange={value => set('template', value)} options={[{value:'',label:t('Standart Kanban')},...state.boards.filter((b: Board) => b.template).map((b: Board) => ({value:b.id,label:translatePreset(b.name,locale)}))]} /></label>}{d.kind === 'board-settings' && <><label>{t("Ko‘rinish")}<StyledSelect ariaLabel={t('Ko‘rinish')} value={d.data.visibility} onChange={value => set('visibility', value)} options={[{value:'closed',label:t('Yopiq — faqat doska a’zolari')},{value:'workspace',label:t('Ish maydoniga ochiq')}]} /></label><label className="check-row"><input type="checkbox" checked={d.data.contributorCreate} onChange={e => set('contributorCreate', e.target.checked)}/>{t("Contributor yangi vazifa yarata oladi")}</label><label className="check-row"><input type="checkbox" checked={d.data.viewerDownload} onChange={e => set('viewerDownload', e.target.checked)}/>{t("Viewer fayllarni yuklab olishi mumkin")}</label><h3>{t("Doska a’zolari")}</h3>{state.members.map((m: any) => <div className="permission-row" key={m.id}><span>{m.name}</span><StyledSelect ariaLabel={t('Doska a’zolari')} value={d.data.members[m.id] ?? 'none'} onChange={value => set('members', { ...d.data.members, [m.id]: value })} options={state.roles.filter((r: any) => r.scope === 'board').map((r: any) => ({value:r.id,label:roleLabel(r.id,r.name,locale,r)}))} /></div>)}</>}{d.kind === 'column' && <>{text('WIP limit (0 = cheklanmagan)', 'limit', 'number')}<label className="check-row"><input type="checkbox" checked={d.data.locked} onChange={e => set('locked', e.target.checked)}/>{t("Ustunni qulflash")}</label>{['addRoles', 'moveRoles'].map(k => <label key={k}>{t(k === 'addRoles' ? 'Kim vazifa qo‘sha oladi' : 'Kim vazifa ko‘chira oladi')}<StyledSelect ariaLabel={t(k === 'addRoles' ? 'Kim vazifa qo‘sha oladi' : 'Kim vazifa ko‘chira oladi')} value={d.data[k]?.[0] ?? ''} onChange={value => set(k, value ? [value] : [])} options={[{value:'',label:t('Roli ruxsat bergan har bir a’zo')},...state.roles.filter((r: any) => r.scope === 'board' && r.id !== 'none').map((r: any) => ({value:r.id,label:roleLabel(r.id,r.name,locale,r)}))]} /></label>)}</>}{d.kind === 'invite' && <>{text('Ism-familiya', 'name')}{text('Email', 'email', 'email')}<PasswordField label={t('Boshlang‘ich parol')} value={d.data.password ?? ''} onChange={value => set('password', value)} autoComplete="new-password" t={t} />{text('Bo‘lim', 'team')}<label>{t("Doska roli")}<StyledSelect ariaLabel={t('Doska roli')} value={d.data.boardRole} onChange={value => set('boardRole', value)} options={[{value:'',label:t('Rolni tanlang')},...state.roles.filter((r: any) => r.scope === 'board').map((r: any) => ({value:r.id,label:roleLabel(r.id,r.name,locale,r)}))]} /></label><p className="muted role-help">{t('Tanlangan rol barcha doskalarga beriladi. Yangi rollar sozlamalarda yaratiladi.')}</p><p className="inline-note">{t('Admin parolni belgilaydi. Xodimga parolni alohida, xavfsiz usulda yetkazing.')}</p>{inviteResult && <div className="admin-invite-result"><label>{t('Kirish havolasi')}<input readOnly value={inviteResult} onFocus={e => e.target.select()}/></label><a className="button secondary" href={'mailto:' + encodeURIComponent(d.data.email) + '?subject=' + encodeURIComponent(t('ONUR Task Manager taklifi')) + '&body=' + encodeURIComponent(t('Siz uchun ONUR Task Manager hisobi yaratildi. Kirish havolasi: ') + inviteResult + '\n' + t('Boshlang‘ich parolni administratoringizdan alohida oling.'))}>{t('Email ilovasida taklifni yuborish')}</a><p className="muted">{t('Email avtomatik yuborilmaydi; pochta ilovangizda yuborishni tasdiqlang.')}</p></div>}</>}{d.kind === 'member' && <>{text('Ism-familiya', 'name')}{text('Bo‘lim', 'team')}{d.data.role !== 'owner' && <label>{t("Doska roli")}<StyledSelect ariaLabel={t('Doska roli')} value={d.data.boardRole} onChange={value => setDialog({ ...d, data: { ...d.data, boardRole: value, boardRoleChanged: true } })} options={[{value:'',label:t('Rolni tanlang')},...state.roles.filter((r: any) => r.scope === 'board').map((r: any) => ({value:r.id,label:roleLabel(r.id,r.name,locale,r)}))]} /></label>}<label className="check-row"><input type="checkbox" checked={d.data.active} onChange={e => set('active', e.target.checked)}/>{t("Faol foydalanuvchi")}</label></>}{d.kind === 'role' && <><div className="role-name-fields">{text('Lotincha nom', 'name')}{text('Kirillcha nom', 'nameCyrl')}{text('Ruscha nom', 'nameRu')}</div><p className="muted role-help">{t('Rol nomlari avtomatik tarjima qilinmaydi. Har uch til uchun nom kiriting.')}</p><div className="permissions-grid">{[...boardPermissions, 'own.edit', 'own.move', 'own.deadline'].map(p => <label className="check-row" key={p}><input type="checkbox" checked={d.data.permissions.includes(p)} onChange={e => set('permissions', e.target.checked ? [...d.data.permissions, p] : d.data.permissions.filter((x: string) => x !== p))}/>{permissionLabel(p, locale)}</label>)}</div></>}{d.kind === 'acl' && <><label className="check-row"><input type="checkbox" checked={d.data.private} onChange={e => set('private', e.target.checked)}/>{t("Yashirin vazifa")}</label><label className="check-row"><input type="checkbox" checked={d.data.locked} onChange={e => set('locked', e.target.checked)}/>{t("Vazifani qulflash")}</label><p className="muted">{t("Owner va Board Admin yashirin vazifalarni ham ko‘radi. Boshqalarga alohida kirish bering.")}</p>{state.members.map((m: any) => <div className="permission-row" key={m.id}><label className="check-row"><input type="checkbox" checked={d.data.allowed.includes(m.id)} onChange={e => set('allowed', e.target.checked ? [...d.data.allowed, m.id] : d.data.allowed.filter((x: string) => x !== m.id))}/>{m.name}</label><StyledSelect ariaLabel={t('Doska huquqidan olish')} value={d.data.acl[m.id] ?? ''} onChange={value => { const acl = { ...d.data.acl }; if (value) acl[m.id] = value; else delete acl[m.id]; set('acl', acl); }} options={[{value:'',label:t('Doska huquqidan olish')},...state.roles.filter((r: any) => r.scope === 'board' && !['none','board-admin'].includes(r.id)).map((r: any) => ({value:r.id,label:roleLabel(r.id,r.name,locale,r)}))]} /></div>)}</>}</>; }
function Modal({ title, close, children, sheet = false }: {
    title: string;
    sheet?: boolean;
    close: () => void;
    children: React.ReactNode;
}) { const t = useT(); const ref = useRef<HTMLElement>(null); useEffect(() => { const old = document.activeElement as HTMLElement; const el = ref.current; const first = el?.querySelector<HTMLElement>('button,input,select,textarea'); first?.focus(); const handler = (e: KeyboardEvent) => { if (e.key !== 'Tab')
    return; const focus = [...el!.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')]; if (e.shiftKey && document.activeElement === focus[0]) {
    e.preventDefault();
    focus.at(-1)?.focus();
}
else if (!e.shiftKey && document.activeElement === focus.at(-1)) {
    e.preventDefault();
    focus[0]?.focus();
    } }; el?.addEventListener('keydown', handler); return () => { el?.removeEventListener('keydown', handler); old?.focus(); }; }, []); return <div className={'modal-backdrop' + (sheet ? ' sheet-backdrop' : '')} onClick={close}><section ref={ref} className={'modal' + (sheet ? ' card-sheet' : '')} role="dialog" aria-modal="true" aria-label={t(title)} onClick={e => e.stopPropagation()}><header><span>{t(title)}</span><button className="icon-button" aria-label={t("Yopish")} onClick={close}><X size={20}/></button></header><div className="modal-body">{children}</div></section></div>; }
export function Avatar({ state, id }: {
    state: State;
    id: string;
}) { const m = state.members.find(m => m.id === id); return <span className="avatar" title={m?.name ?? 'A’zo'} style={{ background: (m?.color ?? '#718096') + '24', color: m?.color ?? '#718096' }}>{(m?.name ?? 'A').split(' ').slice(0, 2).map(n => n[0]).join('')}</span>; }
export function Priority({ value }: {
    value: string;
}) { const t = useT(); return <span className={'priority ' + value}><span>{value === 'urgent' ? '⚑' : value === 'high' ? '↑' : value === 'low' ? '↓' : '−'}</span>{t(({ low: 'Past', medium: 'O‘rta', high: 'Yuqori', urgent: 'Shoshilinch' } as any)[value])}</span>; }
function Empty({ text }: {
    text: string;
}) { const t = useT(); return <div className="empty"><CheckCheck size={32}/><p>{text}</p></div>; }
function KanbanBoard({ board, cards, state, user, onOpen, onAdd, onNewColumn, onSettings, onReorderCard, onReorderColumn }: {
    board: Board;
    cards: Card[];
    state: State;
    user: string;
    onOpen: (card: Card) => void;
    onAdd: (columnId: string) => void;
    onNewColumn: () => void;
    onSettings: (column: Board['columns'][number]) => void;
    onReorderCard: (id: string, columnId: string, targetId?: string, after?: boolean) => void;
    onReorderColumn: (id: string, targetId: string, after: boolean) => void;
}) {
    const t = useT();
    const locale = useContext(LanguageContext);
    const columnTouch = useRef<{ id: string; x: number; y: number; active: boolean; timer: ReturnType<typeof setTimeout> | null } | null>(null);
    const edgeScroll = useDragAutoScroll();
    const canReorder = can(state, user, board, 'column.reorder');
    return <div className="kanban">{board.columns.map(col => <section className="column" data-column={col.id} key={col.id}>
        <div className={'column-title ' + (canReorder ? 'can-drag' : '')}
            onPointerDown={e => {
                if (!canReorder || (e.target as Element).closest('button') || (e.pointerType === 'mouse' && e.button !== 0)) return;
                const el = e.currentTarget;
                if (e.pointerType === 'touch') columnTouch.current = { id: col.id, x: e.clientX, y: e.clientY, active: false, timer: setTimeout(() => {
                    if (columnTouch.current?.id === col.id) { columnTouch.current.active = true; el.closest('.column')?.classList.add('dragging-col'); el.setPointerCapture(e.pointerId); }
                }, 400) };
                else { columnTouch.current = { id: col.id, x: e.clientX, y: e.clientY, active: false, timer: null }; el.setPointerCapture(e.pointerId); }
            }}
            onPointerMove={e => {
                const touch = columnTouch.current;
                if (!touch || touch.id !== col.id) return;
                if (touch.active) { edgeScroll.update(e.currentTarget, e.clientX, e.clientY, 'column'); return; }
                if (Math.hypot(e.clientX - touch.x, e.clientY - touch.y) <= 12) return;
                if (touch.timer) { clearTimeout(touch.timer); columnTouch.current = null; }
                else { touch.active = true; e.currentTarget.closest('.column')?.classList.add('dragging-col'); edgeScroll.update(e.currentTarget, e.clientX, e.clientY, 'column'); }
            }}
            onPointerUp={e => {
                const touch = columnTouch.current;
                if (!touch || touch.id !== col.id) return;
                if (touch.timer) clearTimeout(touch.timer);
                if (touch.active) {
                    e.preventDefault();
                    const target = hitAt(e.clientX, e.clientY, e.currentTarget.closest<HTMLElement>('.column') ?? e.currentTarget)?.closest<HTMLElement>('[data-column]');
                    if (target) onReorderColumn(col.id, target.dataset.column!, e.clientX > target.getBoundingClientRect().left + target.getBoundingClientRect().width / 2);
                }
                e.currentTarget.closest('.column')?.classList.remove('dragging-col');
                edgeScroll.stop();
                columnTouch.current = null;
            }}
            onPointerCancel={e => { if (columnTouch.current?.timer) clearTimeout(columnTouch.current.timer); columnTouch.current = null; e.currentTarget.closest('.column')?.classList.remove('dragging-col'); edgeScroll.stop(); }}>
            {canReorder && <GripVertical className="column-grip" size={16} aria-hidden="true"/>}
            <span className="column-dot" style={{ background: col.color }}/><h2>{translatePreset(col.name, locale)}</h2>
            <span className={'column-count ' + (col.limit && cards.filter(c => c.columnId === col.id).length >= col.limit ? 'at-limit' : '')}>{cards.filter(c => c.columnId === col.id).length}{col.limit ? '/' + col.limit : ''}</span>
            {col.locked && <LockKeyhole size={12}/>}
            <button className="icon-button" aria-label={translatePreset(col.name, locale) + ' · ' + t('Sozlamalar')} onClick={() => onSettings(col)}><MoreHorizontal size={18}/></button>
        </div>
        <div className="column-cards">{cards.filter(c => c.columnId === col.id).map(c => <TaskCard key={c.id} card={c} state={state} user={user} onOpen={() => onOpen(c)} onMove={columnId => onReorderCard(c.id, columnId)} onReorder={onReorderCard}/>)}
            {can(state, user, board, 'card.create') && <button className="add-card" disabled={col.locked} onClick={() => onAdd(col.id)}><Plus size={17}/> {t("Vazifa qo‘shish")}</button>}
        </div>
    </section>)}{can(state, user, board, 'column.manage') && <button className="add-column" onClick={onNewColumn}><Plus size={16}/> {t("Ustun")}</button>}</div>;
}

export function TaskCard({ card: c, state, user, onOpen, onMove, onReorder }: {
    card: Card;
    state: State;
    user: string;
    onOpen: () => void;
    onMove: (col: string) => any;
    onReorder: (id: string, col: string, targetId?: string, after?: boolean) => any;
}) {
    const t = useT();
    const locale = useContext(LanguageContext);
    const design = useContext(DesignContext);
    const count = c.checklist.filter(x => x.done).length;
    const dueLabel = (iso: string) => { const d = new Date(iso + 'T00:00'); const now = new Date(); now.setHours(0, 0, 0, 0); const diff = Math.round((d.getTime() - now.getTime()) / 864e5); const day = diff === 0 ? 'Bugun' : diff === 1 ? 'Ertaga' : diff === -1 ? 'Kecha' : ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'][d.getDay()]; return t(day) + ', ' + shortDate(iso, locale); };
    const tone = [...c.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 4;
    const b = state.boards.find(b => b.id === c.boardId)!;
    const done = doneColumnId(b) === c.columnId;
    const overdue = c.due && c.due < new Date().toISOString().slice(0, 10) && !done;
    const movable = can(state, user, b, 'card.move', c);
    const touch = useRef<{ x: number; y: number; active: boolean; timer: ReturnType<typeof setTimeout> | null } | null>(null);
    const suppressClick = useRef(false);
    const edgeScroll = useDragAutoScroll();
    const follow = (el: HTMLElement, x: number, y: number) => { if (touch.current) el.style.transform = `translate(${x - touch.current.x}px, ${y - touch.current.y}px) rotate(-2.5deg) scale(1.03)`; };
    const release = (el: HTMLElement) => { el.classList.remove('dragging'); el.style.transform = ''; };
    const landed = lastMoved.id === c.id && Date.now() - lastMoved.at < 1500;
    return <article className={'task-card' + (movable ? ' can-drag' : '') + (overdue ? ' is-overdue' : '') + (done ? ' is-done' : '') + (landed ? ' landed' : '') + ' tone-' + tone} data-card-id={c.id} tabIndex={0} role="button"
        onPointerDown={e => {
            if (!movable || (e.pointerType === 'mouse' && e.button !== 0)) return;
            const el = e.currentTarget;
            if (e.pointerType === 'touch') touch.current = { x: e.clientX, y: e.clientY, active: false, timer: setTimeout(() => {
                if (touch.current) { touch.current.active = true; el.classList.add('dragging'); el.setPointerCapture(e.pointerId); }
            }, 400) };
            else { touch.current = { x: e.clientX, y: e.clientY, active: false, timer: null }; el.setPointerCapture(e.pointerId); }
        }}
        onPointerMove={e => {
            if (!touch.current) return;
            if (touch.current.active) { follow(e.currentTarget, e.clientX, e.clientY); edgeScroll.update(e.currentTarget, e.clientX, e.clientY, 'card'); return; }
            if (Math.hypot(e.clientX - touch.current.x, e.clientY - touch.current.y) <= 12) return;
            if (touch.current.timer) { clearTimeout(touch.current.timer); touch.current = null; }
            else { touch.current.active = true; e.currentTarget.classList.add('dragging'); follow(e.currentTarget, e.clientX, e.clientY); edgeScroll.update(e.currentTarget, e.clientX, e.clientY, 'card'); }
        }}
        onPointerUp={e => {
            if (!touch.current) return;
            if (touch.current.timer) clearTimeout(touch.current.timer);
            if (touch.current.active) {
                e.preventDefault(); suppressClick.current = true;
                const hit = hitAt(e.clientX, e.clientY, e.currentTarget);
                const targetCard = hit?.closest<HTMLElement>('[data-card-id]');
                const dest = hit?.closest<HTMLElement>('[data-column]')?.dataset.column;
                if (dest) lastMoved = { id: c.id, at: Date.now() };
                if (dest && dest !== c.columnId && dest === doneColumnId(b)) fireSalute(e.clientX, e.clientY);
                if (dest && targetCard?.dataset.cardId && targetCard.dataset.cardId !== c.id)
                    onReorder(c.id, dest, targetCard.dataset.cardId, e.clientY > targetCard.getBoundingClientRect().top + targetCard.getBoundingClientRect().height / 2);
                else if (dest && targetCard?.dataset.cardId !== c.id) onMove(dest);
            }
            release(e.currentTarget);
            edgeScroll.stop();
            touch.current = null;
        }}
        onPointerCancel={e => { if (touch.current?.timer) clearTimeout(touch.current.timer); touch.current = null; release(e.currentTarget); edgeScroll.stop(); }}
        onClick={e => { if (suppressClick.current) { suppressClick.current = false; e.preventDefault(); return; } onOpen(); }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}>{design === 'b' ? <><div className="tc-top"><span className={'due-date ' + (overdue ? 'overdue' : done ? 'completed' : '')}><CalendarDays size={13}/>{c.due ? dueLabel(c.due) : t('Muddatsiz')}</span><span className={'prio-badge ' + c.priority}>{t(({ low: 'Past', medium: 'O‘rta', high: 'Yuqori', urgent: 'Shoshilinch' } as any)[c.priority] ?? '')}</span></div><h3>{(c.private || c.locked) && <LockKeyhole size={13}/>} {c.title}</h3><div className="tc-bottom"><div className="avatar-stack">{c.assignees.slice(0, 3).map(id => <Avatar key={id} state={state} id={id}/>)}{c.assignees.length > 3 && <span className="avatar more">+{c.assignees.length - 3}</span>}</div><span className="card-counts">{c.comments.length > 0 && <span><MessageSquare size={13}/>{c.comments.length}</span>}{c.files.length > 0 && <span><Paperclip size={13}/>{c.files.length}</span>}</span><div className="tc-tags">{c.labels.filter(Boolean).slice(0, 2).map((l, i) => <span key={l + i}># {translatePreset(l, locale)}</span>)}</div></div></> : <><div className="card-labels">{c.labels.filter(Boolean).map((l, i) => <span key={l + i} className={'label label-' + (l === 'Dizayn' || l === 'UI/UX' ? 'purple' : l === 'Dasturlash' ? 'blue' : l === 'Tadqiqot' ? 'orange' : 'teal')}>{translatePreset(l, locale)}</span>)}{(c.private || c.locked) && <LockKeyhole size={13}/>}</div><h3>{c.title}</h3><div className="card-ident"><span>{c.number}</span><Priority value={c.priority}/></div>{c.checklist.length > 0 && <div className="check-progress"><div><span style={{ width: (count / c.checklist.length * 100) + '%' }}/></div><span><CheckCheck size={13}/> {count}{t("/")}{c.checklist.length}</span></div>}<div className="card-bottom"><span className={'due-date ' + (overdue ? 'overdue' : done ? 'completed' : '')}><CalendarDays size={13}/>{c.due ? shortDate(c.due, locale) : t('Muddatsiz')}</span><span className="card-counts">{c.comments.length > 0 && <span><MessageSquare size={13}/>{c.comments.length}</span>}{c.files.length > 0 && <span><Paperclip size={13}/>{c.files.length}</span>}</span><div className="avatar-stack">{c.assignees.map(id => <Avatar key={id} state={state} id={id}/>)}</div></div></>}</article>; }


/** A short firework at (x, y): used when a task reaches the done column or its checklist is finished. */
export function fireSalute(x: number, y: number) {
    if (typeof document === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.createElement('div');
    root.className = 'salute';
    root.setAttribute('aria-hidden', 'true');
    root.style.left = x + 'px';
    root.style.top = y + 'px';
    const colors = ['#57D07F', '#E8C35A', '#1C1D1A', '#9BE8B0'];
    root.innerHTML = '<i class="salute-rocket"></i><span class="salute-burst"><i class="salute-flash"></i>' + Array.from({ length: 12 }, (_, i) => `<i class="salute-spark" style="--a:${i * 30}deg;--c:${colors[i % colors.length]}"></i>`).join('') + '</span>';
    document.body.appendChild(root);
    setTimeout(() => root.remove(), 1500);
}

type PillItem = { id: string; label: string; short?: string; icon?: any; badge?: number };
/**
 * Tabs with a "liquid glass" lens: when the active tab changes, the lens lifts, stretches and slides
 * to the new tab, then settles into a soft pill. With `draggable`, the lens can also be dragged with a
 * finger and dropped on a tab (phone tab bar).
 */
function PillTabs({ items, active, onSelect, label, className = '', stacked = false, draggable = false }: { items: PillItem[]; active: string; onSelect: (id: string) => void; label: string; className?: string; stacked?: boolean; draggable?: boolean }) {
    const wrap = useRef<HTMLElement>(null);
    const lens = useRef<HTMLSpanElement>(null);
    const placed = useRef<{ left: number; width: number } | null>(null);
    const drag = useRef<{ x: number; id: number; moved: boolean; grab: number } | null>(null);
    const suppress = useRef(false);
    const signature = items.map(item => item.id + item.label + (item.badge ?? '')).join('|');
    const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const measure = (id: string) => { const el = wrap.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`); return el ? { left: el.offsetLeft, width: el.offsetWidth } : null; };
    const settle = (node: HTMLElement) => { node.classList.remove('moving'); };
    const place = (target: { left: number; width: number } | null, animate: boolean) => {
        const node = lens.current;
        if (!node) return;
        if (!target) { node.style.opacity = '0'; placed.current = null; return; }
        const from = placed.current;
        placed.current = target;
        node.style.opacity = '1';
        node.getAnimations().forEach(animation => animation.cancel());
        node.style.transform = `translateX(${target.left}px)`;
        node.style.width = target.width + 'px';
        if (!animate || !from || reduced() || (from.left === target.left && from.width === target.width)) { settle(node); return; }
        const distance = Math.abs(target.left - from.left);
        const wide = Math.max(from.width, target.width) + Math.min(distance * 0.18, 40);
        node.classList.add('moving');
        const animation = node.animate([
            { transform: `translateX(${from.left}px) scale(1, 1)`, width: from.width + 'px' },
            { transform: `translateX(${from.left + (target.left - from.left) * 0.2}px) scale(1.14, 1.2)`, width: from.width + 'px', offset: 0.18 },
            { transform: `translateX(${(from.left + target.left) / 2 - (wide - (from.width + target.width) / 2) / 2}px) scale(1.16, 1.18)`, width: wide + 'px', offset: 0.5 },
            { transform: `translateX(${target.left}px) scale(1.12, 1.14)`, width: target.width + 'px', offset: 0.78 },
            { transform: `translateX(${target.left}px) scale(0.97, 0.98)`, width: target.width + 'px', offset: 0.9 },
            { transform: `translateX(${target.left}px) scale(1, 1)`, width: target.width + 'px' },
        ], { duration: 620, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' });
        animation.onfinish = () => settle(node);
    };
    useLayoutEffect(() => {
        place(measure(active), true);
        // ResizeObserver also fires once right after observe(); only react to real size changes
        let lastWidth = wrap.current?.offsetWidth ?? 0;
        const observer = new ResizeObserver(() => { const width = wrap.current?.offsetWidth ?? 0; if (width === lastWidth) return; lastWidth = width; place(measure(active), false); });
        if (wrap.current) observer.observe(wrap.current);
        return () => observer.disconnect();
    }, [active, signature]);
    const nearest = (center: number) => {
        let best = active, gap = Infinity;
        wrap.current?.querySelectorAll<HTMLElement>('[data-id]').forEach(el => { const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center); if (d < gap) { gap = d; best = el.dataset.id!; } });
        return best;
    };
    const dragHandlers = draggable ? {
        onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            const box = wrap.current!.getBoundingClientRect();
            const current = placed.current;
            const x = e.clientX - box.left;
            drag.current = { x: e.clientX, id: e.pointerId, moved: false, grab: current && x >= current.left && x <= current.left + current.width ? x - current.left : (current?.width ?? 60) / 2 };
        },
        onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
            const d = drag.current, node = lens.current, current = placed.current;
            if (!d || !node || !current || d.id !== e.pointerId) return;
            if (!d.moved) { if (Math.abs(e.clientX - d.x) < 8) return; d.moved = true; wrap.current!.setPointerCapture(e.pointerId); node.getAnimations().forEach(a => a.cancel()); node.classList.add('moving', 'held'); }
            const box = wrap.current!.getBoundingClientRect();
            const left = Math.max(-8, Math.min(box.width - current.width + 8, e.clientX - box.left - d.grab));
            node.style.transform = `translateX(${left}px) scale(1.18, 1.22)`;
            const id = nearest(left + current.width / 2);
            wrap.current!.querySelectorAll<HTMLElement>('[data-id]').forEach(el => el.classList.toggle('hover', el.dataset.id === id));
        },
        onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
            const d = drag.current; drag.current = null;
            const node = lens.current;
            if (!d?.moved || !node || !placed.current) return;
            suppress.current = true;
            setTimeout(() => { suppress.current = false; }, 0);
            const box = wrap.current!.getBoundingClientRect();
            const left = Math.max(0, Math.min(box.width - placed.current.width, e.clientX - box.left - d.grab));
            wrap.current!.querySelectorAll<HTMLElement>('.hover').forEach(el => el.classList.remove('hover'));
            node.classList.remove('held');
            const id = nearest(left + placed.current.width / 2);
            placed.current = { left, width: placed.current.width };
            if (id === active) place(measure(active), true); else onSelect(id);
        },
        onPointerCancel: () => { drag.current = null; lens.current?.classList.remove('held'); place(measure(active), true); },
    } : {};
    return <nav ref={wrap} className={'pill-tabs ' + className} aria-label={label} {...dragHandlers}>
        <span ref={lens} className="pill-indicator" aria-hidden="true" style={{ opacity: 0 }}/>
        {items.map(({ id, label, short, icon: Icon, badge }) => <button key={id} type="button" data-id={id} data-active={active === id} aria-current={active === id ? 'page' : undefined} className={active === id ? 'active' : ''} onClick={() => { if (suppress.current) return; onSelect(id); }}>
            {stacked ? <><span className="tab-icon">{Icon && <Icon size={21} aria-hidden="true"/>}{!!badge && <em>{badge}</em>}</span><small>{short ?? label}</small></> : <>{Icon && <Icon size={16} aria-hidden="true"/>}<span>{label}</span>{!!badge && <em>{badge}</em>}</>}
        </button>)}
    </nav>;
}

/** Counts from the previous value to the new one. */
function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
    const [shown, setShown] = useState(0);
    const from = useRef(0);
    useEffect(() => {
        const start = performance.now();
        const begin = from.current;
        const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let frame = 0;
        const tick = (now: number) => {
            const p = instant ? 1 : Math.min(1, (now - start) / 900);
            const next = Math.round(begin + (value - begin) * (1 - Math.pow(1 - p, 3)));
            from.current = next;
            setShown(next);
            if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value]);
    return <>{shown}{suffix}</>;
}

function Ring({ done, total, label }: { done: number; total: number; label: string }) {
    const length = 2 * Math.PI * 48;
    return <svg className="donut" viewBox="0 0 120 120" role="img" aria-label={label}>
        <circle className="donut-track" cx="60" cy="60" r="48"/>
        <circle className="donut-value" cx="60" cy="60" r="48" transform="rotate(-90 60 60)" style={{ strokeDasharray: length, strokeDashoffset: length * (1 - (total ? done / total : 0)), ['--ring-length' as string]: length }}/>
    </svg>;
}

function Skeleton() {
    return <div className="skeleton" aria-busy="true" aria-label="Yuklanmoqda">
        <span className="sk sk-title"/>
        <div className="sk-row"><span className="sk sk-bar"/><span className="sk sk-bar"/><span className="sk sk-bar"/><span className="sk sk-bar"/></div>
        <div className="sk-grid"><span className="sk sk-card"/><span className="sk sk-card"/><span className="sk sk-card"/></div>
        <div className="sk-grid four"><span className="sk sk-col"/><span className="sk sk-col"/><span className="sk sk-col"/><span className="sk sk-col"/></div>
    </div>;
}

function UserMenu({ state, user, name, role, dark, onDark, onView, onSpaces, onLogout, language }: { state: State; user: string; name: string; role: string; dark: boolean; onDark: () => void; onView: (view: string) => void; onSpaces: () => void; onLogout: () => void; language: React.ReactNode }) {
    const t = useT();
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, [open]);
    const go = (action: () => void) => () => { setOpen(false); action(); };
    return <div className="user-menu" ref={root} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
        <button type="button" className="user-trigger" aria-haspopup="menu" aria-expanded={open} aria-label={t('Profil menyusi')} onClick={() => setOpen(!open)}><Avatar state={state} id={user}/></button>
        {open && <div className="user-pop" role="menu">
            <div className="user-head"><Avatar state={state} id={user}/><div><strong>{name}</strong><small>{role}</small></div></div>
            <button type="button" role="menuitem" onClick={go(onSpaces)}><Layers size={17}/><span>{state.name}<small>{t('Ish maydonini almashtirish')}</small></span></button>
            <button type="button" role="menuitem" onClick={go(() => onView('members'))}><Users size={17}/>{t('Jamoa va huquqlar')}</button>
            <button type="button" role="menuitem" onClick={go(() => onView('reports'))}><ChartNoAxesCombined size={17}/>{t('Hisobotlar')}</button>
            <button type="button" role="menuitem" onClick={go(() => onView('boards'))}><LayoutDashboard size={17}/>{t('Barcha doskalar')}</button>
            <button type="button" role="menuitem" onClick={go(() => onView('notifications'))}><Bell size={17}/>{t('Bildirishnomalar')}</button>
            <button type="button" role="menuitem" onClick={go(() => onView('activity'))}><History size={17}/>{t('Faoliyat tarixi')}</button>
            <button type="button" role="menuitem" onClick={go(() => onView('archive'))}><Archive size={17}/>{t('Arxiv')}</button>
            <button type="button" role="menuitem" onClick={go(() => onView('settings'))}><Settings size={17}/>{t('Sozlamalar')}</button>
            <div className="user-language"><span>{t('Platforma tili')}</span>{language}</div>
            <button type="button" role="menuitem" onClick={go(onDark)}>{dark ? <Sun size={17}/> : <Moon size={17}/>}{t(dark ? 'Yorug‘ rejim' : 'Qorong‘i rejim')}</button>
            <button type="button" role="menuitem" className="danger" onClick={go(onLogout)}><LogOut size={17}/>{t('Hisobdan chiqish')}</button>
        </div>}
    </div>;
}

const isoDay = (date: Date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');

/** Home page: greeting, status of the current board, key numbers and the user's own work. */
function Dashboard({ state, user, board, me, onOpen }: { state: State; user: string; board?: Board; me?: Member; onOpen: (card: Card) => void }) {
    const t = useT();
    const locale = useContext(LanguageContext);
    const live = state.cards.filter(c => !c.archived);
    const isDone = (c: Card) => { const b = state.boards.find(x => x.id === c.boardId); return !!b && doneColumnId(b) === c.columnId; };
    const hour = new Date().getHours();
    const greeting = t(hour < 12 ? 'Xayrli tong' : hour < 18 ? 'Xayrli kun' : 'Xayrli kech');
    const rawName = me?.name?.trim() ?? '';
    const first = (rawName.includes('@') ? rawName.split('@')[0].replace(/^./, ch => ch.toUpperCase()) : rawName.split(/\s+/)[0]) || '';
    const boardCards = board ? live.filter(c => c.boardId === board.id) : [];
    const segments = (board?.columns ?? []).map((col, i) => ({ col, count: boardCards.filter(c => c.columnId === col.id).length, style: ['ink', 'green', 'hatch', 'outline'][i % 4] }));
    const today = new Date();
    const todayIso = isoDay(today);
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
    const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); const iso = isoDay(d); return { iso, label: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'][i], count: live.filter(c => c.due === iso).length }; });
    const peak = Math.max(1, ...week.map(d => d.count));
    const weekTotal = week.reduce((sum, d) => sum + d.count, 0);
    const mine = live.filter(c => c.assignees.includes(user));
    const mineDone = mine.filter(isDone).length;
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const dueTomorrow = mine.filter(c => !isDone(c) && c.due === isoDay(tomorrow)).length;
    const pool = mine.length ? mine : live;
    const upcoming = pool.filter(c => !isDone(c) && c.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
    const overdue = pool.filter(c => !isDone(c) && c.due && c.due < todayIso).length;
    const members = state.members.filter(m => m.active && !m.id.startsWith('invite-')).length;
    const boards = state.boards.filter(b => !b.archived).length;
    return <section className="dash" aria-label={t('Bosh sahifa')}>
        <div className="dash-hero">
            <div className="dash-greeting">
                <h1>{greeting}{first ? ', ' + first : ''}</h1>
                {board && boardCards.length > 0 && <div className="dash-segments">{segments.map(({ col, count, style }) => <div className="segment" key={col.id} style={{ flexGrow: Math.max(count, 0.6) }}><span>{translatePreset(col.name, locale)} · {count}</span><b className={'seg-' + style}>{Math.round(count / boardCards.length * 100)}%</b></div>)}</div>}
            </div>
            <div className="dash-numbers">
                <div><strong><CountUp value={live.length}/></strong><span>{t('Vazifa')}</span></div>
                <div><strong><CountUp value={members}/></strong><span>{t('A’zo')}</span></div>
                <div><strong><CountUp value={boards}/></strong><span>{t('Doska')}</span></div>
            </div>
        </div>
        <div className="dash-widgets">
            <article className="widget">
                <header><h2>{t('Shu hafta muddatlar')}</h2><span className="chip">{weekTotal} {t('ta vazifa')}</span></header>
                <div className="week-bars">{week.map((d, i) => <div key={d.iso} className={'week-day' + (d.iso === todayIso ? ' today' : '')} title={d.count + ' ' + t('ta vazifa')}><span className="bar-track"><i style={{ height: Math.max(8, d.count / peak * 100) + '%', animationDelay: i * 0.05 + 's' }}/></span><small>{t(d.label)}</small></div>)}</div>
            </article>
            <article className="widget focus">
                <header><h2>{t('Mening fokusim')}</h2></header>
                <div className="ring-wrap"><Ring done={mineDone} total={mine.length} label={mineDone + ' / ' + mine.length}/><div><strong><CountUp value={mineDone}/>/{mine.length}</strong><small>{t('bajarildi')}</small></div></div>
                <p>{mine.length === 0 ? t('Sizga hali vazifa biriktirilmagan') : dueTomorrow ? dueTomorrow + ' ' + t('ta vazifaning muddati ertaga') : t('Ertaga muddati tugaydigan vazifa yo‘q')}</p>
            </article>
            <article className="widget dark-widget">
                <header><h2>{t('Muddati yaqin')}</h2>{overdue > 0 && <span className="chip warn">{overdue} {t('ta kechikkan')}</span>}</header>
                {upcoming.length ? <ul>{upcoming.map(c => <li key={c.id}><button type="button" onClick={() => onOpen(c)}><Avatar state={state} id={c.assignees[0] ?? ''}/><span><strong>{c.title}</strong><small className={c.due < todayIso ? 'late' : ''}>{shortDate(c.due, locale)} · {c.number}</small></span><ChevronRight size={16}/></button></li>)}</ul> : <p className="widget-empty">{t('Muddati belgilangan ochiq vazifa yo‘q')}</p>}
            </article>
        </div>
    </section>;
}


/** Design B "Mening vazifalarim": filter tabs and a grid of task cards. */
function MyTasks({ cards, state, onOpen }: { cards: Card[]; state: State; onOpen: (card: Card) => void }) {
    const t = useT();
    const locale = useContext(LanguageContext);
    const [tab, setTab] = useState('all');
    const today = isoDay(new Date());
    const week = new Date(); week.setDate(week.getDate() + 7);
    const weekIso = isoDay(week);
    const boardOf = (c: Card) => state.boards.find(b => b.id === c.boardId);
    const isDone = (c: Card) => { const b = boardOf(c); return !!b && doneColumnId(b) === c.columnId; };
    const shown = cards.filter(c => tab === 'all' ? true : tab === 'today' ? c.due === today && !isDone(c) : tab === 'soon' ? !!c.due && c.due > today && c.due <= weekIso && !isDone(c) : isDone(c));
    const dueThisWeek = cards.filter(c => c.due && c.due >= today && c.due <= weekIso && !isDone(c)).length;
    return <section className="b-mytasks">
        <header><h1>{t('Mening vazifalarim')}</h1><p>{dueThisWeek} {t('ta vazifaning muddati shu hafta')}</p></header>
        <PillTabs className="view-pills" label={t('Saralash')} items={[{ id: 'all', label: t('Hammasi') }, { id: 'today', label: t('Bugun muddatli') }, { id: 'soon', label: t('Yaqinda') }, { id: 'done', label: t('Bajarilgan') }]} active={tab} onSelect={setTab}/>
        <div className="b-task-grid view-body" key={tab}>{shown.map(c => { const col = boardOf(c)?.columns.find(x => x.id === c.columnId); const tone = [...c.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 4; return <button key={c.id} type="button" className={'task-card b-grid-card tone-' + tone} onClick={() => onOpen(c)}>
            <div className="tc-top"><span className={'due-date ' + (c.due && c.due < today && !isDone(c) ? 'overdue' : '')}><CalendarDays size={13}/>{c.due ? shortDate(c.due, locale) : t('Muddatsiz')}</span><span className="tc-chips">{col && <span className="status-chip" style={{ color: col.color, background: col.color + '1f' }}>{translatePreset(col.name, locale)}</span>}<span className={'prio-badge ' + c.priority}>{t(({ low: 'Past', medium: 'O‘rta', high: 'Yuqori', urgent: 'Shoshilinch' } as any)[c.priority] ?? '')}</span></span></div>
            <h3>{c.title}</h3>
            {c.description && <p className="tc-desc">{c.description}</p>}
            <div className="tc-bottom"><div className="avatar-stack">{c.assignees.slice(0, 2).map(id => <Avatar key={id} state={state} id={id}/>)}{c.assignees.length > 2 && <span className="avatar more">+{c.assignees.length - 2}</span>}</div><div className="tc-tags">{c.labels.filter(Boolean).slice(0, 2).map((l, i) => <span key={l + i}># {translatePreset(l, locale)}</span>)}</div></div>
        </button>; })}</div>
        {!shown.length && <Empty text="Bu bo‘limda vazifa yo‘q"/>}
    </section>;
}
