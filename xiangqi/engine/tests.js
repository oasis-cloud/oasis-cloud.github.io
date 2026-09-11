import assert from "node:assert/strict";
import {
  BLACK,
  CANNON,
  CHARIOT,
  ELEPHANT,
  HORSE,
  KING,
  PAWN,
  RED,
  applyMove,
  cloneBoard,
  createInitialBoard,
  getAllLegalMoves,
  getLegalMoves,
  getStatus,
  isInCheck,
  perft,
  positionKey,
} from "./rules.js";
import { evaluate, evaluateRed } from "./evaluate.js";
import { search } from "./search.js";

const passed = [];

function test(name, fn) {
  fn();
  passed.push(name);
  console.log("PASS", name);
}

function emptyBoard() {
  return Array.from({ length: 10 }, () => Array(9).fill(null));
}

function placeKings(board, red = { f: 4, r: 0 }, black = { f: 4, r: 9 }) {
  board[red.r][red.f] = { side: RED, type: KING };
  board[black.r][black.f] = { side: BLACK, type: KING };
}

function hasDest(moves, f, r) {
  return moves.some((m) => m.f === f && m.r === r);
}

try {
  const initial = createInitialBoard();

  test("开局 perft(1) 红方合法着法数", () => {
    const n = perft(initial, RED, 1);
    console.log("perft(initial, red, 1) =", n);
    assert.ok(n >= 40 && n <= 50, `开局着法应在 40–50，实际 ${n}`);
    assert.equal(n, 44);
  });

  test("蹩马腿：马在 (1,0)，(1,1) 有子，不能走到 (2,2)/(0,2)", () => {
    const b = emptyBoard();
    placeKings(b, { f: 4, r: 0 }, { f: 5, r: 9 });
    b[0][1] = { side: RED, type: HORSE };
    b[1][1] = { side: RED, type: PAWN };
    const moves = getLegalMoves(b, 1, 0);
    assert.equal(hasDest(moves, 2, 2), false);
    assert.equal(hasDest(moves, 0, 2), false);
  });

  test("塞象眼", () => {
    const b = emptyBoard();
    placeKings(b, { f: 4, r: 0 }, { f: 5, r: 9 });
    b[0][2] = { side: RED, type: ELEPHANT };
    b[1][3] = { side: RED, type: PAWN };
    const moves = getLegalMoves(b, 2, 0);
    assert.equal(hasDest(moves, 4, 2), false);
  });

  test("象不过河", () => {
    const b = emptyBoard();
    placeKings(b, { f: 4, r: 0 }, { f: 5, r: 9 });
    b[4][2] = { side: RED, type: ELEPHANT };
    const moves = getLegalMoves(b, 2, 4);
    assert.equal(hasDest(moves, 4, 6), false);
    assert.equal(hasDest(moves, 0, 6), false);
    assert.equal(hasDest(moves, 4, 2), true);
    assert.equal(hasDest(moves, 0, 2), true);
  });

  test("炮吃必须隔一子、隔两子不能吃、无炮架不能吃", () => {
    const target = { f: 4, r: 7 };
    function cannonBoard(screens) {
      const b = emptyBoard();
      placeKings(b, { f: 3, r: 0 }, { f: 5, r: 9 });
      b[4][4] = { side: RED, type: CANNON };
      b[target.r][target.f] = { side: BLACK, type: PAWN };
      for (const [f, r] of screens) b[r][f] = { side: RED, type: PAWN };
      return b;
    }
    assert.equal(hasDest(getLegalMoves(cannonBoard([]), 4, 4), 4, 7), false, "无炮架不能吃");
    assert.equal(hasDest(getLegalMoves(cannonBoard([[4, 5]]), 4, 4), 4, 7), true, "隔一子可吃");
    assert.equal(hasDest(getLegalMoves(cannonBoard([[4, 5], [4, 6]]), 4, 4), 4, 7), false, "隔两子不能吃");
  });

  test("兵未过河不能横走；过河可横不能退", () => {
    const behind = emptyBoard();
    placeKings(behind, { f: 3, r: 0 }, { f: 5, r: 9 });
    behind[3][4] = { side: RED, type: PAWN };
    const m1 = getLegalMoves(behind, 4, 3);
    assert.equal(hasDest(m1, 4, 4), true);
    assert.equal(hasDest(m1, 3, 3), false);
    assert.equal(hasDest(m1, 5, 3), false);

    const over = emptyBoard();
    placeKings(over, { f: 3, r: 0 }, { f: 5, r: 9 });
    over[5][4] = { side: RED, type: PAWN };
    const m2 = getLegalMoves(over, 4, 5);
    assert.equal(hasDest(m2, 4, 6), true);
    assert.equal(hasDest(m2, 3, 5), true);
    assert.equal(hasDest(m2, 5, 5), true);
    assert.equal(hasDest(m2, 4, 4), false);
  });

  test("飞将：将帅同线无子，该着法非法", () => {
    const b = emptyBoard();
    placeKings(b, { f: 4, r: 0 }, { f: 4, r: 9 });
    b[2][4] = { side: RED, type: CANNON };
    const moves = getLegalMoves(b, 4, 2);
    assert.ok(moves.every((m) => m.f === 4), "离开中线会造成飞将");
    assert.equal(hasDest(moves, 3, 2), false);
    assert.equal(hasDest(moves, 5, 2), false);
  });

  test("走棋后不能把自己置于被将军", () => {
    const b = emptyBoard();
    placeKings(b, { f: 4, r: 0 }, { f: 5, r: 9 });
    b[2][4] = { side: RED, type: HORSE };
    b[7][4] = { side: BLACK, type: CHARIOT };
    const moves = getLegalMoves(b, 4, 2);
    for (const dest of moves) {
      const next = applyMove(b, { f: 4, r: 2 }, dest);
      assert.equal(isInCheck(next, RED), false);
    }
    assert.equal(moves.length, 0);
  });

  test("困毙：无合法着法且未将军，getStatus === stalemate", () => {
    const b = emptyBoard();
    placeKings(b, { f: 3, r: 0 }, { f: 4, r: 9 });
    b[8][0] = { side: RED, type: CHARIOT };
    b[7][2] = { side: RED, type: HORSE };
    b[7][6] = { side: RED, type: HORSE };
    assert.equal(isInCheck(b, BLACK), false);
    assert.equal(getStatus(b, BLACK), "stalemate");
  });

  test("将死：getStatus === checkmate", () => {
    const b = emptyBoard();
    placeKings(b, { f: 3, r: 0 }, { f: 4, r: 9 });
    b[9][0] = { side: RED, type: CHARIOT };
    b[8][0] = { side: RED, type: CHARIOT };
    assert.equal(isInCheck(b, BLACK), true);
    assert.equal(getStatus(b, BLACK), "checkmate");
  });

  test("perft(initial, red, 2) 回归值", () => {
    const n = perft(initial, RED, 2);
    console.log("perft(initial, red, 2) =", n);
    assert.equal(n, 1920);
  });

  test("重复局面键：同一局面 positionKey 相等", () => {
    const a = createInitialBoard();
    const b = cloneBoard(a);
    assert.equal(positionKey(a, RED), positionKey(b, RED));
    const moved = applyMove(a, { f: 7, r: 2 }, { f: 4, r: 2 });
    assert.notEqual(positionKey(a, RED), positionKey(moved, BLACK));
    const again = applyMove(createInitialBoard(), { f: 7, r: 2 }, { f: 4, r: 2 });
    assert.equal(positionKey(moved, BLACK), positionKey(again, BLACK));
  });

  test("评估：开局接近 0；缺车方明显落后", () => {
    const open = evaluate(initial, RED);
    const openRed = evaluateRed(initial);
    console.log("evaluate opening red-to-move =", open, "evaluateRed =", openRed);
    assert.ok(Math.abs(open) < 40, `开局评估应接近 0，实际 ${open}`);
    assert.ok(Math.abs(openRed) < 40);
    const missing = cloneBoard(initial);
    missing[0][0] = null;
    const down = evaluateRed(missing);
    console.log("evaluateRed missing chariot =", down);
    assert.ok(down < -500, `缺车应明显落后，实际 ${down}`);
  });

  test("搜索：easy 开局 300ms 内返回合法着法", () => {
    const t0 = Date.now();
    const res = search(initial, RED, {
      timeMs: 280,
      maxDepth: 3,
      noise: 40,
      pool: 4,
      useBook: false,
      difficulty: "easy",
    });
    const elapsed = Date.now() - t0;
    console.log("easy search", { elapsed, move: res.move, nodes: res.nodes, depth: res.depth });
    assert.ok(res.move, "easy 应返回着法");
    const legal = getAllLegalMoves(initial, RED);
    assert.ok(
      legal.some((m) => m.from.f === res.move.from.f && m.from.r === res.move.from.r && m.to.f === res.move.to.f && m.to.r === res.move.to.r),
      "返回着法必须合法"
    );
    assert.ok(elapsed < 300, `应在 300ms 内返回，实际 ${elapsed}ms`);
  });

  test("搜索：hard 在简单吃子局面会吃子", () => {
    const b = emptyBoard();
    placeKings(b, { f: 4, r: 0 }, { f: 5, r: 9 });
    b[0][0] = { side: RED, type: CHARIOT };
    b[6][0] = { side: BLACK, type: CANNON };
    const res = search(b, RED, {
      timeMs: 600,
      maxDepth: 4,
      noise: 0,
      pool: 1,
      useBook: false,
      difficulty: "hard",
    });
    console.log("hard capture search", res);
    assert.ok(res.move, "hard 应返回着法");
    assert.equal(res.move.from.f, 0);
    assert.equal(res.move.from.r, 0);
    assert.equal(res.move.to.f, 0);
    assert.equal(res.move.to.r, 6);
    assert.equal(res.move.capture, true);
  });

  console.log("\n" + passed.map((n) => "PASS " + n).join("\n"));
  console.log(`\n${passed.length} tests passed`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
