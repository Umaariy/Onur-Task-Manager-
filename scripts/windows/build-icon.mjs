import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../../public/onur-mark.png', import.meta.url));
const target = fileURLToPath(new URL('../../work/installer-stage/onur.ico', import.meta.url));
const png = readFileSync(source);
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(0, 6); // 256px
header.writeUInt8(0, 7); // 256px
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(header.length, 18);
writeFileSync(target, Buffer.concat([header, png]));
