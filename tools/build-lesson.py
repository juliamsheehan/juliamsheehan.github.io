#!/usr/bin/env python3
"""Wrap a lesson fragment into a single self-contained HTML file.

The hub's CSS and JS are inlined rather than linked, so the result opens
straight from disk (double-click, or file:///...) with no server, no network
and no dependency on the rest of the repo. Read it, move it, email it.

    python tools/build-lesson.py <fragment.html> <output.html> [--title "..."]

The fragment is just the lesson content -- everything that would sit inside
<main>. No <html>, <head>, site header or nav: those only make sense on the
published site, where the nav links actually go somewhere.

Because CSS and JS are inlined from assets/, a standalone lesson always picks
up the current design and the current quiz/practice engines. Rebuild an old
lesson and it silently gains whatever has been added since.
"""
import argparse
import datetime
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
CSS = REPO / "assets" / "style.css"
JS = REPO / "assets" / "hub.js"

# A standalone lesson sits outside the site, so a relative link like
# glossary.html has nothing to resolve against. Point those at the live site.
SITE = "https://juliamsheehan.github.io/"


def absolutize(html):
    """Rewrite relative page links to the live site; leave anchors alone."""
    def sub(m):
        quote, href = m.group(1), m.group(2)
        if href.startswith(("http://", "https://", "#", "mailto:", "data:")):
            return m.group(0)
        return 'href={q}{site}{href}{q}'.format(q=quote, site=SITE, href=href)

    return re.sub(r'href=(["\'])([^"\']+)\1', sub, html)

PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title}</title>
<meta name="description" content="A self-contained lesson on {title}." />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\U0001F393</text></svg>" />
<style>
{css}
</style>
</head>
<body>

<main>
{body}
</main>

<footer class="site-footer">
  <p class="muted">A standalone lesson · built {built} · open it straight from disk, no server needed.</p>
</footer>

<script>
{js}
</script>
</body>
</html>
"""


def read(path):
    if not path.exists():
        sys.exit("error: missing {}".format(path))
    return path.read_text(encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("fragment", type=pathlib.Path, help="lesson body fragment")
    ap.add_argument("output", type=pathlib.Path, help="standalone file to write")
    ap.add_argument("--title", help="page title (default: first <h1> in the fragment)")
    args = ap.parse_args()

    body = absolutize(read(args.fragment))

    title = args.title
    if not title:
        m = re.search(r"<h1[^>]*>(.*?)</h1>", body, re.S | re.I)
        title = re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else "Lesson"

    css = read(CSS)
    js = read(JS)

    # A literal </script> or </style> inside the payload would end the tag early.
    js = js.replace("</script>", "<\\/script>")
    css = css.replace("</style>", "<\\/style>")

    page = PAGE.format(
        title=title,
        css=css,
        js=js,
        body=body,
        built=datetime.date.today().strftime("%d %B %Y"),
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(page, encoding="utf-8", newline="\r\n")

    kb = args.output.stat().st_size / 1024
    print("wrote {} ({:.0f} KB, self-contained)".format(args.output, kb))


if __name__ == "__main__":
    main()
