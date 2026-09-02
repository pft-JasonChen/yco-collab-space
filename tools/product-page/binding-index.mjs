import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot } from './project.mjs';
import { loadRegistry } from './registry-policy.mjs';
import { loadPatterns, patternTokens } from './pattern-policy.mjs';

const registry = await loadRegistry();
const { patterns } = await loadPatterns();

function flattenFields(fields, components, prefix = '') {
  const rows = [];
  for (const [name, field] of Object.entries(fields ?? {})) {
    const fieldPath = prefix + name + (field.repeatable ? '[]' : '');
    const row = { path: fieldPath, type: field.type, required: Boolean(field.required), role: field.role ?? null };
    if (field.values) row.values = field.values;
    if (field.maxLength) row.maxLength = field.maxLength;
    if (field.html) row.html = true;
    rows.push(row);
    if (field.type === 'component') {
      const nested = field.component === 'inline' ? field.fields : components.get(field.component)?.fields;
      rows.push(...flattenFields(nested, components, fieldPath + '.'));
    }
  }
  return rows;
}

const index = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  contentType: { uid: registry.registry.contentType.uid, apiPath: registry.registry.contentType.apiPath },
  bindings: [...patterns.values()].map((pattern) => {
    const component = registry.components.get(pattern.strapiComponent);
    return {
      pattern: pattern.id,
      status: pattern.status,
      contentRole: pattern.contentRole,
      surfaceZone: pattern.surfaceZone,
      strapiComponent: pattern.strapiComponent,
      dynamicZone: Boolean(component?.dynamicZone),
      layoutOptions: pattern.layoutOptions,
      fieldDefaults: pattern.fieldDefaults,
      copyLimits: pattern.copy,
      mediaSlots: pattern.media,
      tokens: patternTokens(pattern),
      fields: component ? flattenFields(component.fields, registry.components) : [],
    };
  }),
  sharedAssets: registry.sharedAssets.assets,
};
const cachePath = fromRoot('.collab-cache', 'strapi-registry-index.json');
await fs.mkdir(path.dirname(cachePath), { recursive: true });
await fs.writeFile(cachePath, JSON.stringify(index, null, 2) + '\n');
process.stdout.write('[binding] WROTE .collab-cache/strapi-registry-index.json (' + index.bindings.length + ' pattern ↔ component bindings)\n');
for (const binding of index.bindings) {
  process.stdout.write('  ' + binding.pattern.padEnd(24) + ' → ' + binding.strapiComponent.padEnd(32) + ' role=' + binding.contentRole + ' tokens=' + binding.tokens.length + '\n');
}
