'use strict';
/** Loads one node's published corpus in the shapes the conditions need. */
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config');

const { convert } = require(path.join(cfg.DEPS, 'html-to-text'));
const { encode } = require(path.join(cfg.DEPS, 'gpt-tokenizer', 'cjs', 'encoding', 'o200k_base'));

const SKIP = [{ selector: 'img', format: 'skip' }, { selector: 'script', format: 'skip' },
  { selector: 'style', format: 'skip' }, { selector: 'svg', format: 'skip' },
  { selector: 'a', options: { linkBrackets: ['[', ']'], hideLinkHrefIfSameAsText: true } }];

/** Token count in the o200k_base vocabulary (the vocabulary the engine's own bench pins). */
const countTokens = (s) => encode(s).length;

/** Page text from built HTML, links visible as `text [href]`. */
const htmlToText = (html) => convert(html, { wordwrap: false, selectors: SKIP });

/** Maps a site route to a file under the build, or null. Only .html routes and the llms files. */
function routeFile(www, route, allowText) {
  const clean = decodeURIComponent(String(route || '/').split('#')[0].split('?')[0]);
  const rel = clean.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '');
  if (rel.split('/').includes('..')) return null;
  const cands = [];
  if (allowText && /^(llms\.txt)$/.test(rel)) cands.push(rel);
  else if (/\.html$/.test(rel)) cands.push(rel);
  else if (rel === '' || rel.endsWith('/')) cands.push(path.join(rel, 'index.html'));
  else if (!path.extname(rel)) cands.push(path.join(rel, 'index.html'));
  for (const c of cands) {
    const f = path.join(www, c);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return null;
}

/** Text a plain-pages agent gets for a route (null if there is no such page). */
function pageText(node, route, allowText) {
  const f = routeFile(cfg.wwwDir(node), route, allowText);
  if (!f) return null;
  const raw = fs.readFileSync(f, 'utf8');
  return f.endsWith('.html') ? htmlToText(raw) : raw;
}

/** Published items from the node's chunk export: slug -> { title, iri, kind }. */
function items(node) {
  const out = new Map();
  const file = path.join(cfg.wwwDir(node), 'chunks.jsonl');
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const c = JSON.parse(line);
    if (!out.has(c.item)) out.set(c.item, { slug: c.item, title: c.title, iri: c.iri, kind: c.kind, digests: [] });
    out.get(c.item).digests.push(c.digest, c.id);
  }
  return out;
}

/** Published Markdown items (front matter removed): [{slug, title, type, body}]. */
function markdownItems(node) {
  const dir = path.join(cfg.srcDir(node), 'content');
  const pub = items(node);
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.md')) continue;
      const slug = e.name.slice(0, -3);
      if (!pub.has(slug) || pub.get(slug).kind === 'cluster') continue;
      const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(fs.readFileSync(p, 'utf8'));
      if (!m) continue;
      out.push({ slug, title: pub.get(slug).title, body: m[2].replace(/\n{3,}/g, '\n\n').trim() });
    }
  };
  walk(dir);
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Splits an item into one chunk per `## ` section; the id is `slug#n`. */
function markdownChunks(node) {
  const out = [];
  for (const it of markdownItems(node)) {
    const parts = it.body.split(/\n(?=## )/);
    parts.forEach((p, n) => out.push({ id: `${it.slug}#${n}`, slug: it.slug, title: it.title, text: p.trim() }));
  }
  return out;
}

module.exports = { countTokens, htmlToText, pageText, routeFile, items, markdownItems, markdownChunks };
