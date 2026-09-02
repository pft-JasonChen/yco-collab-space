import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, sha256File } from '../prototype-cli/project.mjs';

export const assetTypes = ['image', 'video', 'icon', 'illustration', 'logo', 'font'];
const supportedExtensions = {
  image: new Set(['.avif', '.jpeg', '.jpg', '.png', '.webp']),
  video: new Set(['.avif', '.jpeg', '.jpg', '.mp4', '.png', '.webm', '.webp']),
  icon: new Set(['.png', '.svg']),
  illustration: new Set(['.png', '.svg', '.webp']),
  logo: new Set(['.png', '.svg', '.webp']),
  font: new Set(['.woff', '.woff2']),
};
const mediaKindByExtension = new Map([
  ['.mp4', 'video'], ['.webm', 'video'], ['.svg', 'vector'],
  ['.avif', 'image'], ['.jpeg', 'image'], ['.jpg', 'image'],
  ['.png', 'image'], ['.webp', 'image'],
  ['.woff', 'font'], ['.woff2', 'font'],
]);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

export function normaliseCollectionReference(reference) {
  const value = String(reference ?? '')
    .trim()
    .replace(/^\.\//, '')
    .replace(/^design-library\//, '')
    .replace(/\/$/, '');
  const match = value.match(/^assets\/(image|video|icon|illustration|logo|font)\/([a-z0-9][a-z0-9-]*)$/);
  if (!match) {
    throw new Error(
      'Collection must be assets/<type>/<collection> using a supported type and kebab-case collection.',
    );
  }
  return value;
}

async function walkCollection(directory, root, type, warnings) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.')) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      warnings.push('Symlinks are not allowed in Design Library collections: ' + toPosix(path.relative(root, absolutePath)));
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...(await walkCollection(absolutePath, root, type, warnings)));
      continue;
    }
    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name).toLowerCase();
    const relativePath = toPosix(path.relative(root, absolutePath));
    if (!supportedExtensions[type].has(extension)) {
      warnings.push('Unsupported ' + type + ' collection file: ' + relativePath);
      continue;
    }
    const stat = await fs.stat(absolutePath);
    files.push({
      path: relativePath,
      repositoryPath: 'design-library/' + relativePath,
      extension,
      mediaKind: mediaKindByExtension.get(extension),
      bytes: stat.size,
      sha256: await sha256File(absolutePath),
      status: 'candidate',
    });
  }

  return files;
}

export async function scanCollection(reference, workspace = fromRoot()) {
  const normalised = normaliseCollectionReference(reference);
  const [, type, collection] = normalised.split('/');
  const libraryRoot = path.join(workspace, 'design-library');
  const absolutePath = path.resolve(libraryRoot, normalised);
  const allowedRoot = path.resolve(libraryRoot, 'assets') + path.sep;
  if (!absolutePath.startsWith(allowedRoot)) throw new Error('Collection path escapes Design Library.');
  const stat = await fs.stat(absolutePath).catch(() => null);
  if (!stat?.isDirectory()) {
    return { reference: normalised, type, collection, exists: false, files: [], warnings: ['Collection does not exist: ' + normalised], contextHash: null };
  }
  const warnings = [];
  const files = await walkCollection(absolutePath, libraryRoot, type, warnings);
  const hash = createHash('sha256');
  for (const file of files) hash.update(file.path + '\0' + file.sha256 + '\0');
  return {
    reference: normalised,
    type,
    collection,
    exists: true,
    files,
    warnings,
    contextHash: hash.digest('hex'),
  };
}

export async function scanLibrary(workspace = fromRoot()) {
  const assetsRoot = path.join(workspace, 'design-library', 'assets');
  const collections = [];
  const warnings = [];

  for (const type of assetTypes) {
    const typeRoot = path.join(assetsRoot, type);
    const entries = await fs.readdir(typeRoot, { withFileTypes: true }).catch(() => []);
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.') || !entry.isDirectory()) continue;
      const result = await scanCollection('assets/' + type + '/' + entry.name, workspace);
      collections.push(result);
      warnings.push(...result.warnings);
    }
  }

  return { schemaVersion: 1, generatedAt: new Date().toISOString(), collections, warnings };
}

export async function writeLibraryIndex(index, workspace = fromRoot()) {
  const cachePath = path.join(workspace, '.collab-cache', 'design-library-index.json');
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(index, null, 2) + '\n');
  return cachePath;
}
