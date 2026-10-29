// After `next build`: copy static files, public assets and DB migrations into
// .next/standalone so that folder runs on its own (node .next/standalone/server.js).
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');
if (!fs.existsSync(path.join(standalone, 'server.js'))) {
    console.error('❌ .next/standalone/server.js topilmadi. Avval: npm run build');
    process.exit(1);
}

const copy = (from, to) => {
    if (!fs.existsSync(from)) return;
    fs.rmSync(to, { recursive: true, force: true });
    fs.cpSync(from, to, { recursive: true });
};

copy(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'));
copy(path.join(root, 'public'), path.join(standalone, 'public'));
copy(path.join(root, 'drizzle'), path.join(standalone, 'drizzle'));

console.log('✅ Server build tayyor: .next/standalone');
