import { csrf, db, errorResponse, hash, rateLimit, response } from '@/lib/server';
import { fail } from '@/lib/actions';
import { passwordHash, validPassword } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        csrf(req);
        const body = await req.json() as { token?: unknown; password?: unknown };
        if (typeof body.token !== 'string' || body.token.length < 20 || body.token.length > 200) fail(400, 'INVALID_TOKEN', 'Havola noto‘g‘ri');
        if (!validPassword(body.password)) fail(400, 'PASSWORD', 'Parol kamida 8 belgidan iborat bo‘lsin');
        const tokenHash = await hash(body.token);
        await rateLimit('reset:' + tokenHash);
        const reset = await db().prepare('SELECT user_id FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>?').bind(tokenHash, Date.now()).first<{ user_id: string }>();
        if (!reset) fail(403, 'EXPIRED', 'Havola eskirgan yoki ishlatilgan');
        const encoded = await passwordHash(body.password);
        const mutation = crypto.randomUUID();
        const result = await db().batch([
            db().prepare('UPDATE password_resets SET used_at=? WHERE token_hash=? AND used_at IS NULL AND expires_at>?').bind(mutation, tokenHash, Date.now()),
            db().prepare('UPDATE accounts SET password_hash=? WHERE id=? AND active=1 AND EXISTS(SELECT 1 FROM password_resets WHERE token_hash=? AND used_at=?)').bind(encoded, reset.user_id, tokenHash, mutation),
            db().prepare('DELETE FROM sessions WHERE user_id=? AND EXISTS(SELECT 1 FROM password_resets WHERE token_hash=? AND used_at=?)').bind(reset.user_id, tokenHash, mutation)
        ]);
        if (result[0].meta.changes !== 1 || result[1].meta.changes !== 1) fail(403, 'EXPIRED', 'Havola eskirgan yoki ishlatilgan');
        return response({ ok: true });
    } catch (error) { return errorResponse(error); }
}
