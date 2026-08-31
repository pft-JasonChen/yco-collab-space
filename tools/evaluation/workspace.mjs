import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { repositoryRoot } from '../prototype-cli/project.mjs';

const excludedDirectories = new Set([
  '.git',
  '.prototype-state',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
]);

function copyFilter(source) {
  const relative = path.relative(repositoryRoot, source);

  if (!relative) {
    return true;
  }

  const parts = relative.split(path.sep);

  if (excludedDirectories.has(parts[0])) {
    return false;
  }

  if (parts[0] === 'evals' && parts[1] === 'runs') {
    return false;
  }

  if (parts[0] === 'features' && parts[2] === 'evidence') {
    return false;
  }

  return true;
}

export async function createIsolatedWorkspace(label = 'trial') {
  const prefix = path.join(os.tmpdir(), 'yco-prototype-eval-' + label + '-');
  const workspace = await fs.mkdtemp(prefix);

  await fs.cp(repositoryRoot, workspace, {
    recursive: true,
    filter: copyFilter,
  });

  const sourceNodeModules = path.join(repositoryRoot, 'node_modules');
  const targetNodeModules = path.join(workspace, 'node_modules');
  const nodeModulesStat = await fs.stat(sourceNodeModules).catch(() => null);

  if (nodeModulesStat?.isDirectory()) {
    await fs.symlink(sourceNodeModules, targetNodeModules, 'dir');
  }

  return workspace;
}

export async function cleanupIsolatedWorkspace(workspace) {
  const expectedPrefix = path.join(os.tmpdir(), 'yco-prototype-eval-');
  const resolved = path.resolve(workspace);

  if (!resolved.startsWith(expectedPrefix)) {
    throw new Error('Refusing to clean a non-evaluation workspace: ' + resolved);
  }

  await fs.rm(resolved, { recursive: true, force: true });
}

export function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];

    child.stdout.on('data', (chunk) => stdout.push(chunk.toString()));
    child.stderr.on('data', (chunk) => stderr.push(chunk.toString()));
    child.on('error', (error) => {
      resolve({
        command,
        args,
        exitCode: null,
        error: error.message,
        stdout: stdout.join(''),
        stderr: stderr.join(''),
        durationMs: Date.now() - startedAt,
      });
    });
    child.on('close', (exitCode) => {
      resolve({
        command,
        args,
        exitCode,
        error: null,
        stdout: stdout.join(''),
        stderr: stderr.join(''),
        durationMs: Date.now() - startedAt,
      });
    });
  });
}
