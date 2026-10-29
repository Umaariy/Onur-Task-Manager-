// Reads otm.env (KEY=VALUE lines) and fills in defaults. Shared by start.mjs and backup.mjs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadConfig() {
    const envFile = process.env.OTM_ENV_FILE || [path.join(appRoot, 'otm.env'), path.join(appRoot, '..', 'otm.env')].find(f => fs.existsSync(f));
    if (envFile && fs.existsSync(envFile)) {
        for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
            const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
            if (match && !line.trim().startsWith('#') && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
        }
    }

    process.env.PORT ||= '5181';
    process.env.HOSTNAME ||= '127.0.0.1'; // only reachable through Caddy on the same server
    process.env.OTM_TRUST_PROXY ||= '1';
    process.env.OTM_DATA_DIR = path.resolve(process.env.OTM_DATA_DIR || path.join(appRoot, '..', 'data'));
    process.env.OTM_BACKUP_DIR = path.resolve(process.env.OTM_BACKUP_DIR || path.join(appRoot, '..', 'backups'));
    process.env.OTM_MIGRATIONS_DIR ||= path.join(appRoot, 'drizzle');
    fs.mkdirSync(process.env.OTM_DATA_DIR, { recursive: true });

    // One-time key for /setup. Generated once and kept in the data folder.
    if (!process.env.OTM_SETUP_SECRET) {
        const keyFile = path.join(process.env.OTM_DATA_DIR, 'setup-key.txt');
        if (!fs.existsSync(keyFile)) fs.writeFileSync(keyFile, crypto.randomBytes(32).toString('hex') + '\n');
        process.env.OTM_SETUP_SECRET = fs.readFileSync(keyFile, 'utf8').trim();
    }

    return { envFile, dataDir: process.env.OTM_DATA_DIR, backupDir: process.env.OTM_BACKUP_DIR };
}
