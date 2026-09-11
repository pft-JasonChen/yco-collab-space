import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  inventory,
  publicIntake,
  candidateGroup,
  isAiVideoCandidate,
} from "./intake-inventory.mjs";

test("inventory is reproducible and does not read hidden credentials or copy raw source", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "yco-intake-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "src/pages/video"), { recursive: true });
  await fs.writeFile(
    path.join(root, "src/pages/video/index.js"),
    "import x from 'next/router'; export default x;",
  );
  await fs.writeFile(path.join(root, "src/.env.json"), "MUST_NOT_APPEAR");
  await fs.writeFile(
    path.join(root, "src/credentials.json"),
    "MUST_NOT_APPEAR",
  );
  await fs.writeFile(path.join(root, "src/private-key.js"), "MUST_NOT_APPEAR");
  const first = await inventory(root);
  assert.equal(first.files.length, 1);
  assert.deepEqual(first, await inventory(root));
  assert.equal(
    first.candidates[0].definitionStatus,
    "pending-human-definition",
  );
  assert.equal(JSON.stringify(first).includes("MUST_NOT_APPEAR"), false);
  const projection = publicIntake(first, { id: "ai-video" });
  assert.equal(JSON.stringify(projection).includes("next/router"), false);
  assert.equal(JSON.stringify(projection).includes("sha256"), false);
  assert.equal(JSON.stringify(projection).includes(root), false);
  await fs.appendFile(
    path.join(root, "src/pages/video/index.js"),
    "\n// changed",
  );
  assert.notEqual((await inventory(root)).inventoryHash, first.inventoryHash);
});
test("localized routes share a candidate; common UI and support code are not auto-promoted to patterns", () => {
  assert.equal(isAiVideoCandidate('src/pages/old-photo-restoration'), false);
  assert.equal(isAiVideoCandidate('src/components/common/ratio'), true);
  assert.deepEqual(
    candidateGroup("src/pages/[locale]/video/index.js"),
    candidateGroup("src/pages/video/index.js"),
  );
  assert.equal(
    candidateGroup("src/components/common/button/index.js").suggestion,
    "component",
  );
  assert.equal(
    candidateGroup("src/store/actions/video.js").suggestion,
    "supporting-code",
  );
});
