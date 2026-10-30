// 種目の絵（ChatGPT の絵を黒地・白い人に整えた webp。public/art/）。鍛える場所はライムで塗ってある。
// 絵の地は常に暗い色（ライト・ダークどちらでも同じ見え方）。
import type { Part } from "./types";

export const ART_KEYS = [
  "chest-press", "lat-pulldown", "shoulder-press", "biceps-curl", "dip-machine", "abdominal",
  "back-extension", "rotary-torso", "leg-press", "leg-extension", "adduction", "abduction",
  "bike", "treadmill", "pushup", "pullup", "dips", "squat", "lunge", "crunch", "plank",
];

/** 種目の絵の img。知らない絵は部位の絵にする */
export function artSvg(key: string, part: Part, cls = "art"): string {
  const file = ART_KEYS.includes(key) ? `ex-${key}` : key.startsWith("part-") ? key : `part-${part}`;
  return `<img class="${cls}" src="./art/${file}.webp" alt="" width="480" height="360" decoding="async">`;
}
