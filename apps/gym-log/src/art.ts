// 種目の絵（自作の SVG）。人の形は関節の座標から線で描き、鍛える場所を差し色で塗る。
// 絵の地は常に暗い色（ライト・ダークどちらでも同じ見え方）。色は style.css の .art の中で決める。
// あとで ChatGPT の絵に差し替えるときは、artSvg() の代わりに <img src="./art/ex-<key>.webp"> を返す（docs/ART_PROMPT.md）。
import type { Part } from "./types";

type Pt = [number, number];
type Seg = "torso" | "arm" | "fore" | "thigh" | "shin" | "arm2" | "fore2" | "thigh2" | "shin2";

interface Pose {
  head: Pt;
  sh: Pt;
  hip: Pt;
  el?: Pt;
  ha?: Pt;
  kn?: Pt;
  ft?: Pt;
  /** 奥側の腕・脚（少し暗く描く） */
  el2?: Pt;
  ha2?: Pt;
  kn2?: Pt;
  ft2?: Pt;
}

const L = (a: Pt, b: Pt, cls: string) => `<line class="${cls}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
const P = (d: string, cls = "mc") => `<path class="${cls}" d="${d}"/>`;
const R = (x: number, y: number, w: number, h: number, rx = 2.5, cls = "pad") =>
  `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const C = (x: number, y: number, r: number, cls = "mc") => `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}"/>`;
const E = (x: number, y: number, rx: number, ry: number, rot = 0) =>
  `<ellipse class="blob" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})"/>`;
/** 動きの向き（矢印） */
const A = (d: string) => `<path class="mv" d="${d}" marker-end="url(#gl-arrow)"/>`;

function figure(p: Pose, hl: Seg[] = []): string {
  const c = (s: Seg, back = false) => (hl.includes(s) ? "hl" : back ? "bd2" : "bd");
  let out = "";
  if (p.kn2 && p.ft2) out += L(p.hip, p.kn2, c("thigh2", true)) + L(p.kn2, p.ft2, c("shin2", true));
  if (p.el2 && p.ha2) out += L(p.sh, p.el2, c("arm2", true)) + L(p.el2, p.ha2, c("fore2", true));
  out += L(p.sh, p.hip, c("torso"));
  if (p.kn && p.ft) out += L(p.hip, p.kn, c("thigh")) + L(p.kn, p.ft, c("shin"));
  if (p.el && p.ha) out += L(p.sh, p.el, c("arm")) + L(p.el, p.ha, c("fore"));
  out += `<circle class="head" cx="${p.head[0]}" cy="${p.head[1]}" r="6.5"/>`;
  return out;
}

const FLOOR = L([10, 84], [110, 84], "floor");
/** 座ってするマシンの土台（座面と背もたれ） */
const seat = (x: number, y: number, backTop: Pt = [x - 6, 22]) =>
  L([x + 8, y + 4], [x + 8, 84], "mc") + L([x - 2, y + 2], backTop, "mcw") + R(x - 4, y, 26, 6);

interface Art {
  /** 絵の奥（器具） */
  back: string;
  pose: Pose;
  hl: Seg[];
  /** 絵の手前（握り・パッド・筋肉・矢印） */
  front: string;
}

const ARTS: Record<string, Art> = {
  "chest-press": {
    back: FLOOR + seat(44, 58, [38, 20]) + P("M38 12 H66 L80 26") + L([80, 26], [80, 42], "mcw"),
    pose: { head: [43, 20], sh: [43, 31], hip: [48, 57], el: [60, 38], ha: [78, 34], kn: [68, 58], ft: [68, 82] },
    hl: ["arm"],
    front: E(48, 37, 4, 6.5) + A("M88 50 H104"),
  },
  "lat-pulldown": {
    back: FLOOR + P("M60 2 V10") + L([40, 10], [80, 10], "mcw") + L([60, 64], [60, 84], "mc") + R(46, 60, 26, 6) + R(70, 46, 12, 6),
    pose: { head: [50, 25], sh: [54, 35], hip: [56, 60], el: [70, 26], ha: [64, 10], kn: [76, 58], ft: [76, 82] },
    hl: ["arm"],
    front: E(52, 42, 3.5, 8, 8) + A("M94 14 V34"),
  },
  "shoulder-press": {
    back: FLOOR + seat(46, 60, [40, 22]) + P("M38 18 V4 H60") + L([60, 2], [60, 12], "mcw"),
    pose: { head: [42, 22], sh: [45, 33], hip: [50, 59], el: [60, 26], ha: [60, 8], kn: [70, 60], ft: [70, 82] },
    hl: ["arm"],
    front: C(47, 33, 5, "blob") + A("M84 30 V10"),
  },
  "biceps-curl": {
    back: FLOOR + seat(40, 62, [36, 30]) + P("M66 50 V84") + `<rect class="pad" x="54" y="40" width="22" height="7" rx="3" transform="rotate(28 65 44)"/>`,
    pose: { head: [44, 24], sh: [44, 35], hip: [46, 61], el: [70, 50], ha: [72, 28], kn: [64, 64], ft: [64, 82] },
    hl: ["arm"],
    front: C(72, 26, 3.5, "mcw") + A("M92 52 Q96 32 82 22"),
  },
  "dip-machine": {
    back: FLOOR + seat(46, 60, [40, 22]),
    pose: { head: [50, 22], sh: [50, 33], hip: [52, 59], el: [40, 44], ha: [56, 56], kn: [72, 60], ft: [72, 82] },
    hl: ["arm", "fore"],
    front: L([52, 56], [62, 56], "mcw") + A("M88 36 V56"),
  },
  abdominal: {
    back: FLOOR + seat(42, 62, [36, 28]) + P("M66 22 L60 40"),
    pose: { head: [64, 26], sh: [58, 36], hip: [48, 61], el: [66, 46], ha: [64, 34], kn: [68, 64], ft: [68, 82] },
    hl: ["torso"],
    front: A("M82 22 Q92 38 80 54"),
  },
  "back-extension": {
    back: FLOOR + seat(48, 62, [52, 60]) + R(28, 24, 7, 18, 3),
    pose: { head: [38, 26], sh: [42, 36], hip: [54, 61], el: [52, 44], ha: [48, 38], kn: [72, 62], ft: [72, 82] },
    hl: ["torso"],
    front: A("M34 56 Q18 48 20 30"),
  },
  "rotary-torso": {
    back: FLOOR + seat(48, 62, [44, 30]) + R(66, 34, 6, 14, 3),
    pose: { head: [54, 24], sh: [54, 35], hip: [56, 61], el: [66, 44], ha: [70, 38], kn: [74, 62], ft: [74, 82] },
    hl: ["torso"],
    front: `<path class="mv" d="M36 46 A22 7 0 1 0 82 44" marker-end="url(#gl-arrow)"/>`,
  },
  "leg-press": {
    back: FLOOR + L([18, 40], [40, 68], "mcw") + L([40, 68], [62, 68], "mcw") + L([50, 68], [50, 84], "mc") + L([90, 30], [90, 74], "mcw") + L([90, 52], [104, 52], "mc"),
    pose: { head: [21, 34], sh: [27, 44], hip: [42, 64], el: [36, 58], ha: [46, 62], kn: [62, 42], ft: [86, 52] },
    hl: ["thigh"],
    front: A("M64 24 H84"),
  },
  "leg-extension": {
    back: FLOOR + seat(42, 58, [38, 20]) + L([62, 64], [62, 84], "mc"),
    pose: { head: [44, 20], sh: [44, 31], hip: [48, 57], el: [52, 46], ha: [60, 58], kn: [66, 58], ft: [88, 48] },
    hl: ["thigh"],
    front: C(86, 54, 4.5, "padc") + A("M96 74 Q104 60 98 44"),
  },
  adduction: {
    back: FLOOR + R(44, 54, 32, 6) + L([60, 60], [60, 84], "mc") + R(46, 62, 6, 14, 3) + R(68, 62, 6, 14, 3),
    pose: { head: [60, 14], sh: [60, 25], hip: [60, 54], kn: [38, 62], ft: [38, 82], kn2: [82, 62], ft2: [82, 82], el: [48, 40], ha: [46, 54], el2: [72, 40], ha2: [74, 54] },
    hl: ["thigh", "thigh2"],
    front: A("M14 46 H30") + A("M106 46 H90"),
  },
  abduction: {
    back: FLOOR + R(44, 54, 32, 6) + L([60, 60], [60, 84], "mc") + R(28, 58, 6, 14, 3) + R(86, 58, 6, 14, 3),
    pose: { head: [60, 14], sh: [60, 25], hip: [60, 54], kn: [44, 62], ft: [44, 82], kn2: [76, 62], ft2: [76, 82], el: [48, 40], ha: [46, 54], el2: [72, 40], ha2: [74, 54] },
    hl: ["thigh", "thigh2"],
    front: A("M22 42 H8") + A("M98 42 H112"),
  },
  bike: {
    back: FLOOR + L([46, 40], [60, 66], "mcw") + L([60, 66], [82, 30], "mcw") + L([30, 84], [96, 84], "mcw") + L([60, 66], [60, 84], "mc") + C(60, 66, 10) + R(40, 36, 14, 5),
    pose: { head: [68, 12], sh: [62, 21], hip: [48, 36], el: [72, 28], ha: [82, 30], kn: [68, 46], ft: [64, 74], kn2: [62, 50], ft2: [56, 60] },
    hl: ["thigh", "shin"],
    front: P("M86 52 h6 l3 -7 l4 14 l3 -7 h6", "mv"),
  },
  treadmill: {
    back: FLOOR + R(18, 74, 80, 6, 3, "padc") + L([92, 74], [96, 28], "mcw") + L([96, 32], [80, 34], "mc"),
    pose: { head: [56, 12], sh: [56, 22], hip: [56, 46], el: [62, 34], ha: [70, 38], kn: [64, 60], ft: [70, 72], el2: [50, 34], ha2: [46, 42], kn2: [50, 60], ft2: [42, 72] },
    hl: ["thigh", "shin"],
    front: A("M40 66 H24"),
  },
  pushup: {
    back: FLOOR,
    pose: { head: [88, 44], sh: [80, 50], hip: [50, 58], el: [82, 66], ha: [82, 82], kn: [34, 66], ft: [18, 76] },
    hl: ["arm"],
    front: E(76, 55, 6, 3.5, 12) + A("M102 34 V54"),
  },
  pullup: {
    back: L([24, 8], [96, 8], "mcw") + L([28, 8], [28, 4], "mc") + L([92, 8], [92, 4], "mc"),
    pose: { head: [60, 22], sh: [60, 32], hip: [60, 58], el: [44, 24], ha: [40, 8], el2: [76, 24], ha2: [80, 8], kn: [57, 71], ft: [57, 84], kn2: [63, 71], ft2: [63, 84] },
    hl: ["arm", "arm2"],
    front: P("M53 34 L60 50 L67 34 Z", "blobf") + A("M106 46 V26"),
  },
  dips: {
    back: FLOOR + L([34, 52], [92, 52], "mcw") + L([40, 52], [40, 84], "mc") + L([86, 52], [86, 84], "mc"),
    pose: { head: [62, 18], sh: [62, 29], hip: [62, 56], el: [52, 40], ha: [62, 52], kn: [60, 72], ft: [48, 72] },
    hl: ["arm", "fore"],
    front: A("M104 22 V42"),
  },
  squat: {
    back: FLOOR,
    pose: { head: [52, 18], sh: [50, 29], hip: [38, 52], el: [62, 36], ha: [76, 36], kn: [62, 58], ft: [56, 82] },
    hl: ["thigh"],
    front: A("M94 26 V54"),
  },
  lunge: {
    back: FLOOR,
    pose: { head: [58, 12], sh: [58, 23], hip: [58, 50], el: [52, 36], ha: [58, 46], kn: [78, 60], ft: [78, 82], kn2: [46, 76], ft2: [30, 82] },
    hl: ["thigh", "thigh2"],
    front: A("M100 30 V52"),
  },
  crunch: {
    back: FLOOR,
    pose: { head: [28, 58], sh: [36, 66], hip: [54, 80], el: [32, 54], ha: [24, 60], kn: [70, 60], ft: [86, 82] },
    hl: ["torso"],
    front: A("M22 44 Q30 32 44 36"),
  },
  plank: {
    back: FLOOR,
    pose: { head: [92, 50], sh: [82, 58], hip: [50, 62], el: [82, 80], ha: [96, 80], kn: [34, 70], ft: [16, 80] },
    hl: ["torso"],
    front: C(50, 30, 9, "mv") + P("M50 25 V30 L54 33", "mv"),
  },
};

/** 部位だけの絵（自作の種目）。正面の人の形で、その場所を差し色で塗る */
function partArt(part: Part): string {
  const body =
    `<circle class="head" cx="60" cy="14" r="7"/>` +
    L([60, 22], [60, 52], "bd") +
    L([48, 26], [72, 26], "bd") +
    L([48, 26], [42, 44], part === "arm" ? "hl" : "bd") +
    L([42, 44], [40, 58], part === "arm" ? "hl" : "bd") +
    L([72, 26], [78, 44], part === "arm" ? "hl" : "bd") +
    L([78, 44], [80, 58], part === "arm" ? "hl" : "bd") +
    L([56, 52], [52, 68], part === "leg" ? "hl" : "bd") +
    L([52, 68], [52, 84], part === "leg" ? "hl" : "bd") +
    L([64, 52], [68, 68], part === "leg" ? "hl" : "bd") +
    L([68, 68], [68, 84], part === "leg" ? "hl" : "bd");
  const extra: Record<Part, string> = {
    chest: E(55, 31, 5, 3.5) + E(65, 31, 5, 3.5),
    back: P("M52 28 L60 46 L68 28 Z", "blobf"),
    shoulder: C(48, 26, 4.5, "blob") + C(72, 26, 4.5, "blob"),
    arm: "",
    core: R(55, 34, 10, 16, 3, "blobf"),
    leg: "",
    cardio: P("M92 30 c-4 -6 -12 -2 -8 5 l8 8 l8 -8 c4 -7 -4 -11 -8 -5 z", "blobf"),
  };
  return body + extra[part];
}

/** 矢印の形。画面に1回だけ置く（main.ts） */
export const ART_DEFS =
  '<svg class="art-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><marker id="gl-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="mvh"/></marker></defs></svg>';

/** 種目の絵の SVG。知らない絵は部位の絵にする */
export function artSvg(key: string, part: Part, cls = "art"): string {
  const a = ARTS[key];
  const inner = a ? a.back + figure(a.pose, a.hl) + a.front : partArt(key.startsWith("part-") ? (key.slice(5) as Part) : part);
  return `<svg class="${cls}" viewBox="0 0 120 90" aria-hidden="true" focusable="false">${inner}</svg>`;
}

export const ART_KEYS = Object.keys(ARTS);
