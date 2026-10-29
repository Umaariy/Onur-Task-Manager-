// Second design ("B") on http://localhost:5182, next to design A on 5181.
// Same code and the same data folder; only the look differs.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'dev', '-p', '5182'], {
    stdio: 'inherit',
    env: { ...process.env, OTM_DESIGN: 'b', OTM_DIST_DIR: '.next-b' },
});
child.on('exit', code => process.exit(code ?? 0));
