import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, pathExists, requestedFeature } from '../prototype-cli/project.mjs';

/**
 * The fix loop reads this, not the raw rendered log. Failures are grouped by check
 * with the viewports they failed at and one truncated error, and the last line is
 * the exact command that re-runs only those checks.
 */
const feature = requestedFeature();
if (!feature) throw new Error('Usage: rendered:summary -- <feature>');

const evidenceRoot = fromRoot('features', feature, 'evidence');
const candidates = ['rendered-validation.partial.json', 'rendered-validation.json'];
let chosen = null;

for (const name of candidates) {
  const file = path.join(evidenceRoot, name);
  if (!(await pathExists(file))) continue;
  const stat = await fs.stat(file);
  if (!chosen || stat.mtimeMs > chosen.mtimeMs) chosen = { name, file, mtimeMs: stat.mtimeMs };
}

if (!chosen) {
  process.stderr.write('[rendered-summary] no evidence for ' + feature + '; run npm run test:rendered -- --feature ' + feature + '\n');
  process.exitCode = 1;
} else {
  const report = JSON.parse(await fs.readFile(chosen.file, 'utf8'));
  const failures = report.results.filter((result) => !result.passed);
  const byCheck = new Map();
  for (const result of failures) {
    const entry = byCheck.get(result.check) ?? { criterion: result.criterion, viewports: [], error: result.error };
    entry.viewports.push(result.viewport);
    byCheck.set(result.check, entry);
  }

  process.stdout.write(
    '[rendered-summary] ' + feature + ': ' + (report.results.length - failures.length) + '/' + report.results.length +
      ' passed' + (report.partial ? ' (partial run)' : '') + ' — ' + chosen.name + '\n',
  );
  for (const [check, entry] of byCheck) {
    process.stdout.write(
      'FAIL ' + check + ' (' + entry.criterion + ') @ ' + entry.viewports.join(', ') + ': ' +
        String(entry.error ?? '').replace(/\s+/g, ' ').slice(0, 240) + '\n',
    );
  }
  if (byCheck.size > 0) {
    process.stdout.write(
      'next: npm run test:rendered -- --feature ' + feature + ' --check ' + [...byCheck.keys()].join(',') + '\n',
    );
  }
}
