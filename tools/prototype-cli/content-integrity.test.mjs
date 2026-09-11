import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parse, stringify } from "yaml";
import {
  generationIntegrity,
  integrityErrors,
  runtimeGraph,
  fileManifest,
  scriptReferences,
} from "./content-integrity.mjs";
import { fromRoot, hashFeatureInputs, sha256File } from "./project.mjs";
import { resolveSurfaceContext } from "./surface-policy.mjs";
import { buildSharedComponentProvenance } from "../design-library/component-provenance.mjs";
import { currentEvidence } from "../collab-space/stage-policy.mjs";

async function fixture(t) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "yco-integrity-"));
  t.after(() => fs.rm(workspace, { recursive: true, force: true }));
  const write = async (file, text) => {
    const target = path.join(workspace, file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, text);
  };
  await write(
    "features/demo/generated/feature.jsx",
    "import Button from '../../../platform/ui/button/index.js'; export default Button;",
  );
  await write(
    "platform/ui/button/index.js",
    "export { default } from './Button.jsx';",
  );
  await write(
    "platform/ui/button/Button.jsx",
    "import './Button.css'; export default function Button() { return <button />; }",
  );
  await write(
    "platform/ui/button/Button.css",
    "button { background: url('./icon.svg'); }",
  );
  await write("platform/ui/button/icon.svg", "<svg/>");
  await write("platform/tokens/tokens.lock.json", "{}");
  await write("platform/runtime/i18n.js", "export default {};");
  await write("package-lock.json", "{}");
  const contract = parse(
    await fs.readFile(
      fromRoot("design-library/components/button/component.yaml"),
      "utf8",
    ),
  );
  contract.implementation.compatibilityImportPaths = [];
  await write(
    "design-library/components/button/component.yaml",
    stringify(contract),
  );
  await write(
    "features/demo/product/surface-intent.yaml",
    stringify({
      strategy: "novel",
      temporary: true,
      primaryPack: null,
      borrowedPacks: [],
      layoutIntent: { zones: [], componentRoles: [], responsivePriority: [] },
    }),
  );
  await write("features/demo/design/design-gaps.yaml", "gaps: []");
  const surface = (await resolveSurfaceContext("demo", { workspace })).context;
  const components = await buildSharedComponentProvenance("demo", workspace);
  const generation = {
    inputHash: await hashFeatureInputs("demo", workspace),
    surface,
    components,
    resources: { requestedCollections: [], selected: [] },
    tokens: {
      lockPath: "platform/tokens/tokens.lock.json",
      lockSha256: await sha256File(
        path.join(workspace, "platform/tokens/tokens.lock.json"),
      ),
    },
  };
  generation.integrity = await generationIntegrity("demo", {
    workspace,
    surface,
    components,
  });
  await write(
    "features/demo/generated/generation.json",
    JSON.stringify(generation),
  );
  return { workspace, write, generation, surface, components };
}

const mutations = [
  [
    "generated JSX",
    "features/demo/generated/feature.jsx",
    "export default function Changed(){ return null; }",
  ],
  ["added output", "features/demo/generated/extra.css", "a{}"],
  [
    "indirect Button",
    "platform/ui/button/Button.jsx",
    "export default function Changed(){ return null; }",
  ],
  ["indirect CSS", "platform/ui/button/Button.css", "button { opacity: .5; }"],
  ["CSS asset", "platform/ui/button/icon.svg", "<svg><path/></svg>"],
  [
    "runtime adapter",
    "platform/runtime/i18n.js",
    "export default { changed: true };",
  ],
  ["package lock", "package-lock.json", '{"changed":true}'],
  ["token file", "platform/tokens/tokens.lock.json", '{"changed":true}'],
  ["missing output", "features/demo/generated/feature.jsx", null],
  ["missing transitive dependency", "platform/ui/button/Button.jsx", null],
];
for (const [name, file, replacement] of mutations)
  test("mutation killed at integrity AND approval gate: " + name, async (t) => {
    const f = await fixture(t);
    await currentEvidence("demo", f.workspace);
    if (replacement === null) await fs.unlink(path.join(f.workspace, file));
    else await f.write(file, replacement);
    assert.equal(
      await hashFeatureInputs("demo", f.workspace),
      f.generation.inputHash,
      "product inputs did not change",
    );
    assert.ok((await integrityErrors("demo", f.generation, f)).length);
    await assert.rejects(
      currentEvidence("demo", f.workspace),
      /stale generation evidence/,
    );
  });
for (const mutation of ["removed", "forged-hash", "omitted-file"])
  test("metadata mutation killed: " + mutation, async (t) => {
    const f = await fixture(t);
    if (mutation === "removed") delete f.generation.integrity;
    if (mutation === "forged-hash")
      f.generation.integrity.output.hash = "0".repeat(64);
    if (mutation === "omitted-file")
      f.generation.integrity.dependencies.files.pop();
    await f.write(
      "features/demo/generated/generation.json",
      JSON.stringify(f.generation),
    );
    await assert.rejects(
      currentEvidence("demo", f.workspace),
      /stale generation evidence/,
    );
  });
test("unchanged evidence and unrelated files are stable; manifest order is deterministic", async (t) => {
  const f = await fixture(t);
  const before = await currentEvidence("demo", f.workspace);
  await f.write("notes/unrelated.md", "Not a runtime or generation input");
  assert.equal(
    (await currentEvidence("demo", f.workspace)).evidenceHash,
    before.evidenceHash,
  );
  const files = ["platform/ui/button/index.js", "platform/ui/button/icon.svg"];
  assert.deepEqual(
    await fileManifest(files, f.workspace),
    await fileManifest(files.reverse(), f.workspace),
  );
});
test("literal dynamic imports, re-exports and CSS assets form a recursive graph", async (t) => {
  const f = await fixture(t);
  await f.write(
    "features/demo/generated/feature.jsx",
    "export const load = () => import('../../../platform/ui/button/index.js');",
  );
  const graph = await runtimeGraph(
    ["features/demo/generated/feature.jsx"],
    f.workspace,
  );
  assert.ok(graph.files.some((f) => f.path.endsWith("icon.svg")));
  assert.throws(() => scriptReferences("import(name)"), /non-static/);
  assert.throws(
    () => scriptReferences('import.meta.glob("./*.js")'),
    /explicit generated dependency manifest/,
  );
});

test('multiple CSS imports and missing package locks cannot silently omit dependencies', async (t) => {
  const f = await fixture(t);
  await f.write('platform/ui/button/Button.css', '@import "./a.css", "./b.css";');
  await f.write('platform/ui/button/a.css', 'a{}');
  await f.write('platform/ui/button/b.css', 'b{}');
  const graph = await runtimeGraph(['features/demo/generated/feature.jsx'], f.workspace);
  assert.ok(graph.files.some((file) => file.path.endsWith('/b.css')));
  await f.write('features/demo/generated/feature.jsx', "import x from 'unlocked-package'; export default x;");
  await assert.rejects(runtimeGraph(['features/demo/generated/feature.jsx'], f.workspace), /not integrity-pinned/);
});
test("recursive composed packs invalidate evidence and cycles/missing versions fail closed", async (t) => {
  const f = await fixture(t);
  const ids = ["workspace/demo", "pattern/parent", "pattern/child"];
  await f.write(
    "platform/surfaces/catalog.yaml",
    stringify({
      entries: ids.map((id, i) => ({
        id,
        kind: i ? "module" : "surface",
        status: "provisional",
      })),
    }),
  );
  for (const [i, id] of ids.entries()) {
    const root = `platform/surfaces/${id}/2026-09/`;
    await f.write(
      root + "surface.yaml",
      stringify({
        id,
        version: "2026-09",
        kind: i ? "module" : "surface",
        status: "provisional",
        zones: [],
        responsivePriority: [],
      }),
    );
    await f.write(
      root + "component-slots.yaml",
      stringify({
        slots: [],
        composes: i < 2 ? [ids[i + 1] + "@2026-09"] : [],
      }),
    );
    await f.write(root + "evaluation.yaml", "{}");
    await f.write(root + "layout-rules.md", "layout");
    await f.write(root + "provenance.json", "{}");
  }
  await f.write(
    "features/demo/product/surface-intent.yaml",
    stringify({
      strategy: "reuse",
      temporary: true,
      primaryPack: { id: ids[0], version: "2026-09" },
      borrowedPacks: [],
      layoutIntent: { zones: [], componentRoles: [], responsivePriority: [] },
    }),
  );
  const before = await resolveSurfaceContext("demo", f);
  assert.deepEqual(before.errors, []);
  assert.equal(before.context.dependencyPacks.length, 3);
  f.generation.inputHash = await hashFeatureInputs('demo', f.workspace);
  f.generation.surface = before.context;
  f.generation.integrity = await generationIntegrity('demo', { ...f, surface: before.context });
  await f.write('features/demo/generated/generation.json', JSON.stringify(f.generation));
  await currentEvidence('demo', f.workspace);
  await f.write(
    "platform/surfaces/pattern/child/2026-09/layout-rules.md",
    "mutated grandchild",
  );
  assert.notEqual(
    (await resolveSurfaceContext("demo", f)).context.contextHash,
    before.context.contextHash,
  );
  await assert.rejects(currentEvidence('demo', f.workspace), /stale generation evidence/);
  await f.write(
    "platform/surfaces/pattern/child/2026-09/component-slots.yaml",
    "slots: []\ncomposes: [pattern/parent@2026-09]",
  );
  assert.match(
    (await resolveSurfaceContext("demo", f)).errors.join("\n"),
    /cycle/i,
  );
  await f.write(
    "platform/surfaces/pattern/child/2026-09/component-slots.yaml",
    "slots: []\ncomposes: [pattern/parent@2099-01]",
  );
  assert.match(
    (await resolveSurfaceContext("demo", f)).errors.join("\n"),
    /version does not exist/,
  );
});
