export type Zone = "freezer" | "chilled" | "vegetable";
export type Freshness = "fresh" | "spoiled";

export interface FoodItem {
  id: string;
  kind: "food";
  name: string;
  emoji: string;
  zone: Zone;
  freshness: Freshness;
  reaction: string;
}

export interface JunkItem {
  id: string;
  kind: "junk";
  name: string;
  emoji: string;
  reaction: string;
  evidenceId?: string;
  isMuseum?: boolean;
}

export type Item = FoodItem | JunkItem;

export type MissionId =
  | "lost-and-found"
  | "bad-smell"
  | "total-chaos"
  | "pudding-1"
  | "pudding-2"
  | "pudding-3";

export interface Mission {
  id: MissionId;
  number: number;
  chapter: string;
  title: string;
  intro: string;
  objective: string;
  completion: string;
  arrangeRequired: boolean;
  initialIds: Array<string | null>;
  threeStarLimit: number;
}

export interface GameState {
  missionId: MissionId;
  slots: Array<Item | null>;
  moves: number;
  recovered: Item[];
}

export interface EvidenceInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export interface MuseumInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  story: string;
}

export interface SaveData {
  version: 1;
  completedMissions: string[];
  collectedEvidence: string[];
  museumUnlocked: string[];
}

export const ZONES: Zone[] = ["freezer", "chilled", "vegetable"];
export const COLUMNS = 4;

export const EVIDENCES: EvidenceInfo[] = [
  { id: "remote", name: "冷えたリモコン", emoji: "📺", description: "暗闇の中で探した痕跡" },
  { id: "puddingHalf", name: "半分プリン", emoji: "🍮", description: "一口だけ食べた残骸" },
  { id: "spoon", name: "小さなスプーン", emoji: "🥄", description: "夜食に使われた道具" },
  { id: "note", name: "「ぼくじゃない」メモ", emoji: "📝", description: "怪しすぎる自己弁護" },
];

export const MUSEUM_ITEMS: MuseumInfo[] = [
  {
    id: "remote",
    name: "テレビのリモコン",
    emoji: "📺",
    description: "冷蔵庫に保管されていた謎の機器",
    story: "「熱を持っていたから冷やした」とのこと。",
  },
];

export const PUDDING_INCIDENT_TRUTH = {
  title: "真犯人はお父さん！",
  body: "「夜中にお腹が空いて一口だけ食べた。リモコンは暗闇で探したときに間違えて入れた」とのこと。一件落着！",
};

const ITEMS: Record<string, Item> = {
  remote: {
    id: "remote",
    kind: "junk",
    name: "テレビのリモコン",
    emoji: "📺",
    reaction: "テレビつかないと思ったら、冷えてたー！",
    evidenceId: "remote",
    isMuseum: true,
  },
  sock: { id: "sock", kind: "junk", name: "片っぽの靴下", emoji: "🧦", reaction: "探してた片っぽ、ここにいたの!?" },
  toycar: { id: "toycar", kind: "junk", name: "ミニカー", emoji: "🚗", reaction: "冷蔵庫を駐車場にしないで〜！" },
  puddingHalf: {
    id: "puddingHalf",
    kind: "junk",
    name: "半分プリン",
    emoji: "🍮",
    reaction: "一口だけ食べて放置されてる…！",
    evidenceId: "puddingHalf",
  },
  spoon: {
    id: "spoon",
    kind: "junk",
    name: "小さなスプーン",
    emoji: "🥄",
    reaction: "プリンを食べた犯人の道具だ！",
    evidenceId: "spoon",
  },
  note: {
    id: "note",
    kind: "junk",
    name: "「ぼくじゃない」メモ",
    emoji: "📝",
    reaction: "「ぼくじゃない」って書いてある…怪しすぎる！",
    evidenceId: "note",
  },
  milk: { id: "milk", kind: "food", name: "牛乳", emoji: "🥛", zone: "chilled", freshness: "fresh", reaction: "まだキンキンに冷えてるよ！" },
  carrot: { id: "carrot", kind: "food", name: "にんじん", emoji: "🥕", zone: "vegetable", freshness: "fresh", reaction: "野菜室でシャキシャキのままだよ！" },
  icecream: { id: "icecream", kind: "food", name: "アイス", emoji: "🍨", zone: "freezer", freshness: "fresh", reaction: "カチコチに凍ってて美味しそう！" },
  gyoza: { id: "gyoza", kind: "food", name: "冷凍ぎょうざ", emoji: "🥟", zone: "freezer", freshness: "fresh", reaction: "出番まで冷凍室でお休み中！" },
  egg: { id: "egg", kind: "food", name: "たまご", emoji: "🥚", zone: "chilled", freshness: "fresh", reaction: "割れてないよ、安心！" },
  apple: { id: "apple", kind: "food", name: "りんご", emoji: "🍎", zone: "vegetable", freshness: "fresh", reaction: "みずみずしくて美味しそう！" },
  pudding: { id: "pudding", kind: "food", name: "プリン", emoji: "🍮", zone: "chilled", freshness: "fresh", reaction: "プルプルで美味しそう！" },
  broccoli: { id: "broccoli", kind: "food", name: "ブロッコリー", emoji: "🥦", zone: "vegetable", freshness: "fresh", reaction: "青々としてて新鮮！" },
  cheese: { id: "cheese", kind: "food", name: "チーズ", emoji: "🧀", zone: "chilled", freshness: "fresh", reaction: "ちゃんと保存されてるよ！" },
  icepack: { id: "icepack", kind: "food", name: "保冷剤", emoji: "🧊", zone: "freezer", freshness: "fresh", reaction: "カチカチで冷たい！" },
  yogurtBad: { id: "yogurtBad", kind: "food", name: "カビたヨーグルト", emoji: "🥣", zone: "chilled", freshness: "spoiled", reaction: "賞味期限が先月！これはさよなら…" },
  lettuceBad: { id: "lettuceBad", kind: "food", name: "しなしなレタス", emoji: "🥬", zone: "vegetable", freshness: "spoiled", reaction: "液体になりかけてる！あぶない！" },
  fishBad: { id: "fishBad", kind: "food", name: "あやしい魚", emoji: "🐟", zone: "chilled", freshness: "spoiled", reaction: "このにおい、犯人はキミだー！" },
};

export const MISSIONS: Mission[] = [
  {
    id: "lost-and-found",
    number: 1,
    chapter: "日常編",
    title: "リモコンはどこ!?",
    intro: "テレビがつかない！冷蔵庫を開けたら、なんか変…？",
    objective: "食べ物じゃないものを2個見つけよう",
    completion: "リモコン救出！靴下まで冷え冷えでした。",
    arrangeRequired: false,
    initialIds: ["icecream", "gyoza", "icepack", null, "milk", "egg", "pudding", "remote", "carrot", "broccoli", "apple", "sock"],
    threeStarLimit: 2,
  },
  {
    id: "bad-smell",
    number: 2,
    chapter: "日常編",
    title: "なんか臭うぞ…",
    intro: "冷蔵庫からただならぬ気配。傷んだ食材を見極めよう！",
    objective: "傷んだ食材を3個だけ取り出そう",
    completion: "異臭の原因をぜんぶ発見。空気がうまい！",
    arrangeRequired: false,
    initialIds: ["icecream", "gyoza", "icepack", "fishBad", "milk", "egg", "yogurtBad", "cheese", "carrot", "broccoli", "apple", "lettuceBad"],
    threeStarLimit: 3,
  },
  {
    id: "total-chaos",
    number: 3,
    chapter: "日常編",
    title: "ぜんぶぐちゃぐちゃ！",
    intro: "謎アイテムに傷んだ食材、棚もバラバラ。冷蔵庫を救え！",
    objective: "変なものを回収して、食材を正しい段へ戻そう",
    completion: "冷蔵庫、完全復活！今日も平和です。",
    arrangeRequired: true,
    initialIds: ["remote", "milk", "carrot", "icecream", "gyoza", "yogurtBad", "egg", "apple", "pudding", "broccoli", "cheese", "icepack"],
    threeStarLimit: 6,
  },
  {
    id: "pudding-1",
    number: 4,
    chapter: "深夜のプリン事件",
    title: "① 冷えたリモコン",
    intro: "夜中に怪しい音がした。冷蔵庫を開けると冷えたリモコンが…？",
    objective: "変なものを2個回収して証拠を集めよう",
    completion: "「冷えたリモコン」を獲得！暗闇で探した痕跡が…？",
    arrangeRequired: false,
    initialIds: ["icecream", "gyoza", "icepack", null, "milk", "egg", "pudding", "remote", "carrot", "broccoli", "apple", "toycar"],
    threeStarLimit: 2,
  },
  {
    id: "pudding-2",
    number: 5,
    chapter: "深夜のプリン事件",
    title: "② 消えた半分",
    intro: "半分食べたプリンと小さいスプーンを発見！誰が食べたの？",
    objective: "残された証拠を2個回収しよう",
    completion: "証拠「半分プリン」「スプーン」を獲得！",
    arrangeRequired: false,
    initialIds: ["icecream", "gyoza", "icepack", "puddingHalf", "milk", "egg", "spoon", "cheese", "carrot", "broccoli", "apple", "lettuceBad"],
    threeStarLimit: 3,
  },
  {
    id: "pudding-3",
    number: 6,
    chapter: "深夜のプリン事件",
    title: "③ 決定的証拠",
    intro: "「ぼくじゃない」のメモを発見！散らかった棚も整頓しよう。",
    objective: "メモを回収し、食材を正しい段へ入れ替えよう",
    completion: "すべての証拠が揃った！事件解決！",
    arrangeRequired: true,
    initialIds: ["note", "milk", "carrot", "icecream", "gyoza", "yogurtBad", "egg", "apple", "pudding", "broccoli", "cheese", "icepack"],
    threeStarLimit: 6,
  },
];

export function getMission(id: MissionId): Mission {
  const mission = MISSIONS.find((candidate) => candidate.id === id);
  if (!mission) throw new Error(`unknown mission: ${id}`);
  return mission;
}

export function createInitialState(missionId: MissionId = "lost-and-found"): GameState {
  const mission = getMission(missionId);
  return {
    missionId,
    slots: mission.initialIds.map((id) => (id ? ITEMS[id] ?? null : null)),
    moves: 0,
    recovered: [],
  };
}

export function zoneForSlot(index: number): Zone {
  if (index < 0 || index >= COLUMNS * ZONES.length) throw new RangeError("slot index is outside the fridge");
  return ZONES[Math.floor(index / COLUMNS)]!;
}

export function isRemovalTarget(item: Item): boolean {
  return item.kind === "junk" || item.freshness === "spoiled";
}

export function swapSlots(state: GameState, from: number, to: number): GameState {
  if (from === to || !state.slots[from] || from < 0 || to < 0 || from >= state.slots.length || to >= state.slots.length) return state;
  const slots = [...state.slots];
  [slots[from], slots[to]] = [slots[to] ?? null, slots[from] ?? null];
  return { ...state, slots, moves: state.moves + 1 };
}

export function removeTarget(state: GameState, index: number): GameState {
  const item = state.slots[index];
  if (!item || !isRemovalTarget(item)) return state;
  const slots = [...state.slots];
  slots[index] = null;
  return { ...state, slots, moves: state.moves + 1, recovered: [...state.recovered, item] };
}

export interface GameProgress {
  misplacedFoods: number;
  targetsRemaining: number;
  solved: boolean;
}

export function evaluate(state: GameState): GameProgress {
  const mission = getMission(state.missionId);
  let misplacedFoods = 0;
  let targetsRemaining = 0;
  state.slots.forEach((item, index) => {
    if (!item) return;
    if (isRemovalTarget(item)) targetsRemaining += 1;
    else if (mission.arrangeRequired && item.kind === "food" && item.zone !== zoneForSlot(index)) misplacedFoods += 1;
  });
  return { misplacedFoods, targetsRemaining, solved: misplacedFoods === 0 && targetsRemaining === 0 };
}

export function starsForMoves(moves: number, missionId: MissionId): number {
  const mission = getMission(missionId);
  const limit = mission.threeStarLimit;
  if (moves <= limit) return 3;
  if (moves <= limit + 3) return 2;
  return 1;
}

export function isMissionUnlocked(missionId: MissionId, completedMissions: readonly string[]): boolean {
  if (missionId === "pudding-2") return completedMissions.includes("pudding-1");
  if (missionId === "pudding-3") {
    return completedMissions.includes("pudding-1") && completedMissions.includes("pudding-2");
  }
  return true;
}

export function hasAllIncidentEvidence(collectedEvidence: readonly string[]): boolean {
  return EVIDENCES.every((evidence) => collectedEvidence.includes(evidence.id));
}

export function normalizeSaveData(raw: unknown): SaveData {
  const defaultData: SaveData = {
    version: 1,
    completedMissions: [],
    collectedEvidence: [],
    museumUnlocked: [],
  };
  if (!raw || typeof raw !== "object") return defaultData;
  const obj = raw as Record<string, unknown>;
  const normalizeIds = (value: unknown, allowedIds: readonly string[]): string[] => {
    if (!Array.isArray(value)) return [];
    const allowed = new Set(allowedIds);
    return [...new Set(value.filter((id): id is string => typeof id === "string" && allowed.has(id)))];
  };
  return {
    version: 1,
    completedMissions: normalizeIds(obj.completedMissions, MISSIONS.map((mission) => mission.id)),
    collectedEvidence: normalizeIds(obj.collectedEvidence, EVIDENCES.map((evidence) => evidence.id)),
    museumUnlocked: normalizeIds(obj.museumUnlocked, MUSEUM_ITEMS.map((item) => item.id)),
  };
}

export function loadSaveData(storage?: Storage): SaveData {
  try {
    const store = storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
    if (!store) return normalizeSaveData(null);
    const json = store.getItem("fridge-puzzle-save-v1");
    if (!json) return normalizeSaveData(null);
    return normalizeSaveData(JSON.parse(json));
  } catch {
    return normalizeSaveData(null);
  }
}

export function saveProgress(data: SaveData, storage?: Storage): void {
  try {
    const store = storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
    if (!store) return;
    store.setItem("fridge-puzzle-save-v1", JSON.stringify(data));
  } catch {
    // Ignore quota or serialization errors
  }
}
