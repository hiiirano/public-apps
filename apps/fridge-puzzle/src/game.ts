export const GAME_ID = "hiehie-fridge";
export const ROUND_ID = "sweets-02";

export const CHARACTER_IDS = ["gothic", "kid", "grandma", "cardigan", "athlete", "office", "hat"] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

export interface Character {
  id: CharacterId;
  revealName: string;
  image: string;
}

export const CHARACTERS: readonly Character[] = [
  { id: "gothic", revealName: "黒い服の人", image: "./assets/character-gothic.webp" },
  { id: "kid", revealName: "黄色い服の子", image: "./assets/character-kid.webp" },
  { id: "grandma", revealName: "赤い服のおばあちゃん", image: "./assets/character-grandma.webp" },
  { id: "cardigan", revealName: "赤いカーディガンの人", image: "./assets/character-cardigan.webp" },
  { id: "athlete", revealName: "ジャージの人", image: "./assets/character-athlete.webp" },
  { id: "office", revealName: "紺色の上着の人", image: "./assets/character-office.webp" },
  { id: "hat", revealName: "帽子のおじさん", image: "./assets/character-hat.webp" },
];

export type PuzzleItemId = "pudding" | "cake" | "icecream";
export type PuzzleSlot = number;

export interface PuzzleState {
  slots: PuzzleItemId[];
  selected: PuzzleSlot | null;
  moves: number;
}

export interface Round {
  id: typeof ROUND_ID;
  seed: string;
  order: CharacterId[];
  correct: CharacterId;
}

export interface SharedRound {
  game: typeof GAME_ID;
  round: typeof ROUND_ID;
  seed: string;
  senderSlot: number;
}

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let value = seed || 0x9e3779b9;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
}

function shuffledCharacters(seed: string): CharacterId[] {
  const pool = [...CHARACTER_IDS];
  const random = seededRandom(hashText(`${seed}:characters`));
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [pool[index], pool[other]] = [pool[other]!, pool[index]!];
  }
  return pool;
}

export function createRound(seed: string): Round {
  if (!isValidSeed(seed)) throw new Error("invalid round seed");
  const order = shuffledCharacters(seed).slice(0, 4);
  const correct = order[hashText(`${seed}:answer`) % order.length]!;
  return { id: ROUND_ID, seed, order, correct };
}

export function createPuzzleState(): PuzzleState {
  return {
    slots: ["cake", "icecream", "pudding", "cake", "pudding", "icecream", "cake", "pudding", "icecream"],
    selected: null,
    moves: 0,
  };
}

export function selectPuzzleSlot(state: PuzzleState, slot: PuzzleSlot): PuzzleState {
  if (!Number.isInteger(slot) || slot < 0 || slot >= state.slots.length) return state;
  if (state.selected === null) return { ...state, selected: slot };
  if (state.selected === slot) return { ...state, selected: null };
  const slots: PuzzleState["slots"] = [...state.slots];
  [slots[state.selected], slots[slot]] = [slots[slot], slots[state.selected]];
  return { slots, selected: null, moves: state.moves + 1 };
}

export function isPuzzleSolved(state: PuzzleState): boolean {
  if (state.slots.length !== 9) return false;
  const rows = [state.slots.slice(0, 3), state.slots.slice(3, 6), state.slots.slice(6, 9)];
  return rows.every((row) => row.every((item) => item === row[0])) && new Set(rows.map((row) => row[0])).size === 3;
}

export function isValidSeed(seed: string): boolean {
  return /^[a-z0-9]{8,24}$/.test(seed);
}

export function createSeed(randomValues?: Uint32Array): string {
  const values = randomValues ?? crypto.getRandomValues(new Uint32Array(2));
  return Array.from(values, (value) => value.toString(36).padStart(7, "0")).join("").slice(0, 14);
}

export function serializeSharedRound(round: Round, senderChoice: CharacterId): string {
  const senderSlot = round.order.indexOf(senderChoice);
  if (senderSlot < 0) throw new Error("sender choice is not in this round");
  return new URLSearchParams({
    play: GAME_ID,
    round: ROUND_ID,
    seed: round.seed,
    pick: String(senderSlot),
  }).toString();
}

export function parseSharedRound(fragment: string): SharedRound | null {
  try {
    const params = new URLSearchParams(fragment.replace(/^#/, ""));
    if (params.get("play") !== GAME_ID || params.get("round") !== ROUND_ID) return null;
    const seed = params.get("seed") ?? "";
    const senderSlotText = params.get("pick") ?? "";
    if (!isValidSeed(seed) || !/^[0-3]$/.test(senderSlotText)) return null;
    return { game: GAME_ID, round: ROUND_ID, seed, senderSlot: Number(senderSlotText) };
  } catch {
    return null;
  }
}

export function comparisonMessage(
  correct: CharacterId,
  receiverChoice: CharacterId,
  senderChoice?: CharacterId,
): string {
  if (!senderChoice) return receiverChoice === correct ? "なんで分かった？" : "いや知らんわ！";
  const receiverCorrect = receiverChoice === correct;
  const senderCorrect = senderChoice === correct;
  if (receiverCorrect && senderCorrect) return "この二人、冷蔵庫に詳しすぎる";
  if (receiverCorrect) return "なんで分かった？";
  if (senderCorrect) return "送った人、たまたま当ててます";
  if (receiverChoice === senderChoice) return "気は合う。正解ではない";
  return "二人とも知らんわ！";
}

export function getCharacter(id: CharacterId): Character {
  const character = CHARACTERS.find((candidate) => candidate.id === id);
  if (!character) throw new Error(`unknown character: ${id}`);
  return character;
}
