import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "@babel/parser";
import { fromRoot, pathExists } from "./project.mjs";

const posix = (value) => value.split(path.sep).join("/");
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
const stable = (value) =>
  Array.isArray(value)
    ? value.map(stable)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, stable(value[key])]),
        )
      : value;
export const objectDigest = (value) => digest(JSON.stringify(stable(value)));

export function inside(workspace, relative) {
  const absolute = path.resolve(workspace, relative);
  const rel = path.relative(path.resolve(workspace), absolute);
  if (
    !rel ||
    rel === ".." ||
    rel.startsWith(".." + path.sep) ||
    path.isAbsolute(rel)
  )
    throw new Error("Integrity path escapes workspace: " + relative);
  return absolute;
}

export async function listContent(workspace, relative) {
  const absolute = inside(workspace, relative);
  const stat = await fs.lstat(absolute);
  if (stat.isSymbolicLink())
    throw new Error("Integrity does not follow symbolic links: " + relative);
  if (stat.isFile()) return [posix(relative)];
  const files = [];
  for (const name of (await fs.readdir(absolute)).sort()) {
    if (name === ".DS_Store") continue;
    files.push(
      ...(await listContent(workspace, posix(path.join(relative, name)))),
    );
  }
  return files;
}

export async function fileManifest(files, workspace = fromRoot()) {
  const entries = [];
  for (const file of [...new Set(files)].sort()) {
    const absolute = inside(workspace, file);
    const real = await fs.realpath(absolute);
    inside(workspace, path.relative(workspace, real));
    entries.push({ path: file, sha256: digest(await fs.readFile(absolute)) });
  }
  return { files: entries, hash: objectDigest(entries) };
}

export function scriptReferences(source, file = "module.jsx") {
  const ast = parse(source, {
    sourceType: "unambiguous",
    plugins: [
      "jsx",
      ...(file.endsWith(".ts") || file.endsWith(".tsx") ? ["typescript"] : []),
    ],
    createImportExpressions: true,
  });
  const references = new Set();
  const literal = (node) =>
    node?.type === "StringLiteral"
      ? node.value
      : node?.type === "TemplateLiteral" && node.expressions.length === 0
        ? node.quasis[0].value.cooked
        : null;
  const add = (node, kind) => {
    const specifier = literal(node);
    if (specifier === null)
      throw new Error(
        `${file}: non-static ${kind}; declare a statically resolvable dependency`,
      );
    references.add(specifier);
  };
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (
      [
        "ImportDeclaration",
        "ExportNamedDeclaration",
        "ExportAllDeclaration",
      ].includes(node.type) &&
      node.source
    )
      add(node.source, "import/export");
    if (node.type === "ImportExpression") add(node.source, "dynamic import");
    if (
      node.type === "CallExpression" &&
      (node.callee?.type === "Import" || node.callee?.name === "require")
    )
      add(node.arguments[0], "import/require");
    if (
      node.type === "CallExpression" &&
      node.callee?.property?.name === "glob"
    )
      throw new Error(
        `${file}: runtime glob requires an explicit generated dependency manifest`,
      );
    if (
      node.type === "NewExpression" &&
      node.callee?.name === "URL" &&
      node.arguments[1]?.object?.type === "MetaProperty"
    )
      add(node.arguments[0], "asset URL");
    for (const [key, value] of Object.entries(node))
      if (!["loc", "start", "end", "comments", "tokens"].includes(key)) {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === "object") visit(value);
      }
  };
  visit(ast.program);
  return [...references].sort();
}

function styleReferences(source) {
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return [
    ...new Set([
      ...[...clean.matchAll(/@(?:use|forward|import)\s+['"]([^'"]+)['"]/g)].map(
        (m) => m[1],
      ),
      ...[...clean.matchAll(/@import\s+([^;]+);/g)].flatMap((statement) =>
        [...statement[1].matchAll(/(?:^|,)\s*['"]([^'"]+)['"]/g)].map((m) => m[1]),
      ),
      ...[...clean.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)].map(
        (m) => m[1],
      ),
    ]),
  ];
}

async function resolveReference(specifier, importer, workspace) {
  if (/^(data:|#|sass:)/.test(specifier)) return null;
  if (/^(https?:|\/\/)/.test(specifier))
    throw new Error(`${importer}: external runtime dependency ${specifier}`);
  const clean = specifier.split(/[?#]/)[0];
  const isStyle = /\.(css|scss|sass)$/.test(importer);
  if (!clean.startsWith(".") && !clean.startsWith("/") && !isStyle) {
    if (!/^(@[^/]+\/)?[a-z0-9][a-z0-9._-]*(\/.*)?$/i.test(clean))
      throw new Error(`${importer}: unsupported dependency alias ${clean}`);
    return {
      package: clean.startsWith("@")
        ? clean.split("/").slice(0, 2).join("/")
        : clean.split("/")[0],
    };
  }
  const base = clean.startsWith("/")
    ? path.posix.join("public", clean.slice(1))
    : path.posix.join(path.posix.dirname(importer), clean);
  const extensions = [
    "",
    ".js",
    ".jsx",
    ".mjs",
    ".ts",
    ".tsx",
    ".json",
    ".css",
    ".scss",
  ];
  const options = [
    ...extensions.map((ext) => base + ext),
    ...extensions.slice(1).map((ext) => base + "/index" + ext),
  ];
  if (isStyle)
    for (const ext of ["", ".scss", ".sass", ".css"])
      options.push(
        path.posix.join(
          path.posix.dirname(base),
          "_" + path.posix.basename(base) + ext,
        ),
      );
  for (const candidate of options) {
    const absolute = inside(workspace, candidate);
    if ((await fs.stat(absolute).catch(() => null))?.isFile())
      return { file: posix(candidate) };
  }
  throw new Error(`${importer}: missing dependency ${specifier}`);
}

export async function runtimeGraph(entries, workspace = fromRoot()) {
  const visited = new Set();
  const edges = [];
  const packages = new Set();
  const visit = async (file) => {
    if (visited.has(file)) return;
    visited.add(file);
    const absolute = inside(workspace, file);
    if (!(await pathExists(absolute)))
      throw new Error("Missing dependency: " + file);
    const script = /\.(js|jsx|mjs|cjs|ts|tsx)$/.test(file);
    const style = /\.(css|scss|sass)$/.test(file);
    if (!script && !style) return;
    const source = await fs.readFile(absolute, "utf8");
    for (const specifier of script
      ? scriptReferences(source, file)
      : styleReferences(source)) {
      const resolved = await resolveReference(specifier, file, workspace);
      if (!resolved) continue;
      edges.push({
        from: file,
        specifier,
        to: resolved.file ?? "package:" + resolved.package,
      });
      if (resolved.package) packages.add(resolved.package);
      else await visit(resolved.file);
    }
  };
  for (const entry of [...new Set(entries)].sort()) await visit(entry);
  if (packages.size) {
    const lock = JSON.parse(
      await fs.readFile(path.join(workspace, "package-lock.json"), "utf8"),
    );
    for (const name of packages)
      if (!lock.packages?.["node_modules/" + name]?.integrity)
        throw new Error(
          "Runtime package is not integrity-pinned in package-lock.json: " +
            name,
        );
  }
  return {
    ...(await fileManifest([...visited], workspace)),
    edges: edges.sort((a, b) =>
      JSON.stringify(a).localeCompare(JSON.stringify(b), "en"),
    ),
    packages: [...packages].sort(),
  };
}

export async function generatedOutputs(feature, workspace = fromRoot()) {
  const root = `features/${feature}/generated`;
  const files = (await listContent(workspace, root)).filter(
    (file) => file !== root + "/generation.json",
  );
  return fileManifest(files, workspace);
}

// Deliberately conservative host/tool envelope: host UI, tokens, tooling and
// lockfile changes invalidate generations even when a module is loaded by Vite.
const envelopeRoots = [
  "app",
  "public",
  "platform/ui",
  "platform/surfaces",
  "design-library/components",
  "platform/runtime",
  "platform/tokens",
  "tools/prototype-cli",
  "tools/design-library",
  "tools/collab-space",
  "tools/migration",
  "agent-adapters",
  ".agents/skills",
];
const envelopeFiles = [
  "package.json",
  "package-lock.json",
  "prototype.config.json",
  "vite.config.js",
  "collab-space.map.yaml",
  "AGENTS.md",
  "migration/rd-intake-inventory.json",
  "migration/ai-video-pilot.json",
];
export async function generationIntegrity(
  feature,
  { workspace = fromRoot(), surface, components } = {},
) {
  const output = await generatedOutputs(feature, workspace);
  const graph = await runtimeGraph(
    output.files.map((f) => f.path),
    workspace,
  );
  const files = [
    ...graph.files.map((f) => f.path),
    ...(surface?.sourceFiles ?? []),
    ...(components?.selected ?? []).flatMap((c) => [
      c.contractPath,
      ...(c.runtimeAssets ?? []).map((a) => a.repositoryPath),
    ]),
  ];
  // The virtual Surface index reads every adopter's intent, including other features.
  for (const entry of await fs.readdir(path.join(workspace, 'features'), { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const intent = `features/${entry.name}/product/surface-intent.yaml`;
    if (await pathExists(path.join(workspace, intent))) files.push(intent);
  }
  for (const root of envelopeRoots)
    if (await pathExists(path.join(workspace, root)))
      files.push(
        ...(await listContent(workspace, root)).filter(
          (f) => !f.endsWith(".test.mjs"),
        ),
      );
  for (const file of envelopeFiles)
    if (await pathExists(path.join(workspace, file))) files.push(file);
  const dependencies = {
    ...(await fileManifest(files, workspace)),
    edges: graph.edges,
    packages: graph.packages,
  };
  dependencies.hash = objectDigest({
    files: dependencies.files,
    edges: dependencies.edges,
    packages: dependencies.packages,
  });
  return {
    schemaVersion: 1,
    output,
    dependencies,
    revisionHash: objectDigest({
      output: output.hash,
      dependencies: dependencies.hash,
      surface: surface?.contextHash,
      components,
    }),
  };
}

export function manifestErrors(recorded, actual, label) {
  if (
    !recorded ||
    !Array.isArray(recorded.files) ||
    typeof recorded.hash !== "string"
  )
    return [`${label} manifest missing; run prototype:record`];
  const errors = [];
  const before = new Map(recorded.files.map((f) => [f.path, f.sha256]));
  const after = new Map(actual.files.map((f) => [f.path, f.sha256]));
  if (before.size !== recorded.files.length)
    errors.push(`${label} manifest has duplicate paths`);
  for (const [file, sha] of after)
    if (before.get(file) !== sha)
      errors.push(
        `${label} ${before.has(file) ? "changed" : "added"}: ${file}`,
      );
  for (const file of before.keys())
    if (!after.has(file)) errors.push(`${label} removed: ${file}`);
  if (recorded.hash !== actual.hash) errors.push(`${label} hash changed`);
  return errors;
}

export async function integrityErrors(
  feature,
  generation,
  { workspace = fromRoot(), surface, components } = {},
) {
  if (generation.integrity?.schemaVersion !== 1)
    return ["Generation integrity is missing; run prototype:record"];
  try {
    const actual = await generationIntegrity(feature, {
      workspace,
      surface,
      components,
    });
    const errors = [
      ...manifestErrors(
        generation.integrity.output,
        actual.output,
        "Generated output",
      ),
      ...manifestErrors(
        generation.integrity.dependencies,
        actual.dependencies,
        "Dependency",
      ),
    ];
    if (objectDigest(generation.integrity) !== objectDigest(actual))
      errors.push(
        "Generation revision changed; revalidate and record before approval",
      );
    return errors;
  } catch (error) {
    return ["Integrity resolution failed: " + error.message];
  }
}
