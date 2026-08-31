import { scanCollection } from './library.mjs';

const collectionIndex = process.argv.indexOf('--collection');
const collection = collectionIndex >= 0 ? process.argv[collectionIndex + 1] : null;
if (!collection) throw new Error('Usage: npm run library:query -- --collection assets/<type>/<collection>');
process.stdout.write(JSON.stringify(await scanCollection(collection), null, 2) + '\n');
