// End-to-end smoke test against a running server build.
// Usage: OTM_TEST_URL=http://127.0.0.1:5181 OTM_SETUP_SECRET=... node --test tests/server.smoke.mjs
// Uses a fresh data folder — it creates the Owner account.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.OTM_TEST_URL || 'http://127.0.0.1:5181';
const secret = process.env.OTM_SETUP_SECRET;
const email = 'owner@onur.test';
const password = 'Sinov-parol-2026';
// Pretend to be the browser behind Caddy: public https origin.
const proxied = { 'Host': 'tasks.onur.test', 'X-Forwarded-Proto': 'https', 'X-Forwarded-Host': 'tasks.onur.test', 'X-Forwarded-For': '203.0.113.7', 'Origin': 'https://tasks.onur.test' };
let cookie = '';
let workspace;

const json = (body, extra = {}) => ({ method: 'POST', headers: { 'Content-Type': 'application/json', ...proxied, ...extra, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
const get = (path, extra = {}) => fetch(base + path, { headers: { ...proxied, ...extra, ...(cookie ? { Cookie: cookie } : {}) }, redirect: 'manual' });

test('fresh install redirects to /setup', async () => {
    const r = await get('/');
    assert.ok([307, 308].includes(r.status), String(r.status));
    assert.match(r.headers.get('location') ?? '', /\/setup$/);
    const s = await (await get('/api/v1/auth/setup')).json();
    assert.equal(s.setupRequired, true);
});

test('setup rejects a wrong key', async () => {
    const r = await fetch(base + '/api/v1/auth/setup', json({ email, password, setupSecret: 'wrong' }));
    assert.equal(r.status, 403);
});

test('setup creates the Owner with a Secure cookie behind https proxy', async () => {
    const r = await fetch(base + '/api/v1/auth/setup', json({ email, password, setupSecret: secret }));
    assert.equal(r.status, 200, await r.clone().text());
    const setCookie = r.headers.get('set-cookie') ?? '';
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /Secure/);
    const again = await fetch(base + '/api/v1/auth/setup', json({ email: 'x@onur.test', password, setupSecret: secret }));
    assert.equal(again.status, 409);
});

test('login works and returns a session', async () => {
    const r = await fetch(base + '/api/v1/auth/login', json({ email, password }));
    assert.equal(r.status, 200, await r.clone().text());
    cookie = (r.headers.get('set-cookie') ?? '').split(';')[0];
    assert.ok(cookie.includes('='));
});

test('workspace loads', async () => {
    const r = await get('/api/v1/workspace');
    assert.equal(r.status, 200, await r.clone().text());
    workspace = await r.json();
    assert.ok(workspace.workspaceId);
    assert.ok(Array.isArray(workspace.state.cards));
});

test('write from another site is blocked (CSRF)', async () => {
    const r = await fetch(base + '/api/v1/actions', json({ workspaceId: workspace.workspaceId, version: workspace.version, action: 'card.save', payload: {} }, { Origin: 'https://evil.example' }));
    assert.equal(r.status, 403);
});

test('card save + version conflict (transaction / CAS)', async () => {
    const card = workspace.state.cards[0];
    if (!card) return; // empty workspace — nothing to edit
    const v = workspace.version;
    const ok = await fetch(base + '/api/v1/actions', json({ workspaceId: workspace.workspaceId, version: v, action: 'card.save', payload: { ...card, title: card.title + ' — server sinov' } }));
    assert.equal(ok.status, 200, await ok.clone().text());
    const stale = await fetch(base + '/api/v1/actions', json({ workspaceId: workspace.workspaceId, version: v, action: 'card.save', payload: { ...card, title: 'eskirgan' } }));
    assert.equal(stale.status, 409);
    workspace = await (await get('/api/v1/workspace')).json();
    assert.equal(workspace.state.cards[0].title, card.title + ' — server sinov');
});

test('file upload, link and download', async () => {
    const card = workspace.state.cards[0];
    if (!card) return;
    const pdf = new TextEncoder().encode('%PDF-1.4\n% sinov fayli\n');
    const form = new FormData();
    form.set('file', new File([pdf], 'sinov.pdf', { type: 'application/pdf' }));
    form.set('workspaceId', workspace.workspaceId);
    form.set('cardId', card.id);
    form.set('version', String(workspace.version));
    const up = await fetch(base + '/api/v1/files', { method: 'POST', headers: { ...proxied, Cookie: cookie }, body: form });
    assert.equal(up.status, 200, await up.clone().text());
    workspace = await up.json();
    const file = workspace.state.cards.find(c => c.id === card.id).files.at(-1);
    const link = await (await get(`/api/v1/files?workspace=${workspace.workspaceId}&card=${card.id}&file=${file.id}`)).json();
    assert.match(link.url, /^\/api\/v1\/download\?token=/);
    const dl = await get(link.url);
    assert.equal(dl.status, 200);
    assert.deepEqual(new Uint8Array(await dl.arrayBuffer()), pdf);
});

test('login rate limit is per real client IP, not global', async () => {
    for (let i = 0; i < 31; i++) await fetch(base + '/api/v1/auth/login', json({ email: `nobody${i}@onur.test`, password: 'noto‘g‘ri-parol' }, { 'X-Forwarded-For': '198.51.100.9' }));
    const blocked = await fetch(base + '/api/v1/auth/login', json({ email, password }, { 'X-Forwarded-For': '198.51.100.9' }));
    assert.equal(blocked.status, 429);
    const other = await fetch(base + '/api/v1/auth/login', json({ email, password }, { 'X-Forwarded-For': '192.0.2.44' }));
    assert.equal(other.status, 200, 'another office user must still be able to log in');
});

test('logout ends the session', async () => {
    const r = await fetch(base + '/api/v1/auth/logout', json({}));
    assert.equal(r.status, 200);
    assert.equal((await get('/api/v1/workspace')).status, 401);
});
