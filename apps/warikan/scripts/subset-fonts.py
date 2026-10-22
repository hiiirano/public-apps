"""画面で使う文字だけに絞ったフォント（woff2）を作る。

使い方（fonttools と brotli が必要）:
  python3 scripts/subset-fonts.py <フォントのフォルダ>
フォントのフォルダには Google Fonts（OFL）の次のファイルを置く:
  KiwiMaru-Medium.ttf / MPLUSRounded1c-Regular.ttf / MPLUSRounded1c-Bold.ttf
画面の文言（src/*.ts）を変えたら、もう一度実行する。
利用者が入力する名前の漢字は収録しないので、端末のフォントで表示される。
"""
import pathlib
import re
import sys

from fontTools import subset

root = pathlib.Path(__file__).resolve().parent.parent
src_dir = pathlib.Path(sys.argv[1])
out_dir = root / "src" / "fonts"
out_dir.mkdir(parents=True, exist_ok=True)

ui = set()
for f in sorted((root / "src").glob("*.ts")):
    if f.name.endswith(".test.ts"):
        continue
    ui |= set(f.read_text(encoding="utf-8"))
ui |= set((root / "index.html").read_text(encoding="utf-8"))

ascii_chars = {chr(c) for c in range(0x20, 0x7F)}
kana = {chr(c) for c in range(0x3041, 0x3097)} | {chr(c) for c in range(0x30A1, 0x30FB)} | set("ー・「」『』（）、。！？〜…ヴ＋－×÷％￥")
fullwidth = {chr(c) for c in range(0xFF01, 0xFF5F)}

# 見出し（h1・h2）は Kiwi Maru。見出しに出る文字だけを収録する
main_ts = (root / "src" / "main.ts").read_text(encoding="utf-8")
heading = set("".join(re.sub(r"<[^>]+>|\$\{[^}]*\}", "", m) for m in re.findall(r"<h[12][^>]*>(.*?)</h[12]>", main_ts, re.S)))
heading |= set("0123456789")
body = {c for c in ui if ord(c) >= 0x20} | ascii_chars | kana | fullwidth

jobs = [
    ("KiwiMaru-Medium.ttf", "kiwi-maru-500.woff2", heading),
    ("MPLUSRounded1c-Regular.ttf", "m-plus-rounded-1c-400.woff2", body),
    ("MPLUSRounded1c-Bold.ttf", "m-plus-rounded-1c-700.woff2", body),
]
for src, out, chars in jobs:
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    font = subset.load_font(str(src_dir / src), opts)
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=[ord(c) for c in chars])
    sub.subset(font)
    subset.save_font(font, str(out_dir / out), opts)
    print(f"{out}: {len(chars)} 文字, {(out_dir / out).stat().st_size // 1024} KB")
