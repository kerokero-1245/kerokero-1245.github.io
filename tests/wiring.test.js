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
