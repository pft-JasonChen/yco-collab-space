import { verifySnapshot } from './snapshot.mjs';

const result = await verifySnapshot();

if (result.errors.length > 0) {
  process.stderr.write('[snapshot] FAIL\n');
  for (const error of result.errors) process.stderr.write('  - ' + error + '\n');
  process.stderr.write('  Run `npm run snapshot:vendor` with the RD snapshot reachable to refresh the baseline.\n');
  process.exitCode = 1;
} else {
  process.stdout.write('[snapshot] PASS ' + result.vendored + ' vendored RD files match their contracts\n');
}
