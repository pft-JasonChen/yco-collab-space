import Ajv from 'ajv';
import { formatSchemaErrors, listFeatureSlugs, readJson, requestedFeature } from '../prototype-cli/project.mjs';
import { validateReleaseSemantics } from './stage-policy.mjs';

const schema = await readJson('tools/collab-space/schemas/releases.schema.json');
const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
let failed = false;
for (const feature of await listFeatureSlugs(requestedFeature())) {
  const release = await readJson('features/' + feature + '/releases.json');
  const errors = [];
  if (!validate(release)) errors.push(formatSchemaErrors(validate.errors));
  else errors.push(...(await validateReleaseSemantics(feature, release)));
  if (errors.length) {
    failed = true;
    process.stderr.write('[stage] FAIL ' + feature + '\n  - ' + errors.join('\n  - ') + '\n');
  } else process.stdout.write('[stage] PASS ' + feature + ' ' + release.currentStage + '\n');
}
if (failed) process.exitCode = 1;
