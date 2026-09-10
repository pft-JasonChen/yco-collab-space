import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { fromRoot, pathExists } from "../prototype-cli/project.mjs";

const safeId = /^[a-z0-9-]+\/[a-z0-9-]+$/;
const safeVersion = /^[a-z0-9-]+$/;
const read = async (file) => parse(await fs.readFile(file, "utf8"));

// Explicit namespaces prevent a zone and a slot with the same id overwriting one
// another. These are current implementations, not replacements for the contracts.
export function bindingErrors(binding, manifest, slots, components) {
  const errors = [];
  if (
    !binding ||
    binding.schemaVersion !== 1 ||
    binding.pack !== manifest.id ||
    binding.version !== manifest.version
  ) {
    return ["Missing or invalid binding identity"];
  }
  for (const namespace of ["zones", "slots"]) {
    const rows = namespace === "zones" ? manifest.zones : slots.slots;
    const assignments = binding[namespace] ?? {};
    for (const row of rows ?? []) {
      if (row.required && !assignments[row.id])
        errors.push(`Missing required ${namespace}.${row.id}`);
    }
    for (const [id, target] of Object.entries(assignments)) {
      if (!(rows ?? []).some((row) => row.id === id))
        errors.push(`Unknown ${namespace}.${id}`);
      const modes = ["component", "unimplemented"].filter(
        (key) => target?.[key],
      );
      if (modes.length !== 1)
        errors.push(
          `${namespace}.${id} needs exactly one component or unimplemented reason`,
        );
      if (target?.component && !components.has(target.component))
        errors.push(`Unknown component ${target.component}`);
      if (
        target?.unimplemented &&
        (typeof target.unimplemented !== "string" ||
          !target.unimplemented.trim())
      )
        errors.push(`Invalid reason for ${namespace}.${id}`);
    }
  }
  if (binding.preview) {
    if (
      ![
        "tool-page",
        "tool-video",
        "uploaded-media",
        "action-footer",
        "video-results",
        "history-list",
        "detail-modal",
      ].includes(binding.preview.recipe)
    )
      errors.push("Unknown preview recipe");
    for (const [name, target] of Object.entries(
      binding.preview.components ?? {},
    )) {
      if (!components.has(target.component))
        errors.push(`Preview ${name}: unknown component ${target.component}`);
      if (!/^(default|[A-Za-z][A-Za-z0-9]*)$/.test(target.export ?? "default"))
        errors.push(`Preview ${name}: invalid export`);
    }
    const required = {
      "tool-page": [
        "Shell",
        "Layout",
        "Upload",
        "Action",
        "Results",
        "History",
        "Dialog",
      ],
      "tool-video": [
        "Shell",
        "Layout",
        "Upload",
        "Action",
        "Results",
        "History",
        "Dialog",
      ],
      "uploaded-media": ["Upload"],
      "action-footer": ["Action"],
      "video-results": ["Results", "History"],
      "history-list": ["History"],
      "detail-modal": ["Dialog"],
    };
    for (const key of required[binding.preview.recipe] ?? [])
      if (!binding.preview.components?.[key])
        errors.push(`Preview recipe requires ${key}`);
  }
  return errors;
}

export async function collectSurfaceVersions(
  workspace = fromRoot(),
  { requireBindings = true } = {},
) {
  const root = path.join(workspace, "platform/surfaces");
  const catalog = await read(path.join(root, "catalog.yaml"));
  const components = new Map();
  for (const dir of await fs.readdir(
    path.join(workspace, "design-library/components"),
    { withFileTypes: true },
  )) {
    if (!dir.isDirectory()) continue;
    const contract = await read(
      path.join(
        workspace,
        "design-library/components",
        dir.name,
        "component.yaml",
      ),
    );
    components.set(contract.id, contract.implementation.importPath);
  }
  const errors = [];
  const versions = [];
  for (const entry of catalog.entries) {
    if (!safeId.test(entry.id)) {
      errors.push(`Invalid surface id: ${entry.id}`);
      continue;
    }
    const dir = path.join(root, entry.id);
    if (!(await pathExists(dir))) continue;
    for (const version of await fs.readdir(dir, { withFileTypes: true })) {
      if (!version.isDirectory() || !safeVersion.test(version.name)) continue;
      const packRoot = path.join(dir, version.name);
      if (!(await pathExists(path.join(packRoot, "surface.yaml")))) continue;
      const manifest = await read(path.join(packRoot, "surface.yaml"));
      const slots = await read(path.join(packRoot, "component-slots.yaml"));
      const file = path.join(packRoot, "bindings.yaml");
      const bindings = (await pathExists(file)) ? await read(file) : null;
      const key = `${entry.id}@${version.name}`;
      if (
        manifest.id !== entry.id ||
        manifest.version !== version.name ||
        slots.pack !== entry.id ||
        slots.version !== version.name
      )
        errors.push(
          `${key}: manifest/slot identity differs from its directory`,
        );
      if (bindings || requireBindings)
        errors.push(
          ...bindingErrors(bindings, manifest, slots, components).map(
            (e) => `${key}: ${e}`,
          ),
        );
      const composes = slots.composes ?? [];
      if (!Array.isArray(composes))
        errors.push(`${key}: composes must be an array`);
      else if (new Set(composes).size !== composes.length)
        errors.push(`${key}: duplicate composed pattern`);
      versions.push({
        key,
        manifest,
        slots,
        bindings,
        composes: Array.isArray(composes) ? composes : [],
        layoutRules: await fs.readFile(
          path.join(packRoot, "layout-rules.md"),
          "utf8",
        ),
      });
    }
  }
  const keys = new Set(versions.map((v) => v.key));
  const graph = new Map(versions.map((v) => [v.key, v.composes]));
  for (const v of versions) {
    for (const ref of v.composes) {
      if (
        typeof ref !== "string" ||
        !ref.startsWith("pattern/") ||
        !keys.has(ref)
      )
        errors.push(`${v.key}: unknown composed pattern version ${ref}`);
    }
    const visit = (key, chain) => {
      if (chain.includes(key)) {
        errors.push(`Composition cycle: ${[...chain, key].join(" -> ")}`);
        return;
      }
      for (const next of graph.get(key) ?? []) visit(next, [...chain, key]);
    };
    visit(v.key, []);
  }
  for (const [id, file] of components)
    if (!(await pathExists(path.join(workspace, file))))
      errors.push(`Missing implementation ${id}: ${file}`);
  return { catalog, components, versions, errors: [...new Set(errors)] };
}

// Public preview gets a deliberate projection. Never bundle the full contracts,
// provenance, RD files, Figma references or feature input manifests.
export async function publicSurfaceIndex(workspace = fromRoot()) {
  const result = await collectSurfaceVersions(workspace);
  if (result.errors.length) throw new Error(result.errors.join("\n"));
  const usages = [];
  for (const name of await fs.readdir(path.join(workspace, "features"))) {
    if (name.startsWith("_")) continue;
    const file = path.join(
      workspace,
      "features",
      name,
      "product/surface-intent.yaml",
    );
    if (!(await pathExists(file))) continue;
    const intent = await read(file);
    for (const [relationship, refs] of [
      ["primary", [intent.primaryPack]],
      ["borrowed", intent.borrowedPacks ?? []],
    ]) {
      for (const ref of refs.filter(Boolean))
        usages.push({
          key: `${ref.id}@${ref.version}`,
          feature: name,
          relationship,
          roles: ref.roles ?? [],
        });
    }
  }
  return {
    entries: result.catalog.entries.map(
      ({ id, kind, status, defaultVersion }) => ({
        id,
        kind,
        status,
        defaultVersion: defaultVersion ?? null,
      }),
    ),
    versions: result.versions.map(
      ({ key, manifest, slots, bindings, composes, layoutRules }) => ({
        key,
        id: manifest.id,
        version: manifest.version,
        status: manifest.status,
        shell: manifest.shell,
        zones: manifest.zones,
        slots: slots.slots,
        bindings,
        composes,
        layoutRules,
        adopters: usages.filter((usage) => usage.key === key),
        composedBy: result.versions
          .filter((v) => v.composes.includes(key))
          .map((v) => v.key),
      }),
    ),
    components: Object.fromEntries(result.components),
  };
}
