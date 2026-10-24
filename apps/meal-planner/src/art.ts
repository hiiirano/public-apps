// 料理・食材の絵（public/art/*.webp）の割り当て。いまは Microsoft Fluent Emoji 3D（MIT）。
// あとで専用の絵に差し替えるときは、ファイル名を変えずに置き換えればよい（docs/ART_PROMPT.md）。
import type { Recipe } from "./types";

const RULES: [RegExp, string][] = [
  // 朝食・昼食
  [/ピザトースト/, "pizza"],
  [/ホットケーキ|フレンチトースト/, "pancakes"],
  [/サンド/, "sandwich"],
  [/ホットドッグ/, "hot-dog"],
  [/トースト/, "bread"],
  [/タコライス/, "taco"],
  [/おにぎり/, "rice-ball"],
  [/茶漬け/, "teacup-without-handle"],
  [/がゆ|雑炊|豆乳スープ/, "bowl-with-spoon"],
  [/納豆/, "beans"],
  [/バナナ/, "banana"],
  [/りんご/, "red-apple"],
  [/スクランブル|ゆで卵|目玉焼き/, "cooking"],
  [/ウインナー/, "bacon"],
  [/お好み焼き|リゾット|マーボー春雨/, "shallow-pan-of-food"],
  [/しらす丼|ルーロー飯|ライス|ごはん/, "cooked-rice"],
  [/そうめん|ざるそば|ちゃんぽん|ジャージャー麺|カレーうどん/, "steaming-bowl"],
  [/カレー/, "curry-rice"],
  [/焼きそば/, "takeout-box"],
  [/ラーメン|担々麺|うどん|そば|冷やし中華/, "steaming-bowl"],
  [/グラタン|ドリア/, "shallow-pan-of-food"],
  [/パスタ|ナポリタン|カルボナーラ|ペペロン/, "spaghetti"],
  [/餃子|シュウマイ/, "dumpling"],
  [/春巻き/, "stuffed-flatbread"],
  [/漬け丼/, "sushi"],
  [/オムライス|オムレツ|卵|玉|天津飯|だし巻き|ピカタ/, "cooking"],
  [/丼|チャーハン|ピラフ/, "cooked-rice"],
  [/唐揚げ|つくね|ミートボール|酢豚|油淋鶏|ハンバーグ/, "falafel"],
  [/えびフライ|あじフライ/, "fried-shrimp"],
  [/とんかつ/, "cut-of-meat"],
  [/えび/, "shrimp"],
  [/かに/, "crab"],
  [/いか/, "squid"],
  [/アクアパッツァ|鮭|さば|ぶり|たら|あじ|いわし|白身魚/, "fish"],
  [/なます|酢の物|甘酢|サラダ|コールスロー|ラペ/, "green-salad"],
  [/味噌汁|すまし汁|豚汁|かき玉汁/, "bowl-with-spoon"],
  [/スープ|ミネストローネ/, "pot-of-food"],
  [/シチュー|トマト煮|ロールキャベツ|肉じゃが|大根|煮物|クリーム煮/, "pot-of-food"],
  [/豆腐|冷奴|厚揚げ/, "oden"],
  [/鶏|チキン|バンバンジー/, "poultry-leg"],
  [/しょうが焼き|回鍋肉|青椒肉絲|八宝菜|麻婆なす|中華炒め|炒め物/, "shallow-pan-of-food"],
  [/ポーク|豚|牛/, "cut-of-meat"],
  [/なす/, "eggplant"],
  [/ブロッコリー/, "broccoli"],
  [/トマト/, "tomato"],
  [/きゅうり/, "cucumber"],
  [/にんじん|キャロット/, "carrot"],
  [/きのこ|マッシュ/, "mushroom"],
  [/ポテト|じゃが/, "potato"],
  [/さつまいも|かぼちゃ/, "roasted-sweet-potato"],
  [/コーン/, "ear-of-corn"],
  [/落花生/, "peanuts"],
  [/アスパラ|オクラ/, "pea-pod"],
  [/ひじき|きんぴら|れんこん/, "bento-box"],
  [/サラダ|コールスロー|ラタトゥイユ|なます|酢の物|甘酢/, "green-salad"],
  [/おひたし|和え|ほうれん草|小松菜|チンゲン菜|白菜|もやし|バター炒め/, "leafy-green"],
];

/** 料理の絵（ファイル名、拡張子なし） */
export function recipeArt(r: Recipe): string {
  for (const [re, art] of RULES) if (re.test(r.name)) return art;
  if (r.mainType === "魚") return "fish";
  if (r.mainType === "肉") return "cut-of-meat";
  if (r.mainType === "卵") return "cooking";
  if (r.mainType === "麺") return "steaming-bowl";
  if (r.mainType === "豆腐") return "oden";
  return "green-salad";
}

/** 苦手なもの・残り物のボタンの絵 */
export const FOOD_ART: Record<string, string> = {
  牛肉: "cut-of-meat",
  豚肉: "bacon",
  鶏肉: "poultry-leg",
  魚: "fish",
  えび: "shrimp",
  かに: "crab",
  いか: "squid",
  貝: "oyster",
  ねぎ: "herb",
  玉ねぎ: "onion",
  きのこ: "mushroom",
  なす: "eggplant",
  ピーマン: "bell-pepper",
  トマト: "tomato",
  にんじん: "carrot",
  辛いもの: "hot-pepper",
  キャベツ: "leafy-green",
  じゃがいも: "potato",
  卵: "egg",
  ブロッコリー: "broccoli",
  きゅうり: "cucumber",
  コーン: "ear-of-corn",
  牛乳: "glass-of-milk",
  チーズ: "cheese-wedge",
  りんご: "red-apple",
  バナナ: "banana",
  パン: "bread",
};

/** 作る食事の絵 */
export const MEAL_ART: Record<"朝" | "昼" | "晩", string> = { 朝: "sunrise", 昼: "sun", 晩: "crescent-moon" };

export const artSrc = (name: string): string => `./art/${name}.webp`;
