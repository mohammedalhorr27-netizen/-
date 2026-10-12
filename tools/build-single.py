#!/usr/bin/env python3
"""يبني نسخة الويب في ملف HTML واحد (الخطوط والأنماط والبيانات مضمّنة) للنشر على صفحة ويب.

الاستعمال: python3 tools/build-single.py OUT.html [--fragment]
--fragment: يحذف وسوم <!doctype> و<html> و<head> و<body> لأن المستضيف يضيفها بنفسه.
يتطلب: pip install fonttools brotli
"""
import base64
import io
import re
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

WEB = Path(__file__).resolve().parent.parent / "docs"


def woff2_data_uri(ttf_path: Path) -> str:
    font = TTFont(ttf_path)
    font.flavor = "woff2"
    buf = io.BytesIO()
    font.save(buf)
    return "data:font/woff2;base64," + base64.b64encode(buf.getvalue()).decode()


def main() -> None:
    out = Path(sys.argv[1])
    fragment = "--fragment" in sys.argv[2:]
    html = (WEB / "index.html").read_text(encoding="utf-8")

    css = (WEB / "css" / "style.css").read_text(encoding="utf-8")
    css = re.sub(
        r'url\("\.\./fonts/([^"]+)\.ttf"\) format\("truetype"\)',
        lambda m: f'url("{woff2_data_uri(WEB / "fonts" / (m.group(1) + ".ttf"))}") format("woff2")',
        css,
    )
    if fragment:
        # المستضيف يحجز مساحة شريط الحالة أعلى الصفحة، فتلتصق الترويسة تحته مباشرة
        css += "\n#top { top: env(safe-area-inset-top, 0px); padding-top: 0; }\nhtml { direction: rtl; }\n"

    title = re.search(r"<title>.*?</title>", html, re.S).group(0)
    body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
    scripts = re.findall(r'<script src="([^"]+)"></script>', body)
    body = re.sub(r'\s*<script src="[^"]+"></script>', "", body)
    inline_js = "".join(
        "<script>\n" + (WEB / src).read_text(encoding="utf-8") + "\n</script>\n" for src in scripts
    )

    # المستضيف يلفّ الصفحة بوسم <html> خاص به، فنضبط الاتجاه واللغة قبل رسم المحتوى
    set_dir = '<script>document.documentElement.dir = "rtl"; document.documentElement.lang = "ar";</script>'
    page = f"{title}\n<style>\n{css}</style>\n{set_dir}\n{body.strip()}\n{inline_js}"
    if not fragment:
        head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
        head = re.sub(r'\s*<link rel="(stylesheet|manifest|icon|apple-touch-icon)"[^>]*>', "", head)
        head = re.sub(r"\s*<title>.*?</title>", "", head, flags=re.S)
        page = f'<!doctype html>\n<html lang="ar" dir="rtl">\n<head>{head}\n{title}\n<style>\n{css}</style>\n</head>\n<body>\n{body.strip()}\n{inline_js}</body>\n</html>\n'

    out.write_text(page, encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size / 1024 / 1024:.2f} MB)")


if __name__ == "__main__":
    main()
