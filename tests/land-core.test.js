// assets/js/land-core.js（街の進行ロジックの純関数）のテスト。実行: npm test（= node --test）
// 期待値は docs/WORLD.md の表から手で出したもので、実装の式を写していない。
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../assets/js/land-core.js");

// ── 段階表（WORLD.md §3.4）──────────────────────────────

test("THRESHOLDS は WORLD.md §3.4 の表と一致する（10 段階・最初は 2・最後は 50）", () => {
  const world = fs.readFileSync(
    path.join(__dirname, "..", "docs", "WORLD.md"),
    "utf8",
  );
  const section = world.slice(
    world.indexOf("### 3.4"),
    world.indexOf("### 3.5"),
  );
  const rows = [];
  for (const m of section.matchAll(
    /^\|\s*(\d+)(?:\s*👑)?\s*\|\s*(?:\*\*)?(\d+)(?:\*\*)?\s*\|\s*(?:–|\+(\d+))\s*\|/gm,
  )) {
    rows.push({
      stage: Number(m[1]),
      fuel: Number(m[2]),
      delta: m[3] === undefined ? null : Number(m[3]),
    });
  }
  assert.equal(
    rows.length,
    11,
    "§3.4 の表から 11 行（段階 0〜10）を読めること",
  );
  assert.deepEqual(
    rows.map((r) => r.stage),
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  assert.deepEqual(
    rows.map((r) => r.fuel),
    [...L.THRESHOLDS],
  );
  assert.deepEqual(
    rows.slice(1).map((r) => r.delta),
    [2, 2, 3, 4, 5, 5, 6, 7, 8, 8],
  );
});

test("THRESHOLDS は 0 から始まる昇順で、増分は 2,2,3,4,5,5,6,7,8,8（合計 50）", () => {
  assert.equal(L.THRESHOLDS[0], 0);
  const deltas = L.THRESHOLDS.slice(1).map((t, i) => t - L.THRESHOLDS[i]);
  assert.deepEqual(deltas, [2, 2, 3, 4, 5, 5, 6, 7, 8, 8]);
  assert.ok(deltas.every((d) => d > 0));
  assert.equal(L.THRESHOLDS[L.THRESHOLDS.length - 1], 50);
  assert.ok(Object.isFrozen(L.THRESHOLDS), "うっかり書き換えられない");
});

test("定数: MAX_STAGE は表の長さから決まり、みちは段階 5、ドットは 5 個以内", () => {
  assert.equal(L.MAX_STAGE, 10);
  assert.equal(L.MAX_STAGE, L.THRESHOLDS.length - 1);
  assert.equal(L.PATH_STAGE, 5);
  assert.equal(L.METER_DOTS, 5);
  assert.ok(L.METER_DOTS <= 5, "§2.3 数えさせない（5 個以内）");
  assert.equal(L.NEAR_FUEL, 2);
});

test("ブラウザ向けの公開名 window.PiyoLand（globalThis.PiyoLand）が同じ API を指す", () => {
  assert.equal(globalThis.PiyoLand, L);
  for (const name of [
    "parseCount",
    "stageForFuel",
    "displayStageFor",
    "meterDots",
    "isNearNextStage",
    "pickPointTarget",
    "todayStr",
    "bgmValue",
    "parseBgm",
  ]) {
    assert.equal(typeof L[name], "function", name);
  }
});

// ── stageForFuel ──────────────────────────────────────

test("stageForFuel: 段階の境界（しきい値の 1 つ手前・ちょうど・1 つ後）", () => {
  const table = [
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 1],
    [4, 2],
    [6, 2],
    [7, 3],
    [10, 3],
    [11, 4],
    [15, 4],
    [16, 5],
    [20, 5],
    [21, 6],
    [26, 6],
    [27, 7],
    [33, 7],
    [34, 8],
    [41, 8],
    [42, 9],
    [49, 9],
    [50, 10],
    [51, 10],
    [999, 10],
  ];
  for (const [fuel, stage] of table)
    assert.equal(L.stageForFuel(fuel), stage, `fuel=${fuel}`);
});

test("stageForFuel: 負・NaN は 0 段階、上限は MAX_STAGE", () => {
  assert.equal(L.stageForFuel(-1), 0);
  assert.equal(L.stageForFuel(-999), 0);
  assert.equal(L.stageForFuel(NaN), 0);
  assert.equal(L.stageForFuel(Infinity), L.MAX_STAGE);
  assert.equal(L.stageForFuel(1e9), L.MAX_STAGE);
});

test("stageForFuel: fuel が増えても段階は下がらない（0〜120 を 1 ずつ）", () => {
  let prev = 0;
  for (let f = 0; f <= 120; f++) {
    const s = L.stageForFuel(f);
    assert.ok(s >= prev && s - prev <= 1, `fuel=${f}`);
    prev = s;
  }
});

// ── parseCount（こわれた保存値）──────────────────────────

test('parseCount: 壊れた値・欠損は 0（"" "abc" "-3" "NaN" "Infinity" null undefined）', () => {
  for (const raw of [
    "",
    "abc",
    "-3",
    "NaN",
    "Infinity",
    "-Infinity",
    null,
    undefined,
    "0",
    "-0",
    "  ",
  ]) {
    assert.equal(L.parseCount(raw), 0, JSON.stringify(raw));
  }
});

test('parseCount: 正の数は小数を切り捨てて採る（"2.9" は 2）', () => {
  assert.equal(L.parseCount("2.9"), 2);
  assert.equal(L.parseCount("0.9"), 0);
  assert.equal(L.parseCount("1"), 1);
  assert.equal(L.parseCount("7"), 7);
  assert.equal(L.parseCount("50"), 50);
  assert.equal(L.parseCount("123456"), 123456);
});

// ── 退行禁止（displayStageFor）─────────────────────────

test("displayStageFor: reachedPrev が fuel の段階より大きければ そのまま（退行禁止）", () => {
  assert.equal(L.displayStageFor(5, 0), 5);
  assert.equal(L.displayStageFor(10, 3), 10);
  assert.equal(L.displayStageFor(7, 16), 7); // fuel の段階は 5
  assert.equal(L.displayStageFor(10, 0), 10);
});

test("displayStageFor: fuel の段階が大きければ そちら（進んだ）", () => {
  assert.equal(L.displayStageFor(0, 16), 5);
  assert.equal(L.displayStageFor(3, 50), 10);
  assert.equal(L.displayStageFor(0, 2), 1);
});

test("displayStageFor: 同じなら そのまま・全組み合わせで max になる（0..10 × 0..60）", () => {
  assert.equal(L.displayStageFor(4, 11), 4);
  for (let prev = 0; prev <= 10; prev++) {
    for (let fuel = 0; fuel <= 60; fuel++) {
      const s = L.displayStageFor(prev, fuel);
      assert.ok(s >= prev, `退行している prev=${prev} fuel=${fuel}`);
      assert.ok(s >= L.stageForFuel(fuel));
      assert.equal(s, Math.max(prev, L.stageForFuel(fuel)));
    }
  }
});

test("displayStageFor: ⭐が 50 → 0 と下がっても 10 のまま", () => {
  let reached = 0;
  for (let fuel = 50; fuel >= 0; fuel--) {
    reached = L.displayStageFor(Math.max(reached, 10), fuel);
    assert.equal(reached, 10);
  }
});

// ── 到達段階の読み取り（parseStage・WORLD.md §7「到達済み最大段階（0〜10）」）──

test('parseStage: 到達段階を上限で丸める（壊れた保存値 "99" は MAX_STAGE）', () => {
  assert.equal(typeof L.parseStage, "function");
  assert.equal(L.parseStage("99"), 10);
  assert.equal(L.parseStage("11"), 10);
  assert.equal(L.parseStage("123456"), 10);
  assert.equal(L.parseStage("Infinity"), 0); // parseCount と同じく 有限で ない 値は 0
});

test('parseStage: 負・NaN・欠損は 0、0〜10 は そのまま（"2.9" は 2）', () => {
  for (const raw of ["-1", "-99", "NaN", "abc", "", null, undefined])
    assert.equal(L.parseStage(raw), 0, String(raw));
  for (let s = 0; s <= 10; s++) assert.equal(L.parseStage(String(s)), s);
  assert.equal(L.parseStage("2.9"), 2);
});

// ── すすみドット（meterDots）────────────────────────────

const filledCount = (dots) => dots.filter(Boolean).length;

test("meterDots: 各段の始まり（しきい値ちょうど）は 0 こ、いつも 5 つ並ぶ", () => {
  for (let stage = 0; stage < L.MAX_STAGE; stage++) {
    const dots = L.meterDots(stage, L.THRESHOLDS[stage]);
    assert.equal(dots.length, 5, `stage=${stage}`);
    assert.equal(filledCount(dots), 0, `stage=${stage}`);
  }
});

test("meterDots: 各段の終わり（つぎのしきい値の 1 つ手前）の塗り数", () => {
  const expected = [3, 3, 3, 4, 4, 4, 4, 4, 4, 4]; // 段階 0〜9。WORLD §3.4 の増分から手計算
  for (let stage = 0; stage < L.MAX_STAGE; stage++) {
    const dots = L.meterDots(stage, L.THRESHOLDS[stage + 1] - 1);
    assert.equal(filledCount(dots), expected[stage], `stage=${stage}`);
  }
});

test("meterDots: 段階の途中の塗り数（手計算の表）", () => {
  // [displayStage, fuel, 塗る数]。prog = (fuel - lo) / (hi - lo)、塗る数 = round(prog * 5)
  const table = [
    [0, 1, 3],
    [1, 3, 3],
    [2, 5, 2],
    [2, 6, 3],
    [3, 8, 1],
    [3, 9, 3],
    [3, 10, 4],
    [4, 12, 1],
    [4, 13, 2],
    [4, 14, 3],
    [4, 15, 4],
    [5, 16, 0],
    [5, 18, 2],
    [6, 22, 1],
    [6, 24, 3],
    [7, 28, 1],
    [7, 30, 2],
    [7, 32, 4],
    [8, 35, 1],
    [8, 38, 3],
    [8, 40, 4],
    [9, 42, 0],
    [9, 46, 3],
    [9, 49, 4],
  ];
  for (const [stage, fuel, n] of table)
    assert.equal(
      filledCount(L.meterDots(stage, fuel)),
      n,
      `stage=${stage} fuel=${fuel}`,
    );
});

test("meterDots: 塗りは左から（true が先、false があと）", () => {
  for (let stage = 0; stage < L.MAX_STAGE; stage++) {
    for (
      let fuel = L.THRESHOLDS[stage];
      fuel < L.THRESHOLDS[stage + 1];
      fuel++
    ) {
      const dots = L.meterDots(stage, fuel);
      const n = filledCount(dots);
      assert.deepEqual(
        dots,
        [...Array(5)].map((_, i) => i < n),
        `stage=${stage} fuel=${fuel}`,
      );
    }
  }
});

test("meterDots: 退行の最中（表示段階より fuel が少ない）は 0 こ、fuel が多すぎれば 5 こ（はみ出さない）", () => {
  assert.equal(filledCount(L.meterDots(5, 3)), 0);
  assert.equal(filledCount(L.meterDots(9, 0)), 0);
  assert.equal(filledCount(L.meterDots(1, 40)), 5);
  assert.equal(filledCount(L.meterDots(0, 1000)), 5);
});

test("meterDots: 完成（段階 10 以上）では ドットを ださない（空の配列）", () => {
  assert.deepEqual(L.meterDots(10, 50), []);
  assert.deepEqual(L.meterDots(10, 0), []);
  assert.deepEqual(L.meterDots(99, 5), []);
});

// ── 「もうすこし」の判定（isNearNextStage）─────────────

test("isNearNextStage: つぎの段階まで 1〜2 ⭐ のとき true", () => {
  const near = [
    [0, 0],
    [0, 1],
    [1, 2],
    [1, 3],
    [2, 5],
    [2, 6],
    [3, 9],
    [3, 10],
    [4, 14],
    [4, 15],
    [8, 40],
    [8, 41],
    [9, 48],
    [9, 49],
  ];
  for (const [stage, fuel] of near)
    assert.equal(
      L.isNearNextStage(stage, fuel),
      true,
      `stage=${stage} fuel=${fuel}`,
    );
});

test("isNearNextStage: 3 ⭐ 以上 手前・しきい値ちょうど以上・完成では false", () => {
  const far = [
    [2, 4],
    [3, 7],
    [3, 8],
    [4, 11],
    [9, 42],
    [9, 47],
    [5, 16],
  ];
  for (const [stage, fuel] of far)
    assert.equal(
      L.isNearNextStage(stage, fuel),
      false,
      `stage=${stage} fuel=${fuel}`,
    );
  assert.equal(L.isNearNextStage(2, 7), false, "ちょうど届いた（残り 0）");
  assert.equal(L.isNearNextStage(2, 8), false, "超えている（残りが負）");
  assert.equal(L.isNearNextStage(5, 3), false, "退行の最中は 遠い");
  assert.equal(L.isNearNextStage(10, 50), false);
  assert.equal(L.isNearNextStage(10, 49), false);
  assert.equal(L.isNearNextStage(99, 0), false);
});

// ── ぴよの誘導（pickPointTarget）───────────────────────

const vals = (park, cake, shop) => [
  { id: "park", v: park },
  { id: "cake", v: cake },
  { id: "shop", v: shop },
];

test("pickPointTarget: ⭐が いちばん すくない しせつ 1 つを さす（前回は 関係なし）", () => {
  for (const last of [null, "park", "cake", "shop", "", "x"]) {
    assert.equal(
      L.pickPointTarget(vals(3, 1, 2), last),
      "cake",
      `last=${last}`,
    );
    assert.equal(
      L.pickPointTarget(vals(0, 5, 5), last),
      "park",
      `last=${last}`,
    );
    assert.equal(
      L.pickPointTarget(vals(9, 9, 4), last),
      "shop",
      `last=${last}`,
    );
  }
});

test("pickPointTarget: 最少が 2 つ並んだら 前回の つぎの しせつへ（ローテーション・一周でもどる）", () => {
  const v = vals(0, 5, 0); // 候補は park と shop
  assert.equal(L.pickPointTarget(v, "park"), "shop");
  assert.equal(L.pickPointTarget(v, "shop"), "park");
});

test("pickPointTarget: 前回が 候補に ない・未保存・こわれた値のときは 先頭の候補", () => {
  const v = vals(0, 5, 0);
  for (const last of ["cake", null, undefined, "", "garbage"])
    assert.equal(L.pickPointTarget(v, last), "park", `last=${last}`);
});

test("pickPointTarget: 3 つ並んだら park → cake → shop → park の順に まわる", () => {
  let last = null;
  const seen = [];
  for (let i = 0; i < 7; i++) {
    last = L.pickPointTarget(vals(2, 2, 2), last);
    seen.push(last);
  }
  assert.deepEqual(seen, [
    "park",
    "cake",
    "shop",
    "park",
    "cake",
    "shop",
    "park",
  ]);
});

test("pickPointTarget: 同じ入力には 同じ答え（乱数なし）・入力を書き換えない", () => {
  const v = vals(1, 1, 3);
  const copy = JSON.parse(JSON.stringify(v));
  const answers = new Set();
  for (let i = 0; i < 50; i++) answers.add(L.pickPointTarget(v, "park"));
  assert.deepEqual([...answers], ["cake"]);
  assert.deepEqual(v, copy);
});

test("pickPointTarget: 施設が 4 つ・2 つでも 動く（ローテーションは 候補の数で まわる）", () => {
  const four = [
    { id: "a", v: 1 },
    { id: "b", v: 1 },
    { id: "c", v: 0 },
    { id: "d", v: 0 },
  ];
  assert.equal(L.pickPointTarget(four, null), "c");
  assert.equal(L.pickPointTarget(four, "c"), "d");
  assert.equal(L.pickPointTarget(four, "d"), "c");
  assert.equal(
    L.pickPointTarget(
      [
        { id: "x", v: 2 },
        { id: "y", v: 2 },
      ],
      "y",
    ),
    "x",
  );
});

// ── todayStr ───────────────────────────────────────────

test("todayStr: YYYY-MM-DD（ゼロうめ・端末ローカルの日付）", () => {
  assert.equal(L.todayStr(new Date(2026, 9, 11)), "2026-10-11");
  assert.equal(L.todayStr(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(L.todayStr(new Date(2026, 11, 31, 23, 59, 59)), "2026-12-31");
  assert.equal(L.todayStr(new Date(2024, 1, 29, 0, 0, 0)), "2024-02-29");
});

test("todayStr: 引数なしは いま（形だけ確かめる）", () => {
  assert.match(L.todayStr(), /^\d{4}-\d{2}-\d{2}$/);
});

// ── wakeState（land.lastNightDate から 起動時の 朝/夜。WORLD.md §5「日付が変われば朝へ」）──

test("wakeState: land.lastNightDate が今日と同じ日付なら 夜のまま（night）", () => {
  assert.equal(typeof L.wakeState, "function");
  assert.equal(L.wakeState("2026-10-15", "2026-10-15"), "night");
  assert.equal(
    L.wakeState(
      L.todayStr(new Date(2026, 0, 5)),
      L.todayStr(new Date(2026, 0, 5, 23, 59)),
    ),
    "night",
  );
});

test("wakeState: land.lastNightDate が 違う日・未保存・空・壊れ値なら 朝（morning）", () => {
  for (const saved of [
    "2026-10-14",
    "2026-10-16",
    "2025-10-15",
    null,
    undefined,
    "",
    "abc",
  ])
    assert.equal(L.wakeState(saved, "2026-10-15"), "morning", String(saved));
  assert.equal(
    L.wakeState("", ""),
    "morning",
    "今日が分からない（空）ときも朝",
  );
});

// ── parseBgm / bgmValue（land.bgm の保存値。WORLD.md §7）──────────
// 期待値は WORLD.md §7 から（保存値を on/off に揃えた。旧値 "1"/"0" は読んだときに書き直す）。

test('parseBgm: 旧値 "0" は OFF で、"off" に書き直す', () => {
  assert.deepEqual(L.parseBgm("0"), { on: false, rewrite: "off" });
});

test('parseBgm: 旧値 "1" は ON で、"on" に書き直す', () => {
  assert.deepEqual(L.parseBgm("1"), { on: true, rewrite: "on" });
});

test('parseBgm: 新しい値 "on" は ON・"off" は OFF（書き直さない）', () => {
  assert.deepEqual(L.parseBgm("on"), { on: true, rewrite: null });
  assert.deepEqual(L.parseBgm("off"), { on: false, rewrite: null });
});

test("parseBgm: 未設定（null・undefined）は既定の ON（書き直さない）", () => {
  assert.deepEqual(L.parseBgm(null), { on: true, rewrite: null });
  assert.deepEqual(L.parseBgm(undefined), { on: true, rewrite: null });
});

test("parseBgm: 壊れ値は既定の ON（書き直さない）", () => {
  for (const raw of [
    "",
    "abc",
    "ON",
    "OFF",
    " off",
    "off ",
    "2",
    "-1",
    "00",
    "true",
    "false",
    "null",
  ]) {
    assert.deepEqual(
      L.parseBgm(raw),
      { on: true, rewrite: null },
      JSON.stringify(raw),
    );
  }
});

test("parseBgm / bgmValue: 書き直すのは旧値だけ・書く値は on/off で、読み直すと同じ ON/OFF（もう書き直さない）", () => {
  assert.equal(L.bgmValue(true), "on");
  assert.equal(L.bgmValue(false), "off");
  const rewritten = [];
  for (const raw of [null, "", "abc", "on", "off", "0", "1"]) {
    const r = L.parseBgm(raw);
    if (r.rewrite !== null) {
      rewritten.push(raw);
      assert.equal(r.rewrite, L.bgmValue(r.on), JSON.stringify(raw));
      assert.deepEqual(L.parseBgm(r.rewrite), { on: r.on, rewrite: null });
    }
  }
  assert.deepEqual(rewritten, ["0", "1"]);
  for (const on of [true, false]) {
    assert.deepEqual(L.parseBgm(L.bgmValue(on)), { on, rewrite: null });
  }
});
