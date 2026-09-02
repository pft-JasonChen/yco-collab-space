import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, pathExists, sha256File } from '../prototype-cli/project.mjs';
import { validateComponentContracts } from './component-contracts.mjs';

export const BASELINE_ROOT = 'platform/rd-baseline';

function toPosix(value) {
  return value.split(path.sep).join('/');
}

export function baselineRepositoryPath(snapshot, baseline) {
  return [BASELINE_ROOT, snapshot, baseline].join('/');
}

/**
 * A `verbatim` component promises that named files stay byte-identical to the RD
 * baseline vendored under platform/rd-baseline/. `sourceHashes` only detects
 * upstream change; this check detects the other direction — a Collab Space edit
 * that silently diverges the port from production.
 */
export async function checkRdParity({ workspace = fromRoot() } = {}) {
  const validation = await validateComponentContracts({ workspace });
  const errors = [...validation.errors];
  const checked = [];

  for (const { file, contract } of validation.contracts) {
    const { portability, snapshot, verbatimFiles = [], sourceHashes = [] } = contract.rd;

    if (portability === 'verbatim' && verbatimFiles.length === 0) {
      errors.push(`${file}: portability "verbatim" requires at least one rd.verbatimFiles entry.`);
      continue;
    }
    if (portability !== 'verbatim' && verbatimFiles.length > 0) {
      errors.push(`${file}: rd.verbatimFiles is only allowed when portability is "verbatim".`);
      continue;
    }

    const hashByPath = new Map(sourceHashes.map((entry) => [entry.path, entry.sha256]));

    for (const pair of verbatimFiles) {
      const baselineRepositoryPathValue = baselineRepositoryPath(snapshot, pair.baseline);
      const baselineAbsolute = path.join(workspace, ...baselineRepositoryPathValue.split('/'));
      const implementationAbsolute = path.join(workspace, ...pair.implementation.split('/'));

      if (!(await pathExists(baselineAbsolute))) {
        errors.push(`${file}: vendored RD baseline is missing: ${baselineRepositoryPathValue}`);
        continue;
      }
      if (!(await pathExists(implementationAbsolute))) {
        errors.push(`${file}: verbatim implementation is missing: ${pair.implementation}`);
        continue;
      }

      // The vendored baseline must still be the file the contract recorded, so a
      // stale copy cannot make a drifted port look correct.
      const recorded = hashByPath.get(pair.baseline);
      if (!recorded) {
        errors.push(`${file}: rd.verbatimFiles baseline is not listed in rd.sourceHashes: ${pair.baseline}`);
      } else {
        const baselineHash = await sha256File(baselineAbsolute);
        if (baselineHash !== recorded) {
          errors.push(
            `${file}: vendored baseline no longer matches the recorded RD hash: ${baselineRepositoryPathValue}`,
          );
          continue;
        }
      }

      const [baselineSource, implementationSource] = await Promise.all([
        fs.readFile(baselineAbsolute, 'utf8'),
        fs.readFile(implementationAbsolute, 'utf8'),
      ]);

      if (baselineSource !== implementationSource) {
        errors.push(
          `${file}: verbatim file drifted from the RD baseline: ${pair.implementation} ` +
            `(diff against ${baselineRepositoryPathValue})`,
        );
        continue;
      }

      checked.push({ component: contract.id, implementation: pair.implementation });
    }
  }

  // Every vendored baseline must be claimed by a contract, so the read-only area
  // cannot accumulate files nothing checks.
  const baselineRoot = path.join(workspace, BASELINE_ROOT);
  if (await pathExists(baselineRoot)) {
    const claimed = new Set(
      validation.contracts.flatMap(({ contract }) =>
        (contract.rd.verbatimFiles ?? []).map((pair) =>
          baselineRepositoryPath(contract.rd.snapshot, pair.baseline),
        ),
      ),
    );
    for (const absolute of await walk(baselineRoot)) {
      const repositoryPath = toPosix(path.relative(workspace, absolute));
      if (!claimed.has(repositoryPath)) {
        errors.push(`Vendored RD baseline is not referenced by any contract: ${repositoryPath}`);
      }
    }
  }

  return { checked, errors };
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}
