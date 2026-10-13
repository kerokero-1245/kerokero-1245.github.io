# ぴよぴよランドの作り方

世界観・数値・キー・文言の正典は [WORLD.md](WORLD.md) です。このファイルには、作り方の規則に対してこのリポジトリで違うことだけを書きます。

## この repo での適用

規則の全文は [作り方の規則](https://github.com/kerokero-1245/kerokero-1245/blob/main/DESIGN.md) にあります。ここには、このリポジトリで違うことだけを書きます。

### 例外（規則と違うこと）

- JavaScript のまま書く（`index.html` のインライン JS・`assets/js/*.js`・`tests/*.test.js`）。GitHub Pages がリポジトリをビルドなしでそのまま配信する静的ページなので、TypeScript にすると変換の段が要る。テストも同じ JS を `node --test` で直接読む

### 固有の約束（このリポジトリだけの不変条件）

- 街の段階表（⭐しきい値と出現物）。`assets/js/land-core.js` の `THRESHOLDS` がこの表と一致することをテストが見る: [WORLD.md §3.4](WORLD.md#34-街の発展段階表しきい値--出現物正典確定)
- localStorage キー台帳（既存キーは変えない。キー名の値は piyo-assets の keys から読む）: [WORLD.md §7](WORLD.md#7-localstorage-キー台帳正典)
- 見た目の変更は 8 サイズ × 3 状態で撮影して目視する: [WORLD.md §10](WORLD.md#10-検証規律省略不可)
- 世界に存在させないもの（タイマー・ガチャ・退行・外部送信・既存キーの改変など）: [WORLD.md §11](WORLD.md#11-禁止事項世界の絶対線)
- 共通化の寄せ先（`:root` のトークンと共通クラス・`FACILITIES` などの対応表）、純関数の置き場（`land-core.js`）、piyo-assets の写し（`assets/bgm/`・`assets/js/keys.js`。一致は `tests/copies.test.js`）: [WORLD.md §12](WORLD.md#12-実装の方針コードの書き方)

### 記録の例

- なし
