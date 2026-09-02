import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromRoot, readJson } from '../prototype-cli/project.mjs';
import { assetTypes, scanLibrary } from './library.mjs';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function assetUrl(repositoryPath) {
  return '/asset/' + repositoryPath.split('/').map(encodeURIComponent).join('/');
}

function preview(file) {
  const url = assetUrl(file.repositoryPath);
  if (file.mediaKind === 'video') return '<video controls muted preload="metadata" src="' + url + '"></video>';
  if (file.mediaKind === 'image' || file.mediaKind === 'vector') return '<img loading="lazy" src="' + url + '" alt="">';
  if (file.mediaKind === 'font') return '<div class="font-file" aria-label="Font asset">Aa</div>';
  return '<div class="file-only" aria-hidden="true">FILE</div>';
}

export function renderLibraryHtml(index) {
  const groups = assetTypes.map((type) => {
    const collections = index.collections.filter((item) => item.type === type);
    const cards = collections.length
      ? collections.map((collection) => '<article><h3>' + escapeHtml(collection.reference) + '</h3><p>' + collection.files.length + ' files · copy this collection path into the feature request</p><div class="files">' + collection.files.map((file) => '<figure>' + preview(file) + '<figcaption>' + escapeHtml(file.path.split('/').pop()) + '</figcaption></figure>').join('') + '</div></article>').join('')
      : '<p class="empty">No collection uploaded yet.</p>';
    return '<section data-asset-type="' + type + '"><h2>' + type + '</h2>' + cards + '</section>';
  }).join('');
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YCO Design Library</title><style>:root{font-family:Inter,system-ui,sans-serif;color:#202124;background:#f6f7f9}body{max-width:1200px;margin:auto;padding:32px}header{margin-bottom:32px}h1{margin-bottom:8px}section{margin:28px 0}article{background:white;border:1px solid #dfe3e8;border-radius:12px;padding:20px;margin:12px 0}.files{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}figure{margin:0;background:#f6f7f9;border-radius:8px;overflow:hidden}img,video,.font-file,.file-only{display:flex;width:100%;height:140px;object-fit:contain;align-items:center;justify-content:center}.font-file{font-size:44px;font-weight:700}.file-only{font-size:12px;letter-spacing:.08em}figcaption{padding:8px;font-size:12px;word-break:break-word}.empty{color:#6b7280}</style></head><body><header><h1>YCO Design Library</h1><p>Local-only browser. Designer uploads files; PM copies a collection path such as <code>assets/video/dance</code> into the feature request.</p></header>' + groups + '</body></html>';
}

function contentType(filePath) {
  return ({ '.avif': 'image/avif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff': 'font/woff', '.woff2': 'font/woff2' })[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

export function createLibraryServer({ workspace = fromRoot() } = {}) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://local');
      if (url.pathname === '/api/index') {
        response.setHeader('content-type', 'application/json; charset=utf-8');
        response.end(JSON.stringify(await scanLibrary(workspace)));
        return;
      }
      if (url.pathname.startsWith('/asset/')) {
        const relative = url.pathname.slice('/asset/'.length).split('/').map(decodeURIComponent).join('/');
        if (!relative.startsWith('design-library/assets/') || relative.includes('..')) {
          response.writeHead(403).end('Forbidden');
          return;
        }
        const root = path.resolve(workspace, 'design-library', 'assets');
        const absolute = path.resolve(workspace, relative);
        if (!absolute.startsWith(root + path.sep)) {
          response.writeHead(403).end('Forbidden');
          return;
        }
        const contents = await fs.readFile(absolute);
        response.setHeader('content-type', contentType(absolute));
        response.end(contents);
        return;
      }
      if (url.pathname === '/') {
        response.setHeader('content-type', 'text/html; charset=utf-8');
        response.end(renderLibraryHtml(await scanLibrary(workspace)));
        return;
      }
      response.writeHead(404).end('Not found');
    } catch (error) {
      response.writeHead(500).end(error.message);
    }
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const config = await readJson('prototype.config.json');
  const server = createLibraryServer();
  server.listen(config.server.libraryPort, config.server.host, () => {
    process.stdout.write('[library] LOCAL http://' + config.server.host + ':' + config.server.libraryPort + '/\n');
  });
}
