import { promises as fs } from 'node:fs';
import { fromRoot, readJson } from '../../prototype-cli/project.mjs';
import {
  extractTokenDefinitions,
  extractTokenReferences,
  findRawColours,
} from '../../prototype-cli/token-policy.mjs';
import { findNetworkApis } from '../../prototype-cli/network-policy.mjs';
import { relativeToRoot } from '../write-guard.mjs';
import { guarded, readStdinJson, respond } from './io.mjs';

// PostToolUse for Edit / Write on generated code. Runs the two cheapest gates on
// the one file that changed so a raw colour or a fetch() is reported in the same
// turn it was written, not after a full validate.
await guarded('post-write-lint', async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path;
  if (!filePath) return;

  const relative = relativeToRoot(fromRoot(), filePath);
  if (!relative || !/^features\/[^/]+\/generated\//.test(relative)) return;

  const source = await fs.readFile(filePath, 'utf8').catch(() => null);
  if (source === null) return;

  const problems = [];

  if (/\.(?:css|scss)$/.test(relative)) {
    const lock = await readJson('platform/tokens/tokens.lock.json');
    const definitions = new Set();
    for (const file of lock.files) {
      for (const token of extractTokenDefinitions(
        await fs.readFile(fromRoot(file.path), 'utf8'),
      )) {
        definitions.add(token);
      }
    }
    const rawColours = findRawColours(source);
    if (rawColours.length > 0) {
      problems.push('raw colour(s) ' + [...new Set(rawColours)].join(', ') + ' — use an RD token');
    }
    for (const reference of extractTokenReferences(source)) {
      if (!definitions.has(reference)) {
        problems.push('unknown token ' + reference + ' — only tokens in tokens.lock.json exist');
      }
    }
  }

  if (/\.(?:js|jsx|mjs)$/.test(relative)) {
    const apis = findNetworkApis(source);
    if (apis.length > 0) {
      problems.push('client network API ' + apis.join(', ') + ' — prototypes are mock-only');
    }
  }

  if (problems.length === 0) return;

  respond({
    decision: 'block',
    reason:
      '[generated-lint] ' +
      relative +
      ' will fail validate:tokens / validate:network:\n- ' +
      problems.join('\n- ') +
      '\nFix it now; the full gate re-checks the same rules.',
  });
});
