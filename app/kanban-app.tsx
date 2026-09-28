'use client';
import { shortDate, fullDate, monthTitle } from '@/lib/dates';
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Columns3, CheckCheck, CalendarDays, Users, ChartNoAxesCombined, Settings, Search, Plus, ChevronDown, ChevronRight, Bell, Star, LockKeyhole, SlidersHorizontal, List, MoreHorizontal, MessageSquare, Paperclip, ArrowUpRight, X, Check, Menu, Layers, ArrowRight, History, LogOut, Moon, Sun, Trash2, Archive, Copy, Download, GripVertical, ShieldCheck, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { initialState, State, Card, Board, Member, can, canManage, emptyCard, boardRole, boardPermissions, startColumnId, doneColumnId } from '@/lib/model';
import { languageOptions, Locale, countLabel, permissionLabel, roleLabel, roleNameFields, translate, translateNotice, translatePreset } from '@/lib/i18n';
import { LanguageMenu, PasswordField } from './auth-controls';
import StyledSelect from './styled-select';
const LanguageContext = createContext<Locale>('uz-Latn');
const useT = () => { const locale = useContext(LanguageContext); return (source: string) => translate(source, locale); };
function useDragAutoScroll() {
    const frame = useRef<number | null>(null);
    const point = useRef<{ board: HTMLElement; x: number } | null>(null);
    const highlighted = useRef<HTMLElement | null>(null);
    const stop = () => { if (frame.current !== null) cancelAnimationFrame(frame.current); highlighted.current?.classList.remove('drop-target'); highlighted.current = null; frame.current = null; point.current = null; };
    const update = (element: HTMLElement, x: number, y: number, kind: 'card' | 'column') => {
        const board = element.closest<HTMLElement>('.kanban');
        point.current = board ? { board, x } : null;
        const target = document.elementFromPoint(x, y)?.closest<HTMLElement>(kind === 'column' ? '[data-column]' : '[data-card-id], [data-column]') ?? null;
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
const names: Record<string, string> = { boards: 'Barcha doskalar', mine: 'Mening vazifalarim', calendar: 'Kalendar', members: 'Jamoa a’zolari', reports: 'Hisobotlar', activity: 'Faoliyat tarixi', settings: 'Sozlamalar', notifications: 'Bildirishnomalar', archive: 'Arxiv' };
type Dialog = {
    kind: string;
    data: any;
};
export default function KanbanApp() {
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
    const [view, setView] = useState('kanban');
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
    useEffect(() => { const q = new URLSearchParams(location.search); const id = q.get('workspace') ?? ''; const b = q.get('board'); if (b)
        setBoardId(b); setSearch(q.get('q') ?? ''); setPriority(q.get('priority') ?? ''); setAssignee(q.get('assignee') ?? ''); setDeadline(q.get('deadline') ?? ''); void refresh(id); try {
        setFavorites(JSON.parse(localStorage.getItem('oqim-favorites') ?? '[]'));
        setDark(localStorage.getItem('oqim-dark') === 'true');
        const savedLocale = localStorage.getItem('onur-locale');
        if (languageOptions.some(option => option.value === savedLocale)) setLocale(savedLocale as Locale);
    }
    catch { } }, []);
    useEffect(() => { if (user === 'demo')
        return; const t = setInterval(() => { void refreshRef.current(); }, 15000); return () => clearInterval(t); }, [user]);
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
    return <LanguageContext.Provider value={locale}><div className={'app ' + (nav ? 'nav-open' : '')}><aside className="sidebar"><a className="brand" href="/" aria-label={t("ONUR Task Manager")}><img className="brand-logo" src="/onur-logo.png" alt="ONUR"/><span className="brand-product">{t("Task Manager")}</span></a><button className="workspace-switch" onClick={() => setDialog({ kind: 'spaces', data: { name: '' } })}><span className="workspace-avatar">{t("O")}</span><span><strong>{state.name}</strong><small>{t("Ish maydoni")}</small></span><ChevronDown size={16}/></button><nav><div className="nav-caption">{t("ISH MAYDONI")}</div>{sidebarItems.map(([Icon, label, id]: any) => <button key={id} className={view === id ? 'active' : ''} onClick={() => switchView(id)}><Icon size={19} strokeWidth={1.7}/>{t(label)}{id === 'mine' && <span className="nav-count">{state.cards.filter(c => c.assignees.includes(user) && !c.archived).length}</span>}</button>)}<div className="nav-caption">{t("DOSKALAR ")}<button aria-label={t("Doska yaratish")} onClick={() => setDialog({ kind: 'board-new', data: { name: '', description: '', template: '' } })}><Plus size={16}/></button></div>{state.boards.filter(b => !b.archived).map(b => <button key={b.id} className={boardId === b.id && boardView ? 'active' : ''} onClick={() => { setBoardId(b.id); switchView('kanban'); setSearch(''); }}><span className="board-dot" style={{ background: b.color }}/>{translatePreset(b.name, locale)}{favorites.includes(b.id) && <Star size={11}/>}</button>)}<div className="nav-caption">{t("BOSHQARUV")}</div>{managementItems.filter(([, , id]) => id !== 'members' || me?.role !== 'guest').map(([Icon, label, id]: any) => <button key={id} className={view === id ? 'active' : ''} onClick={() => switchView(id)}><Icon size={18} strokeWidth={1.7}/>{t(label)}</button>)}</nav><div className="sidebar-bottom"><div className="team-note"><Layers size={21}/><strong>{t("Birga ishlash osonroq.")}</strong><p>{state.description?.trim() || t("Har bir vazifa o‘z o‘rnida.")}</p></div><button className="profile" onClick={() => switchView('settings')}><Avatar state={state} id={user}/><span><strong>{me?.name ?? 'Siz'}</strong><small>{memberRoleLabel(me)}</small></span><ChevronDown size={16}/></button></div></aside>{nav && <button className="nav-scrim" aria-label={t("Menyuni yopish")} onClick={() => setNav(false)}/>}<div className="main"><header className="topbar"><button className="icon-button mobile-menu" aria-label={t("Menyuni ochish")} onClick={() => setNav(!nav)}><Menu size={21}/></button><div className="breadcrumbs"><span>{t("Ish maydoni")}</span><ChevronRight size={14}/><strong>{t(boardView ? 'Doskalar' : names[view])}</strong></div><div className="top-actions"><LanguageMenu locale={locale} onChange={setLocale} t={t} compact /><div className="global-search"><Search size={17}/><input id="search" aria-label={t("Vazifalarni qidirish")} placeholder={t("Vazifa qidirish...")} value={search} onChange={e => { setSearch(e.target.value); if (e.target.value)
        setView('list'); }}/><kbd>{t("⌘ K")}</kbd></div><button className="icon-button notification-bell" aria-label={t("Bildirishnomalar")} onClick={() => switchView('notifications')}><Bell size={19}/>{state.notifications.some(n => !n.read) && <i />}</button><span className="top-divider"/><Avatar state={state} id={user}/></div></header><main className="content"><div className="page-heading"><div><div className="eyebrow">{t(boardView ? 'LOYIHA DOSKASI' : 'ONUR TASK MANAGER')}</div><div className="title-row"><h1>{search ? t('Qidiruv natijalari') : boardView ? translatePreset(board?.name ?? 'Doskalar', locale) : t(view === 'members' && canManage(state, user) ? 'Admin panel' : names[view])}</h1>{boardView && board && <button className={'icon-button ' + (favorites.includes(board.id) ? 'is-favorite' : '')} aria-label={t("Sevimlilarga qo‘shish")} onClick={toggleFavorite}><Star size={20}/></button>}</div><p>{boardView ? translatePreset(board?.description ?? '', locale) : t('Jamoa ishlarini bir joyda kuzating va boshqaring.')}</p></div><div className="heading-actions"><div className="avatar-stack">{state.members.filter(m => m.active).slice(0, 4).map(m => <Avatar key={m.id} state={state} id={m.id}/>)}</div><button className="button secondary" onClick={() => switchView('members')}><Users size={16}/> {t("Jamoa")}</button></div></div>{user === 'demo' && <div className="demo-banner"><span>{t(loading ? 'Ish maydoni yuklanmoqda…' : 'Namuna doska. Hisobingizga kirib o‘z ish maydoningizda ishlang.')}</span><a href="/login">{t("Hisobga kirish ")}<ArrowRight size={15}/></a></div>}{['kanban', 'list', 'mine', 'calendar'].includes(view) && board && <><div className="board-toolbar"><div className="view-tabs">{[[Columns3, 'Kanban', 'kanban'], [List, 'Ro‘yxat', 'list'], [CalendarDays, 'Kalendar', 'calendar']].map(([Icon, label, id]: any) => <button className={view === id ? 'selected' : ''} key={id} onClick={() => switchView(id)}><Icon size={17}/>{t(label)}</button>)}</div><div className="toolbar-actions"><span className="private-label"><LockKeyhole size={14}/>{t(board.visibility === 'closed' ? 'Yopiq doska' : 'Ish maydoniga ochiq')}</span><button className={'filter-button ' + (priority || assignee || deadline ? 'filtered' : '')} onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={16}/>{t("Filtrlar")}</button><button className="button" disabled={!can(state, user, board, 'card.create') && user !== 'demo'} onClick={() => newCard()}><Plus size={17}/> {t("Vazifa qo‘shish")}</button><button className="icon-button" aria-label={t("Doska sozlamalari")} onClick={() => setDialog({ kind: 'board-settings', data: structuredClone(board) })}><MoreHorizontal size={20}/></button></div></div>{filterOpen && <div className="filter-panel"><StyledSelect ariaLabel={t("Prioritet filtri")} value={priority} onChange={setPriority} options={[{value:'',label:t('Barcha prioritetlar')},{value:'low',label:t('Past')},{value:'medium',label:t('O‘rta')},{value:'high',label:t('Yuqori')},{value:'urgent',label:t('Shoshilinch')}]} /><StyledSelect ariaLabel={t("Mas’ul filtri")} value={assignee} onChange={setAssignee} options={[{value:'',label:t('Barcha mas’ullar')},...state.members.map(m => ({value:m.id,label:m.name}))]} /><StyledSelect ariaLabel={t("Muddat filtri")} value={deadline} onChange={setDeadline} options={[{value:'',label:t('Barcha muddatlar')},{value:'today',label:t('Bugun')},{value:'late',label:t('Muddati o‘tgan')}]} /><button className="button secondary" onClick={() => { setPriority(''); setAssignee(''); setDeadline(''); setSearch(''); }}>{t("Tozalash")}</button><button className="button secondary" onClick={() => copyLink()}><LinkIcon size={15}/> {t("Filtr havolasi")}</button></div>}<div className="board-meta"><span><span className="live-dot"/>{countLabel(cards.length, "tasks", locale)}</span><span><ShieldCheck size={13}/>{t(user === 'demo' ? 'Namuna ma’lumotlar' : 'Huquqlar himoyalangan · 15 soniyada yangilanadi')}</span></div></>}
 {view === 'kanban' && board ? <KanbanBoard board={board} cards={cards} state={state} user={user} onOpen={openCard} onAdd={newCard} onNewColumn={() => setDialog({ kind: 'column', data: { id: '', boardId: board.id, name: '', limit: 0, locked: false, color: '#8296ac', addRoles: [], moveRoles: [] } })} onSettings={col => setDialog({ kind: 'column', data: { ...structuredClone(col), boardId: board.id } })} onReorderCard={reorderCard} onReorderColumn={reorderColumn}/> : view === 'boards' ? <div className="boards-grid">{state.boards.filter(b => !b.archived).map(b => <button className="board-tile" key={b.id} onClick={() => { setBoardId(b.id); switchView('kanban'); }}><span className="tile-icon" style={{ color: b.color, background: b.color + '16' }}><Columns3 size={26}/></span><h2>{translatePreset(b.name, locale)}</h2><p>{translatePreset(b.description, locale)}</p><div><span>{countLabel(state.cards.filter(c => c.boardId === b.id && !c.archived).length, "tasks", locale)}</span><ArrowUpRight size={18}/></div></button>)}{canManage(state, user) && <button className="board-tile new-board" onClick={() => setDialog({ kind: 'board-new', data: { name: '', description: '', template: '' } })}><Plus size={28}/><h2>{t("Yangi doska")}</h2><p>{t("Yangi loyiha uchun joy oching")}</p></button>}</div> : ['list', 'mine'].includes(view) ? <><div className="bulk-bar">{chosen.length > 0 && <><span>{chosen.length} {t("ta tanlandi")}</span><StyledSelect ariaLabel={t("Guruh holda ko‘chirish")} value="" onChange={value => { if (value) void mutate('cards.bulk', { ids: chosen, columnId: value }, false).then(() => setChosen([])); }} options={[{value:'',label:t('Ustunga ko‘chirish')},...(board?.columns.map(c => ({value:c.id,label:translatePreset(c.name,locale)})) ?? [])]} /><button className="button secondary" onClick={() => setDialog({ kind: 'confirm', data: { title: 'Tanlangan vazifalar arxivlansinmi?', action: 'cards.bulk', payload: { ids: chosen, archive: true } } })}><Archive size={14}/> {t("Arxivlash")}</button></>}</div><div className="table-wrap"><table><thead><tr><th /><th>{t("Vazifa")}</th><th>{t("Holat")}</th><th>{t("Mas’ul")}</th><th>{t("Muddat")}</th><th>{t("Prioritet")}</th></tr></thead><tbody>{cards.map(c => <tr key={c.id}><td><input type="checkbox" aria-label={c.title + ' tanlash'} checked={chosen.includes(c.id)} onChange={e => setChosen(e.target.checked ? [...chosen, c.id] : chosen.filter(x => x !== c.id))}/></td><td><button className="text-left" onClick={() => openCard(c)}><small>{c.number}</small><strong>{c.title}</strong></button></td><td>{state.boards.find(b => b.id === c.boardId)?.columns.find(l => l.id === c.columnId)?.name ? translatePreset(state.boards.find(b => b.id === c.boardId)!.columns.find(l => l.id === c.columnId)!.name, locale) : ''}</td><td><div className="avatar-stack">{c.assignees.map(id => <Avatar key={id} state={state} id={id}/>)}</div></td><td>{c.due || '—'}</td><td><Priority value={c.priority}/></td></tr>)}</tbody></table>{!cards.length && <Empty text="Filtrga mos vazifa topilmadi"/>}</div></> : view === 'calendar' ? <div className="calendar-panel"><header><h2>{monthTitle(month, locale)}</h2><div><button className="button secondary" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>{t("←")}</button><button className="button secondary" onClick={() => setMonth(new Date())}>{t("Bugun")}</button><button className="button secondary" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>{t("→")}</button></div></header><div className="calendar-grid">{['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(d => <div className="weekday" key={d}>{t(d)}</div>)}{Array.from({ length: 42 }, (_, i) => { const date = new Date(month.getFullYear(), month.getMonth(), 1); date.setDate(1 - ((date.getDay() + 6) % 7) + i); const ds = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'); return <div className={'calendar-day ' + (date.getMonth() !== month.getMonth() ? 'muted-day' : '') + (ds === today ? ' today' : '')} key={ds}><span>{date.getDate()}</span>{cards.filter(c => c.due === ds).map(c => <button key={c.id} onClick={() => openCard(c)} title={c.title}>{c.title}</button>)}</div>; })}</div></div> : view === 'members' ? <div className="panel"><div className="panel-heading"><h2>{t("Jamoa · ")}{state.members.length} {t("a’zo")}</h2>{platformAdmin && <button className="button" onClick={() => { setInviteResult(''); setDialog({ kind: 'invite', data: { email: '', name: '', password: '', role: 'member', boardRole: '', team: '' } }); }}><Plus size={16}/> {t("Foydalanuvchi yaratish")}</button>}</div>{platformAdmin && <div className="admin-summary"><div><strong>{state.members.filter(m => m.active && !m.id.startsWith('invite-')).length}</strong><span>{t('Faol foydalanuvchi')}</span></div><div><strong>{state.members.filter(m => m.id.startsWith('invite-') && m.active).length}</strong><span>{t('Taklif kutilmoqda')}</span></div><div><strong>{state.members.filter(m => !m.active).length}</strong><span>{t('Bloklangan')}</span></div></div>}{state.members.map(m => <div className="member-row" key={m.id}><Avatar state={state} id={m.id}/><div><strong>{m.name}</strong><p>{m.email}{m.id.startsWith('sample-') ? ' · Namuna a’zo' : ''}</p></div><span>{m.team}</span><span className="role-tag">{memberRoleLabel(m)}{!m.active ? ' · ' + t('Bloklangan') : m.id.startsWith('invite-') ? ' · ' + t('Taklif kutilmoqda') : ''}</span>{canManage(state, user) && <button className="icon-button" aria-label={m.name + ' huquqlari'} onClick={() => { setInviteResult(''); setDialog({ kind: 'member', data: { ...structuredClone(m), boardRole: memberBoardRoleId(m), boardRoleChanged: false, password: '' } }); }}><Settings size={17}/></button>}</div>)}</div> : view === 'reports' ? <div className="panel"><div className="panel-heading"><h2>{board?.name} {t("· Hisobot")}</h2><button className="button secondary" disabled={!board || !can(state, user, board, 'export')} onClick={exportData}><Download size={16}/> {t("CSV eksport")}</button></div><div className="stats-grid">{board?.columns.map(col => <div className="stat" key={col.id}><span>{translatePreset(col.name, locale)}</span><strong style={{ color: col.color }}>{state.cards.filter(c => c.boardId === board.id && c.columnId === col.id && !c.archived).length}</strong></div>)}</div><h3 className="section-heading">{t("Xodimlar kesimida")}</h3><table><thead><tr><th>{t("A’zo")}</th><th>{t("Ochiq")}</th><th>{t("Bajarildi")}</th><th>{t("Kechikkan")}</th></tr></thead><tbody>{state.members.map(m => { const own = state.cards.filter(c => c.assignees.includes(m.id) && !c.archived); const done = (c: Card) => doneColumnId(state.boards.find(b => b.id === c.boardId)!) === c.columnId; return <tr key={m.id}><td>{m.name}</td><td>{own.filter(c => !done(c)).length}</td><td>{own.filter(done).length}</td><td>{own.filter(c => !done(c) && c.due && c.due < today).length}</td></tr>; })}</tbody></table></div> : view === 'activity' ? <div className="panel"><h2>{t("O‘zgarishlar va xavfsizlik jurnali")}</h2>{activity.length ? activity.map(a => <div className="activity-row" key={a.id}><History size={18}/><div><strong>{a.actor_name}</strong> <span>{a.action}</span><p>{a.summary}</p></div><time>{new Date(a.created_at).toLocaleString(locale === 'ru' ? 'ru-RU' : locale === 'uz-Cyrl' ? 'uz-Cyrl-UZ' : 'uz-Latn-UZ')}</time></div>) : <Empty text="Hozircha faoliyat yo‘q"/>}</div> : view === 'notifications' ? <div className="panel"><div className="panel-heading"><h2>{t("Siz uchun xabarlar")}</h2><button className="button secondary" onClick={() => mutate('notifications.read', {}, false)}>{t("O‘qilgan deb belgilash")}</button></div>{state.notifications.length ? state.notifications.map(n => <button className={'notification-row ' + (!n.read ? 'unread' : '')} key={n.id} onClick={() => { const c = state.cards.find(c => c.id === n.cardId); if (c)
        openCard(c); }}><Bell size={18}/><span>{n.text}<small>{new Date(n.at).toLocaleString(locale === 'ru' ? 'ru-RU' : locale === 'uz-Cyrl' ? 'uz-Cyrl-UZ' : 'uz-Latn-UZ')}</small></span></button>) : <Empty text="Yangi bildirishnomalar yo‘q"/>}</div> : view === 'archive' ? <div className="panel"><h2>{t("Arxivlangan doskalar va vazifalar")}</h2>{state.boards.filter(b => b.archived).map(b => <div className="member-row" key={b.id}><Columns3 size={20}/><strong>{b.name}</strong><button className="button secondary" onClick={() => mutate('board.save', { ...b, archived: false }, false)}>{t("Qaytarish")}</button></div>)}{state.cards.filter(c => c.archived).map(c => <div className="member-row" key={c.id}><Archive size={20}/><strong>{c.title}</strong><button className="button secondary" onClick={() => mutate('card.archive', { id: c.id, archived: false }, false)}>{t("Qaytarish")}</button></div>)}{!state.boards.some(b => b.archived) && !state.cards.some(c => c.archived) && <Empty text="Arxiv bo‘sh"/>}</div> : view === 'settings' ? <div className="settings-grid"><div className="panel"><h2>{t("Ish maydoni")}</h2><label>{t("Nomi")}<input defaultValue={state.name} key={state.name} id="ws-name"/></label><label>{t("Tavsif")}<textarea defaultValue={state.description} key={state.description} id="ws-description"/></label><button className="button" disabled={!canManage(state, user)} onClick={() => mutate('workspace.save', { name: (document.getElementById('ws-name') as HTMLInputElement).value, description: (document.getElementById('ws-description') as HTMLTextAreaElement).value }, false)}>{t("Saqlash")}</button></div><div className="panel"><h2>{t("Profil va ko‘rinish")}</h2><label>{t("Ism-familiya")}<input defaultValue={me?.name} key={me?.name} id="profile-name"/></label><button className="button secondary" onClick={() => mutate('profile.save', { name: (document.getElementById('profile-name') as HTMLInputElement).value }, false)}>{t("Profilni saqlash")}</button><div className="language-setting">{t("Platforma tili")}<LanguageMenu locale={locale} onChange={setLocale} t={t} /></div><button className="settings-toggle" onClick={() => setDark(!dark)}>{dark ? <Sun size={19}/> : <Moon size={19}/>} {t(dark ? 'Yorug‘ rejim' : 'Qorong‘i rejim')}<span>{t(dark ? 'Yoqilgan' : 'O‘chirilgan')}</span></button><button className="settings-toggle" onClick={logout}><LogOut size={18}/>{t("Hisobdan chiqish")}</button></div>{canManage(state, user) && <div className="panel roles-panel"><div className="panel-heading"><h2>{t("Doska rollari va huquqlar")}</h2><button className="button secondary" onClick={() => setDialog({ kind: 'role', data: { id: '', name: '', nameCyrl: '', nameRu: '', scope: 'board', permissions: ['view'] } })}><Plus size={16}/> {t("Yangi rol")}</button></div>{state.roles.filter(r => r.scope === 'board').map(r => <button className="role-line" key={r.id} onClick={() => setDialog({ kind: 'role', data: { ...structuredClone(r), ...roleNameFields(r) } })}><ShieldCheck size={18}/><strong>{roleLabel(r.id, r.name, locale, r)}</strong><span>{countLabel(r.permissions.length, "permissions", locale)}</span><ChevronRight size={16}/></button>)}</div>}</div> : null}
 <footer className="page-footer"><span>{t("ONUR Task Manager")}</span><span>{fullDate(new Date(), locale)}</span></footer></main></div>
 {selected && selectedBoard && <Modal title={selected.number || 'YANGI VAZIFA'} close={() => setSelected(null)}>{selected.id && draftVersion !== version && <div className="inline-note">{t("Doska yangilandi. Yangi nusxani tekshiring yoki o‘z nusxangizni saqlashni tanlang.")}<button className="button secondary" onClick={() => { const latest = state.cards.find(c => c.id === selected.id); if (latest)
        openCard(latest); }}>{t("Yangi nusxa")}</button><button className="button secondary" onClick={() => setDraftVersion(version)}>{t("Mening nusxam")}</button></div>}<input className="card-title-input" aria-label={t("Vazifa nomi")} placeholder={t("Vazifa nomi")} disabled={!editable} value={selected.title} onChange={e => setSelected({ ...selected, title: e.target.value })}/><div className="card-actions">{selected.id && <><button className="button secondary" onClick={() => copyLink(selected)}><LinkIcon size={14}/> {t("Havola")}</button><button className="button secondary" disabled={!can(state, user, selectedBoard, 'card.create')} onClick={() => { const copy = { ...structuredClone(selected), id: '', number: '', title: selected.title + ' (nusxa)', comments: [], files: [], locked: false, private: false, acl: {} }; setSelected(copy); }}><Copy size={14}/> {t("Nusxalash")}</button><button className="button secondary" disabled={!can(state, user, selectedBoard, 'acl', authCard)} onClick={() => setDialog({ kind: 'acl', data: structuredClone(selected) })}><LockKeyhole size={14}/> {t("Huquqlar")}</button><button className="button secondary" disabled={!can(state, user, selectedBoard, 'card.delete', authCard)} onClick={() => setDialog({ kind: 'confirm', data: { title: 'Vazifa arxivlansinmi?', action: 'card.archive', payload: { id: selected.id, archived: true } } })}><Archive size={14}/></button><button className="icon-button danger" aria-label={t("Vazifani o‘chirish")} disabled={!can(state, user, selectedBoard, 'card.delete', authCard)} onClick={() => setDialog({ kind: 'confirm', data: { title: 'Vazifa butunlay o‘chirilsinmi?', action: 'card.delete', payload: { id: selected.id } } })}><Trash2 size={17}/></button></>}</div>{selected.locked && <div className="inline-note"><LockKeyhole size={16}/> {t("Vazifa qulflangan. Board Admin huquqlar oynasidan ochishi mumkin.")}</div>}<label>{t("Tavsif")}<textarea rows={5} disabled={!editable} value={selected.description} onChange={e => setSelected({ ...selected, description: e.target.value })} placeholder={t("Vazifa haqida batafsil yozing…")}/></label><div className="form-row"><label>{t("Ustun")}<StyledSelect ariaLabel={t('Ustun')} value={selected.columnId} disabled={!!selected.id && !can(state, user, selectedBoard, 'card.move', authCard)} onChange={value => setSelected({ ...selected, columnId: value })} options={selectedBoard.columns.map(c => ({value:c.id,label:translatePreset(c.name,locale)}))} /></label><label>{t("Boshlanish")}<input type="date" disabled={!editable} value={selected.start} onChange={e => setSelected({ ...selected, start: e.target.value })}/></label><label>{t("Muddat")}<input type="date" disabled={!editable} value={selected.due} onChange={e => setSelected({ ...selected, due: e.target.value })}/></label><label>{t("Prioritet")}<StyledSelect ariaLabel={t('Prioritet')} disabled={!editable} value={selected.priority} onChange={value => setSelected({ ...selected, priority: value })} options={[{value:'low',label:t('Past')},{value:'medium',label:t('O‘rta')},{value:'high',label:t('Yuqori')},{value:'urgent',label:t('Shoshilinch')}]} /></label></div><label>{t("Mas’ullar")}</label><div className="assignee-options">{state.members.filter(m => m.active).map(m => <button className={'assignee-chip ' + (selected.assignees.includes(m.id) ? 'picked' : '')} disabled={!editable} key={m.id} onClick={() => setSelected({ ...selected, assignees: selected.assignees.includes(m.id) ? selected.assignees.filter(x => x !== m.id) : [...selected.assignees, m.id] })}><Avatar state={state} id={m.id}/>{m.name}{selected.assignees.includes(m.id) && <Check size={13}/>}</button>)}</div><label>{t("Yorliqlar (vergul bilan)")}<input disabled={!editable} value={selected.labels.join(', ')} onChange={e => setSelected({ ...selected, labels: e.target.value.split(',').map(s => s.trim()) })}/></label><h3>{t("Checklist ")}<span className="muted">{selected.checklist.filter(x => x.done).length}{t("/")}{selected.checklist.length}</span></h3>{selected.checklist.map(item => <label className="check-row" key={item.id}><input type="checkbox" disabled={!editable} checked={item.done} onChange={() => setSelected({ ...selected, checklist: selected.checklist.map(i => i.id === item.id ? { ...i, done: !i.done } : i) })}/>{translatePreset(item.text, locale)}<button className="icon-button" disabled={!editable} aria-label={t("Bandni olib tashlash")} onClick={() => setSelected({ ...selected, checklist: selected.checklist.filter(i => i.id !== item.id) })}><X size={13}/></button></label>)}{editable && <form className="inline-form" onSubmit={e => { e.preventDefault(); if (checkText.trim()) {
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
 {notice && <div className="toast" role="status">{translateNotice(notice, locale)}<button onClick={() => setNotice('')} aria-label={t("Xabarni yopish")}><X size={16}/></button></div>}</div></LanguageContext.Provider>;
}
function DialogFields({ dialog: d, setDialog, state, board, spaces, inviteResult, onSwitch }: any) { const locale = useContext(LanguageContext); const t = useT(); const set = (k: string, v: any) => setDialog({ ...d, data: { ...d.data, [k]: v } }); const text = (label: string, k: string, type = 'text') => <label>{t(label)}<input type={type} value={d.data[k] ?? ''} onChange={e => set(k, type === 'number' ? Number(e.target.value) : e.target.value)}/></label>; return <>{d.kind === 'spaces' && <>{spaces.map((s: any) => <button className="role-line" key={s.id} onClick={() => onSwitch(s.id)}><Layers size={18}/>{s.name}<ArrowRight size={16}/></button>)}<h3>{t("Yangi ish maydoni")}</h3>{text('Nomi', 'name')}</>}{['board-new', 'board-settings', 'column'].includes(d.kind) && text('Nomi', 'name')}{['board-new', 'board-settings'].includes(d.kind) && text('Tavsif', 'description')}{d.kind === 'board-new' && <label>{t("Shablon")}<StyledSelect ariaLabel={t('Shablon')} value={d.data.template} onChange={value => set('template', value)} options={[{value:'',label:t('Standart Kanban')},...state.boards.filter((b: Board) => b.template).map((b: Board) => ({value:b.id,label:translatePreset(b.name,locale)}))]} /></label>}{d.kind === 'board-settings' && <><label>{t("Ko‘rinish")}<StyledSelect ariaLabel={t('Ko‘rinish')} value={d.data.visibility} onChange={value => set('visibility', value)} options={[{value:'closed',label:t('Yopiq — faqat doska a’zolari')},{value:'workspace',label:t('Ish maydoniga ochiq')}]} /></label><label className="check-row"><input type="checkbox" checked={d.data.contributorCreate} onChange={e => set('contributorCreate', e.target.checked)}/>{t("Contributor yangi vazifa yarata oladi")}</label><label className="check-row"><input type="checkbox" checked={d.data.viewerDownload} onChange={e => set('viewerDownload', e.target.checked)}/>{t("Viewer fayllarni yuklab olishi mumkin")}</label><h3>{t("Doska a’zolari")}</h3>{state.members.map((m: any) => <div className="permission-row" key={m.id}><span>{m.name}</span><StyledSelect ariaLabel={t('Doska a’zolari')} value={d.data.members[m.id] ?? 'none'} onChange={value => set('members', { ...d.data.members, [m.id]: value })} options={state.roles.filter((r: any) => r.scope === 'board').map((r: any) => ({value:r.id,label:roleLabel(r.id,r.name,locale,r)}))} /></div>)}</>}{d.kind === 'column' && <>{text('WIP limit (0 = cheklanmagan)', 'limit', 'number')}<label className="check-row"><input type="checkbox" checked={d.data.locked} onChange={e => set('locked', e.target.checked)}/>{t("Ustunni qulflash")}</label>{['addRoles', 'moveRoles'].map(k => <label key={k}>{t(k === 'addRoles' ? 'Kim vazifa qo‘sha oladi' : 'Kim vazifa ko‘chira oladi')}<StyledSelect ariaLabel={t(k === 'addRoles' ? 'Kim vazifa qo‘sha oladi' : 'Kim vazifa ko‘chira oladi')} value={d.data[k]?.[0] ?? ''} onChange={value => set(k, value ? [value] : [])} options={[{value:'',label:t('Roli ruxsat bergan har bir a’zo')},...state.roles.filter((r: any) => r.scope === 'board' && r.id !== 'none').map((r: any) => ({value:r.id,label:roleLabel(r.id,r.name,locale,r)}))]} /></label>)}</>}{d.kind === 'invite' && <>{text('Ism-familiya', 'name')}{text('Email', 'email', 'email')}<PasswordField label={t('Boshlang‘ich parol')} value={d.data.password ?? ''} onChange={value => set('password', value)} autoComplete="new-password" t={t} />{text('Bo‘lim', 'team')}<label>{t("Doska roli")}<StyledSelect ariaLabel={t('Doska roli')} value={d.data.boardRole} onChange={value => set('boardRole', value)} options={[{value:'',label:t('Rolni tanlang')},...state.roles.filter((r: any) => r.scope === 'board').map((r: any) => ({value:r.id,label:roleLabel(r.id,r.name,locale,r)}))]} /></label><p className="muted role-help">{t('Tanlangan rol barcha doskalarga beriladi. Yangi rollar sozlamalarda yaratiladi.')}</p><p className="inline-note">{t('Admin parolni belgilaydi. Xodimga parolni alohida, xavfsiz usulda yetkazing.')}</p>{inviteResult && <div className="admin-invite-result"><label>{t('Kirish havolasi')}<input readOnly value={inviteResult} onFocus={e => e.target.select()}/></label><a className="button secondary" href={'mailto:' + encodeURIComponent(d.data.email) + '?subject=' + encodeURIComponent(t('ONUR Task Manager taklifi')) + '&body=' + encodeURIComponent(t('Siz uchun ONUR Task Manager hisobi yaratildi. Kirish havolasi: ') + inviteResult + '\n' + t('Boshlang‘ich parolni administratoringizdan alohida oling.'))}>{t('Email ilovasida taklifni yuborish')}</a><p className="muted">{t('Email avtomatik yuborilmaydi; pochta ilovangizda yuborishni tasdiqlang.')}</p></div>}</>}{d.kind === 'member' && <>{text('Ism-familiya', 'name')}{text('Bo‘lim', 'team')}{d.data.role !== 'owner' && <label>{t("Doska roli")}<StyledSelect ariaLabel={t('Doska roli')} value={d.data.boardRole} onChange={value => setDialog({ ...d, data: { ...d.data, boardRole: value, boardRoleChanged: true } })} options={[{value:'',label:t('Rolni tanlang')},...state.roles.filter((r: any) => r.scope === 'board').map((r: any) => ({value:r.id,label:roleLabel(r.id,r.name,locale,r)}))]} /></label>}<label className="check-row"><input type="checkbox" checked={d.data.active} onChange={e => set('active', e.target.checked)}/>{t("Faol foydalanuvchi")}</label></>}{d.kind === 'role' && <><div className="role-name-fields">{text('Lotincha nom', 'name')}{text('Kirillcha nom', 'nameCyrl')}{text('Ruscha nom', 'nameRu')}</div><p className="muted role-help">{t('Rol nomlari avtomatik tarjima qilinmaydi. Har uch til uchun nom kiriting.')}</p><div className="permissions-grid">{[...boardPermissions, 'own.edit', 'own.move', 'own.deadline'].map(p => <label className="check-row" key={p}><input type="checkbox" checked={d.data.permissions.includes(p)} onChange={e => set('permissions', e.target.checked ? [...d.data.permissions, p] : d.data.permissions.filter((x: string) => x !== p))}/>{permissionLabel(p, locale)}</label>)}</div></>}{d.kind === 'acl' && <><label className="check-row"><input type="checkbox" checked={d.data.private} onChange={e => set('private', e.target.checked)}/>{t("Yashirin vazifa")}</label><label className="check-row"><input type="checkbox" checked={d.data.locked} onChange={e => set('locked', e.target.checked)}/>{t("Vazifani qulflash")}</label><p className="muted">{t("Owner va Board Admin yashirin vazifalarni ham ko‘radi. Boshqalarga alohida kirish bering.")}</p>{state.members.map((m: any) => <div className="permission-row" key={m.id}><label className="check-row"><input type="checkbox" checked={d.data.allowed.includes(m.id)} onChange={e => set('allowed', e.target.checked ? [...d.data.allowed, m.id] : d.data.allowed.filter((x: string) => x !== m.id))}/>{m.name}</label><StyledSelect ariaLabel={t('Doska huquqidan olish')} value={d.data.acl[m.id] ?? ''} onChange={value => { const acl = { ...d.data.acl }; if (value) acl[m.id] = value; else delete acl[m.id]; set('acl', acl); }} options={[{value:'',label:t('Doska huquqidan olish')},...state.roles.filter((r: any) => r.scope === 'board' && !['none','board-admin'].includes(r.id)).map((r: any) => ({value:r.id,label:roleLabel(r.id,r.name,locale,r)}))]} /></div>)}</>}</>; }
function Modal({ title, close, children }: {
    title: string;
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
    } }; el?.addEventListener('keydown', handler); return () => { el?.removeEventListener('keydown', handler); old?.focus(); }; }, []); return <div className="modal-backdrop" onClick={close}><section ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={t(title)} onClick={e => e.stopPropagation()}><header><span>{t(title)}</span><button className="icon-button" aria-label={t("Yopish")} onClick={close}><X size={20}/></button></header><div className="modal-body">{children}</div></section></div>; }
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
                    if (columnTouch.current?.id === col.id) { columnTouch.current.active = true; el.style.opacity = '.55'; el.setPointerCapture(e.pointerId); }
                }, 400) };
                else { columnTouch.current = { id: col.id, x: e.clientX, y: e.clientY, active: false, timer: null }; el.setPointerCapture(e.pointerId); }
            }}
            onPointerMove={e => {
                const touch = columnTouch.current;
                if (!touch || touch.id !== col.id) return;
                if (touch.active) { edgeScroll.update(e.currentTarget, e.clientX, e.clientY, 'column'); return; }
                if (Math.hypot(e.clientX - touch.x, e.clientY - touch.y) <= 12) return;
                if (touch.timer) { clearTimeout(touch.timer); columnTouch.current = null; }
                else { touch.active = true; e.currentTarget.style.opacity = '.55'; edgeScroll.update(e.currentTarget, e.clientX, e.clientY, 'column'); }
            }}
            onPointerUp={e => {
                const touch = columnTouch.current;
                if (!touch || touch.id !== col.id) return;
                if (touch.timer) clearTimeout(touch.timer);
                if (touch.active) {
                    e.preventDefault();
                    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-column]');
                    if (target) onReorderColumn(col.id, target.dataset.column!, e.clientX > target.getBoundingClientRect().left + target.getBoundingClientRect().width / 2);
                }
                e.currentTarget.style.opacity = '';
                edgeScroll.stop();
                columnTouch.current = null;
            }}
            onPointerCancel={e => { if (columnTouch.current?.timer) clearTimeout(columnTouch.current.timer); columnTouch.current = null; e.currentTarget.style.opacity = ''; edgeScroll.stop(); }}>
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
    const count = c.checklist.filter(x => x.done).length;
    const b = state.boards.find(b => b.id === c.boardId)!;
    const done = doneColumnId(b) === c.columnId;
    const overdue = c.due && c.due < new Date().toISOString().slice(0, 10) && !done;
    const movable = can(state, user, b, 'card.move', c);
    const touch = useRef<{ x: number; y: number; active: boolean; timer: ReturnType<typeof setTimeout> | null } | null>(null);
    const suppressClick = useRef(false);
    const edgeScroll = useDragAutoScroll();
    return <article className={'task-card ' + (movable ? 'can-drag' : '')} data-card-id={c.id} tabIndex={0} role="button"
        onPointerDown={e => {
            if (!movable || (e.pointerType === 'mouse' && e.button !== 0)) return;
            const el = e.currentTarget;
            if (e.pointerType === 'touch') touch.current = { x: e.clientX, y: e.clientY, active: false, timer: setTimeout(() => {
                if (touch.current) { touch.current.active = true; el.style.opacity = '.55'; el.setPointerCapture(e.pointerId); }
            }, 400) };
            else { touch.current = { x: e.clientX, y: e.clientY, active: false, timer: null }; el.setPointerCapture(e.pointerId); }
        }}
        onPointerMove={e => {
            if (!touch.current) return;
            if (touch.current.active) { edgeScroll.update(e.currentTarget, e.clientX, e.clientY, 'card'); return; }
            if (Math.hypot(e.clientX - touch.current.x, e.clientY - touch.current.y) <= 12) return;
            if (touch.current.timer) { clearTimeout(touch.current.timer); touch.current = null; }
            else { touch.current.active = true; e.currentTarget.style.opacity = '.55'; edgeScroll.update(e.currentTarget, e.clientX, e.clientY, 'card'); }
        }}
        onPointerUp={e => {
            if (!touch.current) return;
            if (touch.current.timer) clearTimeout(touch.current.timer);
            if (touch.current.active) {
                e.preventDefault(); suppressClick.current = true;
                const hit = document.elementFromPoint(e.clientX, e.clientY);
                const targetCard = hit?.closest<HTMLElement>('[data-card-id]');
                const dest = hit?.closest<HTMLElement>('[data-column]')?.dataset.column;
                if (dest && targetCard?.dataset.cardId && targetCard.dataset.cardId !== c.id)
                    onReorder(c.id, dest, targetCard.dataset.cardId, e.clientY > targetCard.getBoundingClientRect().top + targetCard.getBoundingClientRect().height / 2);
                else if (dest && targetCard?.dataset.cardId !== c.id) onMove(dest);
            }
            e.currentTarget.style.opacity = '';
            edgeScroll.stop();
            touch.current = null;
        }}
        onPointerCancel={e => { if (touch.current?.timer) clearTimeout(touch.current.timer); touch.current = null; e.currentTarget.style.opacity = ''; edgeScroll.stop(); }}
        onClick={e => { if (suppressClick.current) { suppressClick.current = false; e.preventDefault(); return; } onOpen(); }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}><div className="card-labels">{c.labels.filter(Boolean).map((l, i) => <span key={l + i} className={'label label-' + (l === 'Dizayn' || l === 'UI/UX' ? 'purple' : l === 'Dasturlash' ? 'blue' : l === 'Tadqiqot' ? 'orange' : 'teal')}>{translatePreset(l, locale)}</span>)}{(c.private || c.locked) && <LockKeyhole size={13}/>}</div><h3>{c.title}</h3><div className="card-ident"><span>{c.number}</span><Priority value={c.priority}/></div>{c.checklist.length > 0 && <div className="check-progress"><div><span style={{ width: (count / c.checklist.length * 100) + '%' }}/></div><span><CheckCheck size={13}/> {count}{t("/")}{c.checklist.length}</span></div>}<div className="card-bottom"><span className={'due-date ' + (overdue ? 'overdue' : done ? 'completed' : '')}><CalendarDays size={13}/>{c.due ? shortDate(c.due, locale) : t('Muddatsiz')}</span><span className="card-counts">{c.comments.length > 0 && <span><MessageSquare size={13}/>{c.comments.length}</span>}{c.files.length > 0 && <span><Paperclip size={13}/>{c.files.length}</span>}</span><div className="avatar-stack">{c.assignees.map(id => <Avatar key={id} state={state} id={id}/>)}</div></div></article>; }
