// 食材の言い換え辞書と照合（純関数）。
// 「牛肉」「ネギ」「にんじん／人参」などの言い方の違いを、料理データの材料名にそろえて判定する。
import { INGREDIENTS } from "./data/ingredients";
import type { Recipe } from "./types";

/** 表記をそろえる: 全角半角・カタカナ→ひらがな・空白や記号を除く */
export function norm(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s・,，、。.「」『』()（）]/g, "")
    .replace(/(類|全般|系)$/, "");
}

const MEAT_BEEF = ["牛こま切れ肉", "合いびき肉"];
const MEAT_PORK = ["豚こま切れ肉", "豚ロース肉", "豚バラ肉", "豚ひき肉", "合いびき肉", "ハム", "ベーコン", "ウインナー"];
const MEAT_CHICKEN = ["鶏もも肉", "鶏むね肉", "鶏ひき肉"];
const FISH = ["鮭", "さば", "たら", "ぶり", "あじ", "いわし", "まぐろ", "ツナ水煮"];
const SEAFOOD = [...FISH, "えび", "かに", "かにかま", "いか", "あさり"];
const MUSHROOM = ["しめじ", "えのき", "しいたけ", "エリンギ"];

export interface FoodGroup {
  /** 画面に出す名前。保存もこの名前で行う */
  label: string;
  /** 言い換え（ひらがな・カタカナ・漢字・英語） */
  aliases: string[];
  /** 料理データの材料名 */
  members: string[];
  /** 補足（例: 玉ねぎは別、など） */
  note?: string;
}

/** まとめて外す・使うときの分類と言い換え。上にあるものほど優先 */
export const GROUPS: FoodGroup[] = [
  { label: "牛肉", aliases: ["牛", "ぎゅうにく", "ビーフ", "牛こま", "牛ひき肉", "牛バラ"], members: MEAT_BEEF, note: "合いびき肉の料理も外します" },
  { label: "豚肉", aliases: ["豚", "ぶたにく", "ぶた", "ポーク", "豚こま", "豚バラ"], members: MEAT_PORK, note: "合いびき肉・ハム・ベーコン・ウインナーの料理も外します" },
  { label: "鶏肉", aliases: ["鶏", "とりにく", "とり肉", "鳥肉", "とり", "チキン", "かしわ"], members: MEAT_CHICKEN },
  { label: "ひき肉", aliases: ["挽肉", "挽き肉", "ミンチ", "ひきにく"], members: ["鶏ひき肉", "豚ひき肉", "合いびき肉"] },
  { label: "ハム・ベーコン", aliases: ["加工肉", "ハム", "ベーコン", "ウインナー", "ソーセージ", "ウィンナー"], members: ["ハム", "ベーコン", "ウインナー"] },
  { label: "肉", aliases: ["にく", "お肉", "肉類"], members: [...new Set([...MEAT_BEEF, ...MEAT_PORK, ...MEAT_CHICKEN, "鶏ひき肉"])] },
  { label: "魚", aliases: ["さかな", "お魚", "魚類", "鮮魚"], members: FISH, note: "だしのかつお節は外れません（外すなら「かつお節」も）" },
  { label: "青魚", aliases: ["青背", "青物", "青い魚"], members: ["さば", "あじ", "いわし", "ぶり"] },
  { label: "えび", aliases: ["海老", "蝦", "エビ", "小えび", "むきえび"], members: ["えび"] },
  { label: "かに", aliases: ["蟹", "カニ", "かにかま", "カニカマ", "かに風味かまぼこ"], members: ["かに", "かにかま"] },
  { label: "いか", aliases: ["烏賊", "イカ"], members: ["いか"] },
  { label: "貝", aliases: ["かい", "貝類", "あさり", "浅蜊", "浅利", "アサリ"], members: ["あさり"] },
  { label: "魚介", aliases: ["魚介類", "海鮮", "シーフード", "海産物", "魚貝"], members: SEAFOOD },
  { label: "ねぎ", aliases: ["葱", "長ねぎ", "長葱", "白ねぎ", "白葱", "青ねぎ", "青葱", "万能ねぎ", "小ねぎ", "細ねぎ", "九条ねぎ", "わけぎ", "薬味ねぎ"], members: ["長ねぎ"], note: "玉ねぎは外れません（外すなら「玉ねぎ」も）" },
  { label: "玉ねぎ", aliases: ["たまねぎ", "玉葱", "タマネギ", "オニオン", "新玉ねぎ", "紫玉ねぎ"], members: ["玉ねぎ"] },
  { label: "きのこ", aliases: ["茸", "キノコ", "きのこ類"], members: MUSHROOM },
  { label: "しいたけ", aliases: ["椎茸", "シイタケ", "干ししいたけ"], members: ["しいたけ"] },
  { label: "えのき", aliases: ["えのき茸", "えのきだけ", "エノキ"], members: ["えのき"] },
  { label: "しめじ", aliases: ["ぶなしめじ", "シメジ"], members: ["しめじ"] },
  { label: "豆腐", aliases: ["とうふ", "トウフ"], members: ["木綿豆腐", "絹豆腐"] },
  { label: "卵", aliases: ["たまご", "玉子", "鶏卵", "エッグ", "タマゴ"], members: ["卵"] },
  { label: "牛乳", aliases: ["ミルク", "ぎゅうにゅう"], members: ["牛乳"] },
  { label: "乳製品", aliases: ["にゅうせいひん"], members: ["牛乳", "生クリーム", "バター", "チーズ"] },
  { label: "トマト", aliases: ["とまと", "ミニトマト", "プチトマト", "トマト缶", "トマト缶詰"], members: ["トマト", "トマト缶"] },
  { label: "辛いもの", aliases: ["辛い物", "辛いの", "からいもの", "激辛", "辛口", "辛い料理", "からい"], members: ["豆板醤", "唐辛子"] },
  { label: "ごま", aliases: ["胡麻", "ゴマ", "すりごま", "いりごま", "ごま油"], members: ["すりごま", "ごま油"] },
];

/** 材料1つずつの言い換え（漢字・カタカナ・英語など） */
const WORD_ALIASES: Record<string, string[]> = {
  "にんじん": ["人参", "ニンジン", "キャロット"],
  "じゃがいも": ["じゃが芋", "馬鈴薯", "ジャガイモ", "ポテト", "男爵", "メークイン"],
  "なす": ["茄子", "ナス", "なすび", "ナスビ"],
  "きゅうり": ["胡瓜", "キュウリ"],
  "かぼちゃ": ["南瓜", "カボチャ", "パンプキン"],
  "ごぼう": ["牛蒡", "ゴボウ"],
  "れんこん": ["蓮根", "レンコン"],
  "しょうが": ["生姜", "ショウガ", "しょうが", "ジンジャー"],
  "にんにく": ["大蒜", "ニンニク", "ガーリック"],
  "白菜": ["はくさい", "ハクサイ"],
  "大根": ["だいこん", "ダイコン"],
  "小松菜": ["こまつな", "コマツナ"],
  "ほうれん草": ["ほうれんそう", "ホウレンソウ", "法蓮草"],
  "水菜": ["みずな", "ミズナ"],
  "にら": ["韮", "ニラ"],
  "チンゲン菜": ["青梗菜", "ちんげんさい", "チンゲンサイ"],
  "たけのこ水煮": ["たけのこ", "筍", "竹の子", "タケノコ"],
  "さつまいも": ["さつま芋", "薩摩芋", "サツマイモ"],
  "コーン": ["とうもろこし", "トウモロコシ", "玉蜀黍", "スイートコーン"],
  "枝豆": ["えだまめ", "エダマメ"],
  "さやいんげん": ["いんげん", "インゲン", "いんげん豆"],
  "アスパラガス": ["アスパラ"],
  "唐辛子": ["とうがらし", "トウガラシ", "鷹の爪", "たかのつめ"],
  "レモン": ["檸檬", "れもん"],
  "キャベツ": ["きゃべつ", "甘藍"],
  "レタス": ["れたす"],
  "ピーマン": ["ぴーまん"],
  "パプリカ": ["ぱぷりか"],
  "もやし": ["萌やし", "モヤシ"],
  "オクラ": ["おくら"],
  "セロリ": ["せろり", "セロリー"],
  "ブロッコリー": ["ぶろっこりー", "ブロッコリ"],
  "鮭": ["さけ", "しゃけ", "サケ", "シャケ", "サーモン", "塩鮭"],
  "さば": ["鯖", "サバ"],
  "たら": ["鱈", "タラ", "白身魚"],
  "ぶり": ["鰤", "ブリ"],
  "あじ": ["鯵", "アジ"],
  "いわし": ["鰯", "イワシ"],
  "まぐろ": ["鮪", "マグロ", "ツナ"],
  "ツナ水煮": ["ツナ", "ツナ缶", "シーチキン"],
  "乾燥わかめ": ["わかめ", "ワカメ", "若布"],
  "乾燥ひじき": ["ひじき", "ヒジキ", "鹿尾菜"],
  "かつお節": ["鰹節", "おかか", "かつおぶし", "削り節", "だし"],
  "こんにゃく": ["蒟蒻", "コンニャク"],
  "春雨": ["はるさめ", "ハルサメ"],
  "納豆": ["なっとう", "ナットウ"],
  "油揚げ": ["あぶらあげ", "油あげ", "あげ"],
  "厚揚げ": ["あつあげ", "生揚げ"],
  "チーズ": ["ちーず"],
  "バター": ["ばたー"],
  "生クリーム": ["クリーム"],
  "マヨネーズ": ["マヨ"],
  "ご飯": ["ごはん", "白米", "米", "お米", "ライス"],
  "うどん": ["饂飩"],
  "そば": ["蕎麦", "ソバ"],
  "スパゲッティ": ["パスタ", "スパゲティ"],
  "中華麺": ["ラーメン", "焼きそば麺", "中華めん"],
  "くるみ": ["胡桃", "クルミ"],
  "落花生": ["ピーナッツ", "らっかせい", "ピーナツ"],
  "味噌": ["みそ", "ミソ"],
  "醤油": ["しょうゆ", "しょう油", "ショウユ"],
  "米酢": ["酢", "お酢", "す"],
};

const INGREDIENT_NAMES = Object.keys(INGREDIENTS);
const NORM_NAME = new Map(INGREDIENT_NAMES.map((n) => [n, norm(n)]));

/** 正規化した言葉 → 材料名の集合 */
const DICT = new Map<string, { label: string; members: string[]; note?: string }>();
function add(word: string, label: string, members: string[], note?: string) {
  const k = norm(word);
  if (k && !DICT.has(k)) DICT.set(k, { label, members, note });
}
for (const g of GROUPS) {
  add(g.label, g.label, g.members, g.note);
  for (const a of g.aliases) add(a, g.label, g.members, g.note);
}
for (const n of INGREDIENT_NAMES) add(n, n, [n]);
for (const [n, aliases] of Object.entries(WORD_ALIASES)) {
  if (!INGREDIENTS[n]) continue;
  for (const a of aliases) add(a, n, [n]);
}

export interface Resolved {
  /** 入力された言葉（そのまま） */
  term: string;
  /** 辞書での呼び名（例: 「ネギ」→「ねぎ」） */
  label: string;
  /** 該当する材料名。空なら料理データに無い言葉 */
  ingredients: string[];
  /** 辞書で見つかったか（false なら部分一致や料理名で探した） */
  known: boolean;
  note?: string;
}

/** 1つの言葉を材料名にそろえる */
export function resolveTerm(term: string): Resolved {
  const t = term.trim();
  const k = norm(t);
  const hit = DICT.get(k);
  if (hit) return { term: t, label: hit.label, ingredients: [...hit.members], known: true, note: hit.note };
  // 辞書に無い言葉は、材料名の部分一致で探す（2文字以上）。例「もも肉」→ 鶏もも肉
  if (k.length >= 2) {
    const partial = INGREDIENT_NAMES.filter((n) => NORM_NAME.get(n)!.includes(k));
    if (partial.length) return { term: t, label: t, ingredients: partial, known: false };
  }
  return { term: t, label: t, ingredients: [], known: false };
}

/** 料理がその言葉に当たるか。材料で見つからない言葉は料理名でも探す（例「カレー」） */
export function recipeMatches(r: Recipe, res: Resolved, byName: boolean): boolean {
  if (res.ingredients.length) return r.ingredients.some((i) => res.ingredients.includes(i.name));
  if (!byName) return false;
  const k = norm(res.term);
  return k.length >= 1 && norm(r.name).includes(k);
}

/** 入力欄の文字を言葉に分ける（「、」「,」空白・改行・「と」区切り） */
export function splitTerms(s: string): string[] {
  return s
    .split(/[、,，\s\n/／・]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.slice(0, 20));
}

/** 同じ意味の言葉を1つにまとめて追加する（「ネギ」と「ねぎ」を二重にしない） */
export function addTerms(list: string[], words: string[]): string[] {
  const out = [...list];
  for (const w of words) {
    const key = resolveTerm(w).label;
    if (!out.some((x) => resolveTerm(x).label === key || norm(x) === norm(w))) out.push(w);
  }
  return out.slice(0, 30);
}
