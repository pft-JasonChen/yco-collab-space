import { validateComponentContracts } from './component-contracts.mjs';

const result = await validateComponentContracts();

if (result.errors.length > 0) {
  process.stderr.write('[components] FAIL\n');
  for (const error of result.errors) process.stderr.write('  - ' + error + '\n');
  process.exitCode = 1;
} else {
  process.stdout.write('[components] PASS ' + result.contracts.length + ' pilot contracts\n');
}
