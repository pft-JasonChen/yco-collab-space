import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

export const repositoryRoot = fileURLToPath(
  new URL('../../', import.meta.url),
);

export function fromRoot(...parts) {
  return path.join(repositoryRoot, ...parts);
}

export async function readJson(relativePath) {
  const source = await fs.readFile(fromRoot(relativePath), 'utf8');
  return JSON.parse(source);
}

export async function readYaml(relativePath) {
  const source = await fs.readFile(fromRoot(relativePath), 'utf8');
  return parseYaml(source);
}

export function normaliseFeatureSlug(value) {
  const slug = String(value ?? '').trim();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      'Feature slug must use lowercase letters, digits and single hyphens.',
    );
  }

  return slug;
}

export function requestedFeature(argv = process.argv.slice(2)) {
  const featureFlagIndex = argv.indexOf('--feature');

  if (featureFlagIndex >= 0) {
    return normaliseFeatureSlug(argv[featureFlagIndex + 1]);
  }

  const positional = argv.find((argument) => !argument.startsWith('-'));
  return positional ? normaliseFeatureSlug(positional) : null;
}

export async function listFeatureSlugs(feature = null) {
  if (feature) {
    const target = fromRoot('features', feature);
    const stat = await fs.stat(target).catch(() => null);

    if (!stat?.isDirectory()) {
      throw new Error('Feature folder does not exist: ' + feature);
    }

    return [feature];
  }

  const entries = await fs.readdir(fromRoot('features'), {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();
}

export async function walkFiles(directory, predicate = () => true) {
  const files = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolutePath, predicate)));
    } else if (entry.isFile() && predicate(absolutePath)) {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

export async function sha256File(absolutePath) {
  const contents = await fs.readFile(absolutePath);
  return createHash('sha256').update(contents).digest('hex');
}

export async function hashFeatureInputs(feature) {
  const featureRoot = fromRoot('features', feature);
  const inputRoots = [
    path.join(featureRoot, 'product'),
    path.join(featureRoot, 'design'),
  ];
  const hash = createHash('sha256');

  for (const inputRoot of inputRoots) {
    const files = await walkFiles(inputRoot);

    for (const file of files) {
      const relativePath = path.relative(featureRoot, file).split(path.sep).join('/');
      hash.update(relativePath);
      hash.update('\0');
      hash.update(await fs.readFile(file));
      hash.update('\0');
    }
  }

  return hash.digest('hex');
}

export function formatSchemaErrors(errors = []) {
  return errors
    .map((error) => {
      const location = error.instancePath || '/';
      return location + ' ' + error.message;
    })
    .join('; ');
}

export async function pathExists(absolutePath) {
  return Boolean(await fs.stat(absolutePath).catch(() => null));
}
