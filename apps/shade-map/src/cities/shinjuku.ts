import type { CityData, EdgeKind, Place, Point, RouteEdge } from "../types";

/** 元の模式座標（100×76）を絵地図の座標（400×304）へ */
const S = 4;
const p = (x: number, y: number): Point => ({ x: x * S, y: y * S });

const place = (
  id: string,
  label: string,
  shortLabel: string,
  kind: Place["kind"],
  x: number,
  y: number,
  art?: string,
): Place => ({ id, label, shortLabel, kind, selectable: kind === "landmark", x: x * S, y: y * S, art });

const edge = (
  id: string,
  from: string,
  to: string,
  distanceM: number,
  kind: EdgeKind,
  forward: string,
  reverse: string,
  basis: string,
  points: Point[],
  sourceIds: string[],
  availability?: string,
): RouteEdge => ({ id, from, to, distanceM, kind, instruction: { forward, reverse }, basis, points, sourceIds, availability });

/**
 * 新宿区「新宿ターミナルマップ」（2025年11月版）を骨格にして、人が手で拾った小さな道のつながり。
 * - 座標は絵地図のための目安で、測量値ではない。
 * - 距離は同マップの縮尺から読み取って 10m 単位に丸めた概算。
 * - 地下・屋根の区間は「日陰」、屋根のない地上の道はすべて「日なた」として数える（季節・時刻は考えない）。
 * 確かめるべき点は docs/01_要件定義.md の「データの範囲と限界」と「作者が確かめること」にある。
 */
export const shinjuku: CityData = {
  id: "shinjuku",
  name: "新宿",
  version: "2026-10-23-beta.2",
  checkedOn: "2026年8月23日",
  places: [
    place("tocho", "東京都庁", "都庁", "landmark", 8, 58, "classical-building"),
    place("west_walkway", "西口の地下歩道（都庁へ向かう道）", "西口地下歩道", "junction", 26, 57),
    place("west_exit", "新宿駅 西口", "西口", "landmark", 43, 50, "station"),
    place("east_exit", "新宿駅 東口", "東口", "landmark", 54, 49, "station"),
    place("metro", "メトロプロムナード（東口の地下）", "メトロ", "junction", 59, 40),
    place("subnade", "新宿サブナード", "サブナード", "junction", 68, 25),
    place("ward_15b", "サブナード 15B出口", "15B出口", "entrance", 76.5, 21),
    place("ward_office", "新宿区役所", "区役所", "landmark", 79, 19, "office-building"),
    place("sanchome", "新宿三丁目駅", "三丁目", "landmark", 91, 49, "metro"),
  ],
  edges: [
    edge(
      "u_tocho_westwalk", "tocho", "west_walkway", 520, "underground",
      "都庁から地下歩道に入り、新宿駅の方へ進みます。",
      "地下歩道を都庁の方へまっすぐ進みます。",
      "ターミナルマップで地下歩道として描かれている",
      [p(8, 58), p(16, 58), p(26, 57)],
      ["terminal-map"],
    ),
    edge(
      "u_westwalk_west", "west_walkway", "west_exit", 360, "underground",
      "地下歩道から西口の地下広場へ進みます。",
      "西口の地下広場から「東京都庁」の案内に従って進みます。",
      "ターミナルマップで地下通路として描かれている",
      [p(26, 57), p(34, 55), p(43, 50)],
      ["terminal-map"],
    ),
    edge(
      "c_west_east", "west_exit", "east_exit", 140, "covered",
      "駅の東西自由通路を通って東口へ進みます。",
      "駅の東西自由通路を通って西口へ進みます。",
      "線路の下を通る駅の自由通路（屋根の下）。新宿区の整備案内による",
      [p(43, 50), p(49, 50), p(54, 49)],
      ["terminal-map", "east-west"],
      "駅の通路です。夜間は通れない時間があるかもしれません。",
    ),
    edge(
      "u_east_metro", "east_exit", "metro", 130, "underground",
      "東口の地下広場から丸ノ内線・メトロプロムナードの方へ進みます。",
      "メトロプロムナードから「JR東口」の案内に従って進みます。",
      "ターミナルマップ・東京メトロ構内図で地下通路として描かれている",
      [p(54, 49), p(56, 44), p(59, 40)],
      ["terminal-map", "metro-map"],
      "電車が動いている時間を想定しています。",
    ),
    edge(
      "u_metro_subnade", "metro", "subnade", 240, "underground",
      "メトロプロムナードからサブナードの方へ進みます。",
      "サブナードから丸ノ内線・JR新宿駅の方へ進みます。",
      "ターミナルマップで地下街としてつながっている",
      [p(59, 40), p(62, 33), p(68, 25)],
      ["terminal-map", "metro-map"],
      "地下街です。開いている時間と、閉まっている出口に注意してください。",
    ),
    edge(
      "u_subnade_ward", "subnade", "ward_15b", 150, "underground",
      "サブナードを区役所の方へ進み、15B出口を目印にします。",
      "15B出口からサブナードに入り、新宿駅の方へ進みます。",
      "ターミナルマップ・区役所のアクセス案内で 15B 出口が最寄りとされている",
      [p(68, 25), p(73, 23), p(76.5, 21)],
      ["terminal-map", "ward-office"],
      "地下街です。開いている時間に注意してください。",
    ),
    edge(
      "o_15b_office", "ward_15b", "ward_office", 50, "outdoor",
      "15B出口から地上に出て、区役所まで歩きます。",
      "区役所から15B出口へ歩き、サブナードに入ります。",
      "地上の道。屋根の有無は未確認のため日なたとして数える",
      [p(76.5, 21), p(79, 19)],
      ["terminal-map", "ward-office"],
    ),
    edge(
      "u_metro_sanchome", "metro", "sanchome", 650, "underground",
      "メトロプロムナードを新宿三丁目の方へまっすぐ進み、A5出口の方を目印にします。",
      "A5出口の方からメトロプロムナードを新宿駅の方へまっすぐ進みます。",
      "ターミナルマップ・東京メトロ構内図で地下通路として描かれている",
      [p(59, 40), p(70, 42), p(81, 46), p(91, 49)],
      ["terminal-map", "metro-map"],
      "出入口によっては使える時間が決まっています。",
    ),
    edge(
      "o_tocho_west", "tocho", "west_exit", 780, "outdoor",
      "地上の中央通りを新宿駅西口の方へ歩きます。",
      "地上の中央通りを都庁の方へ歩きます。",
      "地上の道。ビルや街路樹の影は数えていない",
      [p(8, 58), p(18, 49), p(31, 45), p(43, 50)],
      ["terminal-map"],
    ),
    edge(
      "o_east_ward", "east_exit", "ward_office", 480, "outdoor",
      "東口から地上を歌舞伎町の方へ歩き、区役所通りへ向かいます。",
      "区役所通りから地上を新宿駅東口の方へ歩きます。",
      "地上の道。ビルや街路樹の影は数えていない",
      [p(54, 49), p(60, 39), p(69, 29), p(79, 19)],
      ["terminal-map", "ward-office"],
    ),
    edge(
      "o_east_sanchome", "east_exit", "sanchome", 760, "outdoor",
      "地上の新宿通りを新宿三丁目の方へ歩きます。",
      "地上の新宿通りを新宿駅東口の方へ歩きます。",
      "地上の道。アーケードやビルの影は数えていない",
      [p(54, 49), p(66, 51), p(79, 51), p(91, 49)],
      ["terminal-map"],
    ),
    edge(
      "o_ward_sanchome", "ward_office", "sanchome", 690, "outdoor",
      "区役所の前から地上を明治通りの方へ歩きます。",
      "明治通りの方から地上を区役所の方へ歩きます。",
      "地上の道。ビルや街路樹の影は数えていない",
      [p(79, 19), p(84, 28), p(88, 39), p(91, 49)],
      ["terminal-map"],
    ),
  ],
  sources: [
    {
      id: "terminal-map",
      title: "新宿ターミナルマップ（日英版）",
      publisher: "新宿区・新宿ターミナル案内サイン連絡会",
      url: "https://www.city.shinjuku.lg.jp/content/000423320.pdf",
      updated: "2025年11月時点",
    },
    {
      id: "east-west",
      title: "新宿駅東西自由通路の整備",
      publisher: "新宿区",
      url: "https://www.city.shinjuku.lg.jp/soshiki/toshikei01_002133.html",
      updated: "2025年3月27日更新",
    },
    {
      id: "metro-map",
      title: "新宿駅 構内図・出口案内",
      publisher: "東京メトロ",
      url: "https://www.tokyometro.jp/station/shinjuku/yardmap/index_print.html",
    },
    {
      id: "ward-office",
      title: "新宿区役所本庁舎 交通アクセス",
      publisher: "新宿区",
      url: "https://www.city.shinjuku.lg.jp/shisetsu/map1-1.html",
      updated: "2024年2月13日更新",
    },
  ],
};
