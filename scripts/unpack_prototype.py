import base64, gzip, json, re, sys, pathlib

src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
html = src.read_text(encoding="utf-8")

def block(kind):
    m = re.search(r'<script type="__bundler/' + kind + r'">(.*?)</script>', html, re.S)
    return m.group(1) if m else None

manifest = json.loads(block("manifest"))
for uuid, res in manifest.items():
    if res["mime"].startswith("font"):
        continue
    data = base64.b64decode(res["data"])
    if str(res.get("compressed")).lower() == "true":
        data = gzip.decompress(data)
    text = data.decode("utf-8", errors="replace")
    if text.startswith("/* @ds-bundle"):
        (out / "ds.js").write_text(text, encoding="utf-8")          # design-system components source
    elif "react.production" not in text[:400] and "react-dom" not in text[:400]:
        (out / f"runtime-{uuid[:8]}.js").write_text(text, encoding="utf-8")

template = json.loads(block("template"))
template = re.sub(r"@font-face\s*\{[^}]*\}", "", template)            # drop embedded font blobs
(out / "template.html").write_text(template, encoding="utf-8")        # markup + inline styles + tokens

m = re.search(r'<script type="text/x-dc"[^>]*>(.*?)</script>', template, re.S)
if m:
    (out / "app.js").write_text(m.group(1), encoding="utf-8")         # screen logic + sample data

tokens = {}
for name, value in re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", template):
    tokens.setdefault(name, value.strip())                              # first = day (:root); night overrides come later
(out / "tokens.json").write_text(json.dumps(tokens, indent=2), encoding="utf-8")
print("unpacked to", out)
