import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fromRoot } from "../prototype-cli/project.mjs";
import {
  digest,
  objectDigest,
  scriptReferences,
} from "../prototype-cli/content-integrity.mjs";

const code = /\.(?:[cm]?js|jsx|tsx?|css|scss|sass|json)$/i;
export const isAiVideoCandidate = (root) => /video|(?:^|[/_-])(?:history|upload|ratio)(?:[/_-]|$)/i.test(root);
const forbidden =
  /^(?:\.|node_modules$|dist$|build$)|(?:credential|secret|certificate|private[-_]?key)/i;
export function candidateGroup(file) {
  const parts = file.split("/");
  if (parts[1] === "pages")
    return {
      root: parts
        .slice(0, -1)
        .filter((p) => p !== "[locale]")
        .join("/"),
      suggestion: "surface",
    };
  if (parts[1] === "components") {
    const count = parts[2] === "result-page" && parts[3] === "common" ? 5 : 4;
    return {
      root: parts.slice(0, Math.min(count, parts.length - 1)).join("/"),
      suggestion: parts[2] === "common" ? "component" : "module",
    };
  }
  return {
    root: parts.slice(0, Math.min(3, parts.length - 1)).join("/"),
    suggestion: "supporting-code",
  };
}
export async function inventory(sourceRoot) {
  const files = [];
  async function visit(relative) {
    for (const entry of (
      await fs.readdir(path.join(sourceRoot, relative), { withFileTypes: true })
    ).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      if (entry.isSymbolicLink() || forbidden.test(entry.name)) continue;
      const file = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile() && code.test(entry.name)) {
        const bytes = await fs.readFile(path.join(sourceRoot, file));
        const text = bytes.toString("utf8");
        let imports = [],
          unresolved = false;
        if (/\.[cm]?[jt]sx?$/.test(file)) {
          try {
            imports = scriptReferences(text, file);
          } catch {
            unresolved = true;
          }
        }
        // Signals are triage hints, never a claim of a complete production graph.
        const signals = Object.entries({
          network: /\bfetch\s*\(|axios|Dao\b|dao\//,
          auth: /useSession|auth|login|signIn/i,
          payment: /payment|checkout|stripe|purchase/i,
          state: /redux|useSelector|useDispatch/,
          framework: /next\//,
          worker: /Worker\(|\.worker|wasm/,
          i18n: /useTranslations|useIntl|i18n/,
        })
          .filter(([, pattern]) => pattern.test(text))
          .map(([name]) => name);
        files.push({
          path: file,
          sha256: digest(bytes),
          bytes: bytes.length,
          imports,
          unresolved,
          signals,
        });
      }
    }
  }
  await visit("src");
  files.sort((a, b) => a.path.localeCompare(b.path, "en"));
  const groups = new Map();
  for (const file of files) {
    const { root, suggestion } = candidateGroup(file.path);
    const group = groups.get(root) ?? {
      id: "rd-" + digest(root).slice(0, 16),
      root,
      suggestion,
      definitionStatus: "pending-human-definition",
      suggestedBy: "static-path-heuristic",
      files: [],
      signals: [],
      unresolvedFiles: 0,
      pilot: isAiVideoCandidate(root)
        ? "ai-video-review-candidate"
        : null,
    };
    group.files.push(file.path);
    group.signals.push(...file.signals);
    group.unresolvedFiles += Number(file.unresolved);
    groups.set(root, group);
  }
  const candidates = [...groups.values()]
    .map((g) => ({ ...g, signals: [...new Set(g.signals)].sort() }))
    .sort((a, b) => a.root.localeCompare(b.root, "en"));
  return {
    schemaVersion: 1,
    snapshot: path.basename(path.resolve(sourceRoot)),
    scope: "src source and data files; no executable source copied",
    exclusions: [
      "hidden files/directories",
      "credentials/certificates/keys",
      "dependencies/build outputs",
      "binary media",
      "files outside src",
      "symbolic links",
    ],
    inventoryHash: objectDigest(files),
    files,
    candidates,
  };
}

// Public UI sees aggregate candidates only, never source content/import strings or local paths.
export function publicIntake(data, pilot) {
  return {
    snapshot: data.snapshot,
    fileCount: data.files.length,
    candidates: data.candidates.map(
      ({
        id,
        root,
        suggestion,
        definitionStatus,
        files,
        signals,
        unresolvedFiles,
        pilot,
      }) => ({
        id,
        root,
        suggestion,
        definitionStatus,
        fileCount: files.length,
        signals,
        unresolvedFiles,
        pilot,
      }),
    ),
    pilot,
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const at = process.argv.indexOf("--source");
  if (at < 0 || !process.argv[at + 1])
    throw new Error(
      "Usage: node tools/migration/intake-inventory.mjs --source <RD snapshot directory>",
    );
  const result = await inventory(path.resolve(process.argv[at + 1]));
  await fs.writeFile(
    fromRoot("migration/rd-intake-inventory.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(
    `[rd-intake] ${result.files.length} source/data files; ${result.candidates.length} pending candidates; hash ${result.inventoryHash}`,
  );
}
