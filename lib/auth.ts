import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { passwordHash, validPassword, verifyPassword } from './password';

export { passwordHash, validPassword, verifyPassword };
export const SESSION_COOKIE = 'otm_session';
export const SESSION_AGE = 7 * 24 * 60 * 60;
export type AuthUser = { userId: string; email: string; displayName: string; fullName: null; platformAdmin: boolean };

export async function sha256(value: string) {
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function currentUser(): Promise<AuthUser | null> {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token || !/^[0-9a-f]{64}$/.test(token) || !env.DB) return null;
    const row = await env.DB.prepare('SELECT a.id,a.email,a.active,a.platform_admin FROM sessions s JOIN accounts a ON a.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(await sha256(token), Date.now()).first<{ id: string; email: string; active: number; platform_admin: number }>();
    if (!row || !row.active) return null;
    return { userId: row.id, email: row.email, displayName: row.email, fullName: null, platformAdmin: Boolean(row.platform_admin) };
}

export function sessionCookie(req: Request, token: string, age = SESSION_AGE) {
    const secure = new URL(req.url).protocol === 'https:';
    return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? '; Secure' : ''}`;
}

export async function issueSession(database: D1Database, userId: string) {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
    await database.prepare('INSERT INTO sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)').bind(await sha256(token), userId, Date.now() + SESSION_AGE * 1000, new Date().toISOString()).run();
    return token;
}

export function safeNext(value: unknown) {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
    try {
        const parsed = new URL(value, 'https://otm.local');
        if (parsed.origin !== 'https://otm.local' || ['/login', '/setup', '/reset'].some(path => parsed.pathname === path || parsed.pathname.startsWith(path + '/'))) return '/';
        return parsed.pathname + parsed.search + parsed.hash;
    } catch { return '/'; }
}
