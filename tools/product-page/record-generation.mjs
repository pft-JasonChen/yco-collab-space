import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  fromRoot,
  hashPageInputs,
  pagePaths,
  pathExists,
  readJson,
  readPageSource,
  requestedPage,
  sha256File,
  skillFiles,
  tokenLockPath,
} from './project.mjs';
import { loadRegistry, registryHash, sharedAssetId } from './registry-policy.mjs';
import { patternsHash } from './pattern-policy.mjs';
import { assetRefRepositoryPath, collectMedia, parseAssetRef } from './content-policy.mjs';

function flag(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const page = requestedPage();
if (!page) throw new Error('Usage: npm run page:record -- --page <page> [--adapter <adapter>] [--model <model>]');
const paths = pagePaths(page);
const source = await readPageSource(page);
for (const required of [paths.content, paths.layout, paths.payload]) {
  if (!(await pathExists(fromRoot(required)))) throw new Error('Cannot record generation; missing ' + required);
}

const registry = await loadRegistry();
const content = await readJson(paths.content);
const selected = [];
const warnings = [];
for (const media of collectMedia(content)) {
  const parsed = parseAssetRef(media.assetRef);
  if (!parsed) continue;
  if (parsed.kind === 'strapi') {
    const id = sharedAssetId(registry, parsed.target);
    if (id === null) warnings.push('Unknown shared asset ' + parsed.target);
    selected.push({ assetRef: media.assetRef, kind: 'strapi', repositoryPath: null, sha256: null, strapiMediaId: id, status: 'shared' });
    continue;
  }
  const repositoryPath = assetRefRepositoryPath(media.assetRef, page);
  const exists = await pathExists(fromRoot(repositoryPath));
  selected.push({
    assetRef: media.assetRef,
    kind: parsed.kind,
    repositoryPath,
    sha256: exists ? await sha256File(fromRoot(repositoryPath)) : null,
    strapiMediaId: null,
    status: parsed.kind === 'mock' ? 'temporary' : 'candidate',
  });
  if (!exists) warnings.push('Asset file is missing: ' + repositoryPath);
}
const unique = [...new Map(selected.map((item) => [item.assetRef, item])).values()].sort((a, b) => a.assetRef.localeCompare(b.assetRef));

const artifacts = {};
for (const artifact of ['content.json', 'layout.json', 'strapi-payload.json']) {
  artifacts[artifact] = await sha256File(fromRoot(paths.generated, artifact));
}
let review = null;
if (await pathExists(fromRoot(paths.review))) {
  const reviewDocument = await readJson(paths.review);
  review = {
    path: 'review/spec-compliance.json',
    sha256: await sha256File(fromRoot(paths.review)),
    verdict: reviewDocument.verdict,
    reviewerModel: reviewDocument.reviewer?.model ?? 'not-recorded',
  };
}
const skills = {};
for (const [id, file] of Object.entries(skillFiles)) skills[id] = { path: file, sha256: await sha256File(fromRoot(file)) };
const inputs = await hashPageInputs(page, source);
const generation = {
  schemaVersion: 1,
  page,
  inputHash: inputs.inputHash,
  inputs: { files: inputs.files },
  skills,
  builder: {
    adapter: flag('--adapter', 'not-recorded'),
    model: flag('--model', process.env.PROTOTYPE_MODEL || 'not-recorded'),
  },
  generatedAt: new Date().toISOString(),
  artifacts,
  review,
  resources: { selected: unique, warnings },
  registryHash: await registryHash(),
  patternsHash: await patternsHash(),
  tokens: { lockPath: tokenLockPath, lockSha256: await sha256File(fromRoot(tokenLockPath)) },
  collabContract: { schemaVersion: 1, workflow: 'product-page-generate', track: 'product-page' },
};
await fs.mkdir(fromRoot(paths.generated), { recursive: true });
await fs.writeFile(fromRoot(paths.generation), JSON.stringify(generation, null, 2) + '\n');
process.stdout.write('[page-generation] RECORDED ' + page + ' ' + generation.inputHash.slice(0, 12) + (review ? ' review=' + review.verdict : ' review=missing') + '\n');
