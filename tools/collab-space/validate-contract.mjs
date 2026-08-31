import Ajv from 'ajv';
import { formatSchemaErrors, readJson } from '../prototype-cli/project.mjs';
import { collabMapSemanticErrors, loadCollabMap } from './policy.mjs';

const ajv = new Ajv({ allErrors: true, strict: false });
const schema = await readJson('tools/collab-space/schemas/collab-space-map.schema.json');
const validate = ajv.compile(schema);
const map = await loadCollabMap();
const errors = [];

if (!validate(map)) {
  errors.push(formatSchemaErrors(validate.errors));
} else {
  errors.push(...collabMapSemanticErrors(map));
}

if (errors.length > 0) {
  process.stderr.write('[collab-contract] FAIL\n');
  for (const error of errors) process.stderr.write('  - ' + error + '\n');
  process.exitCode = 1;
} else {
  process.stdout.write(
    '[collab-contract] PASS ' + map.stages.length + ' stages, ' + map.workflows.length + ' workflows\n',
  );
}
