# assets/voice — タイトルよみあげクリップ

初回タップで「ぴよぴよランド」を1回よみあげる同梱クリップを置く場所。

- `piyopiyo-land.m4a` … 「ぴよぴよランド」（**VOICEVOX:ずんだもん**）

`index.html` の `playTitleVoice()` が `Audio()` で再生する。読み込めない環境では
speechSynthesis（日本語）→ 無音の順にフォールバックするため、クリップが無くても落ちない。

## 生成の再現情報（他の3アプリと統一）

| 項目 | 値 |
|---|---|
| エンジン | VOICEVOX ENGINE 0.25.2（macOS x64 CPU・公式GitHubリリース） |
| 話者 / スタイル | ずんだもん / あまあま（`speaker` = style id **1**） |
| 速度 | `speedScale` = 0.92 |
| 音声形式 | 24kHz WAV → `afconvert -f m4af -d aac -b 64000`（AAC 64kbps モノラル m4a） |

`/audio_query`（`text=ぴよぴよランド`）→ `speedScale` 調整 → `/synthesis` → `afconvert` で m4a 化。
生成後にエンジンは停止。クリップは端末内同梱アセット（**外部送信ゼロ**）。

## クレジット

**VOICEVOX:ずんだもん**（VOICEVOX 利用規約に基づく）。
