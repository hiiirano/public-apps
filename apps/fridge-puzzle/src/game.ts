export const GAME_ID = "hiehie-fridge";
export const ROUND_ID = "sweets-01";

export const CHARACTER_IDS = ["gothic", "hobbyist", "kid", "grandma"] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

export interface Character {
  id: CharacterId;
  revealName: string;
  spriteIndex: number;
}

export const CHARACTERS: readonly Character[] = [
  { id: "gothic", revealName: "黒い服の人", spriteIndex: 0 },
  { id: "hobbyist", revealName: "ミント色の服の人", spriteIndex: 1 },
  { id: "kid", revealName: "黄色い服の子", spriteIndex: 2 },
  { id: "grandma", revealName: "赤い服のおばあちゃん", spriteIndex: 3 },
];

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

export function createRound(seed: string): Round {
  if (!isValidSeed(seed)) throw new Error("invalid round seed");
  const order = [...CHARACTER_IDS];
  const random = seededRandom(hashText(`${seed}:order`));
  for (let index = order.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [order[index], order[other]] = [order[other]!, order[index]!];
  }
  const correct = CHARACTER_IDS[hashText(`${seed}:answer`) % CHARACTER_IDS.length]!;
  return { id: ROUND_ID, seed, order, correct };
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
