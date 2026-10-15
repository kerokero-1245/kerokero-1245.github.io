/* ぴよぴよランド（街）の進行ロジック — DOM・保存・タイマー・音に触らない純関数だけ
 * ------------------------------------------------------------------
 * index.html のインライン script から切り出した計算部分。同じファイルを
 *   ・ブラウザ（window.PiyoLand）と
 *   ・Node（tests/land-core.test.js を node --test で実行。module.exports）
 * の両方で読む（assets/bgm/engine.js と同じ UMD 形）。
 *
 * ここに置くもの（正典は docs/WORLD.md）:
 *   - 段階表 THRESHOLDS と、そこから決まる定数（§3.4）
 *   - 壊れた保存値の 0 扱い（§3.2 / §7）と、到達段階の上限での丸め（§7）
 *   - 退行禁止の表示段階（§3.3 / §3.5）
 *   - すすみドット（§2.3・最大 5 つ）
 *   - ぴよが さす施設（§2.1・最少 + ローテーション）と「もうすこし」の判定（§3.6）
 *   - 夜にした日付 YYYY-MM-DD と、起動時に夜のままか朝か（§5 / §7）
 *   - BGM の ON/OFF の保存値 land.bgm の読み方と書く値（§7・旧値 "1"/"0" の移行）
 * 保存の読み書き・描画・音・タイマーは index.html 側に置く（ここには入れない）。
 *
 * 使い方（街）:
 *   <script src="assets/js/land-core.js"></script>   // window.PiyoLand を定義
 */
(function (global) {
  "use strict";

  /* ── だんかい しきい値（WORLD.md §3.4・正典）──
   増分 2,2,3,4,5,5,6,7,8,8（合計 50）。昇順の単調増加。表を変えたら WORLD.md と同時に更新する */
  var THRESHOLDS = Object.freeze([0, 2, 4, 7, 11, 16, 21, 27, 34, 42, 50]);
  var MAX_STAGE = THRESHOLDS.length - 1; // 10（まつり＋👑の完成形）
  var PATH_STAGE = 5; // みちが でる だんかい（§3.4 の段階 5）
  var METER_DOTS = 5; // すすみドットの 数（§2.3 subitizing の範囲＝5 個以内）
  var NEAR_FUEL = 2; // つぎの だんかいまで あと この ⭐ 以下なら「もうすこし」（§3.6）

  /* こわれた値・けつじょは かならず 0 あつかい（§3.2 / §7）。
   有限で正の数だけ、小数を切り捨てて採る（"" "abc" "-3" "NaN" "Infinity" は 0、"2.9" は 2） */
  function parseCount(raw) {
    if (raw == null) return 0;
    var n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  /* ほぞんされた とうたつ だんかい（land.reachedStage）の よみかた（§7「0〜10」）。
   こわれた値は parseCount と おなじく 0、MAX_STAGE より 大きい値（"99" など）は MAX_STAGE に まるめる */
  function parseStage(raw) {
    return Math.min(MAX_STAGE, parseCount(raw));
  }

  /* fuel（⭐の ごうけい）から きまる だんかい（0〜MAX_STAGE） */
  function stageForFuel(fuel) {
    var s = 0;
    for (var i = 0; i < THRESHOLDS.length; i++) {
      if (fuel >= THRESHOLDS[i]) s = i;
      else break;
    }
    return Math.min(s, MAX_STAGE);
  }

  /* ひょうじする だんかい。まえに ひらいた だんかい（reachedPrev）より さがっても もどさない
   （たいこう禁止・§3.3 / §3.5） */
  function displayStageFor(reachedPrev, fuel) {
    return Math.max(reachedPrev, stageForFuel(fuel));
  }

  /* すすみドット: つぎの だんかいまでの すすみを METER_DOTS こぶんの true/false で かえす。
   かんせい（MAX_STAGE 以上）では ドットを ださない（からの はいれつ・👑は ぴよの あたまに） */
  function meterDots(displayStage, fuel) {
    if (displayStage >= MAX_STAGE) return [];
    var lo = THRESHOLDS[displayStage];
    var hi = THRESHOLDS[displayStage + 1];
    var prog = hi > lo ? (fuel - lo) / (hi - lo) : 0;
    if (prog < 0) prog = 0;
    if (prog > 1) prog = 1;
    var filled = Math.round(prog * METER_DOTS);
    var dots = [];
    for (var i = 0; i < METER_DOTS; i++) dots.push(i < filled);
    return dots;
  }

  /* つぎの だんかいまで あと すこし（1〜NEAR_FUEL こ）か。かんせいでは false（§3.6） */
  function isNearNextStage(displayStage, fuel) {
    if (displayStage >= MAX_STAGE) return false;
    var remain = THRESHOLDS[displayStage + 1] - fuel;
    return remain <= NEAR_FUEL && remain > 0;
  }

  /* ぴよが さす しせつ（けっていてき・乱数なし・§2.1）。
   vals: [{ id: "park", v: ⭐の かず }, …]。⭐が いちばん すくない しせつを さす。
   ならんだら、まえに さした しせつ（lastPointed）の つぎ（ローテーション）。
   lastPointed が ならんだ こうほに ない とき（みほぞん・こわれた 値）は せんとうの こうほ */
  function pickPointTarget(vals, lastPointed) {
    var min = vals[0].v;
    for (var i = 1; i < vals.length; i++) if (vals[i].v < min) min = vals[i].v;
    var cands = [];
    for (var j = 0; j < vals.length; j++)
      if (vals[j].v === min) cands.push(vals[j].id);
    if (cands.length === 1) return cands[0]; // すくない しせつが 1つ＝そこを さす
    var idx = cands.indexOf(lastPointed);
    return idx === -1 ? cands[0] : cands[(idx + 1) % cands.length];
  }

  /* たんまつ ローカルの ひづけ YYYY-MM-DD（§7）。d を はぶくと いま */
  function todayStr(d) {
    d = d || new Date();
    function p2(n) {
      return (n < 10 ? "0" : "") + n;
    }
    return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
  }

  /* きどう した ときの あさ/よる（§5）。🌙に した ひ（land.lastNightDate）が きょうと おなじ なら "night"（よるの まま）、
   ちがう ひ・みほぞん・から・こわれた値 なら "morning"（ひづけが かわれば あさへ）。today は todayStr() の 値 */
  function wakeState(savedDate, today) {
    return typeof savedDate === "string" &&
      savedDate !== "" &&
      savedDate === today
      ? "night"
      : "morning";
  }

  /* BGM の ON/OFF の ほぞん値（§7 land.bgm）。かくのは "on" / "off" だけ */
  var BGM_ON = "on";
  var BGM_OFF = "off";
  function bgmValue(on) {
    return on ? BGM_ON : BGM_OFF;
  }

  /* land.bgm の よみかた（§7）。"off" と 旧値 "0" → OFF、"on" と 旧値 "1" → ON、
   それ以外（未設定 null・壊れ値）→ 既定 ON。
   rewrite は 旧値を よんだときだけ 新しい値（"on"/"off"）。index.html が その場で かきなおす（かけなくても あそびは こわさない）。
   新しい値・未設定・壊れ値は null（かきなおさない） */
  function parseBgm(raw) {
    if (raw === BGM_OFF) return { on: false, rewrite: null };
    if (raw === BGM_ON) return { on: true, rewrite: null };
    if (raw === "0") return { on: false, rewrite: BGM_OFF };
    if (raw === "1") return { on: true, rewrite: BGM_ON };
    return { on: true, rewrite: null };
  }

  var api = {
    THRESHOLDS: THRESHOLDS,
    MAX_STAGE: MAX_STAGE,
    PATH_STAGE: PATH_STAGE,
    METER_DOTS: METER_DOTS,
    NEAR_FUEL: NEAR_FUEL,
    parseCount: parseCount,
    parseStage: parseStage,
    stageForFuel: stageForFuel,
    displayStageFor: displayStageFor,
    meterDots: meterDots,
    isNearNextStage: isNearNextStage,
    pickPointTarget: pickPointTarget,
    todayStr: todayStr,
    wakeState: wakeState,
    bgmValue: bgmValue,
    parseBgm: parseBgm,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  global.PiyoLand = api;
})(
  typeof self !== "undefined"
    ? self
    : typeof globalThis !== "undefined"
      ? globalThis
      : this,
);
