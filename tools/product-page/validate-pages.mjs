import { promises as fs } from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import { formatSchemaErrors, readJson, readYaml } from '../prototype-cli/project.mjs';
import { loadCollabMap, stagesForTrack, transitionsForTrack } from '../collab-space/policy.mjs';
import {
  fromRoot,
  hashPageInputs,
  listPageSlugs,
  pagePaths,
  pathExists,
  readPageSource,
  requestedPage,
  sha256File,
  sha256Text,
  tokenLockPath,
} from './project.mjs';
import { loadRegistry, payloadErrors, registryHash, sharedAssetId } from './registry-policy.mjs';
import { layoutErrors, loadPatterns, patternsHash } from './pattern-policy.mjs';
import { assetRefRepositoryPath, contentSemanticErrors, parseAssetRef, reviewErrors } from './content-policy.mjs';

const ajv = new Ajv({ allErrors: true, strict: false });
const schema = async (name) => ajv.compile(await readJson('tools/product-page/schemas/' + name));
const validateSource = await schema('page-source.schema.json');
const validateContent = await schema('content.schema.json');
const validateLayout = await schema('layout.schema.json');
const validateReview = await schema('spec-review.schema.json');
const validateGeneration = await schema('page-generation.schema.json');
const validateReleases = await schema('page-releases.schema.json');

const map = await loadCollabMap();
const pageStages = stagesForTrack(map, 'product-page');
const pageTransitions = transitionsForTrack(map, 'product-page');
const registry = await loadRegistry();
const { patterns } = await loadPatterns();
const surfacePack = await readYaml('platform/surfaces/marketing/product-page/2026-08/surface.yaml');

async function validatePage(page) {
  const errors = [];
  const paths = pagePaths(page);
  if (!(await pathExists(fromRoot(paths.pageSource)))) return ['Missing source/page.source.yaml'];
  const source = await readYaml(paths.pageSource);
  if (!validateSource(source)) errors.push('page.source.yaml: ' + formatSchemaErrors(validateSource.errors));
  else {
    if (source.page !== page) errors.push('page.source.yaml page does not match folder: ' + page);
    if (source.functionKey !== '/products/' + source.pageKey) errors.push('functionKey must be /products/<pageKey>');
    for (const feature of source.upstream.features) {
      if (!(await pathExists(fromRoot('features', feature, 'product', 'prd.md')))) errors.push('Upstream feature spec does not exist: features/' + feature + '/product/prd.md');
    }
    for (const slug of source.upstream.products) {
      if (!(await pathExists(fromRoot('product-library', 'products', slug, 'product.yaml')))) errors.push('Upstream product entry does not exist: ' + slug);
    }
    for (const slug of source.upstream.competitors) {
      if (!(await pathExists(fromRoot('product-library', 'competitors', slug, 'competitor.yaml')))) errors.push('Upstream competitor entry does not exist: ' + slug);
    }
    if (!(await pathExists(fromRoot(paths.brief)))) errors.push('Missing source/brief.md');
  }

  if (await pathExists(fromRoot(paths.releases))) {
    const release = await readJson(paths.releases);
    if (!validateReleases(release)) errors.push('releases.json: ' + formatSchemaErrors(validateReleases.errors));
    else {
      if (release.page !== page) errors.push('releases.json page does not match folder');
      if (!pageStages.some((stage) => stage.id === release.currentStage && stage.kind === 'lifecycle')) errors.push('Unknown product-page lifecycle stage: ' + release.currentStage);
      for (const record of [...release.transitions, ...release.downstreamOutputs]) {
        const transition = pageTransitions.find((item) => item.from === record.from && item.to === record.to);
        if (!transition) errors.push('Release record references an undeclared transition: ' + record.from + ' -> ' + record.to);
        else {
          const approved = new Set(record.approvals.map((item) => item.actor));
          for (const actor of transition.approvals) if (!approved.has(actor)) errors.push('Release record is missing approval from ' + actor + ': ' + record.id);
        }
      }
    }
  } else errors.push('Missing releases.json');

  if (errors.length > 0) return errors;

  const hasContent = await pathExists(fromRoot(paths.content));
  if (!hasContent) {
    if (source.status === 'confirmed') return { errors, note: 'brief confirmed, no generated content yet' };
    return { errors, note: 'brief draft' };
  }

  const contentText = await fs.readFile(fromRoot(paths.content), 'utf8');
  const content = JSON.parse(contentText);
  if (!validateContent(content)) errors.push('content.json: ' + formatSchemaErrors(validateContent.errors));
  else errors.push(...(await contentSemanticErrors(content, page, source)).map((error) => '[content] ' + error));
  if (source.status !== 'confirmed') errors.push('[content] page.source.yaml status must be confirmed before generation');

  let layout = null;
  if (await pathExists(fromRoot(paths.layout))) {
    layout = await readJson(paths.layout);
    if (!validateLayout(layout)) errors.push('layout.json: ' + formatSchemaErrors(validateLayout.errors));
    else {
      if (layout.contentHash !== sha256Text(contentText)) errors.push('[layout] layout.json was built from a different content.json');
      errors.push(...layoutErrors(layout, content, patterns, surfacePack).map((error) => '[layout] ' + error));
    }
  } else errors.push('[layout] layout.json is missing');

  let payload = null;
  if (await pathExists(fromRoot(paths.payload))) {
    payload = await readJson(paths.payload);
    const result = payloadErrors(payload, registry);
    errors.push(...result.errors.map((error) => '[payload] ' + error));
    if (payload.status !== 'draft') errors.push('[payload] status must be draft');
    if (payload.pageKey !== source.pageKey) errors.push('[payload] pageKey must equal page.source.yaml pageKey');
    if (payload.languages?.languages !== source.locale) errors.push('[payload] languages.languages must equal page.source.yaml locale');
    if (layout && Array.isArray(payload.sections) && payload.sections.length !== layout.sections.length) errors.push('[payload] sections count does not match layout.json');
    if (layout && Array.isArray(payload.sections)) {
      layout.sections.forEach((entry, index) => {
        const expected = patterns.get(entry.pattern)?.strapiComponent;
        const actual = payload.sections[index]?.__component;
        if (expected && actual && expected !== actual) errors.push('[payload] sections[' + index + '] uses ' + actual + ' but pattern ' + entry.pattern + ' binds ' + expected);
      });
    }
    for (const { where, ref } of result.assetRefs) {
      const parsed = parseAssetRef(ref);
      if (!parsed) errors.push('[payload] ' + where + ' has an invalid assetRef ' + ref);
      else if (parsed.kind === 'strapi' && sharedAssetId(registry, parsed.target) === null) errors.push('[payload] ' + where + ' references unknown shared asset ' + parsed.target);
      else if (parsed.kind !== 'strapi') {
        const repositoryPath = assetRefRepositoryPath(ref, page);
        if (!(await pathExists(fromRoot(repositoryPath)))) errors.push('[payload] ' + where + ' asset file does not exist: ' + repositoryPath);
      }
    }
  } else errors.push('[payload] strapi-payload.json is missing');

  let review = null;
  if (await pathExists(fromRoot(paths.review))) {
    review = await readJson(paths.review);
    if (!validateReview(review)) errors.push('review: ' + formatSchemaErrors(validateReview.errors));
    else if (review.page !== page) errors.push('[review] page does not match folder');
  } else errors.push('[review] generated/review/spec-compliance.json is missing; run /product-page-review');

  if (await pathExists(fromRoot(paths.generation))) {
    const generation = await readJson(paths.generation);
    if (!validateGeneration(generation)) errors.push('generation.json: ' + formatSchemaErrors(validateGeneration.errors));
    else {
      if (generation.page !== page) errors.push('[generation] page does not match folder');
      const current = await hashPageInputs(page, source);
      if (generation.inputHash !== current.inputHash) {
        const before = new Map(generation.inputs.files.map((file) => [file.path, file.sha256]));
        const changed = current.files.filter((file) => before.get(file.path) !== file.sha256).map((file) => file.path);
        const removed = [...before.keys()].filter((file) => !current.files.some((item) => item.path === file));
        errors.push('[generation] generated page is stale; inputs changed: ' + [...changed, ...removed].slice(0, 8).join(', ') + (changed.length + removed.length > 8 ? ', …' : ''));
      }
      for (const [artifact, expected] of Object.entries(generation.artifacts)) {
        const artifactPath = path.join(paths.generated, artifact);
        if (!(await pathExists(fromRoot(artifactPath)))) errors.push('[generation] recorded artifact is missing: ' + artifact);
        else if ((await sha256File(fromRoot(artifactPath))) !== expected) errors.push('[generation] artifact changed after generation was recorded: ' + artifact);
      }
      if (generation.registryHash !== (await registryHash())) errors.push('[generation] Strapi registry changed since generation');
      if (generation.patternsHash !== (await patternsHash())) errors.push('[generation] Designer patterns changed since generation');
      if (generation.tokens.lockSha256 !== (await sha256File(fromRoot(tokenLockPath)))) errors.push('[generation] token lock changed since generation');
      for (const resource of generation.resources.selected) {
        if (resource.repositoryPath && (await pathExists(fromRoot(resource.repositoryPath)))) {
          if ((await sha256File(fromRoot(resource.repositoryPath))) !== resource.sha256) errors.push('[generation] selected asset changed: ' + resource.repositoryPath);
        } else if (resource.repositoryPath) errors.push('[generation] selected asset is missing: ' + resource.repositoryPath);
      }
      if (review) errors.push(...reviewErrors(review, contentText, generation).map((error) => '[review] ' + error));
      if (review && generation.review && generation.review.sha256 !== (await sha256File(fromRoot(paths.review)))) errors.push('[generation] review file changed after generation was recorded');
    }
  } else errors.push('[generation] generation.json is missing; run npm run page:record');

  return errors;
}

const selected = requestedPage();
const pages = await listPageSlugs(selected);
let failed = false;
for (const page of pages) {
  const result = await validatePage(page);
  const errors = Array.isArray(result) ? result : result.errors;
  if (errors.length > 0) {
    failed = true;
    process.stderr.write('[pages] FAIL ' + page + '\n');
    for (const error of errors) process.stderr.write('  - ' + error + '\n');
  } else {
    const note = Array.isArray(result) ? 'generated + reviewed' : result.note;
    process.stdout.write('[pages] PASS ' + page + ' (' + note + ')\n');
  }
}
if (failed) process.exitCode = 1;
