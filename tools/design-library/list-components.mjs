import { validateComponentContracts } from './component-contracts.mjs';

/**
 * Reuse lookup for intake. Prototype-intake must resolve every component role
 * against this list before any feature UI is generated, so a role that an
 * existing shared component already covers cannot be rebuilt by accident.
 */
const asJson = process.argv.includes('--json');
const { contracts, errors } = await validateComponentContracts();

if (errors.length > 0) {
  process.stderr.write('[library:components] FAIL\n');
  for (const error of errors) process.stderr.write('  - ' + error + '\n');
  process.exitCode = 1;
} else {
  const rows = contracts
    .map(({ contract }) => ({
      id: contract.id,
      displayName: contract.displayName,
      classification: contract.classification,
      status: contract.status,
      portability: contract.rd.portability,
      importPath: contract.implementation.importPath,
      storyId: contract.implementation.storyId,
      states: contract.publicApi.states,
      summary: contract.decisionBasis[0],
      rdSource: contract.rd.sourcePaths[0],
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

  if (asJson) {
    process.stdout.write(JSON.stringify({ schemaVersion: 1, components: rows }, null, 2) + '\n');
  } else {
    process.stdout.write(`${rows.length} shared components available for reuse\n\n`);
    for (const row of rows) {
      process.stdout.write(`${row.id}  (${row.classification} · ${row.status} · rd:${row.portability})\n`);
      process.stdout.write(`  ${row.displayName} — ${row.summary}\n`);
      process.stdout.write(`  import  ${row.importPath}\n`);
      process.stdout.write(`  story   ${row.storyId}\n`);
      process.stdout.write(`  states  ${row.states.join(', ')}\n`);
      process.stdout.write(`  rd      ${row.rdSource}\n\n`);
    }
  }
}
