// Server platform layer: replaces the Cloudflare Workers bindings (D1, R2, secrets)
// with a local SQLite file (built-in `node:sqlite`) and a local files directory.
//
// The database wrapper keeps the D1 call shape used across the app:
//   db.prepare(sql).bind(...).first() / .all() / .run(), and db.batch([...]) in one transaction.
//
// Configuration (environment variables):
//   OTM_DATA_DIR      — folder for the database and uploaded files (default: ./data)
//   OTM_SETUP_SECRET  — one-time key for creating the first Owner on /setup
//   OTM_PUBLIC_URL    — public address, e.g. https://tasks.onur.uz (optional)
//   OTM_TRUST_PROXY   — "1" when running behind Caddy/IIS (default "1")
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

type Row = Record<string, unknown>;
type Meta = { changes: number; last_row_id: number };
export type QueryResult<T = Row> = { results: T[]; success: true; meta: Meta };

const dataDir = () => path.resolve(process.env.OTM_DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), 'data'));

function normalize(value: unknown): string | number | bigint | null | Uint8Array {
    if (value === undefined || value === null) return null;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint') return value;
    if (value instanceof Uint8Array) return value;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    return String(value);
}

const plain = (row: unknown): Row => ({ ...(row as Row) });
const returnsRows = (sql: string) => /^\s*(select|with|pragma)\b/i.test(sql) || /\breturning\b/i.test(sql);

export class PreparedStatement {
    constructor(private readonly database: Database, readonly sql: string, private readonly params: ReturnType<typeof normalize>[] = []) {}

    bind(...values: unknown[]) {
        return new PreparedStatement(this.database, this.sql, values.map(normalize));
    }

    private statement(): StatementSync {
        return this.database.statement(this.sql);
    }

    async first<T = Row>(column?: string): Promise<T | null> {
        return this.firstSync<T>(column);
    }

    async all<T = Row>(): Promise<QueryResult<T>> {
        return this.allSync<T>();
    }

    async run(): Promise<QueryResult> {
        return this.execSync();
    }

    firstSync<T>(column?: string): T | null {
        const row = this.statement().get(...this.params);
        if (!row) return null;
        const value = plain(row);
        return (column ? value[column] : value) as T;
    }

    allSync<T>(): QueryResult<T> {
        const rows = this.statement().all(...this.params).map(plain) as T[];
        return { results: rows, success: true, meta: { changes: this.database.changes(), last_row_id: 0 } };
    }

    /** Executes a statement the way D1 does inside batch(): rows when it returns any, changes always. */
    execSync(): QueryResult {
        if (returnsRows(this.sql)) {
            const rows = this.statement().all(...this.params).map(plain);
            return { results: rows, success: true, meta: { changes: /^\s*(select|with|pragma)\b/i.test(this.sql) ? 0 : this.database.changes(), last_row_id: 0 } };
        }
        const result = this.statement().run(...this.params);
        return { results: [], success: true, meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
    }
}

export class Database {
    private readonly sqlite: DatabaseSync;
    private readonly cache = new Map<string, StatementSync>();

    constructor(file: string) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        this.sqlite = new DatabaseSync(file);
        this.sqlite.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
        migrate(this.sqlite);
    }

    statement(sql: string): StatementSync {
        let statement = this.cache.get(sql);
        if (!statement) {
            statement = this.sqlite.prepare(sql);
            this.cache.set(sql, statement);
        }
        return statement;
    }

    changes(): number {
        const row = this.statement('SELECT changes() AS n').get() as { n: number } | undefined;
        return Number(row?.n ?? 0);
    }

    prepare(sql: string) {
        return new PreparedStatement(this, sql);
    }

    /** All statements run in one transaction; any error rolls everything back (same as D1). */
    async batch(statements: PreparedStatement[]): Promise<QueryResult[]> {
        this.sqlite.exec('BEGIN IMMEDIATE');
        try {
            const results = statements.map(statement => statement.execSync());
            this.sqlite.exec('COMMIT');
            return results;
        } catch (error) {
            this.sqlite.exec('ROLLBACK');
            throw error;
        }
    }

    /** Consistent copy of the database into another file (used by the backup script). */
    backupTo(file: string) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        if (fs.existsSync(file)) fs.rmSync(file);
        this.statement('VACUUM INTO ?').run(file);
    }
}

function migrationsDir() {
    const candidates = [process.env.OTM_MIGRATIONS_DIR, path.join(/* turbopackIgnore: true */ process.cwd(), 'drizzle')].filter(Boolean) as string[];
    const found = candidates.find(dir => fs.existsSync(dir));
    if (!found) throw new Error('Migratsiya papkasi (drizzle) topilmadi');
    return found;
}

function migrate(sqlite: DatabaseSync) {
    sqlite.exec('CREATE TABLE IF NOT EXISTS _otm_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
    const applied = new Set((sqlite.prepare('SELECT name FROM _otm_migrations').all() as { name: string }[]).map(row => row.name));
    const dir = migrationsDir();
    for (const name of fs.readdirSync(dir).filter(file => /^\d{4}_.+\.sql$/.test(file)).sort()) {
        if (applied.has(name)) continue;
        const sql = fs.readFileSync(path.join(dir, name), 'utf8');
        sqlite.exec('BEGIN');
        try {
            sqlite.exec(sql);
            sqlite.prepare('INSERT INTO _otm_migrations (name, applied_at) VALUES (?, ?)').run(name, new Date().toISOString());
            sqlite.exec('COMMIT');
        } catch (error) {
            sqlite.exec('ROLLBACK');
            throw new Error(`Migratsiya ${name} bajarilmadi: ${error instanceof Error ? error.message : error}`);
        }
    }
}

// --- Files (replaces R2) ---

export class FileStore {
    constructor(private readonly root: string) {
        fs.mkdirSync(root, { recursive: true });
    }

    private file(key: string) {
        if (!/^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/.test(key)) throw new Error('Noto‘g‘ri fayl kaliti');
        const full = path.resolve(this.root, ...key.split('/'));
        if (!full.startsWith(path.resolve(this.root) + path.sep)) throw new Error('Noto‘g‘ri fayl kaliti');
        return full;
    }

    async put(key: string, bytes: Uint8Array | ArrayBuffer, _options?: unknown) {
        const target = this.file(key);
        await fs.promises.mkdir(path.dirname(target), { recursive: true });
        const temp = target + '.tmp';
        await fs.promises.writeFile(temp, bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes);
        await fs.promises.rename(temp, target);
    }

    async get(key: string): Promise<{ body: Blob } | null> {
        try {
            return { body: new Blob([await fs.promises.readFile(this.file(key))]) };
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
            throw error;
        }
    }

    async delete(key: string) {
        await fs.promises.rm(this.file(key), { force: true });
    }
}

// --- Singletons (survive hot reload in development) ---

type Platform = { db?: Database; files?: FileStore };
const globalPlatform = globalThis as typeof globalThis & { __otm?: Platform };
const platform: Platform = (globalPlatform.__otm ??= {});

export function database(): Database {
    return (platform.db ??= new Database(path.join(dataDir(), 'otm.db')));
}

export function files(): FileStore {
    return (platform.files ??= new FileStore(path.join(dataDir(), 'files')));
}

/** Drop-in replacement for `import { env } from 'cloudflare:workers'`. */
export const env = {
    get DB() { return database(); },
    get BUCKET() { return files(); },
    get OTM_SETUP_SECRET() { return process.env.OTM_SETUP_SECRET || setupKeyFromFile(); },
};

/** Without OTM_SETUP_SECRET: a random key is created once in <data>/setup-key.txt. */
function setupKeyFromFile() {
    const file = path.join(dataDir(), 'setup-key.txt');
    if (!fs.existsSync(file)) {
        fs.mkdirSync(dataDir(), { recursive: true });
        fs.writeFileSync(file, crypto.randomBytes(32).toString('hex') + '\n');
    }
    return fs.readFileSync(file, 'utf8').trim();
}

// --- Running behind a reverse proxy (Caddy) ---

const trustProxy = () => (process.env.OTM_TRUST_PROXY ?? '1') !== '0';

/** Real client IP: first X-Forwarded-For entry when behind our proxy. */
export function clientIp(req: Request) {
    if (trustProxy()) {
        const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
        if (forwarded) return forwarded;
        const real = req.headers.get('x-real-ip')?.trim();
        if (real) return real;
    }
    return 'unknown';
}

/** Address the browser sees (https://tasks.onur.uz), not the internal http://127.0.0.1:port. */
export function publicOrigin(req: Request) {
    const own = new URL(req.url);
    if (trustProxy()) {
        const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
        const host = (req.headers.get('x-forwarded-host') ?? req.headers.get('host'))?.split(',')[0]?.trim();
        if (proto && host) return `${proto}://${host}`;
    }
    return own.origin;
}

/** Origins accepted for write requests (CSRF check). */
export function allowedOrigins(req: Request) {
    const list = new Set([new URL(req.url).origin, publicOrigin(req)]);
    const configured = process.env.OTM_PUBLIC_URL?.trim();
    if (configured) list.add(new URL(configured).origin);
    const host = req.headers.get('host');
    if (host) list.add(`${new URL(req.url).protocol}//${host}`);
    return list;
}

export function isHttps(req: Request) {
    return publicOrigin(req).startsWith('https:');
}
