/* ぴよぴよランド（街）BGM スコアデータ — land 1曲のみ同梱
 * 出典: piyo-assets/bgm/songs.js（4曲の共通スコア）から街用の land を抽出。
 *   形式: { bpm, beatsPerBar, bars, mix, notes:[{ t(拍), midi, dur(拍), vel }] }
 *   - t   … 曲頭からの拍位置（0拍=先頭）。ループ長 = beatsPerBar * bars 拍。
 *   - midi… MIDIノート番号（60=C4, 72=C5）。
 *   - dur … 音価（拍）。オルゴールの余韻はエンジン側で音価から算出する。
 *   - vel … 相対音量（0〜1）。実音量はエンジンのマスターゲイン(0.10前後)×mix×vel。
 * land: C メジャーペンタ・66BPM・16小節ループ・いちばん子守唄寄り。
 * 和声骨格 [I vi IV V]×4、末尾(V)→先頭(I)が自然につながるシームレスループ。
 * BGM: オリジナル（Web Audio 生成）。録音物・外部素材は使っていない。
 */
(function (global) {
  'use strict';
  var SONGS = {
  land: {
    label: "ぴよぴよランド（街）",
    bpm: 66,
    beatsPerBar: 4,
    bars: 16,
    mix: 1,
    notes: [
      { t: 0, midi: 48, dur: 2, vel: 0.5 },
      { t: 0, midi: 72, dur: 2, vel: 0.82 },
      { t: 2, midi: 55, dur: 2, vel: 0.42 },
      { t: 2, midi: 76, dur: 2, vel: 0.72 },
      { t: 4, midi: 57, dur: 2, vel: 0.5 },
      { t: 4, midi: 81, dur: 1.5, vel: 0.78 },
      { t: 5.5, midi: 76, dur: 2.5, vel: 0.7 },
      { t: 6, midi: 64, dur: 2, vel: 0.42 },
      { t: 8, midi: 53, dur: 2, vel: 0.5 },
      { t: 8, midi: 72, dur: 2, vel: 0.74 },
      { t: 10, midi: 60, dur: 2, vel: 0.42 },
      { t: 10, midi: 69, dur: 2, vel: 0.68 },
      { t: 12, midi: 55, dur: 2, vel: 0.5 },
      { t: 12, midi: 79, dur: 2, vel: 0.78 },
      { t: 14, midi: 62, dur: 2, vel: 0.42 },
      { t: 14, midi: 74, dur: 2, vel: 0.7 },
      { t: 16, midi: 48, dur: 2, vel: 0.5 },
      { t: 16, midi: 76, dur: 1, vel: 0.8 },
      { t: 17, midi: 79, dur: 1, vel: 0.76 },
      { t: 18, midi: 55, dur: 2, vel: 0.42 },
      { t: 18, midi: 84, dur: 2, vel: 0.82 },
      { t: 20, midi: 57, dur: 2, vel: 0.5 },
      { t: 20, midi: 81, dur: 2, vel: 0.76 },
      { t: 22, midi: 64, dur: 2, vel: 0.42 },
      { t: 22, midi: 76, dur: 2, vel: 0.7 },
      { t: 24, midi: 53, dur: 2, vel: 0.5 },
      { t: 24, midi: 84, dur: 1.5, vel: 0.72 },
      { t: 25.5, midi: 81, dur: 1.5, vel: 0.7 },
      { t: 26, midi: 60, dur: 2, vel: 0.42 },
      { t: 28, midi: 55, dur: 2, vel: 0.5 },
      { t: 28, midi: 79, dur: 1.5, vel: 0.76 },
      { t: 29.5, midi: 74, dur: 2.5, vel: 0.68 },
      { t: 30, midi: 62, dur: 2, vel: 0.42 },
      { t: 32, midi: 48, dur: 2, vel: 0.5 },
      { t: 32, midi: 72, dur: 2, vel: 0.82 },
      { t: 34, midi: 55, dur: 2, vel: 0.42 },
      { t: 34, midi: 76, dur: 2, vel: 0.72 },
      { t: 36, midi: 57, dur: 2, vel: 0.5 },
      { t: 36, midi: 81, dur: 1.5, vel: 0.78 },
      { t: 37.5, midi: 76, dur: 2.5, vel: 0.7 },
      { t: 38, midi: 64, dur: 2, vel: 0.42 },
      { t: 40, midi: 53, dur: 2, vel: 0.5 },
      { t: 40, midi: 72, dur: 2, vel: 0.74 },
      { t: 42, midi: 60, dur: 2, vel: 0.42 },
      { t: 42, midi: 69, dur: 2, vel: 0.68 },
      { t: 44, midi: 55, dur: 2, vel: 0.5 },
      { t: 44, midi: 79, dur: 2, vel: 0.78 },
      { t: 46, midi: 62, dur: 2, vel: 0.42 },
      { t: 46, midi: 74, dur: 2, vel: 0.7 },
      { t: 48, midi: 48, dur: 2, vel: 0.5 },
      { t: 48, midi: 76, dur: 1, vel: 0.8 },
      { t: 49, midi: 79, dur: 1, vel: 0.76 },
      { t: 50, midi: 55, dur: 2, vel: 0.42 },
      { t: 50, midi: 84, dur: 2, vel: 0.82 },
      { t: 52, midi: 57, dur: 2, vel: 0.5 },
      { t: 52, midi: 81, dur: 2, vel: 0.76 },
      { t: 54, midi: 64, dur: 2, vel: 0.42 },
      { t: 54, midi: 72, dur: 2, vel: 0.7 },
      { t: 56, midi: 53, dur: 2, vel: 0.5 },
      { t: 56, midi: 69, dur: 2, vel: 0.72 },
      { t: 58, midi: 60, dur: 2, vel: 0.42 },
      { t: 58, midi: 72, dur: 2, vel: 0.7 },
      { t: 60, midi: 55, dur: 2, vel: 0.5 },
      { t: 60, midi: 79, dur: 1.5, vel: 0.74 },
      { t: 61.5, midi: 74, dur: 2, vel: 0.66 },
      { t: 62, midi: 62, dur: 2, vel: 0.42 },
    ],
  },
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = SONGS; }
  global.PIYO_SONGS = SONGS;
})(typeof self !== 'undefined' ? self : typeof globalThis !== 'undefined' ? globalThis : this);
