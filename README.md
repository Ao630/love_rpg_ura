# 夜桜の裏舞台(独立プロジェクト)

「恋愛RPG」のクリア画面から行ける隠しステージです。メインのコード・CSSとは完全に別で、このフォルダだけで動きます(HTML/CSS/JSのみ。ビルド・サーバー不要)。見た目も別デザイン(藍の夜空・金・桜色、明朝体、舞い散る花びら)です。

## 遊び方
回る針を、金色の弧の中で止める(「告白する」ボタン / Space / Enter / ダイヤルのタップ)。全3幕を成功でクリア、外すと敗北。幕が進むほど弧が狭く、針が速くなります。

## 構成
- `index.html` … 3画面(title / play / result)
- `css/style.css` … 見た目(色は先頭の `:root` で変更)
- `js/game.js` … ゲーム本体。先頭の `CONFIG` で難易度・セリフ・立ち絵・戻り先・花びらの数を調整
- `tests/ura.test.js` … 判定ロジックのテスト(`node tests/ura.test.js`)

## メインとの連携
- メイン → 裏: メインの `js/config.js` の `externalLink.url`(既定 `ura_stage/index.html`)
- 裏 → メイン: `game.js` の `CONFIG.backUrl`(既定 `../index.html`)
- 別リポジトリ/別サイトに分けるときは、両方のURLを書き換えるだけです。
