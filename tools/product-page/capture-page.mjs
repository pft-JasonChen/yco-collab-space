import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fromRoot } from './project.mjs';

function flag(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const url = flag('--url');
const to = flag('--to');
if (!url || !to) throw new Error('Usage: npm run library:product:capture -- --url <https://…> --to <products|competitors>/<slug>/pages/<name>.md');
if (!/^https:\/\//.test(url)) throw new Error('Only https URLs are captured.');
const target = fromRoot('product-library', to);
if (!target.startsWith(fromRoot('product-library') + path.sep) || !to.endsWith('.md')) throw new Error('Target must be a .md file inside product-library/.');

const response = await fetch(url, { headers: { 'user-agent': 'yco-collab-space capture (PM research)' } });
if (!response.ok) throw new Error('Fetch failed: HTTP ' + response.status);
const html = await response.text();

function decode(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
const cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
const title = decode(cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
const description = decode(cleaned.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? '');
const lines = ['# ' + (title || url), '', '- Source: ' + url, '- Captured: ' + new Date().toISOString(), '- Meta description: ' + (description || '(none)'), ''];
const blockPattern = /<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
for (const match of cleaned.matchAll(blockPattern)) {
  const tag = match[1].toLowerCase();
  const text = decode(match[2].replace(/<[^>]+>/g, ' '));
  if (!text) continue;
  if (tag.startsWith('h')) lines.push('', '#'.repeat(Math.min(Number(tag[1]) + 1, 6)) + ' ' + text, '');
  else if (tag === 'li') lines.push('- ' + text);
  else lines.push(text, '');
}
await fs.mkdir(path.dirname(target), { recursive: true });
await fs.writeFile(target, lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n');
process.stdout.write('[capture] WROTE product-library/' + to + ' (' + lines.length + ' lines). Record it in the matching product.yaml/competitor.yaml pages[] entry.\n');
