import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  fromRoot,
  pathExists,
  readYaml,
  walkFiles,
} from './project.mjs';

export function surfacePackRelativeRoot(reference) {
  return path.join('platform', 'surfaces', ...reference.id.split('/'), reference.version);
}

export function novelSurfaceContext(intent) {
  const context = {
    strategy: 'novel',
    temporary: intent.temporary,
    primaryPack: null,
    borrowedPacks: [],
    requiredZones: [...intent.layoutIntent.zones],
    requiredComponentRoles: [...intent.layoutIntent.componentRoles],
    responsivePriority: [...intent.layoutIntent.responsivePriority],
    visualReview: 'human-required',
  };

  return {
    ...context,
    contextHash: createHash('sha256')
      .update(JSON.stringify(context))
      .digest('hex'),
    sourceFiles: [],
  };
}

async function hashFiles(files, root) {
  const hash = createHash('sha256');

  for (const file of files) {
    const relativePath = path.relative(root, file).split(path.sep).join('/');
    hash.update(relativePath);
    hash.update('\0');
    hash.update(await fs.readFile(file));
    hash.update('\0');
  }

  return hash.digest('hex');
}

async function resolvePack(reference, catalog, expectedKind = null) {
  const errors = [];
  const entry = catalog.entries.find((item) => item.id === reference.id);

  if (!entry) {
    return {
      errors: ['Surface Pack is not listed in catalog: ' + reference.id],
      pack: null,
    };
  }

  if (entry.status === 'planned') {
    return {
      errors: ['Surface Pack is planned but not implemented: ' + reference.id],
      pack: null,
    };
  }

  if (expectedKind && entry.kind !== expectedKind) {
    errors.push(
      'Primary Surface Pack must have kind ' +
        expectedKind +
        ': ' +
        reference.id,
    );
  }

  const relativeRoot = surfacePackRelativeRoot(reference);
  const absoluteRoot = fromRoot(relativeRoot);

  if (!(await pathExists(absoluteRoot))) {
    errors.push(
      'Surface Pack version does not exist: ' +
        reference.id +
        '@' +
        reference.version,
    );
    return { errors, pack: null };
  }

  const requiredFiles = [
    'surface.yaml',
    'component-slots.yaml',
    'evaluation.yaml',
    'layout-rules.md',
    'provenance.json',
  ];

  for (const requiredFile of requiredFiles) {
    if (!(await pathExists(path.join(absoluteRoot, requiredFile)))) {
      errors.push(
        'Surface Pack is missing ' + requiredFile + ': ' + reference.id,
      );
    }
  }

  if (errors.length > 0) {
    return { errors, pack: null };
  }

  const manifest = await readYaml(path.join(relativeRoot, 'surface.yaml'));
  const slots = await readYaml(path.join(relativeRoot, 'component-slots.yaml'));
  const evaluation = await readYaml(path.join(relativeRoot, 'evaluation.yaml'));

  if (manifest.id !== reference.id || manifest.version !== reference.version) {
    errors.push(
      'Surface Pack manifest identity does not match reference: ' + reference.id,
    );
  }

  if (manifest.kind !== entry.kind) {
    errors.push('Surface Pack kind does not match catalog: ' + reference.id);
  }

  const files = await walkFiles(absoluteRoot);
  const sourceFiles = files.map((file) =>
    path.relative(fromRoot(), file).split(path.sep).join('/'),
  );

  return {
    errors,
    pack: {
      id: manifest.id,
      version: manifest.version,
      kind: manifest.kind,
      status: manifest.status,
      shell: manifest.shell,
      zones: manifest.zones,
      responsivePriority: manifest.responsivePriority,
      componentSlots: slots.slots,
      evaluation,
      packHash: await hashFiles(files, absoluteRoot),
      sourceFiles,
    },
  };
}

export async function resolveSurfaceContextFromIntent(intent) {
  if (intent.strategy === 'novel') {
    return { errors: [], context: novelSurfaceContext(intent) };
  }

  const catalog = await readYaml('platform/surfaces/catalog.yaml');
  const errors = [];
  const primaryResult = await resolvePack(intent.primaryPack, catalog, 'surface');
  errors.push(...primaryResult.errors);
  const borrowedResults = [];

  for (const borrowedReference of intent.borrowedPacks) {
    const result = await resolvePack(borrowedReference, catalog);
    errors.push(...result.errors);

    if (result.pack) {
      const supportedRoles = new Set(
        result.pack.componentSlots.map((slot) => slot.id),
      );

      for (const role of borrowedReference.roles) {
        if (!supportedRoles.has(role)) {
          errors.push(
            'Borrowed role ' +
              role +
              ' is not declared by Surface Pack ' +
              borrowedReference.id,
          );
        }
      }

      borrowedResults.push({
        ...result.pack,
        roles: borrowedReference.roles,
      });
    }
  }

  if (errors.length > 0 || !primaryResult.pack) {
    return { errors, context: null };
  }

  const requiredZones = new Set(intent.layoutIntent.zones);
  const requiredComponentRoles = new Set(intent.layoutIntent.componentRoles);

  for (const zone of primaryResult.pack.zones) {
    if (zone.required) {
      requiredZones.add(zone.id);
    }
  }

  for (const slot of primaryResult.pack.componentSlots) {
    if (slot.required) {
      requiredComponentRoles.add(slot.id);
    }
  }

  for (const borrowedPack of borrowedResults) {
    for (const role of borrowedPack.roles) {
      requiredComponentRoles.add(role);
    }
  }

  const packs = [primaryResult.pack, ...borrowedResults];
  const context = {
    strategy: intent.strategy,
    temporary: intent.temporary,
    primaryPack: {
      id: primaryResult.pack.id,
      version: primaryResult.pack.version,
      packHash: primaryResult.pack.packHash,
    },
    borrowedPacks: borrowedResults.map((pack) => ({
      id: pack.id,
      version: pack.version,
      roles: pack.roles,
      packHash: pack.packHash,
    })),
    requiredZones: [...requiredZones].sort(),
    requiredComponentRoles: [...requiredComponentRoles].sort(),
    responsivePriority: [
      ...primaryResult.pack.responsivePriority,
      ...intent.layoutIntent.responsivePriority,
    ],
    visualReview: packs.every(
      (pack) => pack.evaluation.visualReview?.status === 'reference-ready',
    )
      ? 'reference-ready'
      : 'human-required',
  };

  return {
    errors: [],
    context: {
      ...context,
      contextHash: createHash('sha256')
        .update(JSON.stringify(context))
        .digest('hex'),
      sourceFiles: packs.flatMap((pack) => pack.sourceFiles).sort(),
    },
  };
}

export async function resolveSurfaceContext(feature) {
  const intent = await readYaml(
    path.join('features', feature, 'product', 'surface-intent.yaml'),
  );
  return resolveSurfaceContextFromIntent(intent);
}

