"""Reads every item of a Bundle's content folder: prints {slug: {fm: {...}, body: "..."}} as JSON. Dates become ISO strings."""
import json, os, re, sys, datetime
import yaml

def plain(x):
    if isinstance(x, (datetime.date, datetime.datetime)):
        return x.isoformat()
    if isinstance(x, dict):
        return {str(k): plain(v) for k, v in x.items()}
    if isinstance(x, list):
        return [plain(v) for v in x]
    return x

out = {}
for root, _, files in os.walk(sys.argv[1]):
    for f in files:
        if not f.endswith('.md') or f in ('index.md', 'README.md'):
            continue
        t = open(os.path.join(root, f), encoding='utf8').read()
        m = re.match(r'---\n(.*?)\n---\n?(.*)$', t, re.S)
        if not m:
            continue
        out[f[:-3]] = {'fm': plain(yaml.safe_load(m.group(1)) or {}), 'body': m.group(2).strip()}
json.dump(out, sys.stdout, sort_keys=True)
