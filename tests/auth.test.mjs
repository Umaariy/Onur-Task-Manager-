import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

await fs.mkdir('work/test-modules', { recursive: true });
for (const name of ['password', 'legacy', 'model']) {
    const source = await fs.readFile(`lib/${name}.ts`, 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    await fs.writeFile(`work/test-modules/${name}.mjs`, output);
}
const { passwordHash, verifyPassword, validPassword } = await import('../work/test-modules/password.mjs');
const { transferIdentity } = await import('../work/test-modules/legacy.mjs');
const { initialState } = await import('../work/test-modules/model.mjs');

test('Passwords are salted, hidden and verified', async () => {
    const password = 'OTM test password 2026!';
    const first = await passwordHash(password);
    const second = await passwordHash(password);
    assert.notEqual(first, second);
    assert.ok(!first.includes(password));
    assert.equal(await verifyPassword(password, first), true);
    assert.equal(await verifyPassword('a different password', first), false);
    assert.equal(await verifyPassword(password, 'invalid'), false);
    assert.equal(validPassword('short'), false);
    assert.equal(validPassword('1234567'), false);
    assert.equal(validPassword('12345678'), true);
});

test('Owner transfer preserves boards, assignments and original input', () => {
    const state = initialState('old-owner', 'old@example.test');
    state.cards[0].watchers = ['old-owner'];
    state.cards[0].comments = [{ id: 'c', author: 'old-owner', text: 'old', at: '2026-09-25' }];
    const next = transferIdentity(state, 'old-owner', 'new-owner', 'new@example.test');
    assert.equal(next.members[0].id, 'new-owner');
    assert.equal(next.boards[0].members['new-owner'], 'board-admin');
    assert.equal(next.cards[0].assignees[0], 'new-owner');
    assert.equal(next.cards[0].watchers[0], 'new-owner');
    assert.equal(next.cards[0].comments[0].author, 'new-owner');
    assert.equal(state.members[0].id, 'old-owner');
    assert.equal(next.cards.length, state.cards.length);
});
