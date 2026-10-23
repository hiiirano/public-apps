import type { Recipe } from "../types";

// 分量は2人前。加工品は製品差を考慮した保守的なアレルゲン表記。
export const RECIPES: Recipe[] = [
  {
    "id": "和-main-001",
    "name": "豚のしょうが焼き",
    "role": "main",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚ロース肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しょうが",
        "qty": 15.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-main-002",
    "name": "鶏の照り焼き",
    "role": "main",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏もも肉",
        "qty": 300.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "醤油",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-main-003",
    "name": "肉じゃが",
    "role": "main",
    "genre": "和",
    "timeMin": 35,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "牛こま切れ肉",
        "qty": 200.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "じゃがいも",
        "qty": 300.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "玉ねぎ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 300.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-main-004",
    "name": "親子丼",
    "role": "main",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏もも肉",
        "qty": 200.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "卵",
        "qty": 3.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "玉ねぎ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "醤油",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "卵"
  },
  {
    "id": "和-main-005",
    "name": "牛丼",
    "role": "main",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "牛こま切れ肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "醤油",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 150.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-main-006",
    "name": "豚丼",
    "role": "main",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚こま切れ肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "醤油",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-main-007",
    "name": "鶏の唐揚げ",
    "role": "main",
    "genre": "和",
    "timeMin": 30,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏もも肉",
        "qty": 300.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "しょうが",
        "qty": 10.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "酒",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 40.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-main-008",
    "name": "とんかつ",
    "role": "main",
    "genre": "和",
    "timeMin": 30,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚ロース肉",
        "qty": 300.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "小麦粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "卵",
        "qty": 1.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "パン粉",
        "qty": 50.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "キャベツ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ウスターソース",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-main-009",
    "name": "鶏つくね",
    "role": "main",
    "genre": "和",
    "timeMin": 25,
    "allergens": [
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏ひき肉",
        "qty": 300.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "長ねぎ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "卵",
        "qty": 1.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "片栗粉",
        "qty": 15.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-main-010",
    "name": "豆腐ハンバーグ",
    "role": "main",
    "genre": "和",
    "timeMin": 25,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "木綿豆腐",
        "qty": 200.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "鶏ひき肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "卵",
        "qty": 1.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "パン粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "ポン酢",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "豆腐"
  },
  {
    "id": "和-main-011",
    "name": "鮭の塩焼き",
    "role": "main",
    "genre": "和",
    "timeMin": 15,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鮭",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "大根",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "和-main-012",
    "name": "さばの味噌煮",
    "role": "main",
    "genre": "和",
    "timeMin": 25,
    "allergens": [
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "さば",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "味噌",
        "qty": 30.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "しょうが",
        "qty": 15.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "酒",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 15.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 150.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "和-main-013",
    "name": "ぶりの照り焼き",
    "role": "main",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "ぶり",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "醤油",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "和-main-014",
    "name": "たらの酒蒸し",
    "role": "main",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "たら",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "白菜",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しめじ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "酒",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ポン酢",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "和-main-015",
    "name": "鮭のちゃんちゃん焼き",
    "role": "main",
    "genre": "和",
    "timeMin": 25,
    "allergens": [
      "乳",
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鮭",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "キャベツ",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 70.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "味噌",
        "qty": 30.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "バター",
        "qty": 15.0,
        "unit": "g",
        "category": "乳・卵"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "和-main-016",
    "name": "あじの南蛮漬け",
    "role": "main",
    "genre": "和",
    "timeMin": 30,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "あじ",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "片栗粉",
        "qty": 25.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "米酢",
        "qty": 40.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 15.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 60.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "和-main-017",
    "name": "いわしのしょうが煮",
    "role": "main",
    "genre": "和",
    "timeMin": 30,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "いわし",
        "qty": 300.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "しょうが",
        "qty": 20.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "酒",
        "qty": 40.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 150.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "和-main-018",
    "name": "肉豆腐",
    "role": "main",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "木綿豆腐",
        "qty": 300.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "牛こま切れ肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "長ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 150.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "豆腐"
  },
  {
    "id": "和-main-019",
    "name": "厚揚げと小松菜の煮物",
    "role": "main",
    "genre": "和",
    "timeMin": 15,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "厚揚げ",
        "qty": 250.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "小松菜",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "かつお節",
        "qty": 3.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "水",
        "qty": 150.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "豆腐"
  },
  {
    "id": "和-main-020",
    "name": "豚バラ大根",
    "role": "main",
    "genre": "和",
    "timeMin": 30,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚バラ肉",
        "qty": 200.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "大根",
        "qty": 400.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しょうが",
        "qty": 10.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 300.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-main-021",
    "name": "鶏大根",
    "role": "main",
    "genre": "和",
    "timeMin": 30,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏もも肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "大根",
        "qty": 400.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 300.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-main-022",
    "name": "豚しゃぶサラダ",
    "role": "main",
    "genre": "和",
    "timeMin": 15,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚ロース肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "レタス",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "きゅうり",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "トマト",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ポン酢",
        "qty": 40.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-main-023",
    "name": "鶏むね肉のポン酢焼き",
    "role": "main",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏むね肉",
        "qty": 300.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "片栗粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "ポン酢",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-main-024",
    "name": "和風きのこパスタ",
    "role": "main",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "スパゲッティ",
        "qty": 200.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "しめじ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "えのき",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "バター",
        "qty": 20.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "和-main-025",
    "name": "焼きうどん",
    "role": "main",
    "genre": "和",
    "timeMin": 15,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "うどん",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "豚こま切れ肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "キャベツ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "和-main-026",
    "name": "肉うどん",
    "role": "main",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "うどん",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "牛こま切れ肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "長ねぎ",
        "qty": 80.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "めんつゆ",
        "qty": 60.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 500.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "和-main-027",
    "name": "月見そば",
    "role": "main",
    "genre": "和",
    "timeMin": 15,
    "allergens": [
      "そば",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "そば",
        "qty": 200.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "卵",
        "qty": 2.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "長ねぎ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "めんつゆ",
        "qty": 60.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 500.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "和-main-028",
    "name": "にら玉丼",
    "role": "main",
    "genre": "和",
    "timeMin": 15,
    "allergens": [
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "卵",
        "qty": 4.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "にら",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "卵"
  },
  {
    "id": "和-main-029",
    "name": "納豆オムレツ",
    "role": "main",
    "genre": "和",
    "timeMin": 15,
    "allergens": [
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "卵",
        "qty": 4.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "納豆",
        "qty": 100.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "長ねぎ",
        "qty": 50.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "卵"
  },
  {
    "id": "和-main-030",
    "name": "まぐろの漬け丼",
    "role": "main",
    "genre": "和",
    "timeMin": 15,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "まぐろ",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "醤油",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "すりごま",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "和-main-031",
    "name": "鶏そぼろ丼",
    "role": "main",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏ひき肉",
        "qty": 200.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "卵",
        "qty": 2.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "しょうが",
        "qty": 10.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 15.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-032",
    "name": "ハンバーグ",
    "role": "main",
    "genre": "洋",
    "timeMin": 30,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "合いびき肉",
        "qty": 300.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "卵",
        "qty": 1.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "パン粉",
        "qty": 30.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "牛乳",
        "qty": 30.0,
        "unit": "ml",
        "category": "乳・卵"
      },
      {
        "name": "ケチャップ",
        "qty": 30.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ウスターソース",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-033",
    "name": "チキンソテー",
    "role": "main",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏もも肉",
        "qty": 300.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "こしょう",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "オリーブオイル",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-034",
    "name": "ポークチャップ",
    "role": "main",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚ロース肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ケチャップ",
        "qty": 40.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ウスターソース",
        "qty": 15.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-035",
    "name": "ビーフカレー",
    "role": "main",
    "genre": "洋",
    "timeMin": 40,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "牛こま切れ肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "じゃがいも",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "カレールウ",
        "qty": 50.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-036",
    "name": "チキンカレー",
    "role": "main",
    "genre": "洋",
    "timeMin": 35,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏もも肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "じゃがいも",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "カレールウ",
        "qty": 50.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-037",
    "name": "キーマカレー",
    "role": "main",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "合いびき肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 80.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "トマト缶",
        "qty": 200.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "カレールウ",
        "qty": 40.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-038",
    "name": "鶏のクリームシチュー",
    "role": "main",
    "genre": "洋",
    "timeMin": 35,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏もも肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "じゃがいも",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "玉ねぎ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "シチュールウ",
        "qty": 50.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "牛乳",
        "qty": 200.0,
        "unit": "ml",
        "category": "乳・卵"
      },
      {
        "name": "水",
        "qty": 300.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-039",
    "name": "ロールキャベツ",
    "role": "main",
    "genre": "洋",
    "timeMin": 45,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "合いびき肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "キャベツ",
        "qty": 350.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "卵",
        "qty": 1.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "パン粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "トマト缶",
        "qty": 200.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "コンソメ",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 200.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-040",
    "name": "ミートボールのトマト煮",
    "role": "main",
    "genre": "洋",
    "timeMin": 30,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "合いびき肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "卵",
        "qty": 1.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "パン粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "トマト缶",
        "qty": 300.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "オリーブオイル",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-041",
    "name": "鶏肉のトマト煮",
    "role": "main",
    "genre": "洋",
    "timeMin": 30,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏もも肉",
        "qty": 300.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "トマト缶",
        "qty": 300.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "オリーブオイル",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-042",
    "name": "鮭のムニエル",
    "role": "main",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "乳",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鮭",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "小麦粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "バター",
        "qty": 20.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "レモン",
        "qty": 30.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "洋-main-043",
    "name": "たらのムニエル",
    "role": "main",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "乳",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "たら",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "小麦粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "バター",
        "qty": 20.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "レモン",
        "qty": 30.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "洋-main-044",
    "name": "鮭のクリーム煮",
    "role": "main",
    "genre": "洋",
    "timeMin": 25,
    "allergens": [
      "乳"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鮭",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しめじ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "生クリーム",
        "qty": 100.0,
        "unit": "ml",
        "category": "乳・卵"
      },
      {
        "name": "牛乳",
        "qty": 100.0,
        "unit": "ml",
        "category": "乳・卵"
      },
      {
        "name": "バター",
        "qty": 15.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "洋-main-045",
    "name": "えびフライ",
    "role": "main",
    "genre": "洋",
    "timeMin": 30,
    "allergens": [
      "えび",
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "えび",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "小麦粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "卵",
        "qty": 1.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "パン粉",
        "qty": 50.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "キャベツ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "洋-main-046",
    "name": "あじフライ",
    "role": "main",
    "genre": "洋",
    "timeMin": 30,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "あじ",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "小麦粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "卵",
        "qty": 1.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "パン粉",
        "qty": 50.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ウスターソース",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "洋-main-047",
    "name": "たらのアクアパッツァ",
    "role": "main",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "たら",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "あさり",
        "qty": 200.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "トマト",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オリーブオイル",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "酒",
        "qty": 50.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "洋-main-048",
    "name": "オムライス",
    "role": "main",
    "genre": "洋",
    "timeMin": 25,
    "allergens": [
      "乳",
      "卵"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "卵",
        "qty": 4.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "鶏もも肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "ケチャップ",
        "qty": 50.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "バター",
        "qty": 20.0,
        "unit": "g",
        "category": "乳・卵"
      }
    ],
    "mainType": "卵"
  },
  {
    "id": "洋-main-049",
    "name": "チーズオムレツ",
    "role": "main",
    "genre": "洋",
    "timeMin": 15,
    "allergens": [
      "乳",
      "卵"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "卵",
        "qty": 4.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "チーズ",
        "qty": 60.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "牛乳",
        "qty": 30.0,
        "unit": "ml",
        "category": "乳・卵"
      },
      {
        "name": "バター",
        "qty": 15.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "塩",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "卵"
  },
  {
    "id": "洋-main-050",
    "name": "スパニッシュオムレツ",
    "role": "main",
    "genre": "洋",
    "timeMin": 25,
    "allergens": [
      "卵"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "卵",
        "qty": 4.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "じゃがいも",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "パプリカ",
        "qty": 80.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オリーブオイル",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "卵"
  },
  {
    "id": "洋-main-051",
    "name": "ナポリタン",
    "role": "main",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "スパゲッティ",
        "qty": 200.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "ウインナー",
        "qty": 100.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ピーマン",
        "qty": 80.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ケチャップ",
        "qty": 60.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "バター",
        "qty": 15.0,
        "unit": "g",
        "category": "乳・卵"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "洋-main-052",
    "name": "ミートソースパスタ",
    "role": "main",
    "genre": "洋",
    "timeMin": 30,
    "allergens": [
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "スパゲッティ",
        "qty": 200.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "合いびき肉",
        "qty": 200.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 70.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "トマト缶",
        "qty": 300.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "塩",
        "qty": 3.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "オリーブオイル",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "洋-main-053",
    "name": "カルボナーラ",
    "role": "main",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "スパゲッティ",
        "qty": 200.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "ベーコン",
        "qty": 100.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "卵",
        "qty": 2.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "チーズ",
        "qty": 40.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "牛乳",
        "qty": 100.0,
        "unit": "ml",
        "category": "乳・卵"
      },
      {
        "name": "こしょう",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "洋-main-054",
    "name": "ツナトマトパスタ",
    "role": "main",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "スパゲッティ",
        "qty": 200.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "ツナ水煮",
        "qty": 140.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "トマト缶",
        "qty": 300.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オリーブオイル",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "洋-main-055",
    "name": "えびのクリームパスタ",
    "role": "main",
    "genre": "洋",
    "timeMin": 25,
    "allergens": [
      "えび",
      "乳",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "スパゲッティ",
        "qty": 200.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "えび",
        "qty": 200.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "牛乳",
        "qty": 200.0,
        "unit": "ml",
        "category": "乳・卵"
      },
      {
        "name": "生クリーム",
        "qty": 100.0,
        "unit": "ml",
        "category": "乳・卵"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "バター",
        "qty": 15.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "洋-main-056",
    "name": "ペペロンチーノ",
    "role": "main",
    "genre": "洋",
    "timeMin": 15,
    "allergens": [
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "スパゲッティ",
        "qty": 200.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "唐辛子",
        "qty": 1.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんにく",
        "qty": 10.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オリーブオイル",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 3.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "こしょう",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "洋-main-057",
    "name": "マカロニグラタン",
    "role": "main",
    "genre": "洋",
    "timeMin": 35,
    "allergens": [
      "乳",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "マカロニ",
        "qty": 100.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "鶏もも肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "牛乳",
        "qty": 300.0,
        "unit": "ml",
        "category": "乳・卵"
      },
      {
        "name": "小麦粉",
        "qty": 25.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "バター",
        "qty": 25.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "チーズ",
        "qty": 60.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "洋-main-058",
    "name": "チキンドリア",
    "role": "main",
    "genre": "洋",
    "timeMin": 35,
    "allergens": [
      "乳",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "鶏もも肉",
        "qty": 200.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "牛乳",
        "qty": 250.0,
        "unit": "ml",
        "category": "乳・卵"
      },
      {
        "name": "小麦粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "バター",
        "qty": 20.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "チーズ",
        "qty": 60.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-059",
    "name": "豆腐ステーキのきのこソース",
    "role": "main",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "木綿豆腐",
        "qty": 400.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "しめじ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "小麦粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "バター",
        "qty": 20.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "豆腐"
  },
  {
    "id": "洋-main-060",
    "name": "厚揚げのチーズ焼き",
    "role": "main",
    "genre": "洋",
    "timeMin": 15,
    "allergens": [
      "乳",
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "厚揚げ",
        "qty": 300.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "チーズ",
        "qty": 60.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "トマト",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ケチャップ",
        "qty": 30.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "豆腐"
  },
  {
    "id": "洋-main-061",
    "name": "豚肉のピカタ",
    "role": "main",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "乳",
      "卵",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚ロース肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "卵",
        "qty": 2.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "小麦粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "チーズ",
        "qty": 20.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "なたね油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "洋-main-062",
    "name": "えびピラフ",
    "role": "main",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "えび",
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "えび",
        "qty": 180.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "コーン",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "バター",
        "qty": 20.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "コンソメ",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "中-main-063",
    "name": "麻婆豆腐",
    "role": "main",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "木綿豆腐",
        "qty": 400.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "豚ひき肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "長ねぎ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しょうが",
        "qty": 10.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "豆板醤",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "味噌",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 10.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 150.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "豆腐"
  },
  {
    "id": "中-main-064",
    "name": "麻婆なす",
    "role": "main",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "なす",
        "qty": 300.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "豚ひき肉",
        "qty": 180.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "長ねぎ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "豆板醤",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "味噌",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 10.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "中-main-065",
    "name": "回鍋肉",
    "role": "main",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚バラ肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "キャベツ",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ピーマン",
        "qty": 80.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "甜麺醤",
        "qty": 25.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "中-main-066",
    "name": "青椒肉絲",
    "role": "main",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "牛こま切れ肉",
        "qty": 200.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "ピーマン",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "たけのこ水煮",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オイスターソース",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 10.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "中-main-067",
    "name": "酢豚",
    "role": "main",
    "genre": "中",
    "timeMin": 30,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚ロース肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ピーマン",
        "qty": 80.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "片栗粉",
        "qty": 30.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "ケチャップ",
        "qty": 30.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 50.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "中-main-068",
    "name": "油淋鶏",
    "role": "main",
    "genre": "中",
    "timeMin": 30,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏もも肉",
        "qty": 300.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "長ねぎ",
        "qty": 80.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しょうが",
        "qty": 10.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "片栗粉",
        "qty": 40.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "醤油",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 15.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 80.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "中-main-069",
    "name": "鶏肉とピーマンの中華炒め",
    "role": "main",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏もも肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "ピーマン",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オイスターソース",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "中-main-070",
    "name": "八宝菜",
    "role": "main",
    "genre": "中",
    "timeMin": 25,
    "allergens": [
      "えび",
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚こま切れ肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "えび",
        "qty": 100.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "白菜",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 70.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しいたけ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 15.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 150.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "中-main-071",
    "name": "中華丼",
    "role": "main",
    "genre": "中",
    "timeMin": 25,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚こま切れ肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "白菜",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 70.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しいたけ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 15.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 150.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "中-main-072",
    "name": "焼き餃子",
    "role": "main",
    "genre": "中",
    "timeMin": 35,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚ひき肉",
        "qty": 200.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "キャベツ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にら",
        "qty": 50.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "餃子の皮",
        "qty": 150.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "しょうが",
        "qty": 10.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "中-main-073",
    "name": "春巻き",
    "role": "main",
    "genre": "中",
    "timeMin": 40,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚ひき肉",
        "qty": 180.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "たけのこ水煮",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "春雨",
        "qty": 40.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "しいたけ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "春巻きの皮",
        "qty": 120.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "オイスターソース",
        "qty": 15.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 10.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "中-main-074",
    "name": "シュウマイ",
    "role": "main",
    "genre": "中",
    "timeMin": 30,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚ひき肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "シュウマイの皮",
        "qty": 120.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "片栗粉",
        "qty": 20.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "中-main-075",
    "name": "えびチリ",
    "role": "main",
    "genre": "中",
    "timeMin": 25,
    "allergens": [
      "えび",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "えび",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "長ねぎ",
        "qty": 80.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しょうが",
        "qty": 10.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ケチャップ",
        "qty": 40.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "豆板醤",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 15.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 80.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "中-main-076",
    "name": "えびマヨ",
    "role": "main",
    "genre": "中",
    "timeMin": 25,
    "allergens": [
      "えび",
      "乳",
      "卵",
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "えび",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "片栗粉",
        "qty": 30.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "マヨネーズ",
        "qty": 40.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ケチャップ",
        "qty": 15.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "牛乳",
        "qty": 15.0,
        "unit": "ml",
        "category": "乳・卵"
      },
      {
        "name": "なたね油",
        "qty": 50.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "中-main-077",
    "name": "白身魚の甘酢あん",
    "role": "main",
    "genre": "中",
    "timeMin": 25,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "たら",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ピーマン",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "片栗粉",
        "qty": 25.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "米酢",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "中-main-078",
    "name": "いかとチンゲン菜の炒め物",
    "role": "main",
    "genre": "中",
    "timeMin": 15,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "いか",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "チンゲン菜",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "中-main-079",
    "name": "鮭の中華蒸し",
    "role": "main",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鮭",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "長ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しょうが",
        "qty": 15.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "酒",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "中-main-080",
    "name": "かに玉",
    "role": "main",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "かに",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "卵",
        "qty": 4.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "かに",
        "qty": 100.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "長ねぎ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "片栗粉",
        "qty": 10.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "卵"
  },
  {
    "id": "中-main-081",
    "name": "天津飯",
    "role": "main",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "えび",
      "かに",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "卵",
        "qty": 4.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "かにかま",
        "qty": 100.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "長ねぎ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 10.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "卵"
  },
  {
    "id": "中-main-082",
    "name": "トマトと卵の中華炒め",
    "role": "main",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "卵",
        "qty": 4.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "トマト",
        "qty": 300.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 4.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "卵"
  },
  {
    "id": "中-main-083",
    "name": "にら玉炒め",
    "role": "main",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "卵",
        "qty": 4.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "にら",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "卵"
  },
  {
    "id": "中-main-084",
    "name": "五目チャーハン",
    "role": "main",
    "genre": "中",
    "timeMin": 15,
    "allergens": [
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "卵",
        "qty": 2.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "豚こま切れ肉",
        "qty": 100.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "長ねぎ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 50.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "卵"
  },
  {
    "id": "中-main-085",
    "name": "えびチャーハン",
    "role": "main",
    "genre": "中",
    "timeMin": 15,
    "allergens": [
      "えび",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "ご飯",
        "qty": 400.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "卵",
        "qty": 2.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "えび",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "長ねぎ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ],
    "mainType": "魚"
  },
  {
    "id": "中-main-086",
    "name": "上海風焼きそば",
    "role": "main",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "中華麺",
        "qty": 300.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "豚こま切れ肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "キャベツ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "もやし",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オイスターソース",
        "qty": 25.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "中-main-087",
    "name": "あんかけ焼きそば",
    "role": "main",
    "genre": "中",
    "timeMin": 25,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "中華麺",
        "qty": 300.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "豚こま切れ肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "白菜",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 70.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 15.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "なたね油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 200.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "中-main-088",
    "name": "醤油ラーメン",
    "role": "main",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "中華麺",
        "qty": 300.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "長ねぎ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "もやし",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "卵",
        "qty": 2.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "醤油",
        "qty": 40.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 700.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "中-main-089",
    "name": "担々麺",
    "role": "main",
    "genre": "中",
    "timeMin": 25,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "中華麺",
        "qty": 300.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "豚ひき肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "チンゲン菜",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "すりごま",
        "qty": 30.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "味噌",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "豆板醤",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 8.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 600.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "中-main-090",
    "name": "冷やし中華",
    "role": "main",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "中華麺",
        "qty": 300.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "卵",
        "qty": 2.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "ハム",
        "qty": 100.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "きゅうり",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "トマト",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 15.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "麺"
  },
  {
    "id": "中-main-091",
    "name": "厚揚げの中華あん",
    "role": "main",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "厚揚げ",
        "qty": 300.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "白菜",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しいたけ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 15.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 150.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "豆腐"
  },
  {
    "id": "中-main-092",
    "name": "豆腐とえびの塩煮",
    "role": "main",
    "genre": "中",
    "timeMin": 15,
    "allergens": [
      "えび",
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "絹豆腐",
        "qty": 300.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "えび",
        "qty": 180.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "長ねぎ",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しょうが",
        "qty": 10.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 10.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 150.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "豆腐"
  },
  {
    "id": "中-main-093",
    "name": "豚肉ともやしの中華炒め",
    "role": "main",
    "genre": "中",
    "timeMin": 15,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚こま切れ肉",
        "qty": 250.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "もやし",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にら",
        "qty": 70.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オイスターソース",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      }
    ],
    "mainType": "肉"
  },
  {
    "id": "和-side-094",
    "name": "ほうれん草のおひたし",
    "role": "side",
    "genre": "和",
    "timeMin": 10,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "ほうれん草",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "かつお節",
        "qty": 3.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-095",
    "name": "小松菜のごま和え",
    "role": "side",
    "genre": "和",
    "timeMin": 10,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "小松菜",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "すりごま",
        "qty": 15.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-096",
    "name": "きんぴらごぼう",
    "role": "side",
    "genre": "和",
    "timeMin": 15,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "ごぼう",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 70.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-097",
    "name": "ひじきの煮物",
    "role": "side",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "乾燥ひじき",
        "qty": 15.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "にんじん",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "油揚げ",
        "qty": 40.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 150.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-098",
    "name": "冷奴",
    "role": "side",
    "genre": "和",
    "timeMin": 5,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "絹豆腐",
        "qty": 300.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "長ねぎ",
        "qty": 30.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "しょうが",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-099",
    "name": "豆腐とわかめの味噌汁",
    "role": "side",
    "genre": "和",
    "timeMin": 10,
    "allergens": [
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "絹豆腐",
        "qty": 150.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "乾燥わかめ",
        "qty": 3.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "味噌",
        "qty": 25.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "かつお節",
        "qty": 3.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-100",
    "name": "きゅうりとわかめの酢の物",
    "role": "side",
    "genre": "和",
    "timeMin": 10,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "きゅうり",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "乾燥わかめ",
        "qty": 3.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "米酢",
        "qty": 25.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-101",
    "name": "かぼちゃの煮物",
    "role": "side",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "かぼちゃ",
        "qty": 300.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 150.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-102",
    "name": "大根とにんじんのなます",
    "role": "side",
    "genre": "和",
    "timeMin": 15,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "大根",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "米酢",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 15.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-103",
    "name": "だし巻き卵",
    "role": "side",
    "genre": "和",
    "timeMin": 15,
    "allergens": [
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "卵",
        "qty": 3.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "かつお節",
        "qty": 2.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "醤油",
        "qty": 5.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 50.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "なたね油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-104",
    "name": "なすの煮びたし",
    "role": "side",
    "genre": "和",
    "timeMin": 15,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "なす",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "めんつゆ",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "しょうが",
        "qty": 10.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "なたね油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-105",
    "name": "ほうれん草のくるみ和え",
    "role": "side",
    "genre": "和",
    "timeMin": 10,
    "allergens": [
      "くるみ",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "ほうれん草",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "くるみ",
        "qty": 25.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-106",
    "name": "れんこんのきんぴら",
    "role": "side",
    "genre": "和",
    "timeMin": 15,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "れんこん",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-107",
    "name": "オクラのおかか和え",
    "role": "side",
    "genre": "和",
    "timeMin": 10,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "オクラ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "かつお節",
        "qty": 3.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-108",
    "name": "さつまいもの甘煮",
    "role": "side",
    "genre": "和",
    "timeMin": 20,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "さつまいも",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "砂糖",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 200.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-109",
    "name": "大根と油揚げの煮物",
    "role": "side",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "大根",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "油揚げ",
        "qty": 40.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "みりん",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "かつお節",
        "qty": 3.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "水",
        "qty": 200.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-110",
    "name": "グリーンサラダ",
    "role": "side",
    "genre": "洋",
    "timeMin": 5,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "レタス",
        "qty": 120.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "きゅうり",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "トマト",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オリーブオイル",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-111",
    "name": "ポテトサラダ",
    "role": "side",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "卵",
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "じゃがいも",
        "qty": 300.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "きゅうり",
        "qty": 80.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 50.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "マヨネーズ",
        "qty": 40.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-112",
    "name": "コールスロー",
    "role": "side",
    "genre": "洋",
    "timeMin": 10,
    "allergens": [
      "卵",
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "キャベツ",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 60.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "マヨネーズ",
        "qty": 30.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-113",
    "name": "コーンスープ",
    "role": "side",
    "genre": "洋",
    "timeMin": 15,
    "allergens": [
      "乳"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "コーン",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "牛乳",
        "qty": 300.0,
        "unit": "ml",
        "category": "乳・卵"
      },
      {
        "name": "バター",
        "qty": 10.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-114",
    "name": "ミネストローネ",
    "role": "side",
    "genre": "洋",
    "timeMin": 25,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "トマト缶",
        "qty": 200.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 70.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "じゃがいも",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ベーコン",
        "qty": 50.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "コンソメ",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 300.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-115",
    "name": "キャロットラペ",
    "role": "side",
    "genre": "洋",
    "timeMin": 10,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "にんじん",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オリーブオイル",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-116",
    "name": "ブロッコリーのチーズ焼き",
    "role": "side",
    "genre": "洋",
    "timeMin": 15,
    "allergens": [
      "乳"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "ブロッコリー",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "チーズ",
        "qty": 50.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "オリーブオイル",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-117",
    "name": "ほうれん草のバター炒め",
    "role": "side",
    "genre": "洋",
    "timeMin": 10,
    "allergens": [
      "乳"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "ほうれん草",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "バター",
        "qty": 15.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-118",
    "name": "きのこのガーリックソテー",
    "role": "side",
    "genre": "洋",
    "timeMin": 10,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "しめじ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "エリンギ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オリーブオイル",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-119",
    "name": "ラタトゥイユ",
    "role": "side",
    "genre": "洋",
    "timeMin": 25,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "なす",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ズッキーニ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "パプリカ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "トマト缶",
        "qty": 200.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オリーブオイル",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 3.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-120",
    "name": "かぼちゃサラダ",
    "role": "side",
    "genre": "洋",
    "timeMin": 15,
    "allergens": [
      "卵",
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "かぼちゃ",
        "qty": 300.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "マヨネーズ",
        "qty": 30.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-121",
    "name": "マカロニサラダ",
    "role": "side",
    "genre": "洋",
    "timeMin": 15,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "マカロニ",
        "qty": 100.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "きゅうり",
        "qty": 80.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ハム",
        "qty": 50.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "マヨネーズ",
        "qty": 40.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-122",
    "name": "トマトとチーズのサラダ",
    "role": "side",
    "genre": "洋",
    "timeMin": 5,
    "allergens": [
      "乳"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "トマト",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "チーズ",
        "qty": 80.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "オリーブオイル",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-123",
    "name": "オニオンスープ",
    "role": "side",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "玉ねぎ",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "バター",
        "qty": 15.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "コンソメ",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-124",
    "name": "ジャーマンポテト",
    "role": "side",
    "genre": "洋",
    "timeMin": 20,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "じゃがいも",
        "qty": 300.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ベーコン",
        "qty": 80.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "玉ねぎ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オリーブオイル",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-125",
    "name": "アスパラのソテー",
    "role": "side",
    "genre": "洋",
    "timeMin": 10,
    "allergens": [
      "乳"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "アスパラガス",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "バター",
        "qty": 15.0,
        "unit": "g",
        "category": "乳・卵"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-126",
    "name": "もやしの中華和え",
    "role": "side",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "もやし",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-127",
    "name": "きゅうりの中華漬け",
    "role": "side",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "きゅうり",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-128",
    "name": "春雨サラダ",
    "role": "side",
    "genre": "中",
    "timeMin": 15,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "春雨",
        "qty": 50.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "きゅうり",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ハム",
        "qty": 50.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "醤油",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 20.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-129",
    "name": "卵の中華スープ",
    "role": "side",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "乳",
      "卵",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "卵",
        "qty": 2.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "長ねぎ",
        "qty": 40.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 5.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-130",
    "name": "わかめの中華スープ",
    "role": "side",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "乾燥わかめ",
        "qty": 4.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "長ねぎ",
        "qty": 40.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 5.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-131",
    "name": "チンゲン菜のにんにく炒め",
    "role": "side",
    "genre": "中",
    "timeMin": 10,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "チンゲン菜",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ごま油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-132",
    "name": "バンバンジー",
    "role": "side",
    "genre": "中",
    "timeMin": 20,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "鶏むね肉",
        "qty": 150.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "きゅうり",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "すりごま",
        "qty": 20.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-133",
    "name": "中華冷奴",
    "role": "side",
    "genre": "中",
    "timeMin": 5,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "絹豆腐",
        "qty": 300.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "長ねぎ",
        "qty": 40.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "すりごま",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-134",
    "name": "なすの中華蒸し",
    "role": "side",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "なす",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "しょうが",
        "qty": 10.0,
        "unit": "g",
        "category": "野菜"
      }
    ]
  },
  {
    "id": "中-side-135",
    "name": "白菜の甘酢漬け",
    "role": "side",
    "genre": "中",
    "timeMin": 15,
    "allergens": [],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "白菜",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "米酢",
        "qty": 30.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "砂糖",
        "qty": 15.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 2.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-136",
    "name": "にんじんの中華サラダ",
    "role": "side",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "にんじん",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "すりごま",
        "qty": 10.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-137",
    "name": "小松菜の中華炒め",
    "role": "side",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "小松菜",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんにく",
        "qty": 5.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "オイスターソース",
        "qty": 15.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-138",
    "name": "トマトの中華和え",
    "role": "side",
    "genre": "中",
    "timeMin": 5,
    "allergens": [
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "トマト",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "長ねぎ",
        "qty": 30.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-139",
    "name": "ブロッコリーの中華あん",
    "role": "side",
    "genre": "中",
    "timeMin": 15,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "ブロッコリー",
        "qty": 250.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 10.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 100.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-140",
    "name": "落花生ときゅうりの和え物",
    "role": "side",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "大豆",
      "小麦",
      "落花生"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "落花生",
        "qty": 40.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "きゅうり",
        "qty": 200.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "米酢",
        "qty": 15.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-141",
    "name": "キャベツの中華スープ",
    "role": "side",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "乳",
      "大豆",
      "小麦"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "キャベツ",
        "qty": 150.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 50.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 5.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-142",
    "name": "豚汁",
    "role": "side",
    "genre": "和",
    "timeMin": 20,
    "allergens": [
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "豚バラ肉",
        "qty": 80.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "大根",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にんじん",
        "qty": 40.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ごぼう",
        "qty": 40.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "こんにゃく",
        "qty": 50.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "長ねぎ",
        "qty": 20.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "味噌",
        "qty": 30.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 500.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-143",
    "name": "大根と油揚げの味噌汁",
    "role": "side",
    "genre": "和",
    "timeMin": 10,
    "allergens": [
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "大根",
        "qty": 80.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "油揚げ",
        "qty": 20.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "長ねぎ",
        "qty": 15.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "味噌",
        "qty": 30.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "かつお節",
        "qty": 5.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-144",
    "name": "かき玉汁",
    "role": "side",
    "genre": "和",
    "timeMin": 10,
    "allergens": [
      "卵",
      "小麦",
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "卵",
        "qty": 1.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "長ねぎ",
        "qty": 15.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 5.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "かつお節",
        "qty": 5.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "塩",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-145",
    "name": "キャベツと玉ねぎの味噌汁",
    "role": "side",
    "genre": "和",
    "timeMin": 10,
    "allergens": [
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "キャベツ",
        "qty": 80.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "玉ねぎ",
        "qty": 50.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "味噌",
        "qty": 30.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "かつお節",
        "qty": 5.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "和-side-146",
    "name": "きのこのすまし汁",
    "role": "side",
    "genre": "和",
    "timeMin": 10,
    "allergens": [
      "小麦",
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "しめじ",
        "qty": 50.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "えのき",
        "qty": 50.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "醤油",
        "qty": 10.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "かつお節",
        "qty": 5.0,
        "unit": "g",
        "category": "その他"
      },
      {
        "name": "塩",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "洋-side-147",
    "name": "キャベツのコンソメスープ",
    "role": "side",
    "genre": "洋",
    "timeMin": 15,
    "allergens": [
      "卵",
      "乳",
      "小麦",
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "キャベツ",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "玉ねぎ",
        "qty": 50.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "ベーコン",
        "qty": 30.0,
        "unit": "g",
        "category": "肉・魚"
      },
      {
        "name": "コンソメ",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-148",
    "name": "中華コーンスープ",
    "role": "side",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "卵",
      "乳",
      "小麦",
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "コーン",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "卵",
        "qty": 1.0,
        "unit": "個",
        "category": "乳・卵"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "片栗粉",
        "qty": 5.0,
        "unit": "g",
        "category": "主食"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  },
  {
    "id": "中-side-149",
    "name": "もやしとにらのスープ",
    "role": "side",
    "genre": "中",
    "timeMin": 10,
    "allergens": [
      "乳",
      "小麦",
      "大豆"
    ],
    "servingsBase": 2,
    "ingredients": [
      {
        "name": "もやし",
        "qty": 100.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "にら",
        "qty": 30.0,
        "unit": "g",
        "category": "野菜"
      },
      {
        "name": "鶏ガラスープの素",
        "qty": 5.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "ごま油",
        "qty": 5.0,
        "unit": "ml",
        "category": "調味料"
      },
      {
        "name": "塩",
        "qty": 1.0,
        "unit": "g",
        "category": "調味料"
      },
      {
        "name": "水",
        "qty": 400.0,
        "unit": "ml",
        "category": "調味料"
      }
    ]
  }
];
/** 汁物（味噌汁・スープ）。夕食の「汁物」枠に使う */
export const isSoup = (r: Recipe): boolean => r.role === "side" && /汁|スープ|ミネストローネ/.test(r.name);
export const MAIN_RECIPES = RECIPES.filter(r => r.role === "main");
/** 副菜（汁物を除く） */
export const SIDE_RECIPES = RECIPES.filter(r => r.role === "side" && !isSoup(r));
export const SOUP_RECIPES = RECIPES.filter(isSoup);
export const RECIPE_BY_ID = new Map(RECIPES.map(r => [r.id, r]));
