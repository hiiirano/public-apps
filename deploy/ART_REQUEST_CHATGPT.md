# ChatGPT への絵の依頼文（2026-10-24）

下の「依頼文」をそのまま ChatGPT に貼る。1アプリずつ描いてもらい、できたら「次」と送る。

## 依頼文

```
公開しているWebアプリ7本＋ゲーム1本の挿絵を描いてほしいです。
各アプリの「絵の指示書」がGitHubにあるので、まず読んでから、指示書どおりに描いてください。

指示書（この順番で、1アプリずつ進めてください）
1. 筋トレ記録: https://raw.githubusercontent.com/hiiirano/public-apps/main/apps/gym-log/docs/ART_PROMPT.md
2. PFC・TDEE計算: https://raw.githubusercontent.com/hiiirano/public-apps/main/apps/macro-planner/docs/ART_PROMPT.md
3. 家計簿ノート: https://raw.githubusercontent.com/hiiirano/public-apps/main/apps/kakeibo/docs/ART_PROMPT.md
4. 在庫管理: https://raw.githubusercontent.com/hiiirano/public-apps/main/apps/pantry-tracker/docs/ART_PROMPT.md
5. 暗記カード: https://raw.githubusercontent.com/hiiirano/public-apps/main/apps/flashcards/docs/ART_PROMPT.md
6. 日陰MAP: https://raw.githubusercontent.com/hiiirano/public-apps/main/apps/shade-map/docs/ART_PROMPT.md
7. ヒエヒエ冷蔵庫（ゲーム）: https://raw.githubusercontent.com/hiiirano/public-apps/main/apps/fridge-puzzle/docs/ART_PROMPT.md
8. 週間献立プランナー: https://raw.githubusercontent.com/hiiirano/public-apps/main/apps/meal-planner/docs/ART_PROMPT.md

進め方
- 1回の返事では1アプリ分だけ描いてください。描き終えたら、私が「次」と送るまで待ってください。
- 指示書の中の「ChatGPT に渡すプロンプト」の部分が、描いてほしい内容です。表に書いてある絵がすべて入っているか、描く前に確かめてください。
- 1枚のシートに入れる数が多くて崩れそうなら、シートを2〜3枚に分けてかまいません（例: 28コマ → 14コマ×2枚）。分けた場合は、各シートに何番〜何番が入っているかを返事に書いてください。
- 描き終えたら、シートごとに「左上から右へ、何番の絵が入っているか」を一覧で書いてください（あとで切り出すため）。

全アプリ共通の決まり（指示書より優先）
- 背景は真っ白の無地にしてください。透明を表す灰色の市松模様（チェック柄）は絶対に描かないでください。
- 絵どうしの間は広く空けて、ほかの絵とくっつけたり重ねたりしないでください。
- 文字・数字・ロゴ・実在の会社や商品のブランドは入れないでください（指示書で求められている場合を除く）。
- 1つのアプリの中では、画風・線の太さ・色合いをそろえてください。アプリどうしは指示書ごとに違う画風でかまいません。
- 実在の人物には似せないでください。
- 画像はできるだけ大きな解像度で出してください。

URLが開けない場合は、そう言ってください。指示書の中身を貼り付けます。
```

## 受け取った後
- 画像はアプリごとにフォルダを分けて保存し、Claude に渡す（例 `~/Downloads/art/gym-log/`）。
- 切り出し・背景の透過・差し替え・テストは Claude がやる。
- 献立（8番）は朝食・昼食に対応する作業中。指示書を更新してから push するので、8番はそのあとに頼む。
