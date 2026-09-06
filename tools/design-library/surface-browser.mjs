import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson } from '../prototype-cli/project.mjs';
import { scanSurfaces } from './surfaces.mjs';

/**
 * A local page listing every surface the catalog declares.
 *
 * This exists so the team can see the inventory before anyone tries to render it.
 * It deliberately leads with what is missing — surfaces nobody uses, packs nobody
 * has reviewed, and the shell values that resolve to nothing — because the point
 * of showing the list is to provoke "we don't need that" and "this one is wrong",
 * not to present the catalog as finished.
 */

const STATUS_LABELS = {
  planned: '尚未定義',
  provisional: '未經審查',
  approved: '已審查',
  deprecated: '已淘汰',
};

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
}

const chip = (text, tone = '') => '<span class="chip ' + tone + '">' + escapeHtml(text) + '</span>';

function statRow(summary) {
  const stats = [
    { value: summary.total, label: '登錄總數' },
    { value: summary.defined, label: '有定義檔案' },
    { value: summary.nameOnly, label: '只有名字', tone: summary.nameOnly ? 'warn' : '' },
    { value: summary.byStatus.approved ?? 0, label: '已審查', tone: (summary.byStatus.approved ?? 0) === 0 ? 'warn' : '' },
    { value: summary.unused, label: '沒人用', tone: summary.unused ? 'warn' : '' },
    { value: summary.shellMismatches, label: 'shell 對不上', tone: summary.shellMismatches ? 'bad' : '' },
  ];
  return (
    '<div class="stats">' +
    stats
      .map(
        (stat) =>
          '<div class="stat ' + (stat.tone ?? '') + '"><b>' + stat.value + '</b><span>' + escapeHtml(stat.label) + '</span></div>',
      )
      .join('') +
    '</div>'
  );
}

function rowsTable(caption, rows) {
  if (rows.length === 0) return '';
  return (
    '<div class="block"><h4>' + escapeHtml(caption) + ' <em>' + rows.length + '</em></h4><table>' +
    rows
      .map(
        (row) =>
          '<tr><td class="id">' + escapeHtml(row.id) + '</td>' +
          '<td class="req">' + (row.required ? 'required' : 'optional') + '</td>' +
          '<td>' + escapeHtml(row.description) + '</td></tr>',
      )
      .join('') +
    '</table></div>'
  );
}

function usage(entry) {
  const parts = [];
  for (const adopter of entry.adopters) {
    parts.push(
      chip(
        adopter.feature + ' · ' + adopter.relationship + (adopter.roles?.length ? ' (' + adopter.roles.join(', ') + ')' : ''),
        'ok',
      ),
    );
  }
  for (const pack of entry.composedBy) parts.push(chip(pack + ' 組合它', 'ok'));
  if (parts.length === 0) return '<p class="warn-line">沒有任何 feature 使用，也沒有任何 pack 組合它。</p>';
  return '<p class="chips">' + parts.join('') + '</p>';
}

function definedCard(entry) {
  const pack = entry.pack;
  const flags = [chip(entry.kind), chip(STATUS_LABELS[entry.status] ?? entry.status, entry.status === 'provisional' ? 'warn' : '')];
  if (!entry.used) flags.push(chip('無採用', 'warn'));
  if (pack.shell && !pack.shell.resolves) flags.push(chip('shell 對不上實作', 'bad'));

  const versions = entry.versions.length > 1
    ? '<p class="muted">版本：' + entry.versions.map((version) =>
        version === entry.defaultVersion ? '<b>' + escapeHtml(version) + '</b>（預設）' : escapeHtml(version)).join('、') + '</p>'
    : '';

  const shell = pack.shell
    ? '<div class="block"><h4>shell</h4><p><code>' + escapeHtml(pack.shell.declared) + '</code> ' +
      (pack.shell.resolves
        ? chip('對得上 platform/ui', 'ok')
        : chip('platform/ui 沒有這個目錄', 'bad')) +
      '</p></div>'
    : '';

  const composes = pack.composesPatterns.length
    ? '<div class="block"><h4>組合了這些 pattern <em class="derived">推導自 zone 描述文字，非宣告</em></h4><p class="chips">' +
      pack.composesPatterns.map((id) => chip(id)).join('') + '</p></div>'
    : '';

  const shared = pack.sharedIds.length
    ? '<div class="block"><h4>同時是 zone 也是 slot 的 id <em class="derived">SB-002 要回答 binding 掛哪邊</em></h4><p class="chips">' +
      pack.sharedIds.map((id) => chip(id, 'warn')).join('') + '</p></div>'
    : '';

  const responsive = pack.responsivePriority.length
    ? '<div class="block"><h4>responsive 優先序</h4><ol>' +
      pack.responsivePriority.map((rule) => '<li>' + escapeHtml(rule) + '</li>').join('') + '</ol></div>'
    : '';

  const prose = [];
  if (pack.layoutRules) {
    prose.push('<details><summary>layout-rules.md</summary><pre>' + escapeHtml(pack.layoutRules) + '</pre></details>');
  }
  if (pack.decisionBasis.length) {
    prose.push(
      '<details><summary>decisionBasis（' + pack.decisionBasis.length + '）</summary><ul>' +
        pack.decisionBasis.map((reason) => '<li>' + escapeHtml(reason) + '</li>').join('') +
        '</ul></details>',
    );
  }

  return (
    '<article id="' + escapeHtml(entry.id) + '">' +
    '<header><h3>' + escapeHtml(entry.id) + '</h3><p class="chips">' + flags.join('') + '</p></header>' +
    versions +
    '<div class="block"><h4>誰在用</h4>' + usage(entry) + '</div>' +
    shell +
    composes +
    rowsTable('zones', pack.zones) +
    rowsTable('component slots', pack.slots) +
    shared +
    responsive +
    (prose.length ? '<div class="block prose">' + prose.join('') + '</div>' : '') +
    '<p class="path"><code>' + escapeHtml(pack.relativeRoot) + '</code></p>' +
    '</article>'
  );
}

export function renderSurfaceHtml(index) {
  const defined = index.entries.filter((entry) => entry.defined);
  const nameOnly = index.entries.filter((entry) => !entry.defined);

  const nameOnlyList = nameOnly.length
    ? '<section><h2>只有名字 <em>' + nameOnly.length + '</em></h2>' +
      '<p class="muted">catalog 裡有一行登錄，沒有任何檔案。要判斷的是：哪幾個是真的要做的？</p>' +
      '<ul class="name-only">' +
      nameOnly.map((entry) => '<li><code>' + escapeHtml(entry.id) + '</code>' + chip(entry.kind) + '</li>').join('') +
      '</ul></section>'
    : '';

  return (
    '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>YCO Surface Browser</title><style>' +
    ':root{font-family:"Noto Sans TC",Inter,system-ui,sans-serif;color:#202124;background:#f6f7f9;line-height:1.6}' +
    'body{max-width:1080px;margin:auto;padding:32px 24px 96px}' +
    'h1{margin:0 0 8px;font-size:28px}h2{margin:40px 0 4px;font-size:20px;border-bottom:1px solid #dfe3e8;padding-bottom:8px}' +
    'h2 em,h4 em{font-style:normal;color:#6b7280;font-weight:400;font-size:14px}' +
    'h3{margin:0;font-size:17px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}' +
    'h4{margin:0 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280}' +
    '.lede{color:#3c4043;margin:0 0 20px;max-width:70ch}' +
    '.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:20px 0 8px}' +
    '.stat{background:#fff;border:1px solid #dfe3e8;border-radius:10px;padding:12px 14px;display:flex;flex-direction:column}' +
    '.stat b{font-size:26px;line-height:1.1;font-variant-numeric:tabular-nums}.stat span{font-size:12px;color:#6b7280}' +
    '.stat.warn{border-color:#e0b44a;background:#fffaf0}.stat.warn b{color:#a26b00}' +
    '.stat.bad{border-color:#dc8b8b;background:#fff5f5}.stat.bad b{color:#b3261e}' +
    'article{background:#fff;border:1px solid #dfe3e8;border-radius:12px;padding:18px 20px;margin:14px 0}' +
    'article header{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-bottom:10px}' +
    '.block{margin:14px 0}.chips{display:flex;flex-wrap:wrap;gap:6px;margin:0}' +
    '.chip{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;background:#eef0f3;color:#3c4043;border:1px solid #dfe3e8}' +
    '.chip.ok{background:#edf7ee;border-color:#b6dbb8;color:#1e6023}' +
    '.chip.warn{background:#fffaf0;border-color:#e8cf95;color:#8a5a00}' +
    '.chip.bad{background:#fff5f5;border-color:#e8b4b4;color:#b3261e}' +
    '.warn-line{margin:0;color:#8a5a00;background:#fffaf0;border:1px solid #e8cf95;border-radius:8px;padding:8px 12px}' +
    'table{width:100%;border-collapse:collapse;font-size:14px}' +
    'td{border-top:1px solid #eef0f3;padding:6px 8px 6px 0;vertical-align:top}' +
    'td.id{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;width:1%}' +
    'td.req{color:#6b7280;font-size:12px;white-space:nowrap;width:1%;padding-right:14px}' +
    '.derived{color:#8a5a00}' +
    'details{margin:6px 0}summary{cursor:pointer;font-size:13px;color:#3c4043}' +
    'pre{white-space:pre-wrap;background:#f6f7f9;border:1px solid #eef0f3;border-radius:8px;padding:12px;font-size:13px;overflow-x:auto}' +
    'ol,ul{margin:6px 0;padding-left:20px;font-size:14px}' +
    '.name-only{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px}' +
    '.name-only li{display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #dfe3e8;border-radius:8px;padding:8px 12px}' +
    '.muted{color:#6b7280;font-size:14px}.path{margin:12px 0 0;font-size:12px;color:#6b7280}' +
    'code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}' +
    '</style></head><body>' +
    '<h1>Surface Browser</h1>' +
    '<p class="lede">catalog 裡宣告的每一個 surface。這一頁的用途是<b>對齊</b>：看完之後請說出「這個不需要」或「缺這個」。' +
    '沒有畫面 —— 版面長什麼樣要等 Step 3，因為今天沒有任何檔案記錄哪個元件填哪個 zone。</p>' +
    statRow(index.summary) +
    '<section><h2>有定義檔案 <em>' + defined.length + '</em></h2>' +
    '<p class="muted">這些可以現在就審查內容。狀態全是 <code>provisional</code>：寫下來了，但沒有人看過。</p>' +
    defined.map(definedCard).join('') +
    '</section>' +
    nameOnlyList +
    '<section><h2>platform/ui 現有元件 <em>' + index.components.length + '</em></h2>' +
    '<p class="muted">Step 3 能拿來組版面的零件。目前沒有任何檔案把它們對應到上面的 zone。</p>' +
    '<p class="chips">' + index.components.map((name) => chip(name)).join('') + '</p></section>' +
    '</body></html>'
  );
}

export function createSurfaceServer({ workspace } = {}) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://local');
      if (url.pathname === '/api/index') {
        response.setHeader('content-type', 'application/json; charset=utf-8');
        response.end(JSON.stringify(await scanSurfaces(workspace)));
        return;
      }
      if (url.pathname === '/') {
        response.setHeader('content-type', 'text/html; charset=utf-8');
        response.end(renderSurfaceHtml(await scanSurfaces(workspace)));
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
  const server = createSurfaceServer();
  server.listen(config.server.surfacesPort, config.server.host, () => {
    process.stdout.write('[surfaces] LOCAL http://' + config.server.host + ':' + config.server.surfacesPort + '/\n');
  });
}
