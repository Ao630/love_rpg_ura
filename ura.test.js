// 実行: ura_stage フォルダで  node tests/ura.test.js
'use strict';
const assert = require('assert');
const { UraLogic, CONFIG } = require('../js/game.js');
let n = 0;
const test = (name, fn) => { fn(); n++; console.log('  OK   ' + name); };

test('針の位置は0〜1で一周して戻る', () => {
  assert.strictEqual(UraLogic.position(0, 0.5), 0);
  assert.ok(Math.abs(UraLogic.position(1, 0.5) - 0.5) < 1e-9);
  assert.ok(Math.abs(UraLogic.position(2, 0.5)) < 1e-9);
  for (let t = 0; t < 30; t += 0.37) { const p = UraLogic.position(t, 0.9); assert.ok(p >= 0 && p < 1); }
});
test('弧の中心は 0.2〜0.9 の範囲', () => {
  [0, 0.5, 0.999999].forEach((x) => { const c = UraLogic.pickCenter(0.1, () => x); assert.ok(c >= 0.2 && c < 0.9); });
});
test('判定: 弧の内は成功・外は失敗・境界は成功', () => {
  assert.ok(UraLogic.isHit(0.5, 0.5, 0.1));
  assert.ok(UraLogic.isHit(0.55, 0.5, 0.1));
  assert.ok(!UraLogic.isHit(0.56, 0.5, 0.1));
});
test('判定: 円なので 0 と 1 をまたぐ弧でも正しく判定できる', () => {
  assert.ok(UraLogic.isHit(0.99, 0.02, 0.1));
  assert.ok(UraLogic.isHit(0.01, 0.98, 0.1));
  assert.ok(!UraLogic.isHit(0.5, 0.02, 0.1));
});
test('ラウンドが進むほど難しくなる(弧が狭く・針が速くなる)', () => {
  for (let i = 1; i < CONFIG.rounds.length; i++) {
    assert.ok(CONFIG.rounds[i].zone < CONFIG.rounds[i - 1].zone);
    assert.ok(CONFIG.rounds[i].speed > CONFIG.rounds[i - 1].speed);
  }
});
test('タイム整形', () => {
  assert.strictEqual(UraLogic.format(12340), '00:12:34');
  assert.strictEqual(UraLogic.format(-1), '00:00:00');
});
console.log('\n' + n + ' 件のテストが成功');
