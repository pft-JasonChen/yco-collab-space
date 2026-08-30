import { spawn } from 'node:child_process';
import path from 'node:path';
import { fromRoot, readJson } from './project.mjs';

const mode = process.argv[2];

if (!['dev', 'preview'].includes(mode)) {
  throw new Error('Usage: run-vite.mjs dev|preview');
}

const config = await readJson('prototype.config.json');
const port =
  mode === 'dev' ? config.server.devPort : config.server.previewPort;
const viteBin = fromRoot('node_modules', '.bin', 'vite');
const args = [
  mode === 'dev' ? '--host' : 'preview',
];

if (mode === 'dev') {
  args.push(config.server.host);
} else {
  args.push('--host', config.server.host);
}

args.push('--port', String(port), '--strictPort');

const child = spawn(viteBin, args, {
  cwd: fromRoot(),
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 1;
});
