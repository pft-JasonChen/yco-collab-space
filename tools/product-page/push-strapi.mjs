import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot, pagePaths, pathExists, readJson, requestedPage } from './project.mjs';
import { loadRegistry, sharedAssetId } from './registry-policy.mjs';
import { assetRefRepositoryPath, parseAssetRef } from './content-policy.mjs';

function flag(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function loadDotEnv() {
  const envPath = fromRoot('.env');
  if (!(await pathExists(envPath))) return;
  for (const line of (await fs.readFile(envPath, 'utf8')).split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const page = requestedPage();
if (!page) throw new Error('Usage: npm run page:publish -- --page <page> [--confirm] [--entry <id>]');
const confirm = process.argv.includes('--confirm');
const entryId = flag('--entry');
const paths = pagePaths(page);
const registry = await loadRegistry();
if (registry.errors.length > 0) throw new Error(registry.errors.join('\n'));
if (!(await pathExists(fromRoot(paths.generation)))) throw new Error('generation.json is missing; run /product-page-generate first.');
const generation = await readJson(paths.generation);
if (!generation.review || !['pass', 'pass-with-notes'].includes(generation.review.verdict)) throw new Error('Spec-compliance review must pass before publishing.');
const payload = await readJson(paths.payload);
if ('publishedAt' in payload) throw new Error('publishedAt is forbidden; automation only creates drafts.');
if (payload.status !== 'draft') throw new Error('payload.status must be draft.');

await loadDotEnv();
const api = registry.registry.strapi.adminApi;
const baseUrl = (process.env[api.baseUrlEnv] || '').replace(/\/$/, '');
const uid = registry.registry.contentType.uid;

const pendingUploads = [];
const resolved = [];
function resolve(value, where) {
  if (Array.isArray(value)) return value.map((item, index) => resolve(item, where + '[' + index + ']'));
  if (value && typeof value === 'object') {
    if (typeof value.$assetRef === 'string') {
      const parsed = parseAssetRef(value.$assetRef);
      if (!parsed) throw new Error(where + ': invalid assetRef ' + value.$assetRef);
      if (parsed.kind === 'strapi') {
        const id = sharedAssetId(registry, parsed.target);
        if (id === null) throw new Error(where + ': unknown shared asset ' + parsed.target);
        resolved.push({ where, assetRef: value.$assetRef, strapiMediaId: id, source: 'shared' });
        return id;
      }
      const repositoryPath = assetRefRepositoryPath(value.$assetRef, page);
      const placeholder = { $upload: pendingUploads.length };
      pendingUploads.push({ where, assetRef: value.$assetRef, repositoryPath, placeholder });
      return placeholder;
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item, where + '.' + key)]));
  }
  return value;
}
let body = resolve(payload, 'payload');
for (const upload of pendingUploads) {
  if (!(await pathExists(fromRoot(upload.repositoryPath)))) throw new Error(upload.where + ': asset file is missing ' + upload.repositoryPath);
}

const summary = {
  page,
  mode: confirm ? (entryId ? 'update-draft' : 'create-draft') : 'dry-run',
  uid,
  sharedAssets: resolved,
  uploads: pendingUploads.map(({ where, assetRef, repositoryPath }) => ({ where, assetRef, repositoryPath })),
  sections: payload.sections.map((section) => section.__component),
};

if (!confirm) {
  process.stdout.write('[page-publish] DRY RUN ' + page + '\n' + JSON.stringify(summary, null, 2) + '\n');
  process.stdout.write('Re-run with --confirm after a human approves this draft creation.\n');
  process.exit(0);
}

if (!baseUrl) throw new Error(api.baseUrlEnv + ' is not set. Copy strapi/client/.env.example to .env.');
let token = process.env[api.tokenEnv] || null;
if (!token) {
  const email = process.env[api.emailEnv];
  const password = process.env[api.passwordEnv];
  if (!email || !password) throw new Error('Set ' + api.tokenEnv + ' or ' + api.emailEnv + '/' + api.passwordEnv + ' in .env.');
  const login = await fetch(baseUrl + api.loginPath, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!login.ok) throw new Error('Admin login failed: HTTP ' + login.status);
  token = (await login.json())?.data?.token;
  if (!token) throw new Error('Admin login returned no token.');
}
const headers = { authorization: 'Bearer ' + token };

const uploaded = [];
for (const upload of pendingUploads) {
  const absolute = fromRoot(upload.repositoryPath);
  const form = new FormData();
  form.append('files', new Blob([await fs.readFile(absolute)]), path.basename(absolute));
  const response = await fetch(baseUrl + api.uploadPath, { method: 'POST', headers, body: form });
  if (!response.ok) throw new Error('Upload failed for ' + upload.repositoryPath + ': HTTP ' + response.status + ' (no entry was created)');
  const [file] = await response.json();
  upload.placeholder.$resolvedId = file.id;
  uploaded.push({ ...upload, strapiMediaId: file.id, placeholder: undefined });
}
body = JSON.parse(JSON.stringify(body), (key, value) => (value && typeof value === 'object' && '$upload' in value ? value.$resolvedId : value));

const url = baseUrl + api.contentManagerPath + '/' + uid + (entryId ? '/' + entryId : '');
const response = await fetch(url, { method: entryId ? 'PUT' : 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify(body) });
const responseText = await response.text();
let responseJson = null;
try { responseJson = JSON.parse(responseText); } catch { /* keep text */ }
const id = responseJson?.id ?? responseJson?.data?.id ?? entryId ?? null;
const evidence = {
  schemaVersion: 1,
  page,
  pushedAt: new Date().toISOString(),
  mode: summary.mode,
  request: { method: entryId ? 'PUT' : 'POST', url, uid, inputHash: generation.inputHash, payloadSha256: generation.artifacts['strapi-payload.json'] },
  response: { status: response.status, ok: response.ok, entryId: id, error: response.ok ? null : responseText.slice(0, 2000) },
  uploads: uploaded,
  sharedAssets: resolved,
  adminUrl: id && registry.registry.strapi.adminUiEntryPath ? baseUrl.replace(/\/strapi$/, '') + registry.registry.strapi.adminUiEntryPath.replace('{uid}', uid).replace('{id}', String(id)) : null,
  decisionBasis: ['Draft only; publishing remains a human action inside Strapi.'],
};
const evidenceRoot = fromRoot(paths.evidence, 'publish');
await fs.mkdir(evidenceRoot, { recursive: true });
const evidencePath = path.join(evidenceRoot, evidence.pushedAt.replaceAll(':', '-') + '.json');
await fs.writeFile(evidencePath, JSON.stringify(evidence, null, 2) + '\n');
if (!response.ok) {
  process.stderr.write('[page-publish] FAIL HTTP ' + response.status + '; evidence: ' + path.relative(fromRoot(), evidencePath) + '\n');
  process.exitCode = 1;
} else {
  process.stdout.write('[page-publish] DRAFT ' + (entryId ? 'UPDATED' : 'CREATED') + ' entry ' + id + '\n');
  if (evidence.adminUrl) process.stdout.write('Preview in Strapi admin: ' + evidence.adminUrl + '\n');
  process.stdout.write('Evidence: ' + path.relative(fromRoot(), evidencePath) + '\n');
}
