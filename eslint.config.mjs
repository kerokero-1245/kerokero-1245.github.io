// ESLint の設定（flat config）。`npm run lint`（= eslint .）で流す。
// index.html のインライン script は対象外（HTML 用のプラグインは入れていない）。
import js from "@eslint/js";
import globals from "globals";

export default [
  // 無視するのは依存だけ。ビルドの出力先はこの repo に無い
  { ignores: ["node_modules/"] },

  js.configs.recommended,

  // assets/ の .js（bgm/engine.js・bgm/songs.js・js/keys.js・js/land-core.js）は index.html が <script src> で読む通常のスクリプト。
  // 末尾の `typeof module !== "undefined" && module.exports` は Node から require されたときだけ効く
  // （land-core.js は tests/ が require する）。その `module` を宣言する（規則は切らず、実行環境のほうを書く）
  {
    files: ["assets/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: { ...globals.browser, module: "readonly" },
    },
  },

  // assets/bgm/ は piyo-assets/bgm/ の写しなので中身を変えない（docs/WORLD.md §12）。
  // engine.js の冒頭に「AudioContext 非対応／未取得なら全 API は無害な no-op（クラッシュ厳禁）」とあり、
  // Web Audio の呼び出しを try/catch で握りつぶす作り。catch 13 か所は全部 `e` を使わず、うち 9 か所は空の `catch (e) {}`。
  // 写しは直さず、この 2 規則だけ catch に限って許す（catch 以外の空ブロック・未使用変数は今までどおり指摘する）
  {
    files: ["assets/bgm/**/*.js"],
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { caughtErrors: "none" }],
    },
  },

  // tests/ は CommonJS（require）。node --test が流す
  {
    files: ["tests/**/*.js"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
  },

  // この設定ファイル自身（ESM）
  {
    files: ["eslint.config.mjs"],
    languageOptions: { sourceType: "module", globals: globals.node },
  },
];
