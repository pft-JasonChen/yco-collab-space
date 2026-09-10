import test from "node:test";
import assert from "node:assert/strict";
import {
  bindingErrors,
  collectSurfaceVersions,
  publicSurfaceIndex,
} from "./surface-bindings.mjs";

const manifest = {
  id: "pattern/demo",
  version: "2026-09",
  zones: [{ id: "body", required: true }],
};
const slots = { slots: [{ id: "body", required: true }] };
const components = new Map([["button", "platform/ui/button/index.js"]]);
const binding = () => ({
  schemaVersion: 1,
  pack: manifest.id,
  version: manifest.version,
  zones: { body: { component: "button" } },
  slots: { body: { unimplemented: "Feature content" } },
});

test("same-name zones and slots remain independent and required coverage is enforced", () => {
  assert.deepEqual(bindingErrors(binding(), manifest, slots, components), []);
  const mutated = binding();
  delete mutated.slots.body;
  assert.match(
    bindingErrors(mutated, manifest, slots, components).join("\n"),
    /Missing required slots.body/,
  );
});
test("unknown ids, missing components and ambiguous resolutions fail", () => {
  const mutated = binding();
  mutated.zones.body.component = "not-a-component";
  mutated.slots.ghost = { component: "button", unimplemented: "ambiguous" };
  const errors = bindingErrors(mutated, manifest, slots, components).join("\n");
  assert.match(errors, /Unknown component/);
  assert.match(errors, /Unknown slots.ghost/);
  assert.match(errors, /exactly one/);
});
test("all catalog versions have valid bindings and composed pattern versions", async () => {
  const result = await collectSurfaceVersions();
  assert.deepEqual(result.errors, []);
  assert.equal(result.versions.length, 11);
  assert.equal(result.versions.filter((v) => v.bindings.preview).length, 7);
});
test("public index respects adoption versions and excludes private provenance", async () => {
  const index = await publicSurfaceIndex();
  const oldVideo = index.versions.find(
    (v) => v.key === "workspace/tool-video@2026-08",
  );
  assert.equal(oldVideo.adopters.length, 0);
  assert.equal(
    index.versions.find((v) => v.key === "workspace/tool-video@2026-09")
      .adopters[0].feature,
    "video-expansion",
  );
  assert.equal(
    index.versions.find((v) => v.id === "pattern/video-results").composedBy
      .length,
    1,
  );
  const source = JSON.stringify(index);
  for (const marker of [
    "sourceHashes",
    "decisionBasis",
    "fileKey",
    "rd-baseline",
    "payload-samples",
  ])
    assert.ok(!source.includes(marker), marker);
});
