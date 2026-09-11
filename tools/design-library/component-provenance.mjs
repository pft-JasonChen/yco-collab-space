import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, pathExists, sha256File, walkFiles } from '../prototype-cli/project.mjs';
import { scanCollection } from './library.mjs';
import { validateComponentContracts } from './component-contracts.mjs';
import { generatedOutputs, runtimeGraph } from '../prototype-cli/content-integrity.mjs';

function toPosix(value) {
  return value.split(path.sep).join('/');
}

async function implementationHash(importPath, workspace = fromRoot()) {
  const componentRoot = path.dirname(path.join(workspace, ...importPath.split('/')));
  const files = (await walkFiles(componentRoot)).filter((file) => {
    const name = path.basename(file);
    return /\.(?:css|js|jsx|scss)$/.test(file) && !name.includes('.stories.');
  });
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(toPosix(path.relative(componentRoot, file)) + '\0');
    hash.update(await fs.readFile(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

export async function discoverGeneratedComponentImports(feature, workspace = fromRoot()) {
  const outputs = await generatedOutputs(feature, workspace);
  const graph = await runtimeGraph(outputs.files.map((file) => file.path), workspace);
  const validation = await validateComponentContracts({ workspace });
  if (validation.errors.length) throw new Error(validation.errors.join('\n'));
  const imports = new Set();
  for (const { path: file } of graph.files) {
    if (!file.startsWith('platform/ui/')) continue;
    const match = validation.contracts.find(({ contract }) =>
      file.startsWith(path.posix.dirname(contract.implementation.importPath) + '/') ||
      contract.implementation.compatibilityImportPaths?.includes(file));
    if (match) imports.add(match.contract.implementation.importPath);
    else if (file !== 'platform/ui/index.js') throw new Error('Uncatalogued transitive platform dependency: ' + file);
  }
  return [...imports].sort();
}

function contractImportMap(contracts) {
  const map = new Map();
  for (const entry of contracts) {
    map.set(entry.contract.implementation.importPath, entry);
    for (const compatibilityPath of entry.contract.implementation.compatibilityImportPaths ?? []) {
      map.set(compatibilityPath, entry);
    }
  }
  return map;
}

async function runtimeAssets(contract, workspace) {
  const selected = new Map();
  for (const asset of contract.assets.filter((item) => item.usage === 'runtime')) {
    const collection = await scanCollection(asset.path, workspace);
    for (const file of collection.files) {
      selected.set(file.repositoryPath, {
        repositoryPath: file.repositoryPath,
        sha256: file.sha256,
      });
    }
  }
  return [...selected.values()].sort((a, b) => a.repositoryPath.localeCompare(b.repositoryPath));
}

export async function buildSharedComponentProvenance(feature, workspace = fromRoot()) {
  const validation = await validateComponentContracts({ workspace });
  if (validation.errors.length > 0) throw new Error(validation.errors.join('\n'));
  const imports = await discoverGeneratedComponentImports(feature, workspace);
  const byImport = contractImportMap(validation.contracts);
  const selected = new Map();

  for (const importPath of imports) {
    const entry = byImport.get(importPath);
    if (!entry) throw new Error('Generated feature imports an uncatalogued platform component: ' + importPath);
    const contract = entry.contract;
    if (selected.has(contract.id)) continue;
    const contractPath = entry.file;
    selected.set(contract.id, {
      id: contract.id,
      status: contract.status,
      figmaStatus: contract.figma.status,
      contractPath,
      contractSha256: await sha256File(path.join(workspace, ...contractPath.split('/'))),
      implementationImport: contract.implementation.importPath,
      implementationSha256: await implementationHash(contract.implementation.importPath, workspace),
      runtimeAssets: await runtimeAssets(contract, workspace),
    });
  }

  return {
    catalogSchemaVersion: 2,
    selected: [...selected.values()].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export async function sharedComponentProvenanceErrors(feature, provenance, workspace = fromRoot()) {
  const errors = [];
  if (!provenance || provenance.catalogSchemaVersion !== 2 || !Array.isArray(provenance.selected)) {
    return ['Shared component provenance is missing or invalid.'];
  }
  const validation = await validateComponentContracts({ workspace });
  errors.push(...validation.errors);
  const byId = new Map(validation.contracts.map((entry) => [entry.contract.id, entry]));
  const imports = await discoverGeneratedComponentImports(feature, workspace);
  const byImport = contractImportMap(validation.contracts);
  const importedIds = new Set();

  for (const importPath of imports) {
    const entry = byImport.get(importPath);
    if (!entry) errors.push('Generated feature imports an uncatalogued platform component: ' + importPath);
    else importedIds.add(entry.contract.id);
  }

  const recordedIds = new Set(provenance.selected.map((item) => item.id));
  for (const id of importedIds) if (!recordedIds.has(id)) errors.push('Shared component is not recorded in generation.json: ' + id);
  for (const id of recordedIds) if (!importedIds.has(id)) errors.push('Recorded shared component is no longer imported: ' + id);

  for (const recorded of provenance.selected) {
    const entry = byId.get(recorded.id);
    if (!entry) {
      errors.push('Recorded shared component contract is missing: ' + recorded.id);
      continue;
    }
    const contractPath = path.join(workspace, ...recorded.contractPath.split('/'));
    if (!(await pathExists(contractPath))) {
      errors.push('Shared component contract file is missing: ' + recorded.contractPath);
    } else if ((await sha256File(contractPath)) !== recorded.contractSha256) {
      errors.push('Shared component contract changed since generation: ' + recorded.id);
    }
    if ((await implementationHash(entry.contract.implementation.importPath, workspace)) !== recorded.implementationSha256) {
      errors.push('Shared component implementation changed since generation: ' + recorded.id);
    }
    for (const asset of recorded.runtimeAssets ?? []) {
      const absolute = path.join(workspace, ...asset.repositoryPath.split('/'));
      if (!(await pathExists(absolute))) errors.push('Shared component asset is missing: ' + asset.repositoryPath);
      else if ((await sha256File(absolute)) !== asset.sha256) errors.push('Shared component asset changed since generation: ' + asset.repositoryPath);
    }
  }

  return errors;
}
