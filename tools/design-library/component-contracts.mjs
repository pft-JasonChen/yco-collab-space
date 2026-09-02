import { promises as fs } from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import { parse as parseYaml } from 'yaml';
import { formatSchemaErrors, fromRoot, pathExists, readJson, walkFiles } from '../prototype-cli/project.mjs';
import { normaliseCollectionReference, scanCollection } from './library.mjs';

const schema = await readJson('tools/design-library/schemas/component-contract.schema.json');
const validateSchema = new Ajv({ allErrors: true, strict: false }).compile(schema);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

export async function listComponentContractFiles(workspace = fromRoot()) {
  const root = path.join(workspace, 'design-library', 'components');
  if (!(await pathExists(root))) return [];
  return (await walkFiles(root)).filter((file) => path.basename(file) === 'component.yaml');
}

export async function validateComponentContracts({ workspace = fromRoot(), requireContracts = true } = {}) {
  const files = await listComponentContractFiles(workspace);
  const errors = [];
  const contracts = [];
  const ids = new Set();

  if (requireContracts && files.length === 0) {
    errors.push('No component contracts found under design-library/components/.');
  }

  for (const file of files) {
    const relative = toPosix(path.relative(workspace, file));
    let contract;
    try {
      contract = parseYaml(await fs.readFile(file, 'utf8'));
    } catch (error) {
      errors.push(relative + ': invalid YAML: ' + error.message);
      continue;
    }

    if (!validateSchema(contract)) {
      errors.push(relative + ': ' + formatSchemaErrors(validateSchema.errors));
      continue;
    }

    if (ids.has(contract.id)) errors.push(relative + ': duplicate component id ' + contract.id);
    ids.add(contract.id);

    if (contract.figma.status === 'mapped' && (!contract.figma.fileKey || !contract.figma.componentSetNodeId)) {
      errors.push(relative + ': mapped Figma status requires fileKey and componentSetNodeId.');
    }

    const implementationPath = contract.implementation.importPath;
    if (implementationPath.includes('..') || !implementationPath.startsWith('platform/ui/')) {
      errors.push(relative + ': implementation import must stay under platform/ui/.');
    } else if (!(await pathExists(path.join(workspace, ...implementationPath.split('/'))))) {
      errors.push(relative + ': implementation import does not exist: ' + implementationPath);
    }

    for (const asset of contract.assets) {
      try {
        const normalised = normaliseCollectionReference(asset.path);
        const collection = await scanCollection(normalised, workspace);
        if (!collection.exists || collection.files.length === 0) {
          errors.push(relative + ': component asset collection is missing or empty: ' + normalised);
        }
        for (const warning of collection.warnings) errors.push(relative + ': ' + warning);
      } catch (error) {
        errors.push(relative + ': ' + error.message);
      }
    }

    contracts.push({ file: relative, contract });
  }

  return { files, contracts, errors };
}
