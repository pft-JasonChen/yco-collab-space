import { checkRdParity } from './rd-parity.mjs';

const result = await checkRdParity();

if (result.errors.length > 0) {
  process.stderr.write('[rd-parity] FAIL\n');
  for (const error of result.errors) process.stderr.write('  - ' + error + '\n');
  process.exitCode = 1;
} else {
  process.stdout.write('[rd-parity] PASS ' + result.checked.length + ' verbatim files match the RD baseline\n');
}
