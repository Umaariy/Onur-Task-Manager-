// Starts the production server: node scripts/server/start.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { appRoot, loadConfig } from './config.mjs';

const { envFile, dataDir } = loadConfig();
const server = path.join(appRoot, '.next', 'standalone', 'server.js');
if (!fs.existsSync(server)) {
    console.error('❌ Server build topilmadi. Avval: npm run build');
    process.exit(1);
}
if (!fs.existsSync(path.join(appRoot, '.next', 'standalone', '.next', 'static'))) {
    console.error('❌ Statik fayllar ko‘chirilmagan. Qayta: npm run build');
    process.exit(1);
}

console.log(`ONUR Task Manager — ${new Date().toISOString()}`);
console.log(`  Sozlamalar: ${envFile ?? '(otm.env yo‘q — standart qiymatlar)'}`);
console.log(`  Ma’lumotlar: ${dataDir}`);
console.log(`  Ichki manzil: http://${process.env.HOSTNAME}:${process.env.PORT}`);
if (process.env.OTM_PUBLIC_URL) console.log(`  Tashqi manzil: ${process.env.OTM_PUBLIC_URL}`);

await import(pathToFileURL(server).href);
