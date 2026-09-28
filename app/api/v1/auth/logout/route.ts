import { cookies } from 'next/headers';
import { csrf, db, errorResponse, response } from '@/lib/server';
import { SESSION_COOKIE, sessionCookie, sha256 } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        csrf(req);
        const token = (await cookies()).get(SESSION_COOKIE)?.value;
        if (token) await db().prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run();
        const result = response({ ok: true });
        result.headers.set('Set-Cookie', sessionCookie(req, '', 0));
        return result;
    } catch (error) { return errorResponse(error); }
}
