import path from 'node:path';
import { fromRoot } from '../prototype-cli/project.mjs';
import { scanCollection, scanLibrary, writeLibraryIndex } from './library.mjs';

const collectionIndex = process.argv.indexOf('--collection');
const collection = collectionIndex >= 0 ? process.argv[collectionIndex + 1] : null;
const index = collection
  ? { schemaVersion: 1, generatedAt: new Date().toISOString(), collections: [await scanCollection(collection)], warnings: [] }
  : await scanLibrary();
const cachePath = await writeLibraryIndex(index);
process.stdout.write(
  '[design-library] INDEXED ' + index.collections.length + ' collections → ' + path.relative(fromRoot(), cachePath) + '\n',
);
