import { checkGeometry } from './geometry.mjs';

const result = await checkGeometry();

if (result.errors.length > 0) {
  process.stderr.write('[geometry] FAIL\n');
  for (const error of result.errors) process.stderr.write('  - ' + error + '\n');
  process.exitCode = 1;
} else {
  const withDeviation = result.checked.filter((entry) => entry.deviation);
  process.stdout.write(
    '[geometry] PASS ' + result.checked.length + ' declared facts match RD' +
      (withDeviation.length ? ' (' + withDeviation.length + ' accepted deviation)' : '') +
      '; ' + result.deferred.length + ' measured facts asserted in the browser\n',
  );
}
