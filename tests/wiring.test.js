// index.html と assets/js/land-core.js の配線のテスト（読み込みの順・公開名・ファイルの存在）。
// land-core.js が読めないと 街のロジックは動かない（施設カードの導線だけが残る）ので、配線の崩れを CI で拾う。
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const CORE_TAG = '<script src="assets/js/land-core.js"></script>';

test("index.html は land-core.js を 1 回だけ読み込み、ファイルが実在する", () => {
  assert.equal(html.split(CORE_TAG).length - 1, 1);
  assert.ok(
    fs.statSync(path.join(root, "assets", "js", "land-core.js")).isFile(),
  );
});

test("land-core.js の script は、それを使うインライン script より前にある", () => {
  const core = html.indexOf(CORE_TAG);
  const inline = html.indexOf("<script>");
  assert.ok(core >= 0 && inline >= 0);
  assert.ok(core < inline, "読み込みの順が逆");
});

test("インライン script は window.PiyoLand を使い、無いときは何もせず抜ける（例外で止まらない）", () => {
  const inline = html.slice(html.indexOf("<script>"));
  assert.match(inline, /window\.PiyoLand/);
  assert.match(inline, /if \(!L\) return;/);
});

test("施設カードの導線 3 つは JS が無くても残る静的な <a href> のまま", () => {
  for (const url of [
    "https://kerokero-1245.github.io/otsukai-meiro/",
    "https://kerokero-1245.github.io/piyopiyo-sansu/",
    "https://kerokero-1245.github.io/piyopiyo-kotoba/",
  ]) {
    assert.ok(html.includes(`href="${url}"`), url);
  }
});

// ── land.bgm の起動時の配線 ──
// index.html の インライン script から「保存の読み書き」と「BGM の起動時の ON/OFF」の部分を そのまま 切り出し、
// 偽の localStorage・BGM エンジン・🔊 チップで 動かす（DOM を使わずに、起動時に 保存値が ON/OFF に つながることを見る）。
// 切り出しの目印（コメントや変数名）を変えたら ここも合わせる。目印が見つからなければ テストは落ちる。
function grab(from, to) {
  const s = html.indexOf(from);
  const e = html.indexOf(to, s);
  assert.ok(s >= 0 && e > s, "index.html に目印がない: " + from);
  return html.slice(s, e);
}
const storeCode = grab("var STORE_LOCAL", "/* こわれた値");
const bgmCode = grab('var BGM_KEY = "land.bgm"', "/* ── タイトル よみあげ");
const L = require("../assets/js/land-core.js");

function bootBgm(stored, core = L) {
  let value = stored;
  const writes = [];
  const engineCalls = [];
  const btn = {
    attrs: {},
    textContent: "",
    classList: { toggle() {} },
    setAttribute(k, v) {
      this.attrs[k] = v;
    },
  };
  const window = {
    localStorage: {
      getItem: () => value,
      setItem: (k, v) => {
        writes.push([k, v]);
        value = v;
      },
    },
    PiyoBgm: {
      createEngine: () => ({
        setBgmEnabled: (on) => engineCalls.push(on),
        startBgm() {},
        stopBgm() {},
        duckBgm() {},
        unduckBgm() {},
      }),
    },
  };
  const run = new Function(
    "window",
    "L",
    "bgmBtn",
    storeCode + bgmCode + "\nrenderBgmBtn();\nreturn bgmWant;",
  );
  const want = run(window, core, btn);
  return {
    want,
    stored: value,
    writes,
    engineCalls,
    pressed: btn.attrs["aria-pressed"],
  };
}

test('land.bgm の起動: "off"・旧値 "0" で起動すると OFF（エンジン・🔊 チップとも）。旧値は "off" に書き直す', () => {
  for (const [raw, stored, writes] of [
    ["off", "off", []],
    ["0", "off", [["land.bgm", "off"]]],
  ]) {
    const r = bootBgm(raw);
    assert.equal(r.want, false, raw);
    assert.deepEqual(r.engineCalls, [false], raw);
    assert.equal(r.pressed, "false", raw);
    assert.equal(r.stored, stored, raw);
    assert.deepEqual(r.writes, writes, raw);
  }
});

test('land.bgm の起動: "on"・旧値 "1"・未設定・壊れ値で起動すると ON。書き直すのは旧値 "1" だけ', () => {
  for (const [raw, stored, writes] of [
    ["on", "on", []],
    ["1", "on", [["land.bgm", "on"]]],
    [null, null, []],
    ["abc", "abc", []],
  ]) {
    const r = bootBgm(raw);
    assert.equal(r.want, true, String(raw));
    assert.deepEqual(r.engineCalls, [true], String(raw));
    assert.equal(r.pressed, "true", String(raw));
    assert.equal(r.stored, stored, String(raw));
    assert.deepEqual(r.writes, writes, String(raw));
  }
});

test("land.bgm の起動: キャッシュに残った旧い land-core.js（parseBgm が無い）でも止まらず、既定の ON", () => {
  const oldCore = Object.assign({}, L);
  delete oldCore.parseBgm;
  delete oldCore.bgmValue;
  const r = bootBgm("0", oldCore);
  assert.equal(r.want, true);
  assert.deepEqual(r.engineCalls, [true]);
  assert.deepEqual(r.writes, []);
});

test("land.bgm に書く値は land-core.js の bgmValue（on/off）を通し、旧形式の直書きが残っていない", () => {
  const inline = html.slice(html.indexOf("<script>"));
  assert.match(inline, /L\.bgmValue\(next\)/);
  assert.doesNotMatch(inline, /BGM_KEY, next \? "1" : "0"/);
  assert.doesNotMatch(inline, /readStr\(BGM_KEY\) !== "0"/);
});
