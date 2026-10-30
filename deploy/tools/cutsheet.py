"""ChatGPT で描いた白背景のシートを、格子ごとに切り出して透明背景の WebP にする。

使い方（Pillow・NumPy・SciPy が必要）:
  python cutsheet.py <シート.png> <列> <行> <出力先> <名前1,名前2,...> [--size 256] [--margin 0.06] [--clear-holes 名前,...]
名前は左上から右へ、行ごとの順。空の名前（,,）のマスは飛ばす。

背景の判定: マスの外周からつながっている「白〜薄い灰色で色みの少ない画素」を背景とする
（影や地面の薄い線も消える）。そのあと、いちばん大きいかたまりの 3% 未満の小片
（影の残り、隣のマスのはみ出し）と、平たい線（影・地面）を消す。
"""
import argparse
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage


def cut(cell: np.ndarray, size: int, margin: float, clear_holes: bool = False,
        bg_min: int = 188, bg_chroma: int = 22, min_area: float = 0.03) -> Image.Image:
    rgb = cell[:, :, :3].astype(np.int16)
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    # 白い物（牛乳・白い服）が背景に溶けるときは bg_min を上げ、bg_chroma を下げる
    bglike = (mn > bg_min) & ((mx - mn) < bg_chroma)
    labels, _ = ndimage.label(bglike)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, edge[edge > 0])

    fg = ~bg
    fl, n = ndimage.label(fg)
    if n == 0:
        raise ValueError("絵が見つからない")
    areas = ndimage.sum(fg, fl, range(1, n + 1))
    # 影や地面の線のような、平たい小片も消す（いちばん大きいかたまりの高さの 12% 未満）
    slices = ndimage.find_objects(fl)
    big = int(np.argmax(areas))
    big_h = slices[big][0].stop - slices[big][0].start
    ok = [i + 1 for i, sl in enumerate(slices)
          if i == big or (areas[i] >= areas[big] * min_area and (sl[0].stop - sl[0].start) >= big_h * 0.12)]
    keep = np.isin(fl, ok)
    keep = ndimage.binary_fill_holes(keep)
    if clear_holes:
        # 囲まれたすき間（天びんのひもの内側など）も透明にする。お皿の白など、絵の一部の白には使わない
        holes, m = ndimage.label(bglike & keep)
        hole_areas = ndimage.sum(holes > 0, holes, range(1, m + 1))
        keep &= ~np.isin(holes, np.nonzero(hole_areas >= keep.sum() * 0.005)[0] + 1)

    # 縁の1画素は白さに応じて半透明にして、白いふちを残さない
    alpha = keep.astype(np.float32)
    border = keep & ~ndimage.binary_erosion(keep)
    whiteness = (mn.astype(np.float32) - 150) / 105
    alpha[border] = np.clip(1 - whiteness[border], 0.25, 1)

    ys, xs = np.nonzero(keep)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    out = np.dstack([cell[y0:y1, x0:x1, :3], (alpha[y0:y1, x0:x1] * 255).astype(np.uint8)])
    img = Image.fromarray(out, "RGBA")
    inner = int(size * (1 - 2 * margin))
    img.thumbnail((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(img, ((size - img.width) // 2, (size - img.height) // 2), img)
    return canvas


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet")
    ap.add_argument("cols", type=int)
    ap.add_argument("rows", type=int)
    ap.add_argument("out")
    ap.add_argument("names")
    ap.add_argument("--size", type=int, default=256)
    ap.add_argument("--margin", type=float, default=0.06)
    ap.add_argument("--clear-holes", default="", help="囲まれた白いすき間も透明にする絵の名前（カンマ区切り）")
    a = ap.parse_args()

    sheet = np.array(Image.open(a.sheet).convert("RGB"))
    h, w = sheet.shape[:2]
    names = a.names.split(",")
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for i, name in enumerate(names):
        if not name:
            continue
        r, c = divmod(i, a.cols)
        cell = sheet[r * h // a.rows:(r + 1) * h // a.rows, c * w // a.cols:(c + 1) * w // a.cols]
        cut(cell, a.size, a.margin, name in a.clear_holes.split(",")).save(out / f"{name}.webp", quality=88, alpha_quality=100, method=6)
        print(f"{name}.webp")


if __name__ == "__main__":
    main()
