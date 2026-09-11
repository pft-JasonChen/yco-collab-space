import { spawn } from 'node:child_process';
import { fromRoot, readJson } from './project.mjs';

const mode = process.argv[2];

if (!['dev', 'preview'].includes(mode)) {
  throw new Error('Usage: run-vite.mjs dev|preview');
}

const config = await readJson('prototype.config.json');
const port =
  mode === 'dev' ? config.server.devPort : config.server.previewPort;
const viteBin = fromRoot('node_modules', 'vite', 'bin', 'vite.js');
const args = [
  mode === 'dev' ? '--host' : 'preview',
];

if (mode === 'dev') {
  args.push(config.server.host);
} else {
  args.push('--host', config.server.host);
}

args.push('--port', String(port), '--strictPort');

const child = spawn(process.execPath, [viteBin, ...args], {
  cwd: fromRoot(),
  stdio: 'inherit',
});
child.on('error', (error) => {
  process.stderr.write('[vite] ' + error.message + '\n');
  process.exitCode = 1;
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
