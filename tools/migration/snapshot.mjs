import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, pathExists, readJson, sha256File } from '../prototype-cli/project.mjs';
import { validateComponentContracts } from '../design-library/component-contracts.mjs';

export const MANIFEST_PATH = 'migration/rd-snapshot-manifest.json';
export const BASELINE_ROOT = 'platform/rd-baseline';

function toPosix(value) {
  return value.split(path.sep).join('/');
}

/**
 * `rejectedPatterns` is a security boundary, not a convenience filter: AGENTS.md
 * forbids copying env files, keys, certificates, dependencies or build output out
 * of the RD snapshot. Anything matching is refused, never silently skipped.
 */
export function isRejected(relativePath, rejectedPatterns) {
  const segments = relativePath.split('/');
  return rejectedPatterns.some((pattern) => {
    if (pattern.endsWith('/**')) {
      const prefix = pattern.slice(0, -3);
      return segments.includes(prefix);
    }
    const regexp = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    return segments.some((segment) => regexp.test(segment));
  });
}

/**
 * Every RD file a component contract points at. Vendoring exactly this set keeps
 * the baseline auditable — a clone can verify every port against its source —
 * without pulling the whole application into the repository.
 */
export async function collectClaimedPaths({ workspace = fromRoot() } = {}) {
  const validation = await validateComponentContracts({ workspace });
  if (validation.errors.length > 0) throw new Error(validation.errors.join('\n'));

  const claimed = new Map();
  for (const { contract } of validation.contracts) {
    const { snapshot, sourcePaths, sourceHashes, verbatimFiles = [] } = contract.rd;
    const hashByPath = new Map(sourceHashes.map((entry) => [entry.path, entry.sha256]));
    for (const sourcePath of sourcePaths) {
      const existing = claimed.get(sourcePath);
      const record = {
        source: sourcePath,
        snapshot,
        sha256: hashByPath.get(sourcePath) ?? null,
        claimedBy: [...(existing?.claimedBy ?? []), contract.id].sort(),
        verbatim: (existing?.verbatim ?? false) || verbatimFiles.some((pair) => pair.baseline === sourcePath),
      };
      claimed.set(sourcePath, record);
    }
  }
  return [...claimed.values()].sort((a, b) => a.source.localeCompare(b.source));
}

export function baselinePath(snapshot, sourcePath) {
  return [BASELINE_ROOT, snapshot, sourcePath].join('/');
}

export async function listVendoredFiles(workspace = fromRoot()) {
  const root = path.join(workspace, BASELINE_ROOT);
  if (!(await pathExists(root))) return [];
  const found = [];
  const walk = async (directory) => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile()) found.push(toPosix(path.relative(workspace, absolute)));
    }
  };
  await walk(root);
  return found.sort();
}

export async function readManifest(workspace = fromRoot()) {
  return readJson(MANIFEST_PATH, workspace);
}

export async function verifySnapshot({ workspace = fromRoot() } = {}) {
  const errors = [];
  const manifest = await readManifest(workspace);
  const rejected = manifest.rejectedPatterns ?? [];
  const claimed = await collectClaimedPaths({ workspace });
  const vendored = new Set(await listVendoredFiles(workspace));
  const recorded = new Map((manifest.vendoredBaseline?.files ?? []).map((file) => [file.source, file]));

  for (const entry of claimed) {
    const repositoryPath = baselinePath(entry.snapshot, entry.source);

    if (isRejected(entry.source, rejected)) {
      errors.push('Contract claims a path the snapshot policy rejects: ' + entry.source);
      continue;
    }
    if (!vendored.has(repositoryPath)) {
      errors.push('Claimed RD source is not vendored: ' + repositoryPath);
      continue;
    }
    const record = recorded.get(entry.source);
    if (!record) {
      errors.push('Vendored file is not recorded in the manifest: ' + entry.source);
    } else if (entry.sha256 && record.sha256 !== entry.sha256) {
      errors.push('Manifest hash disagrees with the component contract: ' + entry.source);
    }
    const actual = await sha256File(path.join(workspace, ...repositoryPath.split('/')));
    if (entry.sha256 && actual !== entry.sha256) {
      errors.push('Vendored file does not match the hash its contract records: ' + repositoryPath);
    }
  }

  // The site map is derived from RD's taxonomy declarations, so those files are
  // vendored for the same reason the ported sources are: a derivation nobody can
  // re-run is not auditable.
  const snapshotName = claimed[0]?.snapshot ?? manifest.source?.snapshot;
  for (const file of [...(manifest.siteMapSource?.files ?? []), ...(manifest.pageEntryReference?.files ?? [])]) {
    const repositoryPath = baselinePath(snapshotName, file.source);
    if (!vendored.has(repositoryPath)) {
      errors.push('Derivation source is not vendored: ' + repositoryPath);
      continue;
    }
    const actual = await sha256File(path.join(workspace, ...repositoryPath.split('/')));
    if (actual !== file.sha256) errors.push('Derivation source does not match its recorded hash: ' + repositoryPath);
  }

  const claimedRepositoryPaths = new Set([
    ...claimed.map((entry) => baselinePath(entry.snapshot, entry.source)),
    ...(manifest.siteMapSource?.files ?? []).map((file) => baselinePath(snapshotName, file.source)),
    ...(manifest.pageEntryReference?.files ?? []).map((file) => baselinePath(snapshotName, file.source)),
  ]);
  for (const file of vendored) {
    if (!claimedRepositoryPaths.has(file)) {
      errors.push('Vendored file is not claimed by any component contract: ' + file);
    }
  }

  for (const file of vendored) {
    const relative = file.split('/').slice(2).join('/');
    if (isRejected(relative, rejected)) errors.push('Vendored file matches a rejected pattern: ' + file);
  }

  return { errors, claimed: claimed.length, vendored: vendored.size };
}
