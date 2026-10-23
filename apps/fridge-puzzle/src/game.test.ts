// 判定・生成・共有URL・保存の単体テスト（テスト計画書 03 の T1〜T5）。npm test で実行する。
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  CANDIDATE_COUNT,
  ITEMS,
  ITEM_IDS,
  PEOPLE,
  STAGE_SPECS,
  comparisonMessage,
  completedRows,
  createRound,
  createSeed,
  emptySave,
  formatTime,
  getItem,
  isSolved,
  isValidSeed,
  nextBestMove,
  parseSave,
  parseShare,
  recordPlay,
  seededRandom,
  serializeShare,
  shuffle,
  solve,
  starsFor,
  startPuzzle,
  swapCells,
  tapCell,
  type ItemId,
} from "./game.js";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error(`NG ${name}`);
    throw error;
  }
}

const seedOf = (i: number) => `seed${String(i).padStart(6, "0")}`;

// ---------- T1 最短手数（総当たりと一致するか） ----------

/** すべての並びを幅優先でたどり、そろった状態からの距離を出す */
function bfsDistances(rows: number, cols: number): Map<string, number> {
  const kinds = (["egg", "milk", "beer", "natto"] as ItemId[]).slice(0, rows);
  const dist = new Map<string, number>();
  let frontier: ItemId[][] = [];
  const perms = (list: ItemId[]): ItemId[][] =>
    list.length <= 1 ? [list] : list.flatMap((h, i) => perms([...list.slice(0, i), ...list.slice(i + 1)]).map((r) => [h, ...r]));
  for (const order of perms(kinds)) {
    const cells = order.flatMap((k) => Array<ItemId>(cols).fill(k));
    dist.set(cells.join(), 0);
    frontier.push(cells);
  }
  let d = 0;
  while (frontier.length) {
    d += 1;
    const next: ItemId[][] = [];
    for (const cells of frontier)
      for (let i = 0; i < cells.length; i += 1)
        for (let j = i + 1; j < cells.length; j += 1) {
          if (cells[i] === cells[j]) continue;
          const s = swapCells(cells, i, j);
          const key = s.join();
          if (!dist.has(key)) {
            dist.set(key, d);
            next.push(s);
          }
        }
    frontier = next;
  }
  return dist;
}

for (const [rows, cols] of [
  [3, 3],
  [3, 4],
] as const) {
  test(`T1 ${rows}×${cols} の全配置で最短手数が総当たりと一致`, () => {
    const dist = bfsDistances(rows, cols);
    assert.ok(dist.size > 1000);
    for (const [key, d] of dist) assert.equal(solve(key.split(",") as ItemId[], cols).swaps, d, key);
  });
}

test("T1 4×4 は乱数配置で「最短手順どおりに進めると最短手数でそろう」", () => {
  const random = seededRandom(7);
  const base = (["egg", "milk", "beer", "natto"] as ItemId[]).flatMap((k) => Array<ItemId>(4).fill(k));
  for (let n = 0; n < 150; n += 1) {
    let cells = shuffle(base, random);
    const par = solve(cells, 4).swaps;
    for (let step = 0; step < par; step += 1) {
      const move = nextBestMove(cells, 4);
      assert.ok(move, "途中で手がなくなってはいけない");
      cells = swapCells(cells, move[0], move[1]);
      assert.equal(solve(cells, 4).swaps, par - step - 1);
    }
    assert.equal(isSolved(cells, 4), true);
    assert.equal(nextBestMove(cells, 4), null);
  }
});

// ---------- T2 盤面の生成（必ず解ける・最初から解けていない・難しくなる） ----------

test("T2 300回分の問題: どの面も解けていない状態で始まり、最短手順でそろう", () => {
  for (let i = 0; i < 300; i += 1) {
    const round = createRound(seedOf(i));
    assert.equal(round.stages.length, STAGE_SPECS.length);
    round.stages.forEach((stage, s) => {
      const spec = STAGE_SPECS[s]!;
      assert.equal(stage.rows, spec.rows);
      assert.equal(stage.cols, spec.cols);
      assert.equal(stage.cells.length, spec.rows * spec.cols);
      assert.equal(isSolved(stage.cells, stage.cols), false, "最初からそろっていてはいけない");
      assert.ok(completedRows(stage.cells, stage.cols).filter(Boolean).length < stage.rows);
      for (const k of stage.kinds) assert.equal(stage.cells.filter((c) => c === k).length, stage.cols, "各種類は列の数だけ");
      assert.ok(stage.par >= spec.parMin && stage.par <= spec.parMax, `最短 ${stage.par} 手が範囲外`);
      assert.equal(solve(stage.cells, stage.cols).swaps, stage.par);
      let state = startPuzzle(stage);
      while (!isSolved(state.cells, state.cols)) {
        const [a, b] = nextBestMove(state.cells, state.cols)!;
        state = tapCell(tapCell(state, a), b);
      }
      assert.equal(state.moves, stage.par, "ヒントどおりに押せば最短でクリアできる");
    });
    const pars = round.stages.map((s) => s.par);
    assert.ok(pars[0]! < pars[1]! && pars[1]! < pars[2]!, "面が進むほど最短手数が増える");
  }
});

test("T2 食べ物: 1つの面で分類も色味も重ならず、3面で同じ物を使わず、甘い物は1つまで", () => {
  const categories = new Set<string>();
  for (let i = 0; i < 300; i += 1) {
    const round = createRound(seedOf(i));
    const all = round.stages.flatMap((s) => s.kinds);
    assert.equal(new Set(all).size, all.length);
    assert.ok(all.filter((id) => getItem(id).category === "sweet").length <= 1);
    for (const stage of round.stages) {
      const items = stage.kinds.map(getItem);
      assert.equal(new Set(items.map((x) => x.category)).size, items.length);
      assert.equal(new Set(items.map((x) => x.tone)).size, items.length);
      items.forEach((x) => categories.add(x.category));
    }
    assert.equal(round.fridge.length, all.length + 2);
    for (const id of all) assert.ok(round.fridge.includes(id), "冷蔵庫には遊んだ食べ物が全部入っている");
  }
  for (const c of ["meat", "fish", "veg", "dairy", "drink", "madeahead", "sweet", "fruit"]) assert.ok(categories.has(c), `${c} が出てこない`);
});

test("T2 同じ seed なら同じ問題、違う seed なら違う問題", () => {
  assert.deepEqual(createRound("abc12345"), createRound("abc12345"));
  const firstBoards = new Set(Array.from({ length: 50 }, (_, i) => createRound(seedOf(i)).stages[0]!.cells.join()));
  assert.ok(firstBoards.size >= 25, "最初の面が毎回ほぼ違う");
  const fridges = new Set(Array.from({ length: 50 }, (_, i) => createRound(seedOf(i)).fridge.slice().sort().join()));
  assert.ok(fridges.size >= 48, "冷蔵庫の中身が毎回違う");
  assert.throws(() => createRound("BAD"));
});

// ---------- T3 候補と正解（偏りがないか） ----------

test("T3 候補は毎回4人・人も持ち物も重複なし。冷蔵庫にある物を持つ人が2人以上", () => {
  for (let i = 0; i < 500; i += 1) {
    const round = createRound(seedOf(i));
    assert.equal(round.candidates.length, CANDIDATE_COUNT);
    assert.equal(new Set(round.candidates.map((c) => c.person)).size, CANDIDATE_COUNT);
    assert.ok(round.candidates.filter((c) => round.fridge.includes(c.held)).length >= 2);
    assert.equal(new Set(round.candidates.map((c) => c.held)).size, CANDIDATE_COUNT, "持ち物は4人で重ならない");
    assert.ok(round.correct >= 0 && round.correct < CANDIDATE_COUNT);
  }
});

test("T3 偏り: 正解の位置・候補の登場・持ち物と正解の関係", () => {
  const N = 4000;
  const correctAt = [0, 0, 0, 0];
  const appear = new Map<string, number>();
  let heldMatchesCorrect = 0;
  let heldInFridgeCorrect = 0;
  let heldInFridgeAll = 0;
  for (let i = 0; i < N; i += 1) {
    const round = createRound(`b${String(i).padStart(9, "0")}`);
    correctAt[round.correct]! += 1;
    for (const c of round.candidates) appear.set(c.person, (appear.get(c.person) ?? 0) + 1);
    const winner = round.candidates[round.correct]!;
    if (round.fridge.includes(winner.held)) heldInFridgeCorrect += 1;
    heldInFridgeAll += round.candidates.filter((c) => round.fridge.includes(c.held)).length;
    if (winner.held === round.stages[2]!.kinds[0]) heldMatchesCorrect += 1;
  }
  for (const n of correctAt) assert.ok(Math.abs(n / N - 0.25) < 0.025, `正解の位置が偏っている ${correctAt}`);
  const expected = (N * CANDIDATE_COUNT) / PEOPLE.length;
  assert.equal(appear.size, PEOPLE.length, "全員が登場する");
  for (const [id, n] of appear) assert.ok(Math.abs(n - expected) / expected < 0.15, `${id} の登場が偏っている ${n}/${expected}`);
  // 正解の人だけ冷蔵庫の物を持ちやすい、ということがない（持ち物は正解と無関係）
  const rateCorrect = heldInFridgeCorrect / N;
  const rateAll = heldInFridgeAll / (N * CANDIDATE_COUNT);
  assert.ok(Math.abs(rateCorrect - rateAll) < 0.03, `正解の人の持ち物が冷蔵庫と一致しやすい ${rateCorrect} vs ${rateAll}`);
  assert.ok(heldMatchesCorrect / N < 0.2);
});

test("T3 偏り: 混ぜ方は全並びが同じくらい・最初の面の各マスに各種類が同じくらい", () => {
  const random = seededRandom(123);
  const counts = new Map<string, number>();
  const N = 60000;
  for (let i = 0; i < N; i += 1) {
    const key = shuffle(["x", "y", "z"], random).join("");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  assert.equal(counts.size, 6);
  let chi = 0;
  for (const n of counts.values()) chi += (n - N / 6) ** 2 / (N / 6);
  assert.ok(chi < 20.5, `カイ二乗 ${chi.toFixed(1)}（自由度5・p=0.001 の境界 20.5）`);

  const M = 2000;
  const perCell = Array.from({ length: 9 }, () => [0, 0, 0]);
  for (let i = 0; i < M; i += 1) {
    const stage = createRound(`c${String(i).padStart(9, "0")}`).stages[0]!;
    stage.cells.forEach((item, cell) => (perCell[cell]![stage.kinds.indexOf(item)]! += 1));
  }
  for (const cell of perCell) for (const n of cell) assert.ok(Math.abs(n / M - 1 / 3) < 0.04, `マスの偏り ${JSON.stringify(perCell)}`);
});

// ---------- T4 操作 ----------

test("T4 タップ: 1つ目で選ぶ・同じマスで取り消し・2つ目で入れ替え・同じ種類は手数に数えない", () => {
  const stage = createRound("abc12345").stages[0]!;
  let s = startPuzzle(stage);
  s = tapCell(s, 0);
  assert.equal(s.selected, 0);
  s = tapCell(s, 0);
  assert.equal(s.selected, null);
  const other = s.cells.findIndex((c) => c !== s.cells[0]);
  const same = s.cells.findIndex((c, i) => i > 0 && c === s.cells[0]);
  s = tapCell(tapCell(s, 0), same);
  assert.equal(s.moves, 0, "同じ種類どうしは入れ替えない");
  assert.equal(s.selected, same, "選び直しになる");
  const before = s.cells;
  s = tapCell(s, other);
  assert.equal(s.moves, 1);
  assert.equal(s.selected, null);
  assert.equal(s.cells[same], before[other]);
  assert.equal(s.cells[other], before[same]);
  assert.deepEqual(tapCell(s, 99), s, "範囲外は無視");
  assert.deepEqual(tapCell(s, -1), s);
  assert.deepEqual(tapCell(s, 1.5), s);
});

test("T4 そろった後は操作を受け付けない", () => {
  const solved: ItemId[] = ["egg", "egg", "egg", "milk", "milk", "milk", "beer", "beer", "beer"];
  const s = { cells: solved, cols: 3, selected: null, moves: 3 };
  assert.equal(isSolved(solved, 3), true);
  assert.deepEqual(tapCell(s, 0), s);
  assert.deepEqual(completedRows(["egg", "egg", "milk", "milk", "milk", "egg", "beer", "beer", "beer"], 3), [false, false, true]);
});

test("T4 ★と時間の表示", () => {
  assert.equal(starsFor(3, 3), 3);
  assert.equal(starsFor(2, 3), 3);
  assert.equal(starsFor(5, 3), 2);
  assert.equal(starsFor(6, 3), 1);
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(65.9), "1:05");
  assert.equal(formatTime(-3), "0:00");
});

// ---------- T5 共有URL・保存（壊れたときの扱い） ----------

test("T5 共有URL: 書いて読むと同じ。正解は書かない", () => {
  const f = serializeShare("abc12345", 2, { moves: 17, secs: 74.4 });
  assert.ok(!/correct|answer/.test(f));
  assert.deepEqual(parseShare(`#${f}`), { kind: "ok", shared: { seed: "abc12345", senderPick: 2, senderScore: { moves: 17, secs: 74 } } });
  assert.deepEqual(parseShare(serializeShare("abc12345", 0)), { kind: "ok", shared: { seed: "abc12345", senderPick: 0, senderScore: null } });
  assert.throws(() => serializeShare("abc12345", 4));
  assert.throws(() => serializeShare("x", 0));
});

test("T5 共有URL: 空は none、壊れたものは broken（例外を出さない）", () => {
  assert.deepEqual(parseShare(""), { kind: "none" });
  assert.deepEqual(parseShare("#"), { kind: "none" });
  const broken = [
    "#play=hiehie-fridge&round=sweets-02&seed=abc12345&pick=0", // 前の版のリンク
    "#play=other&v=2&seed=abc12345&pick=0",
    "#play=hiehie-fridge&v=3&seed=abc12345&pick=0",
    "#play=hiehie-fridge&v=2&seed=bad&pick=0",
    "#play=hiehie-fridge&v=2&seed=ABC12345&pick=0",
    "#play=hiehie-fridge&v=2&seed=abc12345&pick=4",
    "#play=hiehie-fridge&v=2&seed=abc12345&pick=-1",
    "#play=hiehie-fridge&v=2&seed=abc12345",
    "#play=hiehie-fridge&v=2&seed=abc12345&pick=1&m=0&t=10",
    "#play=hiehie-fridge&v=2&seed=abc12345&pick=1&m=1000&t=10",
    "#play=hiehie-fridge&v=2&seed=abc12345&pick=1&m=12",
    "#play=hiehie-fridge&v=2&seed=abc12345&pick=1&m=12&t=abc",
    "#play=hiehie-fridge&v=2&seed=abc12345&pick=1&m=12&t=6000",
    "#%E0%A4%A",
    "#<script>alert(1)</script>",
    "#abc",
  ];
  for (const b of broken) assert.deepEqual(parseShare(b), { kind: "broken" }, b);
});

test("T5 共有URL: でたらめな文字列 3000 通りで例外が出ず、ok のときは中身が正しい範囲", () => {
  const random = seededRandom(99);
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789=&#%?-_.~play=hiehie-fridgev=2seed=pick=m=t=";
  for (let n = 0; n < 3000; n += 1) {
    const len = Math.floor(random() * 60);
    let s = "";
    for (let i = 0; i < len; i += 1) s += chars[Math.floor(random() * chars.length)];
    if (n % 3 === 0) s = `play=hiehie-fridge&v=2&seed=${s.slice(0, 12)}&pick=${s.slice(12, 13)}`;
    const r = parseShare(s);
    if (r.kind === "ok") {
      assert.ok(isValidSeed(r.shared.seed));
      assert.ok(r.shared.senderPick >= 0 && r.shared.senderPick < 4);
    }
  }
});

test("T5 保存: 壊れていたら初期状態・正しければ読む・ベスト更新", () => {
  assert.deepEqual(parseSave(null), emptySave());
  assert.deepEqual(parseSave("{oops"), emptySave());
  assert.deepEqual(parseSave("[]"), emptySave());
  assert.deepEqual(parseSave('{"plays":-1,"best":null}'), emptySave());
  assert.deepEqual(parseSave('{"plays":2,"best":{"stars":12,"moves":3,"secs":4}}'), emptySave());
  assert.deepEqual(parseSave('{"plays":2,"best":{"stars":9,"moves":"3","secs":4}}'), emptySave());
  assert.deepEqual(parseSave('{"plays":2,"best":null}'), { plays: 2, best: null });
  assert.deepEqual(parseSave('{"plays":2,"best":{"stars":9,"moves":13,"secs":40},"x":1}'), { plays: 2, best: { stars: 9, moves: 13, secs: 40 } });
  let r = recordPlay(emptySave(), { stars: 7, moves: 15, secs: 60 });
  assert.equal(r.newBest, true);
  r = recordPlay(r.save, { stars: 6, moves: 12, secs: 30 });
  assert.equal(r.newBest, false, "★が少なければ手数が少なくてもベストではない");
  r = recordPlay(r.save, { stars: 7, moves: 15, secs: 50 });
  assert.equal(r.newBest, true, "同じ★・同じ手数なら速い方");
  assert.equal(r.save.plays, 3);
});

test("T5 結果のひとこと", () => {
  assert.equal(comparisonMessage(0, 0), "なんで分かった？");
  assert.equal(comparisonMessage(0, 1), "いや知らんわ！");
  assert.equal(comparisonMessage(0, 0, 0), "この二人、冷蔵庫に詳しすぎる");
  assert.equal(comparisonMessage(0, 0, 1), "なんで分かった？");
  assert.equal(comparisonMessage(0, 1, 0), "送った人、たまたま当ててます");
  assert.equal(comparisonMessage(0, 1, 1), "気は合う。正解ではない");
  assert.equal(comparisonMessage(0, 1, 2), "二人とも知らんわ！");
});

test("T5 seed", () => {
  assert.equal(isValidSeed("abc12345"), true);
  assert.equal(isValidSeed("UPPERCASE"), false);
  assert.equal(createSeed(new Uint32Array([1, 2])), "00000010000002");
  for (let i = 0; i < 100; i += 1) assert.ok(isValidSeed(createSeed()));
});

test("素材: 食べ物と人物の絵がすべてある", () => {
  const art = new URL("../public/art/", import.meta.url);
  for (const id of ITEM_IDS) assert.ok(fs.existsSync(new URL(`f-${id}.webp`, art)), id);
  for (const p of PEOPLE) assert.ok(fs.existsSync(new URL(`p-${p.id}.webp`, art)), p.id);
  for (const p of PEOPLE) assert.ok(ITEM_IDS.includes(p.signature));
  assert.ok(ITEMS.length >= 30 && PEOPLE.length >= 20);
});

console.log(`ヒエヒエ冷蔵庫: ${passed} 件すべて合格`);
