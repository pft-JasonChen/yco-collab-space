import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { parse, stringify } from "yaml";
import { fromRoot } from "../prototype-cli/project.mjs";
import { checkRdParity } from "./rd-parity.mjs";

test("reference removes only its parity promise; verbatim drift and leftover pairs still fail", async () => {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "rd-portability-"));
  const write = async (file, value) => {
    const absolute = path.join(workspace, file);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, value);
  };
  try {
    const contract = parse(
      await fs.readFile(
        fromRoot("design-library/components/button/component.yaml"),
        "utf8",
      ),
    );
    const original = ".button { display: flex; }\n";
    contract.assets = [];
    contract.rd = {
      sourcePackage: "fixture",
      sourceVersion: "1",
      snapshot: "fixture",
      portability: "verbatim",
      sourcePaths: ["button.css"],
      sourceHashes: [
        {
          path: "button.css",
          sha256: createHash("sha256").update(original).digest("hex"),
        },
      ],
      verbatimFiles: [
        {
          implementation: "platform/ui/button/Button.module.css",
          baseline: "button.css",
        },
      ],
    };
    const save = () =>
      write(
        "design-library/components/button/component.yaml",
        stringify(contract),
      );
    await write(
      "platform/ui/button/index.js",
      "export default function Button() {}",
    );
    await write("platform/ui/button/Button.module.css", original);
    await write("platform/rd-baseline/fixture/button.css", original);
    await save();
    assert.deepEqual((await checkRdParity({ workspace })).errors, []);
    await write(
      "platform/ui/button/Button.module.css",
      original + ".button:disabled { opacity: 1; }",
    );
    assert.match(
      (await checkRdParity({ workspace })).errors.join("\n"),
      /verbatim file drifted/,
    );
    contract.rd.portability = "reference";
    await save();
    assert.match(
      (await checkRdParity({ workspace })).errors.join("\n"),
      /only allowed when portability/,
    );
    delete contract.rd.verbatimFiles;
    await save();
    assert.deepEqual((await checkRdParity({ workspace })).errors, []);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});
