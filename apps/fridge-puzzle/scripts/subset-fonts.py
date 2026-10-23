"""画面で使う文字だけに絞ったフォント（woff2）を作る。

使い方（fonttools と brotli が必要）:
  python3 scripts/subset-fonts.py <フォントのフォルダ>
フォントのフォルダには Google Fonts（OFL）の次のファイルを置く:
  MPLUS1p-Medium.ttf / MPLUS1p-ExtraBold.ttf / DelaGothicOne-Regular.ttf / DotGothic16-Regular.ttf
画面の文言（src/*.ts）を変えたら、もう一度実行する。
"""
import pathlib
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
kana = {chr(c) for c in range(0x3041, 0x3097)} | {chr(c) for c in range(0x30A1, 0x30FB)} | set("ー・「」『』（）、。！？〜…★☆＋－×")
body = {c for c in ui if ord(c) >= 0x20} | ascii_chars | kana

jobs = [
    ("MPLUS1p-Medium.ttf", "m-plus-1p-500.woff2", body),
    ("MPLUS1p-ExtraBold.ttf", "m-plus-1p-800.woff2", body),
    ("DelaGothicOne-Regular.ttf", "dela-gothic-one-400.woff2", body),
    ("DotGothic16-Regular.ttf", "dotgothic16-400.woff2", ascii_chars | set("手数目標ステージ")),
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
