// 食材の絵と「よく買う物」の一覧。絵は public/art/<art>.webp

export type Place = "fridge" | "freezer" | "shelf";
export const PLACES: readonly Place[] = ["fridge", "freezer", "shelf"];
export const PLACE_LABEL: Record<Place, string> = { fridge: "冷蔵庫", freezer: "冷凍庫", shelf: "棚" };

export const ARTS = [
  "milk", "egg", "chicken", "bacon", "meat", "fish", "cheese", "butter", "greens", "tomato", "cucumber",
  "carrot", "broccoli", "mushroom", "eggplant", "apple", "strawberry", "lemon", "juice", "rice", "shrimp",
  "icecream", "noodle", "bread", "onion", "potato", "banana", "can", "onigiri", "bento", "tea", "plate",
] as const;
export type Art = (typeof ARTS)[number];
export const isArt = (v: unknown): v is Art => typeof v === "string" && (ARTS as readonly string[]).includes(v);

export interface Preset {
  name: string;
  art: Art;
  place: Place;
  /** 買った日から期限までのおおよその日数（null = 期限なし） */
  days: number | null;
  /** 名前の言いかえ（自由入力から絵を当てるとき使う） */
  words?: string[];
}

/** よく買う物。並びは「よく使う順」になるまでの初期の順番 */
export const PRESETS: readonly Preset[] = [
  { name: "牛乳", art: "milk", place: "fridge", days: 7, words: ["ミルク", "ぎゅうにゅう", "豆乳"] },
  { name: "卵", art: "egg", place: "fridge", days: 14, words: ["たまご", "玉子", "タマゴ"] },
  { name: "鶏肉", art: "chicken", place: "fridge", days: 2, words: ["とり", "鳥", "チキン", "ささみ", "むね肉", "もも肉"] },
  { name: "豚肉", art: "bacon", place: "fridge", days: 3, words: ["ぶた", "ベーコン", "ハム", "ひき肉"] },
  { name: "牛肉", art: "meat", place: "fridge", days: 3, words: ["ぎゅう", "肉", "ステーキ"] },
  { name: "魚", art: "fish", place: "fridge", days: 2, words: ["さかな", "鮭", "さけ", "さば", "刺身", "あじ"] },
  { name: "キャベツ", art: "greens", place: "fridge", days: 7, words: ["レタス", "白菜", "はくさい", "ほうれん草", "小松菜", "ねぎ", "野菜"] },
  { name: "トマト", art: "tomato", place: "fridge", days: 5, words: ["ミニトマト"] },
  { name: "にんじん", art: "carrot", place: "fridge", days: 14, words: ["人参", "ニンジン", "大根", "だいこん"] },
  { name: "きゅうり", art: "cucumber", place: "fridge", days: 5, words: ["キュウリ", "胡瓜", "ピーマン"] },
  { name: "ブロッコリー", art: "broccoli", place: "fridge", days: 4 },
  { name: "きのこ", art: "mushroom", place: "fridge", days: 5, words: ["しめじ", "えのき", "しいたけ", "まいたけ", "キノコ"] },
  { name: "なす", art: "eggplant", place: "fridge", days: 5, words: ["ナス", "茄子"] },
  { name: "チーズ", art: "cheese", place: "fridge", days: 30 },
  { name: "バター", art: "butter", place: "fridge", days: 60, words: ["マーガリン"] },
  { name: "豆腐・納豆", art: "bento", place: "fridge", days: 5, words: ["豆腐", "とうふ", "納豆", "なっとう", "ヨーグルト"] },
  { name: "作りおき", art: "bento", place: "fridge", days: 3, words: ["残り物", "おかず", "お弁当", "弁当"] },
  { name: "りんご", art: "apple", place: "fridge", days: 21, words: ["リンゴ", "林檎", "果物"] },
  { name: "いちご", art: "strawberry", place: "fridge", days: 3, words: ["イチゴ", "苺"] },
  { name: "レモン", art: "lemon", place: "fridge", days: 14, words: ["みかん", "オレンジ"] },
  { name: "ジュース", art: "juice", place: "fridge", days: 7, words: ["飲み物", "麦茶"] },
  { name: "ごはん", art: "rice", place: "freezer", days: 30, words: ["ご飯", "冷凍ごはん", "米", "お米"] },
  { name: "えび", art: "shrimp", place: "freezer", days: 60, words: ["エビ", "海老", "シーフード"] },
  { name: "冷凍めん", art: "noodle", place: "freezer", days: 60, words: ["うどん", "そば", "ラーメン", "麺", "パスタ"] },
  { name: "アイス", art: "icecream", place: "freezer", days: null, words: ["アイスクリーム"] },
  { name: "パン", art: "bread", place: "shelf", days: 4, words: ["食パン", "ロールパン"] },
  { name: "たまねぎ", art: "onion", place: "shelf", days: 30, words: ["玉ねぎ", "タマネギ", "玉葱"] },
  { name: "じゃがいも", art: "potato", place: "shelf", days: 30, words: ["ジャガイモ", "さつまいも", "いも"] },
  { name: "バナナ", art: "banana", place: "shelf", days: 4 },
  { name: "おにぎり", art: "onigiri", place: "shelf", days: 1 },
  { name: "缶詰", art: "can", place: "shelf", days: 365, words: ["缶", "ツナ", "レトルト"] },
  { name: "お茶", art: "tea", place: "shelf", days: 180, words: ["茶", "コーヒー", "紅茶"] },
];

/** 何も押していないときに先に出す12種（冷蔵・冷凍・棚を混ぜる） */
export const FIRST_PICKS: readonly string[] = ["牛乳", "卵", "パン", "鶏肉", "豚肉", "魚", "キャベツ", "トマト", "たまねぎ", "豆腐・納豆", "ごはん", "バナナ"];

/** 絵の読み上げ名（画像の代わりの文字） */
export const ART_LABEL: Record<Art, string> = {
  milk: "牛乳", egg: "卵", chicken: "鶏肉", bacon: "豚肉", meat: "牛肉", fish: "魚", cheese: "チーズ", butter: "バター",
  greens: "葉もの野菜", tomato: "トマト", cucumber: "きゅうり", carrot: "にんじん", broccoli: "ブロッコリー",
  mushroom: "きのこ", eggplant: "なす", apple: "りんご", strawberry: "いちご", lemon: "レモン", juice: "飲み物",
  rice: "ごはん", shrimp: "えび", icecream: "アイス", noodle: "めん", bread: "パン", onion: "たまねぎ",
  potato: "いも", banana: "バナナ", can: "缶詰", onigiri: "おにぎり", bento: "おかず", tea: "お茶", plate: "その他",
};

/** 自由に入れた名前から、いちばん近い「よく買う物」を探す（なければ null） */
export function guessPreset(name: string): Preset | null {
  const n = name.trim();
  if (!n) return null;
  const exact = PRESETS.find((p) => p.name === n || p.words?.includes(n));
  if (exact) return exact;
  let best: Preset | null = null;
  let bestLen = 0;
  for (const p of PRESETS) {
    for (const w of [p.name, ...(p.words ?? [])]) {
      if (w.length > bestLen && n.includes(w)) {
        best = p;
        bestLen = w.length;
      }
    }
  }
  return best;
}
