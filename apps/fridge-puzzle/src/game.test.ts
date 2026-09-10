import assert from "node:assert/strict";
import {
  CHARACTER_IDS,
  GAME_ID,
  ROUND_ID,
  comparisonMessage,
  createPuzzleState,
  createRound,
  createSeed,
  getCharacter,
  isPuzzleSolved,
  isValidSeed,
  parseSharedRound,
  selectPuzzleSlot,
  serializeSharedRound,
  type PuzzleState,
} from "./game.js";

assert.ok(CHARACTER_IDS.length >= 7, "candidate pool must contain at least seven people");

const seed = "abc12345";
const round = createRound(seed);
assert.equal(round.id, ROUND_ID);
assert.deepEqual(round, createRound(seed), "same seed must reproduce candidates, order and answer");
assert.equal(round.order.length, 4);
assert.equal(new Set(round.order).size, 4, "a round must not contain duplicate candidates");
assert.ok(round.order.includes(round.correct));

const seen = new Set(Array.from({ length: 40 }, (_, index) => createRound(`seed${String(index).padStart(4, "0")}`).order).flat());
assert.ok(seen.size >= 7, "different seeds must use the full candidate pool");

let puzzle = createPuzzleState();
assert.equal(isPuzzleSolved(puzzle), false);
puzzle = selectPuzzleSlot(puzzle, 0);
assert.equal(puzzle.selected, 0);
puzzle = selectPuzzleSlot(puzzle, 4);
assert.equal(puzzle.moves, 1);
assert.equal(isPuzzleSolved(puzzle), false);
puzzle = selectPuzzleSlot(selectPuzzleSlot(puzzle, 1), 7);
puzzle = selectPuzzleSlot(selectPuzzleSlot(puzzle, 5), 6);
assert.deepEqual(puzzle.slots, ["pudding", "pudding", "pudding", "cake", "cake", "cake", "icecream", "icecream", "icecream"]);
assert.equal(puzzle.moves, 3);
assert.equal(isPuzzleSolved(puzzle), true);

const resetSelection = selectPuzzleSlot(selectPuzzleSlot(createPuzzleState(), 1), 1);
assert.equal(resetSelection.selected, null);
assert.equal(resetSelection.moves, 0);
assert.deepEqual(selectPuzzleSlot(createPuzzleState(), 9), createPuzzleState(), "out-of-range slot must not change state");

const alternateSolved: PuzzleState = {
  slots: ["cake", "cake", "cake", "icecream", "icecream", "icecream", "pudding", "pudding", "pudding"],
  selected: null,
  moves: 4,
};
assert.equal(isPuzzleSolved(alternateSolved), true, "row order must not matter");

const senderChoice = round.order[2]!;
const fragment = serializeSharedRound(round, senderChoice);
const parsed = parseSharedRound(`#${fragment}`);
assert.deepEqual(parsed, { game: GAME_ID, round: ROUND_ID, seed, senderSlot: 2 });
assert.equal(createRound(parsed!.seed).order[parsed!.senderSlot], senderChoice);

assert.equal(parseSharedRound(""), null);
assert.equal(parseSharedRound("#play=hiehie-fridge&round=sweets-02&seed=bad&pick=0"), null);
assert.equal(parseSharedRound("#play=hiehie-fridge&round=sweets-02&seed=abc12345&pick=4"), null);
assert.equal(parseSharedRound("#play=hiehie-fridge&round=sweets-01&seed=abc12345&pick=0"), null);

assert.equal(isValidSeed("abc12345"), true);
assert.equal(isValidSeed("UPPERCASE"), false);
assert.equal(createSeed(new Uint32Array([1, 2])), "00000010000002");

const [correct, wrongA, wrongB] = CHARACTER_IDS;
assert.equal(comparisonMessage(correct, correct), "なんで分かった？");
assert.equal(comparisonMessage(correct, wrongA), "いや知らんわ！");
assert.equal(comparisonMessage(correct, correct, correct), "この二人、冷蔵庫に詳しすぎる");
assert.equal(comparisonMessage(correct, correct, wrongA), "なんで分かった？");
assert.equal(comparisonMessage(correct, wrongA, correct), "送った人、たまたま当ててます");
assert.equal(comparisonMessage(correct, wrongA, wrongA), "気は合う。正解ではない");
assert.equal(comparisonMessage(correct, wrongA, wrongB), "二人とも知らんわ！");

for (const id of CHARACTER_IDS) {
  const character = getCharacter(id);
  assert.equal(character.id, id);
  assert.match(character.image, /^\.\/assets\/character-[a-z]+\.webp$/);
}

console.log("hiehie-fridge 3x3 puzzle core tests: all tests passed!");
