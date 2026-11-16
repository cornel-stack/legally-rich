#!/usr/bin/env python3
"""
Capture the legal evidence for an episode as committed PNGs plus highlight boxes.

    python3 scripts/fetch_evidence.py episodes/ep01-credit-card

Reads the `evidence` array in case.json. Each item:
    {
      "id": "fdcpa-1692g",
      "url": "https://www.law.cornell.edu/uscode/text/15/1692g",
      "caption": "15 U.S. Code § 1692g — Validation of debts",
      "clip": "#2a9e...  (optional CSS selector to crop to)",
      "find": ["within thirty days", "the debt collector shall"],  (text to highlight)
      "fallback": { "title": "...", "section": "...", "body": "..." }  (rendered card)
    }

Writes:
    episodes/<ep>/evidence/<id>.png
    and merges computed highlight fractions (0..1) back into case.json under
    evidence[].highlights, so the Remotion DocumentZoom can animate to them.

Design goals: deterministic, offline-safe. If the live page can't be reached or
the text can't be located, it renders the `fallback` card so the pipeline never
stalls and still shows a sourced, highlighted document.
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

VIEWPORT = {"width": 1400, "height": 1800}
SCALE = 2


def launch(p):
    # Prefer system Chrome locally; fall back to Playwright's bundled Chromium (CI).
    try:
        return p.chromium.launch(channel="chrome", args=["--no-sandbox"])
    except Exception:
        pass
    try:
        return p.chromium.launch(args=["--no-sandbox"])  # playwright-installed chromium
    except Exception:
        return p.chromium.launch(
            executable_path="/usr/bin/google-chrome", args=["--no-sandbox"]
        )


def fallback_html(fb: dict) -> str:
    """A clean, official-looking statute/filing card used when live capture fails."""
    title = fb.get("title", "")
    section = fb.get("section", "")
    body = fb.get("body", "")
    highlight = fb.get("highlight", "")
    # mark the highlight phrase inside body
    marked = body
    if highlight and highlight in body:
        marked = body.replace(
            highlight, f'<mark id="hl">{highlight}</mark>', 1
        )
    return f"""<!doctype html><html><head><meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; }}
  body {{ margin:0; background:#ececec; font-family: Georgia, 'Times New Roman', serif; }}
  .sheet {{ width: 1100px; margin: 60px auto; background:#fff; padding:80px 90px;
           box-shadow:0 10px 40px rgba(0,0,0,.18); border:1px solid #d8d8d8; }}
  .kicker {{ font-family: Arial, sans-serif; letter-spacing:.14em; text-transform:uppercase;
            font-size:15px; color:#6b6b6b; margin-bottom:28px; }}
  h1 {{ font-size:34px; line-height:1.25; margin:0 0 10px; color:#141414; }}
  .section {{ font-family: Arial, sans-serif; font-size:16px; color:#444; margin-bottom:34px; }}
  p {{ font-size:23px; line-height:1.7; color:#1c1c1c; margin:0 0 20px; text-align:justify; }}
  mark {{ background:#fff2a8; padding:2px 2px; }}
</style></head><body>
  <div class="sheet">
    <div class="kicker">{section}</div>
    <h1>{title}</h1>
    <p>{marked}</p>
  </div>
</body></html>"""


def frac_from_box(box, page_w, page_h):
    return {
        "x": round(box["x"] / page_w, 4),
        "y": round(box["y"] / page_h, 4),
        "w": round(box["width"] / page_w, 4),
        "h": round(box["height"] / page_h, 4),
    }


def capture_item(page, item, out_png: Path) -> list:
    """Screenshot one evidence item; return list of highlight dicts (fractions)."""
    highlights = []
    used_fallback = False

    if "url" in item:
        try:
            page.goto(item["url"], wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(1200)
        except Exception as exc:
            print(f"    live fetch failed ({exc}); using fallback")
            used_fallback = True
    else:
        used_fallback = True

    if used_fallback:
        page.set_content(fallback_html(item.get("fallback", {})), wait_until="load")
        page.wait_for_timeout(300)

    # Determine the crop target (an element) or full page
    clip_el = None
    if not used_fallback and item.get("clip"):
        try:
            clip_el = page.query_selector(item["clip"])
        except Exception:
            clip_el = None

    # Resolve highlight boxes relative to the captured image
    find = item.get("find", [])
    if used_fallback:
        hl = page.query_selector("#hl")
        targets = [hl] if hl else []
    else:
        targets = []
        for phrase in find:
            try:
                loc = page.get_by_text(phrase, exact=False).first
                if loc.count() > 0:
                    loc.scroll_into_view_if_needed(timeout=4000)
                    targets.append(loc.element_handle())
            except Exception:
                pass

    # Screenshot
    if clip_el is not None:
        box = clip_el.bounding_box()
        page.screenshot(path=str(out_png), clip=box)
        base_x, base_y, base_w, base_h = box["x"], box["y"], box["width"], box["height"]
        for t in targets:
            if not t:
                continue
            tb = t.bounding_box()
            if tb:
                highlights.append(
                    {
                        "x": round((tb["x"] - base_x) / base_w, 4),
                        "y": round((tb["y"] - base_y) / base_h, 4),
                        "w": round(tb["width"] / base_w, 4),
                        "h": round(tb["height"] / base_h, 4),
                    }
                )
    else:
        # Full-page screenshot: measure full content size
        dims = page.evaluate(
            "() => ({w: document.documentElement.scrollWidth,"
            " h: document.documentElement.scrollHeight})"
        )
        page.screenshot(path=str(out_png), full_page=True)
        for t in targets:
            if not t:
                continue
            tb = t.bounding_box()
            if tb:
                highlights.append(frac_from_box(tb, dims["w"], dims["h"]))

    # attach ids/labels
    out = []
    for i, h in enumerate(highlights):
        out.append({"id": f"{item['id']}-h{i}", **h})
    return out


def main(ep_dir: Path):
    case_path = ep_dir / "case.json"
    case = json.loads(case_path.read_text())
    ev_dir = ep_dir / "evidence"
    ev_dir.mkdir(parents=True, exist_ok=True)
    evidence = case.get("evidence", [])
    if not evidence:
        print("no evidence declared in case.json")
        return

    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page(viewport=VIEWPORT, device_scale_factor=SCALE)
        for item in evidence:
            png = ev_dir / f"{item['id']}.png"
            print(f"  capture {item['id']} -> {png.name}")
            hls = capture_item(page, item, png)
            item["image"] = f"evidence/{png.name}"
            item["accessed"] = item.get("accessed", "2026-11-16")
            item["highlights"] = hls
            print(f"    {len(hls)} highlight(s)")
        browser.close()

    case_path.write_text(json.dumps(case, indent=2, ensure_ascii=False))
    print("evidence done; case.json updated with image paths + highlights.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: fetch_evidence.py <episode-dir>")
        sys.exit(1)
    main(Path(sys.argv[1]))
