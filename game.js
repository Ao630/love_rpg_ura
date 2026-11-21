/**
 * ura_stage/js/game.js ― 夜桜の裏舞台「告白ダイヤル」
 * 回る針を、金色の弧の中で止めれば成功。ラウンドが進むほど弧が狭く・針が速くなる。
 * 全ラウンド成功でクリア、1回でも外すと敗北(「もう一度」で最初から)。
 * 判定ロジック(UraLogic)は画面に依存しない純粋な関数で、tests/ura.test.js で検証している。
 */
(function (global) {
  'use strict';

  // ★数値・文章はここで調整する(zone = 円全体に対する弧の割合 / speed = 針が1秒に回る周数)
  var CONFIG = {
    rounds: [
      { name: '第一幕', zone: 0.16, speed: 0.45, intro: 'ようこそ、裏の舞台へ。まずは軽く、ね？' },
      { name: '第二幕', zone: 0.10, speed: 0.65, intro: 'へえ…やるじゃない。次はどうかしら。' },
      { name: '終幕',   zone: 0.06, speed: 0.90, intro: '最後よ。あなたの想い、ここで見せてちょうだい！' }
    ],
    successLines: ['ふふ、いい呼吸ね。', '…っ、胸が高鳴るわ。', '……完敗よ。'],
    failLine: '惜しかったわね。恋は何度でもやり直せるのよ。',
    clearText: 'あなたは伝説の恋愛マスターよ。これからも素敵な恋を。',
    portrait: '',                    // 立ち絵の画像パス(例 'assets/yukino.png')。空欄なら「雪乃」の文字を表示
    backUrl: '../index.html',        // 「表の世界へ戻る」の飛び先(メインのゲームの index.html)
    nextRoundDelayMs: 900,
    petalCount: 22                   // 舞い散る花びらの数
  };

  // ---------- 判定ロジック(純粋関数) ----------
  var UraLogic = {
    /** 時間 t(秒)・速さ speed(周/秒)での針の位置(0〜1。上が0で時計回り) */
    position: function (t, speed) {
      return (((t * speed) % 1) + 1) % 1;
    },
    /** 弧の中心をランダムに決める。開始直後の針(0)とすぐ重ならないよう 0.2〜0.9 の範囲 */
    pickCenter: function (zone, rng) {
      return 0.2 + (rng || Math.random)() * 0.7;
    },
    /** 針の位置 p が弧の中か(円なので、0 と 1 はつながっている。境界を含む) */
    isHit: function (p, center, zone) {
      var d = Math.abs(p - center);
      d = Math.min(d, 1 - d);
      return d <= zone / 2 + 1e-9;
    },
    /** ミリ秒を MM:SS:CC に整形 */
    format: function (ms) {
      var t = Math.max(0, Math.floor(ms));
      function p2(n) { return (n < 10 ? '0' : '') + n; }
      return p2(Math.floor(t / 60000)) + ':' + p2(Math.floor((t % 60000) / 1000)) + ':' + p2(Math.floor((t % 1000) / 10));
    }
  };
  global.UraLogic = UraLogic;
  if (typeof module !== 'undefined' && module.exports) { module.exports = { UraLogic: UraLogic, CONFIG: CONFIG }; }
  if (typeof document === 'undefined') { return; } // Node(テスト)ではここまで

  // ---------- 画面 ----------
  var $ = function (id) { return document.getElementById(id); };
  var screens = { title: $('screen-title'), play: $('screen-play'), result: $('screen-result') };
  var dialEl = document.querySelector('.dial'), zoneEl = $('zone'), handEl = $('hand'), msgEl = $('msg');
  var CIRC = 2 * Math.PI * 80; // 円の外周(r=80)
  var confessBtn = $('btn-confess');

  var roundIndex = 0, center = 0, startedAt = 0, finishedAt = null;
  var roundStart = 0, rafId = null, locked = true, playing = false, timerId = null;

  function show(name) {
    Object.keys(screens).forEach(function (k) { screens[k].hidden = (k !== name); });
  }

  function startRound() {
    var r = CONFIG.rounds[roundIndex];
    center = UraLogic.pickCenter(r.zone);
    // 金の弧: 上(0)から時計回りに、中心 center・幅 zone の位置へ(-90°は3時方向から上へ合わせる補正)
    zoneEl.setAttribute('stroke-dasharray', (r.zone * CIRC) + ' ' + CIRC);
    zoneEl.setAttribute('transform', 'rotate(' + ((center - r.zone / 2) * 360 - 90) + ' 100 100)');
    $('round-label').textContent = r.name;
    msgEl.textContent = r.intro;
    dialEl.className = 'dial';
    roundStart = performance.now();
    locked = false;
    confessBtn.disabled = false;
    loop();
  }

  function loop() {
    var r = CONFIG.rounds[roundIndex];
    handEl.setAttribute('transform', 'rotate(' + (UraLogic.position((performance.now() - roundStart) / 1000, r.speed) * 360) + ' 100 100)');
    rafId = requestAnimationFrame(loop);
  }
  function stopLoop() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }

  function tickTimer() {
    var end = finishedAt !== null ? finishedAt : Date.now();
    $('timer').textContent = UraLogic.format(end - startedAt);
  }

  function confess() {
    if (locked || !playing) { return; }
    locked = true;                       // 連打で二重判定しない
    confessBtn.disabled = true;
    stopLoop();
    var r = CONFIG.rounds[roundIndex];
    var p = UraLogic.position((performance.now() - roundStart) / 1000, r.speed);
    if (UraLogic.isHit(p, center, r.zone)) {
      dialEl.classList.add('ok');
      msgEl.textContent = CONFIG.successLines[Math.min(roundIndex, CONFIG.successLines.length - 1)];
      if (roundIndex === CONFIG.rounds.length - 1) {
        finishedAt = Date.now(); tickTimer();
        window.setTimeout(function () { finish(true); }, CONFIG.nextRoundDelayMs);
      } else {
        roundIndex += 1;
        window.setTimeout(startRound, CONFIG.nextRoundDelayMs);
      }
    } else {
      dialEl.classList.add('ng');
      msgEl.textContent = CONFIG.failLine;
      finishedAt = Date.now(); tickTimer();
      window.setTimeout(function () { finish(false); }, CONFIG.nextRoundDelayMs);
    }
  }

  function finish(win) {
    playing = false;
    window.clearInterval(timerId);
    $('result-heading').textContent = win ? '裏ステージ、完全制覇' : '幕、閉じる';
    $('result-text').textContent = win
      ? 'タイム ' + UraLogic.format(finishedAt - startedAt) + '\n' + CONFIG.clearText
      : CONFIG.failLine;
    show('result');
  }

  function start() {
    roundIndex = 0; finishedAt = null; startedAt = Date.now(); playing = true;
    window.clearInterval(timerId);
    timerId = window.setInterval(tickTimer, 50);
    tickTimer();
    show('play');
    startRound();
  }

  // ---------- 初期化 ----------
  if (CONFIG.portrait) {
    var portrait = $('portrait');
    portrait.style.backgroundImage = 'url("' + CONFIG.portrait.replace(/"/g, '%22') + '")';
    portrait.textContent = '';
  }
  $('link-back-title').href = CONFIG.backUrl;
  $('link-back-result').href = CONFIG.backUrl;
  $('btn-start').addEventListener('click', start);
  $('btn-retry').addEventListener('click', start);
  confessBtn.addEventListener('click', confess);
  dialEl.addEventListener('click', confess);
  document.addEventListener('keydown', function (e) {
    if (e.repeat) { return; }
    if ((e.key === ' ' || e.key === 'Enter') && playing) { e.preventDefault(); confess(); }
  });
  // 舞い散る花びらを作る(位置・速さ・揺れをランダムに)
  var petals = $('petals');
  for (var i = 0; i < CONFIG.petalCount; i++) {
    var el = document.createElement('span');
    el.className = 'petal';
    el.style.left = (Math.random() * 100) + 'vw';
    el.style.animationDuration = (8 + Math.random() * 8) + 's';
    el.style.animationDelay = (-Math.random() * 16) + 's';
    el.style.setProperty('--drift', (Math.random() * 120 - 20) + 'px');
    petals.appendChild(el);
  }
  show('title');
})(typeof window !== 'undefined' ? window : globalThis);
