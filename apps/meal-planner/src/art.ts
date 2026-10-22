import type { Recipe } from "./types";
/** Fluent Flat only. Match the dish first, then fall back to its main ingredient/type. */
export function recipeArt(r: Recipe): string {
  const n = r.name;
  if (/カレー/.test(n)) return "curry-rice";
  if (/ラーメン|担々麺|うどん|そば|中華$/.test(n)) return "steaming-bowl";
  if (/パスタ|スパゲッティ|ナポリタン|カルボナーラ|ペペロン/.test(n)) return "spaghetti";
  if (/餃子|シュウマイ/.test(n)) return "dumpling";
  if (/サラダ|ラペ|コールスロー|和え|おひたし|なます|漬け|煮びたし/.test(n) && r.role === "side") return "green-salad";
  if (/スープ|汁|シチュー|煮物|煮$/.test(n)) return "pot-of-food";
  if (/えび|かに/.test(n)) return "fried-shrimp";
  if (/丼|ご飯|チャーハン|ピラフ|天津飯|ドリア|オムライス/.test(n)) return "cooked-rice";
  if (/卵|玉|オムレツ/.test(n)) return "cooking";
  if (/鶏|チキン|バンバンジー/.test(n)) return "poultry-leg";
  if (r.mainType === "魚") return "fish";
  if (r.mainType === "肉") return "cut-of-meat";
  if (r.mainType === "卵") return "cooking";
  if (r.mainType === "麺") return "steaming-bowl";
  if (r.mainType === "豆腐") return "pot-of-food";
  return "green-salad";
}
