import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, pathExists, readYaml, sha256File, walkFiles } from './project.mjs';
import { normaliseCollectionReference, scanCollection } from '../design-library/library.mjs';

const assetExtensionPattern = /\.(?:avif|jpe?g|mp4|png|svg|webm|webp)(?:\?[^'"\s)]*)?$/i;

function toPosix(value) {
  return value.split(path.sep).join('/');
}

export async function readMediaIntent(feature) {
  return readYaml(path.join('features', feature, 'product', 'media-intent.yaml'));
}

export function mediaIntentSemanticErrors(mediaIntent, feature) {
  const errors = [];
  if (mediaIntent.feature !== feature) errors.push('media-intent.yaml feature does not match folder: ' + feature);
  const paths = mediaIntent.requestedCollections.map((item) => item.path);
  for (const pathValue of new Set(paths.filter((value, index) => paths.indexOf(value) !== index))) {
    errors.push('Duplicate requested media collection: ' + pathValue);
  }
  for (const request of mediaIntent.requestedCollections) {
    try {
      normaliseCollectionReference(request.path);
    } catch (error) {
      errors.push(error.message + ' Received: ' + request.path);
    }
  }
  return errors;
}

export async function requestedCollectionContext(feature) {
  const mediaIntent = await readMediaIntent(feature);
  const collections = [];
  const errors = [];
  const warnings = [];

  for (const request of mediaIntent.requestedCollections) {
    const scanned = await scanCollection(request.path);
    if (request.requiredForGeneration && (!scanned.exists || scanned.files.length === 0)) {
      errors.push('Required media collection is unavailable or empty: ' + request.path);
    }
    warnings.push(...scanned.warnings);
    collections.push({
      path: scanned.reference,
      purpose: request.purpose,
      selectionGuidance: request.selectionGuidance,
      requiredForGeneration: request.requiredForGeneration,
      exists: scanned.exists,
      fileCount: scanned.files.length,
      contextHash: scanned.contextHash,
    });
  }

  return { collections, errors, warnings };
}

function referencedAssetStrings(source) {
  const values = new Set();
  const quoted = /['"]([^'"]+)['"]/g;
  const cssUrl = /url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g;
  for (const expression of [quoted, cssUrl]) {
    for (const match of source.matchAll(expression)) {
      const value = match[1].split('?')[0];
      if (assetExtensionPattern.test(value)) values.add(value);
    }
  }
  return [...values];
}

export async function discoverGeneratedResources(feature) {
  const generatedRoot = fromRoot('features', feature, 'generated');
  const allowedRoots = [
    {
      source: 'design-library',
      root: fromRoot('design-library', 'assets'),
    },
    {
      source: 'pm-mock',
      root: fromRoot('features', feature, 'product', 'mock-assets'),
    },
  ];
  const selected = new Map();

  for (const generatedFile of await walkFiles(generatedRoot)) {
    if (!/\.(?:css|js|jsx|json|scss)$/.test(generatedFile) || path.basename(generatedFile) === 'generation.json') continue;
    const source = await fs.readFile(generatedFile, 'utf8');
    for (const reference of referencedAssetStrings(source)) {
      if (!reference.startsWith('.')) continue;
      const absolutePath = path.resolve(path.dirname(generatedFile), reference);
      if (!(await pathExists(absolutePath))) continue;
      const matchedRoot = allowedRoots.find(({ root }) => absolutePath.startsWith(path.resolve(root) + path.sep));
      if (!matchedRoot) continue;
      const repositoryPath = toPosix(path.relative(fromRoot(), absolutePath));
      selected.set(repositoryPath, {
        repositoryPath,
        source: matchedRoot.source,
        sha256: await sha256File(absolutePath),
        status: matchedRoot.source === 'pm-mock' ? 'temporary' : 'candidate',
      });
    }
  }

  return [...selected.values()].sort((a, b) => a.repositoryPath.localeCompare(b.repositoryPath));
}

export async function buildResourceProvenance(feature) {
  const requested = await requestedCollectionContext(feature);
  if (requested.errors.length > 0) throw new Error(requested.errors.join('\n'));
  return {
    requestedCollections: requested.collections,
    selected: await discoverGeneratedResources(feature),
    warnings: requested.warnings,
  };
}

export async function buildTokenProvenance() {
  const lockPath = 'platform/tokens/tokens.lock.json';
  const lock = await readYaml(lockPath);
  return {
    sourcePackage: lock.sourcePackage,
    lockPath,
    lockSha256: await sha256File(fromRoot(...lockPath.split('/'))),
    activationStatus: 'rd-compatible',
  };
}

export async function tokenProvenanceErrors(tokens) {
  const errors = [];
  if (!tokens?.lockPath || !tokens?.lockSha256) {
    return ['Token provenance is missing from generation.json.'];
  }
  const absolutePath = fromRoot(...tokens.lockPath.split('/'));
  if (!(await pathExists(absolutePath))) return ['Token lock is missing: ' + tokens.lockPath];
  if ((await sha256File(absolutePath)) !== tokens.lockSha256) {
    errors.push('Token baseline changed since generation: ' + tokens.lockPath);
  }
  return errors;
}

export async function resourceProvenanceErrors(resources) {
  const errors = [];
  for (const recorded of resources?.requestedCollections ?? []) {
    const current = await scanCollection(recorded.path);
    if (current.contextHash !== recorded.contextHash) {
      errors.push('Media collection changed since generation: ' + recorded.path);
    }
  }
  for (const selected of resources?.selected ?? []) {
    const absolutePath = fromRoot(...selected.repositoryPath.split('/'));
    if (!(await pathExists(absolutePath))) {
      errors.push('Selected media file is missing: ' + selected.repositoryPath);
      continue;
    }
    if ((await sha256File(absolutePath)) !== selected.sha256) {
      errors.push('Selected media file changed since generation: ' + selected.repositoryPath);
    }
  }
  return errors;
}
