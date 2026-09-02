import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue;
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(absolutePath)));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

export async function snapshotWorkspacePaths(workspace, relativePaths) {
  const snapshot = {};

  for (const relativeRoot of [...new Set(relativePaths)].sort()) {
    const absoluteRoot = path.join(workspace, relativeRoot);
    const stat = await fs.stat(absoluteRoot).catch(() => null);

    if (!stat) {
      snapshot[relativeRoot.replace(/\/$/, '') + '/.missing'] = null;
      continue;
    }

    const files = stat.isDirectory() ? await walk(absoluteRoot) : [absoluteRoot];
    for (const file of files) {
      const relativePath = path.relative(workspace, file).split(path.sep).join('/');
      const contents = await fs.readFile(file);
      snapshot[relativePath] = createHash('sha256').update(contents).digest('hex');
    }
  }

  return snapshot;
}

export async function snapshotFeatureSources(workspace, feature) {
  const featureRoot = path.join(workspace, 'features', feature);
  const snapshot = {};

  for (const sourceDirectory of ['product', 'design']) {
    const root = path.join(featureRoot, sourceDirectory);
    const files = await walk(root);

    for (const file of files) {
      const relativePath = path
        .relative(featureRoot, file)
        .split(path.sep)
        .join('/');
      const contents = await fs.readFile(file);
      snapshot[relativePath] = createHash('sha256')
        .update(contents)
        .digest('hex');
    }
  }

  return snapshot;
}

export function diffSourceSnapshots(before, after) {
  const paths = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed = [];

  for (const filePath of [...paths].sort()) {
    if (before[filePath] !== after[filePath]) {
      changed.push({
        path: filePath,
        before: before[filePath] || null,
        after: after[filePath] || null,
      });
    }
  }

  return changed;
}
