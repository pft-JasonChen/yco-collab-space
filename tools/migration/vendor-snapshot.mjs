import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, pathExists, sha256File } from '../prototype-cli/project.mjs';
import {
  MANIFEST_PATH,
  baselinePath,
  collectClaimedPaths,
  isRejected,
  listVendoredFiles,
  readManifest,
} from './snapshot.mjs';

/**
 * Copies exactly the RD files that component contracts claim into the read-only
 * baseline, then rewrites the manifest to match. Run it after adding or changing
 * a contract's rd.sourcePaths; `npm run validate:snapshot` proves the result.
 */
const workspace = fromRoot();
const manifest = await readManifest(workspace);
const sourceIndex = process.argv.indexOf('--source');
const snapshotRoot = sourceIndex >= 0 ? process.argv[sourceIndex + 1] : manifest.source.path;

if (!(await pathExists(snapshotRoot))) {
  throw new Error(
    'RD snapshot is not reachable at ' + snapshotRoot + '.\n' +
      'Pass --source <path> to point at your local copy. The vendored baseline in ' +
      'platform/rd-baseline/ is what the gates check; this command only refreshes it.',
  );
}

const claimed = await collectClaimedPaths({ workspace });
const rejected = manifest.rejectedPatterns ?? [];
const written = [];
const failures = [];

for (const entry of claimed) {
  if (isRejected(entry.source, rejected)) {
    failures.push('Refused by snapshot policy: ' + entry.source);
    continue;
  }
  const from = path.join(snapshotRoot, ...entry.source.split('/'));
  if (!(await pathExists(from))) {
    failures.push('Missing in the snapshot: ' + entry.source);
    continue;
  }
  const to = path.join(workspace, ...baselinePath(entry.snapshot, entry.source).split('/'));
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);

  const sha256 = await sha256File(to);
  if (entry.sha256 && sha256 !== entry.sha256) {
    failures.push('Snapshot file no longer matches the hash its contract records: ' + entry.source);
  }
  written.push({ source: entry.source, sha256, claimedBy: entry.claimedBy, verbatim: entry.verbatim });
}

// Drop anything nothing claims any more, so the baseline cannot accumulate.
const snapshotName = manifest.source.snapshot;
const keep = new Set([
  ...claimed.map((entry) => baselinePath(entry.snapshot, entry.source)),
  ...(manifest.siteMapSource?.files ?? []).map((file) => baselinePath(snapshotName, file.source)),
  ...(manifest.pageEntryReference?.files ?? []).map((file) => baselinePath(snapshotName, file.source)),
]);
for (const file of await listVendoredFiles(workspace)) {
  if (!keep.has(file)) {
    await fs.rm(path.join(workspace, ...file.split('/')));
    process.stdout.write('[snapshot] removed unclaimed ' + file + '\n');
  }
}

manifest.vendoredBaseline = {
  root: ['platform/rd-baseline', manifest.source.snapshot].join('/'),
  purpose:
    'Read-only RD reference. Holds exactly the files component contracts claim under rd.sourcePaths, ' +
    'so validate:rd-parity and validate:snapshot can run on any clone without the external snapshot.',
  scope: 'contract-claimed',
  fileCount: written.length,
  files: written.sort((a, b) => a.source.localeCompare(b.source)),
};

await fs.writeFile(
  path.join(workspace, ...MANIFEST_PATH.split('/')),
  JSON.stringify(manifest, null, 2) + '\n',
);

if (failures.length > 0) {
  process.stderr.write('[snapshot] FAIL\n');
  for (const failure of failures) process.stderr.write('  - ' + failure + '\n');
  process.exitCode = 1;
} else {
  process.stdout.write(
    '[snapshot] VENDORED ' + written.length + ' files (' + written.filter((f) => f.verbatim).length + ' verbatim)\n',
  );
}
