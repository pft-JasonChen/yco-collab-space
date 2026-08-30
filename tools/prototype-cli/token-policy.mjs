const definitionPattern = /(--[A-Za-z0-9_-]+)\s*:/g;
const referencePattern = /var\(\s*(--[A-Za-z0-9_-]+)/g;
const rawColourPattern =
  /#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/g;

export function extractTokenDefinitions(source) {
  return new Set(
    Array.from(source.matchAll(definitionPattern), (match) => match[1]),
  );
}

export function extractTokenReferences(source) {
  return new Set(
    Array.from(source.matchAll(referencePattern), (match) => match[1]),
  );
}

export function findRawColours(source) {
  return Array.from(source.matchAll(rawColourPattern), (match) => match[0]);
}
