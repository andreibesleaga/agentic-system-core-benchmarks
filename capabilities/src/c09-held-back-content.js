'use strict';
/**
 * Case 9. Does `agsc mcp` (1.1.0) serve held-back items (draft, or not in the publish set)?
 * The node's published surfaces are the reference: none may carry a held-back item.
 * Method: every held-back slug of the patterns node is requested through read, links and search; the answer of ask is checked.
 */
const fs = require('node:fs');
const path = require('node:path');
const { cfg, writeResult, mcpOpen } = require('./shared/lib');

(async () => {
  const dir = cfg.fullDir('patterns');
  const www = cfg.wwwDir('patterns');
  const published = new Set(fs.readFileSync(path.join(www, 'chunks.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).item));
  const all = new Map(); // slug -> {status, title}
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.md') || e.name === 'index.md') continue;
      const fm = (/^---\n([\s\S]*?)\n---/.exec(fs.readFileSync(p, 'utf8')) || [, ''])[1];
      if (!/^---\n/.test(fs.readFileSync(p, 'utf8'))) continue; // no frontmatter: not an item
      all.set(e.name.slice(0, -3), { status: (/^status: (\S+)/m.exec(fm) || [, 'none'])[1], title: (/^title: (.*)$/m.exec(fm) || [, ''])[1].replace(/^["']|["']$/g, '') });
    }
  }(path.join(dir, 'content')));
  const held = [...all.keys()].filter((s) => !published.has(s)).sort();
  // An item's IRI is https://<host>/<plural>/<slug>/ ; a bare word in a search index or a URL of another site is not a match.
  const wwwText = ['llms.txt', 'llms-full.txt', 'chunks.jsonl', 'graph.nq', 'graph.ttl', 'graph.jsonld', 'sitemap.xml'].map((f) => fs.readFileSync(path.join(www, f), 'utf8')).join('\n');
  const onPublished = held.filter((s) => new RegExp(`patterns\\.agenticsystemcore\\.com/(concepts|procedures|episodes|lessons|gates|clusters)/${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`).test(wwwText)).length;

  const m = await mcpOpen(dir);
  const tools = (await m.client.listTools()).tools.map((t) => t.name);
  const res = (await m.client.listResources().catch(() => ({ resources: [] }))).resources || [];
  let readOk = 0; let linksOk = 0; let searchHit = 0; let flagged = 0; 
  for (const s of held) {
    const r = await m.call('read', { slug: s });
    if (!r.isError) { readOk += 1; if (/"status":"draft"|status: draft/.test(r.text)) flagged += 1; }
    if (!(await m.call('links', { slug: s })).isError) linksOk += 1;
    const q = await m.call('search', { query: all.get(s).title || s });
    if (q.json && q.json.body && q.json.body.hits.some((h) => h.slug === s)) searchHit += 1;
  }
  // ask: does a question about a held-back item cite it?
  let askCites = 0; let asked = 0;
  for (const s of held.slice(0, 30)) {
    const a = await m.call('ask', { question: all.get(s).title || s }); asked += 1;
    if (a.json && (a.json.citations || []).some((c) => c.includes(`/${s}/`))) askCites += 1;
  }
  await m.close();
  // The same against the published-only copy (answering study's setup) is the control: held-back items do not exist there.
  const mp = await mcpOpen(cfg.srcDir('patterns'));
  let readOkPublishedOnly = 0;
  for (const s of held) if (!(await mp.call('read', { slug: s })).isError) readOkPublishedOnly += 1;
  await mp.close();
  const byStatus = {}; for (const s of held) byStatus[all.get(s).status] = (byStatus[all.get(s).status] || 0) + 1;
  writeResult('c09-held-back-content', {
    tools_listed: tools.length, resources_listed: res.length, items_in_bundle: all.size, published_items_incl_clusters: published.size, held_back_items: held.length, held_back_by_status: byStatus,
    held_back_found_on_published_surfaces: onPublished,
    mcp_read_returns_held_back: readOk, mcp_links_returns_held_back: linksOk, mcp_search_finds_held_back_by_title: searchHit, mcp_read_marks_draft_in_result: flagged,
    ask_asked: asked, ask_cites_held_back: askCites,
    control_published_only_copy_read_returns_held_back: readOkPublishedOnly,
    documented: 'spec/00-overview.md AGSC-00-05 and spec/01-bundle.md AGSC-01-26: the local tool server is the author’s own tool over the author’s Bundle and reads drafts; it is not a published surface.',
  });
})();
