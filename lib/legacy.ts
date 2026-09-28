import type { State } from './model';

export function transferIdentity(state: State, oldId: string, newId: string, email: string): State {
    const next = structuredClone(state);
    for (const member of next.members) if (member.id === oldId) { member.id = newId; member.email = email; }
    for (const board of next.boards) {
        if (board.members[oldId] !== undefined) {
            board.members[newId] = board.members[oldId];
            delete board.members[oldId];
        }
    }
    for (const card of next.cards) {
        card.assignees = card.assignees.map(id => id === oldId ? newId : id);
        card.watchers = card.watchers.map(id => id === oldId ? newId : id);
        card.allowed = card.allowed.map(id => id === oldId ? newId : id);
        if (card.createdBy === oldId) card.createdBy = newId;
        if (card.acl[oldId] !== undefined) { card.acl[newId] = card.acl[oldId]; delete card.acl[oldId]; }
        for (const comment of card.comments) if (comment.author === oldId) comment.author = newId;
    }
    for (const notice of next.notifications) if (notice.userId === oldId) notice.userId = newId;
    return next;
}
