// 写しと正本のずれを防ぐテスト。
// 街（静的 HTML・ビルド無し）は piyo-assets の一部を assets/ に写して同梱している。正本だけ直して写しを
// 直し忘れると、街だけ BGM・保存キーが知育 3 本とずれる（キー名がずれると ⭐が街に届かない）。
// devDependencies の piyo-assets（同じタグ）を正本として、写しが正本と同じかを見る。
//   engine.js・keys.js: バイト列の一致
//   songs.js: 写しは land 1 曲の抜き出しなのでバイト列では比べられない。両方を評価して PIYO_SONGS.land の値を比べる
//   assets/img/*.svg: 正本 svg/ の同名ファイルとバイト列の一致（assets/img を列挙して全部見る。0 件なら失敗）
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const pkg = path.join(root, "node_modules", "@kerokero-1245", "piyo-assets");

function sameBytes(copy, original) {
  const a = fs.readFileSync(path.join(root, copy));
  const b = fs.readFileSync(path.join(pkg, original));
  assert.ok(a.length > 0, copy + " が空");
  assert.ok(a.equals(b), copy + " が正本 " + original + " と違う");
}

test("assets/bgm/engine.js は正本 bgm/engine.js とバイト列が同じ", () => {
  sameBytes("assets/bgm/engine.js", "bgm/engine.js");
});

test("assets/js/keys.js は正本 keys/keys.js とバイト列が同じ", () => {
  sameBytes("assets/js/keys.js", "keys/keys.js");
});

// 写しの一覧は直書きせず assets/img を列挙する（新しく写した svg が素通りしないように）。
// 1 つずつ止めずに全部を見て、正本に無い名前・中身の違う名前をまとめて出す
test("assets/img/*.svg は正本 svg/ の同名ファイルとバイト列が同じ", () => {
  const dir = path.join(root, "assets", "img");
  const names = fs.readdirSync(dir).filter((name) => name.endsWith(".svg"));
  assert.ok(
    names.length > 0,
    "assets/img に svg が 1 つも無い（列挙先を確かめる）",
  );
  const missing = [];
  const differs = [];
  for (const name of names) {
    const original = path.join(pkg, "svg", name);
    if (!fs.existsSync(original)) {
      missing.push(name);
      continue;
    }
    const a = fs.readFileSync(path.join(dir, name));
    if (a.length === 0 || !a.equals(fs.readFileSync(original)))
      differs.push(name);
  }
  assert.deepStrictEqual(
    { missing, differs },
    { missing: [], differs: [] },
    "正本 svg/ に同名が無い: " +
      (missing.join(", ") || "なし") +
      " / 正本と中身が違う: " +
      (differs.join(", ") || "なし"),
  );
});

// classic script を空の文脈で評価し、置いた PIYO_SONGS を取り出す（冒頭の IIFE が globalThis に置く）
function songsOf(file) {
  const ctx = {};
  vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
  assert.ok(
    ctx.PIYO_SONGS && ctx.PIYO_SONGS.land,
    file + " に PIYO_SONGS.land が無い",
  );
  return ctx.PIYO_SONGS;
}

test("assets/bgm/songs.js の PIYO_SONGS.land は正本 bgm/songs.js の land と同じ値", () => {
  const copy = songsOf(path.join(root, "assets", "bgm", "songs.js"));
  const original = songsOf(path.join(pkg, "bgm", "songs.js"));
  assert.ok(original.land.notes.length > 0, "正本の land に音が無い");
  // 別の文脈の配列・オブジェクトは prototype が違うので、JSON を通して値だけを比べる
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(copy.land)),
    JSON.parse(JSON.stringify(original.land)),
  );
});
