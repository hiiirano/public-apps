"""画面で使う文字だけに絞ったフォント（woff2）を作る。

使い方（fonttools と brotli が必要）:
  python3 scripts/subset-fonts.py <フォントのフォルダ>
フォントのフォルダには Google Fonts（OFL）の次のファイルを置く:
  BIZUDPGothic-Regular.ttf / BIZUDPGothic-Bold.ttf
  （https://github.com/google/fonts/tree/main/ofl/bizudpgothic）
画面の文言（src/*.ts・index.html）を変えたら、もう一度実行する。
利用者が入力する名前の漢字は収録しないので、端末のフォントで表示される。
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
kana = {chr(c) for c in range(0x3041, 0x3097)} | {chr(c) for c in range(0x30A1, 0x30FB)} | set("ー・「」『』（）、。！？〜…ヴ＋－×÷％￥／")
fullwidth = {chr(c) for c in range(0xFF01, 0xFF5F)}
chars = {c for c in ui if ord(c) >= 0x20} | ascii_chars | kana | fullwidth

jobs = [
    ("BIZUDPGothic-Regular.ttf", "biz-udpgothic-400.woff2"),
    ("BIZUDPGothic-Bold.ttf", "biz-udpgothic-700.woff2"),
]
for src, out in jobs:
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.hinting = False
    font = subset.load_font(str(src_dir / src), opts)
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=[ord(c) for c in chars])
    sub.subset(font)
    subset.save_font(font, str(out_dir / out), opts)
    print(f"{out}: {len(chars)} 文字, {(out_dir / out).stat().st_size // 1024} KB")
