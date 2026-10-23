// ヒエヒエ冷蔵庫の判定・生成・共有URL。画面（main.ts）から切り離した純関数だけを置く。

export const GAME_ID = "hiehie-fridge";
export const FORMAT_VERSION = "2";

// ---------- 食べ物と人物 ----------

export type Category = "meat" | "fish" | "veg" | "dairy" | "drink" | "madeahead" | "sweet" | "fruit" | "other";
/** 見た目の色味。同じ面に似た色の物を並べないために使う */
export type Tone = "red" | "green" | "yellow" | "beige" | "white" | "brown" | "blue" | "purple" | "orange" | "pink" | "clear";

export interface Item {
  id: string;
  label: string;
  category: Category;
  tone: Tone;
}

export const ITEMS = [
  { id: "meat", label: "お肉", category: "meat", tone: "red" },
  { id: "chicken", label: "とりもも", category: "meat", tone: "beige" },
  { id: "bacon", label: "ベーコン", category: "meat", tone: "pink" },
  { id: "sushi", label: "刺身", category: "fish", tone: "orange" },
  { id: "fish", label: "さかな", category: "fish", tone: "blue" },
  { id: "shrimp", label: "えび", category: "fish", tone: "red" },
  { id: "broccoli", label: "ブロッコリー", category: "veg", tone: "green" },
  { id: "carrot", label: "にんじん", category: "veg", tone: "orange" },
  { id: "tomato", label: "トマト", category: "veg", tone: "red" },
  { id: "cabbage", label: "葉っぱ野菜", category: "veg", tone: "green" },
  { id: "eggplant", label: "なす", category: "veg", tone: "purple" },
  { id: "onion", label: "たまねぎ", category: "veg", tone: "beige" },
  { id: "cucumber", label: "きゅうり", category: "veg", tone: "green" },
  { id: "mushroom", label: "きのこ", category: "veg", tone: "red" },
  { id: "egg", label: "たまご", category: "dairy", tone: "beige" },
  { id: "milk", label: "牛乳", category: "dairy", tone: "white" },
  { id: "cheese", label: "チーズ", category: "dairy", tone: "yellow" },
  { id: "butter", label: "バター", category: "dairy", tone: "yellow" },
  { id: "beer", label: "ビール", category: "drink", tone: "yellow" },
  { id: "protein", label: "プロテイン", category: "drink", tone: "pink" },
  { id: "sake", label: "日本酒", category: "drink", tone: "white" },
  { id: "tea", label: "お茶", category: "drink", tone: "white" },
  { id: "bento", label: "作り置き", category: "madeahead", tone: "brown" },
  { id: "leftover", label: "残り物", category: "madeahead", tone: "white" },
  { id: "curry", label: "カレー", category: "madeahead", tone: "orange" },
  { id: "natto", label: "納豆", category: "madeahead", tone: "brown" },
  { id: "gyoza", label: "ぎょうざ", category: "madeahead", tone: "beige" },
  { id: "oden", label: "おでん", category: "madeahead", tone: "purple" },
  { id: "pudding", label: "プリン", category: "sweet", tone: "brown" },
  { id: "cake", label: "ケーキ", category: "sweet", tone: "pink" },
  { id: "icecream", label: "アイス", category: "sweet", tone: "blue" },
  { id: "apple", label: "りんご", category: "fruit", tone: "red" },
  { id: "lemon", label: "レモン", category: "fruit", tone: "yellow" },
  { id: "strawberry", label: "いちご", category: "fruit", tone: "red" },
  { id: "jam", label: "なぞのびん", category: "other", tone: "clear" },
  { id: "ice", label: "氷", category: "other", tone: "blue" },
  { id: "babybottle", label: "ほにゅうびん", category: "other", tone: "clear" },
] as const satisfies readonly Item[];

export type ItemId = (typeof ITEMS)[number]["id"];
export const ITEM_IDS: readonly ItemId[] = ITEMS.map((i) => i.id);

export interface Person {
  id: string;
  name: string;
  /** いかにも持っていそうな物（手がかりっぽく見せるだけ） */
  signature: ItemId;
}

export const PEOPLE = [
  { id: "macho", name: "マッチョなお兄さん", signature: "protein" },
  { id: "grandma", name: "おばあちゃん", signature: "tea" },
  { id: "kid", name: "こども", signature: "icecream" },
  { id: "office", name: "会社員のお姉さん", signature: "beer" },
  { id: "cook", name: "コックさん", signature: "bento" },
  { id: "astronaut", name: "宇宙飛行士", signature: "ice" },
  { id: "ninja", name: "忍者", signature: "natto" },
  { id: "detective", name: "名探偵", signature: "egg" },
  { id: "zombie", name: "ゾンビ", signature: "meat" },
  { id: "cat", name: "ねこ", signature: "fish" },
  { id: "alien", name: "宇宙人", signature: "milk" },
  { id: "santa", name: "サンタさん", signature: "cake" },
  { id: "mage", name: "魔法使い", signature: "jam" },
  { id: "farmer", name: "農家のおじさん", signature: "carrot" },
  { id: "penguin", name: "ペンギン", signature: "sushi" },
  { id: "vampire", name: "吸血鬼", signature: "tomato" },
  { id: "baby", name: "赤ちゃん", signature: "babybottle" },
  { id: "hero", name: "ヒーロー", signature: "protein" },
  { id: "polarbear", name: "シロクマ", signature: "ice" },
  { id: "engineer", name: "エンジニア", signature: "leftover" },
  { id: "oldman", name: "おじいちゃん", signature: "sake" },
  { id: "princess", name: "お姫さま", signature: "strawberry" },
] as const satisfies readonly Person[];

export type PersonId = (typeof PEOPLE)[number]["id"];
export const PERSON_IDS: readonly PersonId[] = PEOPLE.map((p) => p.id);

export function getItem(id: ItemId): Item {
  const item = ITEMS.find((i) => i.id === id);
  if (!item) throw new Error(`unknown item: ${id}`);
  return item;
}

export function getPerson(id: PersonId): Person {
  const person = PEOPLE.find((p) => p.id === id);
  if (!person) throw new Error(`unknown person: ${id}`);
  return person;
}

// ---------- 乱数（seed から毎回同じ結果を出す） ----------

export function hashText(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32。xorshift より下位ビットの偏りが少ない */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(list: readonly T[], random: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function isValidSeed(seed: string): boolean {
  return /^[a-z0-9]{8,24}$/.test(seed);
}

export function createSeed(randomValues?: Uint32Array): string {
  const values = randomValues ?? crypto.getRandomValues(new Uint32Array(2));
  return Array.from(values, (v) => v.toString(36).padStart(7, "0")).join("").slice(0, 14);
}

// ---------- 盤面 ----------

export interface StageSpec {
  rows: number;
  cols: number;
  /** 最短手数をこの範囲に収めて、面ごとに少しずつ難しくする */
  parMin: number;
  parMax: number;
}

/** 1回のプレイ = 3面。3段×3列 → 3段×4列 → 4段×4列 */
export const STAGE_SPECS: readonly StageSpec[] = [
  { rows: 3, cols: 3, parMin: 3, parMax: 3 },
  { rows: 3, cols: 4, parMin: 4, parMax: 4 },
  { rows: 4, cols: 4, parMin: 6, parMax: 7 },
];

export interface Stage {
  rows: number;
  cols: number;
  kinds: ItemId[];
  cells: ItemId[];
  /** 最短手数 */
  par: number;
}

export function rowsOf<T>(cells: readonly T[], cols: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < cells.length; i += cols) rows.push(cells.slice(i, i + cols));
  return rows;
}

/** 各段がそろっているか */
export function completedRows(cells: readonly ItemId[], cols: number): boolean[] {
  return rowsOf(cells, cols).map((row) => row.every((c) => c === row[0]));
}

export function isSolved(cells: readonly ItemId[], cols: number): boolean {
  return cells.length > 0 && cells.length % cols === 0 && completedRows(cells, cols).every(Boolean);
}

function permutations<T>(list: readonly T[]): T[][] {
  if (list.length <= 1) return [[...list]];
  const out: T[][] = [];
  list.forEach((head, i) => {
    for (const rest of permutations([...list.slice(0, i), ...list.slice(i + 1)])) out.push([head, ...rest]);
  });
  return out;
}

/**
 * 入れ替えでそろえる最短手数 = 置き場所の違う物の数 − 分解できる輪の最大数。
 * 「物の種類 x が、種類 t の段にいる」を x→t の辺とみなし、辺をできるだけ多くの輪に分ける。
 */
function maxCycles(matrix: number[][], memo: Map<string, number>): number {
  const key = matrix.map((r) => r.join(",")).join(";");
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  const n = matrix.length;
  let a = -1;
  let b = -1;
  outer: for (let i = 0; i < n; i += 1)
    for (let j = 0; j < n; j += 1)
      if (matrix[i]![j]! > 0) {
        a = i;
        b = j;
        break outer;
      }
  if (a < 0) {
    memo.set(key, 0);
    return 0;
  }
  let best = 0;
  // a→b を含む単純な輪をすべて試す
  const walk = (path: number[]) => {
    const last = path[path.length - 1]!;
    if (matrix[last]![a]! > 0) {
      const used = [...path, a];
      const next = matrix.map((r) => [...r]);
      let okCycle = true;
      for (let k = 0; k < used.length - 1; k += 1) {
        const from = used[k]!;
        const to = used[k + 1]!;
        if (next[from]![to]! <= 0) okCycle = false;
        next[from]![to]! -= 1;
      }
      if (okCycle) best = Math.max(best, 1 + maxCycles(next, memo));
    }
    for (let c = 0; c < n; c += 1) {
      if (path.includes(c) || c === a) continue;
      if (matrix[last]![c]! > 0) walk([...path, c]);
    }
  };
  walk([a, b]);
  memo.set(key, best);
  return best;
}

/** 輪の数の計算結果を使い回す（盤面が小さいので種類は限られる） */
const cycleMemo = new Map<string, number>();

export interface Solution {
  swaps: number;
  /** 段ごとにそろえる種類（最短になる並び） */
  target: ItemId[];
}

export function solve(cells: readonly ItemId[], cols: number): Solution {
  const rows = rowsOf(cells, cols);
  const kinds = [...new Set(cells)];
  if (kinds.length !== rows.length) throw new Error("kinds must equal rows");
  let bestSwaps = Infinity;
  let bestTarget: ItemId[] = kinds;
  if (cycleMemo.size > 50000) cycleMemo.clear();
  const memo = cycleMemo;
  for (const target of permutations(kinds)) {
    const index = new Map(kinds.map((k, i) => [k, i]));
    const matrix = kinds.map(() => kinds.map(() => 0));
    let misplaced = 0;
    rows.forEach((row, r) => {
      const want = index.get(target[r]!)!;
      for (const item of row) {
        const have = index.get(item)!;
        if (have !== want) {
          matrix[have]![want]! += 1;
          misplaced += 1;
        }
      }
    });
    const swaps = misplaced - maxCycles(matrix, memo);
    if (swaps < bestSwaps) {
      bestSwaps = swaps;
      bestTarget = target;
    }
  }
  return { swaps: bestSwaps, target: bestTarget };
}

export function swapCells(cells: readonly ItemId[], a: number, b: number): ItemId[] {
  const next = [...cells];
  [next[a], next[b]] = [next[b]!, next[a]!];
  return next;
}

/** 最短でそろう次の1手。2つとも正しい段に行く手を優先する（初めての人に分かりやすいため） */
export function nextBestMove(cells: readonly ItemId[], cols: number): [number, number] | null {
  const { swaps, target } = solve(cells, cols);
  if (swaps === 0) return null;
  let fallback: [number, number] | null = null;
  const wantAt = (i: number) => target[Math.floor(i / cols)]!;
  for (let i = 0; i < cells.length; i += 1) {
    for (let j = i + 1; j < cells.length; j += 1) {
      if (cells[i] === cells[j]) continue;
      if (solve(swapCells(cells, i, j), cols).swaps !== swaps - 1) continue;
      if (cells[i] === wantAt(j) && cells[j] === wantAt(i)) return [i, j];
      fallback ??= [i, j];
    }
  }
  return fallback;
}

export function createStage(seed: string, index: number, kinds: readonly ItemId[]): Stage {
  const spec = STAGE_SPECS[index];
  if (!spec) throw new Error("unknown stage");
  if (kinds.length !== spec.rows) throw new Error("kinds must equal rows");
  const random = seededRandom(hashText(`${seed}:stage:${index}`));
  const base = kinds.flatMap((k) => Array.from({ length: spec.cols }, () => k));
  let fallback: Stage | null = null;
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const cells = shuffle(base, random);
    if (isSolved(cells, spec.cols)) continue;
    const par = solve(cells, spec.cols).swaps;
    const stage = { rows: spec.rows, cols: spec.cols, kinds: [...kinds], cells, par };
    if (par >= spec.parMin && par <= spec.parMax) return stage;
    if (!fallback || Math.abs(par - spec.parMin) < Math.abs(fallback.par - spec.parMin)) fallback = stage;
  }
  return fallback!;
}

// ---------- 1回分の問題 ----------

export interface Candidate {
  person: PersonId;
  /** 手に持っている物。正解とは一切関係ない */
  held: ItemId;
}

export interface Round {
  seed: string;
  stages: Stage[];
  /** 最後に見せる冷蔵庫の中身 */
  fridge: ItemId[];
  candidates: Candidate[];
  /** 正解の候補の位置（0〜3） */
  correct: number;
}

export const CANDIDATE_COUNT = 4;

/** 面ごとに、分類も色味も重ならない食べ物を選ぶ。甘い物は1回に1つまで */
export function pickStageKinds(random: () => number): ItemId[][] {
  const pool = shuffle(ITEMS, random);
  const used = new Set<ItemId>();
  let sweets = 0;
  return STAGE_SPECS.map((spec) => {
    const chosen: Item[] = [];
    for (const item of pool) {
      if (chosen.length === spec.rows) break;
      if (used.has(item.id)) continue;
      if (item.category === "sweet" && sweets >= 1) continue;
      if (chosen.some((c) => c.category === item.category || c.tone === item.tone)) continue;
      chosen.push(item);
    }
    for (const c of chosen) {
      used.add(c.id as ItemId);
      if (c.category === "sweet") sweets += 1;
    }
    return chosen.map((c) => c.id as ItemId);
  });
}

export function createRound(seed: string): Round {
  if (!isValidSeed(seed)) throw new Error("invalid round seed");
  const random = seededRandom(hashText(`${seed}:round`));
  const kinds = pickStageKinds(random);
  const stages = kinds.map((k, i) => createStage(seed, i, k));
  const inStages = kinds.flat();
  const extras = shuffle(
    ITEM_IDS.filter((id) => !inStages.includes(id)),
    random,
  ).slice(0, 2);
  const fridge = shuffle([...inStages, ...extras], random);

  const people = shuffle(PERSON_IDS, random).slice(0, CANDIDATE_COUNT);
  // 持ち物は4人で重ならないようにする。7割は冷蔵庫にある物（いかにも手がかりっぽく見せる）
  const heldPool = shuffle(fridge, random);
  const taken = new Set<ItemId>();
  const candidates: Candidate[] = people.map((person) => {
    const signature = getPerson(person).signature;
    const fromFridge = random() < 0.7 || taken.has(signature);
    const held = fromFridge ? heldPool.find((id) => !taken.has(id))! : signature;
    taken.add(held);
    return { person, held };
  });
  // 冷蔵庫にある物を持つ人を最低2人にする
  let matching = candidates.filter((c) => fridge.includes(c.held)).length;
  for (const c of candidates) {
    if (matching >= 2) break;
    if (!fridge.includes(c.held)) {
      c.held = heldPool.find((id) => !taken.has(id))!;
      taken.add(c.held);
      matching += 1;
    }
  }
  // 正解は持ち物と無関係に、4人から均等に選ぶ
  const correct = hashText(`${seed}:answer`) % CANDIDATE_COUNT;
  return { seed, stages, fridge, candidates, correct };
}

// ---------- 操作 ----------

export interface PuzzleState {
  cells: ItemId[];
  cols: number;
  selected: number | null;
  moves: number;
}

export function startPuzzle(stage: Stage): PuzzleState {
  return { cells: [...stage.cells], cols: stage.cols, selected: null, moves: 0 };
}

/** マスを押す。1つ目は選ぶ、同じマスでやめる、2つ目で入れ替える（同じ種類どうしは手数に数えない） */
export function tapCell(state: PuzzleState, slot: number): PuzzleState {
  if (!Number.isInteger(slot) || slot < 0 || slot >= state.cells.length) return state;
  if (isSolved(state.cells, state.cols)) return state;
  if (state.selected === null) return { ...state, selected: slot };
  if (state.selected === slot) return { ...state, selected: null };
  if (state.cells[state.selected] === state.cells[slot]) return { ...state, selected: slot };
  return { ...state, cells: swapCells(state.cells, state.selected, slot), selected: null, moves: state.moves + 1 };
}

/** ★の数。最短なら3、最短+2手まで2、それ以上は1 */
export function starsFor(moves: number, par: number): 1 | 2 | 3 {
  if (moves <= par) return 3;
  if (moves <= par + 2) return 2;
  return 1;
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ---------- 共有URL ----------

export interface Score {
  moves: number;
  secs: number;
}

export interface SharedRound {
  seed: string;
  senderPick: number;
  senderScore: Score | null;
}

export const MAX_MOVES = 999;
export const MAX_SECS = 5999;

export function serializeShare(seed: string, pick: number, score?: Score): string {
  if (!isValidSeed(seed)) throw new Error("invalid seed");
  if (!Number.isInteger(pick) || pick < 0 || pick >= CANDIDATE_COUNT) throw new Error("invalid pick");
  const params = new URLSearchParams({ play: GAME_ID, v: FORMAT_VERSION, seed, pick: String(pick) });
  if (score) {
    params.set("m", String(Math.min(MAX_MOVES, Math.max(1, Math.round(score.moves)))));
    params.set("t", String(Math.min(MAX_SECS, Math.max(0, Math.round(score.secs)))));
  }
  return params.toString();
}

export type ParseResult = { kind: "none" } | { kind: "broken" } | { kind: "ok"; shared: SharedRound };

/** URLの # 以降を読む。空なら none、読めなければ broken（画面は新しい問題に戻す） */
export function parseShare(fragment: string): ParseResult {
  const body = fragment.replace(/^#/, "");
  if (body.trim() === "") return { kind: "none" };
  try {
    const params = new URLSearchParams(body);
    if (params.get("play") !== GAME_ID || params.get("v") !== FORMAT_VERSION) return { kind: "broken" };
    const seed = params.get("seed") ?? "";
    const pick = params.get("pick") ?? "";
    if (!isValidSeed(seed) || !/^[0-3]$/.test(pick)) return { kind: "broken" };
    const m = params.get("m");
    const t = params.get("t");
    let senderScore: Score | null = null;
    if (m !== null || t !== null) {
      if (!m || !t || !/^\d{1,3}$/.test(m) || !/^\d{1,4}$/.test(t)) return { kind: "broken" };
      const moves = Number(m);
      const secs = Number(t);
      if (moves < 1 || moves > MAX_MOVES || secs > MAX_SECS) return { kind: "broken" };
      senderScore = { moves, secs };
    }
    return { kind: "ok", shared: { seed, senderPick: Number(pick), senderScore } };
  } catch {
    return { kind: "broken" };
  }
}

export function comparisonMessage(correct: number, mine: number, sender?: number): string {
  if (sender === undefined) return mine === correct ? "なんで分かった？" : "いや知らんわ！";
  const meOk = mine === correct;
  const senderOk = sender === correct;
  if (meOk && senderOk) return "この二人、冷蔵庫に詳しすぎる";
  if (meOk) return "なんで分かった？";
  if (senderOk) return "送った人、たまたま当ててます";
  if (mine === sender) return "気は合う。正解ではない";
  return "二人とも知らんわ！";
}

// ---------- 保存（自己ベストと回数だけ） ----------

export const STORAGE_KEY = "hiehie-fridge.v2";

export interface Best {
  stars: number;
  moves: number;
  secs: number;
}

export interface SaveData {
  plays: number;
  best: Best | null;
}

export const emptySave = (): SaveData => ({ plays: 0, best: null });

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

export function parseSave(raw: string | null): SaveData {
  try {
    const data = JSON.parse(raw ?? "null");
    if (!data || typeof data !== "object" || !isInt(data.plays, 0, 1_000_000)) return emptySave();
    const b = data.best;
    if (b === null) return { plays: data.plays, best: null };
    if (!b || !isInt(b.stars, 1, 9) || !isInt(b.moves, 1, MAX_MOVES) || !isInt(b.secs, 0, 35999)) return emptySave();
    return { plays: data.plays, best: { stars: b.stars, moves: b.moves, secs: b.secs } };
  } catch {
    return emptySave();
  }
}

/** ★が多いほど、同じなら手数が少ないほど、同じなら速いほど良い */
export function isBetter(a: Best, b: Best | null): boolean {
  if (!b) return true;
  if (a.stars !== b.stars) return a.stars > b.stars;
  if (a.moves !== b.moves) return a.moves < b.moves;
  return a.secs < b.secs;
}

export function recordPlay(save: SaveData, result: Best): { save: SaveData; newBest: boolean } {
  const newBest = isBetter(result, save.best);
  return { save: { plays: Math.min(save.plays + 1, 1_000_000), best: newBest ? { ...result } : save.best }, newBest };
}
