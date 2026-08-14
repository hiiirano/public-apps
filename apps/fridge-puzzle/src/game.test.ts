import assert from "node:assert/strict";
import {
  CHARACTER_IDS,
  GAME_ID,
  ROUND_ID,
  comparisonMessage,
  createRound,
  createSeed,
  getCharacter,
  isValidSeed,
  parseSharedRound,
  serializeSharedRound,
} from "./game.js";

const seed = "abc12345";
const round = createRound(seed);
const repeated = createRound(seed);

assert.equal(round.id, ROUND_ID);
assert.deepEqual(round, repeated, "same seed must reproduce the full round");
assert.equal(new Set(round.order).size, 4);
assert.deepEqual([...round.order].sort(), [...CHARACTER_IDS].sort());
assert.ok(CHARACTER_IDS.includes(round.correct));

const senderChoice = round.order[2]!;
const fragment = serializeSharedRound(round, senderChoice);
const parsed = parseSharedRound(`#${fragment}`);
assert.deepEqual(parsed, { game: GAME_ID, round: ROUND_ID, seed, senderSlot: 2 });
assert.equal(createRound(parsed!.seed).order[parsed!.senderSlot], senderChoice);

assert.equal(parseSharedRound(""), null);
assert.equal(parseSharedRound("#play=hiehie-fridge&round=sweets-01&seed=bad&pick=0"), null);
assert.equal(parseSharedRound("#play=hiehie-fridge&round=sweets-01&seed=abc12345&pick=4"), null);
assert.equal(parseSharedRound("#play=other&round=sweets-01&seed=abc12345&pick=0"), null);
assert.equal(parseSharedRound("#play=hiehie-fridge&round=unknown&seed=abc12345&pick=0"), null);

assert.equal(isValidSeed("abc12345"), true);
assert.equal(isValidSeed("UPPERCASE"), false);
assert.equal(isValidSeed("with-dash"), false);
assert.equal(createSeed(new Uint32Array([1, 2])), "00000010000002");

const [correct, wrongA, wrongB] = CHARACTER_IDS;
assert.equal(comparisonMessage(correct, correct), "なんで分かった？");
assert.equal(comparisonMessage(correct, wrongA), "いや知らんわ！");
assert.equal(comparisonMessage(correct, correct, correct), "この二人、冷蔵庫に詳しすぎる");
assert.equal(comparisonMessage(correct, correct, wrongA), "なんで分かった？");
assert.equal(comparisonMessage(correct, wrongA, correct), "送った人、たまたま当ててます");
assert.equal(comparisonMessage(correct, wrongA, wrongA), "気は合う。正解ではない");
assert.equal(comparisonMessage(correct, wrongA, wrongB), "二人とも知らんわ！");

for (const id of CHARACTER_IDS) assert.equal(getCharacter(id).id, id);

console.log("hiehie-fridge core tests: all tests passed!");
