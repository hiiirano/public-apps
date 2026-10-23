// よく食べるもの（ワンタップで記録）。
// 値は 日本食品標準成分表（八訂）の 100g あたりの値に、量を掛けて丸めた目安。
// 一覧と元の値は docs/01_要件定義.md「F4 よく食べるもの」。
import type { Macros } from "./types";

export interface Food extends Macros {
  id: string;
  name: string;
  amount: string;
  art: string;
}

export const FOODS: readonly Food[] = [
  { id: "rice", name: "ごはん", amount: "茶碗1杯 150g", art: "rice", kcal: 234, protein: 3.8, fat: 0.5, carbs: 55.7 },
  { id: "onigiri", name: "おにぎり", amount: "1個 110g", art: "onigiri", kcal: 187, protein: 2.9, fat: 0.3, carbs: 42.8 },
  { id: "bread", name: "食パン", amount: "6枚切り1枚", art: "bread", kcal: 149, protein: 5.3, fat: 2.5, carbs: 27.8 },
  { id: "udon", name: "うどん", amount: "ゆで1玉 250g", art: "udon", kcal: 238, protein: 6.5, fat: 1.0, carbs: 54.0 },
  { id: "pasta", name: "スパゲッティ", amount: "ゆで1皿 250g", art: "spaghetti", kcal: 375, protein: 14.5, fat: 2.3, carbs: 80.5 },
  { id: "egg", name: "卵", amount: "1個 50g", art: "egg", kcal: 71, protein: 6.1, fat: 5.1, carbs: 0.2 },
  { id: "chicken", name: "鶏むね肉", amount: "皮なし 100g", art: "chicken", kcal: 105, protein: 23.3, fat: 1.9, carbs: 0.1 },
  { id: "pork", name: "豚ロース肉", amount: "100g", art: "meat", kcal: 248, protein: 19.3, fat: 19.2, carbs: 0.2 },
  { id: "salmon", name: "さけ", amount: "1切れ 80g", art: "fish", kcal: 99, protein: 17.8, fat: 3.3, carbs: 0.1 },
  { id: "milk", name: "牛乳", amount: "コップ1杯 200mL", art: "milk", kcal: 126, protein: 6.8, fat: 7.8, carbs: 9.9 },
  { id: "cheese", name: "チーズ", amount: "1切れ 20g", art: "cheese", kcal: 63, protein: 4.5, fat: 5.2, carbs: 0.3 },
  { id: "banana", name: "バナナ", amount: "1本 100g", art: "banana", kcal: 93, protein: 1.1, fat: 0.2, carbs: 22.5 },
  { id: "mikan", name: "みかん", amount: "1個 80g", art: "mikan", kcal: 39, protein: 0.6, fat: 0.1, carbs: 9.6 },
  { id: "choco", name: "チョコ", amount: "板1枚 50g", art: "chocolate", kcal: 275, protein: 3.5, fat: 17.1, carbs: 27.9 },
];

export const foodById = (id: string): Food | undefined => FOODS.find((f) => f.id === id);
