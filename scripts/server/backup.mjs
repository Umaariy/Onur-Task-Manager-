// Daily backup: node scripts/server/backup.mjs
// Creates backups/YYYY-MM-DD_HHmm/ with a consistent copy of the database and the files folder,
// then removes backups older than OTM_BACKUP_KEEP_DAYS (default 30).
// Safe to run while the server is working.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { loadConfig } from './config.mjs';

const { dataDir, backupDir } = loadConfig();
const keepDays = Number(process.env.OTM_BACKUP_KEEP_DAYS || 30);
const dbFile = path.join(dataDir, 'otm.db');
if (!fs.existsSync(dbFile)) {
    console.error(`❌ Baza topilmadi: ${dbFile}`);
    process.exit(1);
}

const now = new Date();
const pad = n => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
const target = path.join(backupDir, stamp);
fs.mkdirSync(target, { recursive: true });

const db = new DatabaseSync(dbFile);
db.exec('PRAGMA busy_timeout = 10000');
db.prepare('VACUUM INTO ?').run(path.join(target, 'otm.db'));
db.close();

const filesDir = path.join(dataDir, 'files');
if (fs.existsSync(filesDir)) fs.cpSync(filesDir, path.join(target, 'files'), { recursive: true });
const keyFile = path.join(dataDir, 'setup-key.txt');
if (fs.existsSync(keyFile)) fs.copyFileSync(keyFile, path.join(target, 'setup-key.txt'));

// Check the copy opens and has data.
const check = new DatabaseSync(path.join(target, 'otm.db'), { readOnly: true });
const accounts = check.prepare('SELECT COUNT(*) AS n FROM accounts').get().n;
check.close();

let removed = 0;
const limit = Date.now() - keepDays * 86400000;
for (const name of fs.readdirSync(backupDir)) {
    const full = path.join(backupDir, name);
    if (/^\d{4}-\d{2}-\d{2}_\d{4}$/.test(name) && fs.statSync(full).mtimeMs < limit) {
        fs.rmSync(full, { recursive: true, force: true });
        removed++;
    }
}

console.log(`✅ Zaxira nusxa: ${target} (hisoblar: ${accounts}; o‘chirilgan eski nusxalar: ${removed})`);
