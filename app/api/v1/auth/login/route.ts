import { csrf, db, errorResponse, response } from '@/lib/server';
import { fail } from '@/lib/actions';
import { issueSession, passwordHash, sessionCookie, validPassword, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        csrf(req);
        if (!req.headers.get('content-type')?.startsWith('application/json')) fail(415, 'CONTENT_TYPE', 'JSON kerak');
        const body = await req.json() as Record<string, unknown>;
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = body.password;
        if (!email || email.length > 254 || !validPassword(password)) fail(401, 'INVALID_LOGIN', 'Login yoki parol noto‘g‘ri');
        const window = Math.floor(Date.now() / 900000);
        const address = req.headers.get('CF-Connecting-IP') ?? 'unknown';
        const counts = await db().batch([
            db().prepare('INSERT INTO rate_windows (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind('login-email:' + email + ':' + window, (window + 1) * 900000),
            db().prepare('INSERT INTO rate_windows (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind('login-ip:' + address + ':' + window, (window + 1) * 900000)
        ]);
        if (((counts[0].results?.[0] as { count: number } | undefined)?.count ?? 0) > 10 || ((counts[1].results?.[0] as { count: number } | undefined)?.count ?? 0) > 30) fail(429, 'LOGIN_LIMIT', 'Juda ko‘p urinish. Birozdan keyin urinib ko‘ring.');
        const account = await db().prepare('SELECT id,email,password_hash,active FROM accounts WHERE email=?').bind(email).first<{ id: string; email: string; password_hash: string; active: number }>();
        const valid = account ? await verifyPassword(password, account.password_hash) : (await passwordHash(password), false);
        if (!valid || !account?.active) fail(401, 'INVALID_LOGIN', 'Login yoki parol noto‘g‘ri');
        const spaces = await db().prepare('SELECT w.state FROM memberships m JOIN workspaces w ON w.id=m.workspace_id WHERE m.user_id=?').bind(account.id).all<{ state: string }>();
        if (!spaces.results.some(space => JSON.parse(space.state).members?.some((member: { id: string; active: boolean }) => member.id === account.id && member.active))) fail(403, 'NO_ACCESS', 'Hisobga faol ish maydoni biriktirilmagan');
        const token = await issueSession(db(), account.id);
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Set-Cookie': sessionCookie(req, token) } });
    } catch (error) { return errorResponse(error); }
}
