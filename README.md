# public-apps

コミュニティ内で広まった **AI活用事例** をベースに、「多くの人に役立つ」小さなアプリを1本ずつ作るモノレポ。
段取り管理に [beads (`bd`)](https://github.com/gastownhall/beads) を実戦投入している。

## アプリ

| # | アプリ | 状態 | 公開URL | 場所 |
|---|---|---|---|---|
| 1 | 週間献立プランナー | 公開中 | https://hiiirano.github.io/public-apps/meal-planner/ | [`apps/meal-planner/`](apps/meal-planner/) |
| 2 | 在庫管理 | 公開中 | https://hiiirano.github.io/public-apps/pantry-tracker/ | [`apps/pantry-tracker/`](apps/pantry-tracker/) |
| 3 | 暗記カード | 公開中 | https://hiiirano.github.io/public-apps/flashcards/ | [`apps/flashcards/`](apps/flashcards/) |
| 4 | 家計簿 kakeibo | 公開中 | https://hiiirano.github.io/public-apps/kakeibo/ | [`apps/kakeibo/`](apps/kakeibo/) |
| 5 | 割り勘 warikan | 公開中 | https://hiiirano.github.io/public-apps/warikan/ | [`apps/warikan/`](apps/warikan/) |
| 6 | PFC・TDEE計算 macro-planner | 公開中 | https://hiiirano.github.io/public-apps/macro-planner/ | [`apps/macro-planner/`](apps/macro-planner/) |
| 7 | 筋トレ記録 gym-log | 公開中 | https://hiiirano.github.io/public-apps/gym-log/ | [`apps/gym-log/`](apps/gym-log/) |

入口ページ: https://hiiirano.github.io/public-apps/

## デプロイ

GitHub Pages（ソース = `gh-pages` ブランチ）。再デプロイは:

```bash
./deploy.sh   # build → gh-pages へ force push
```

> 現在のトークンに `workflow` スコープが無いため GitHub Actions ではなくブランチ配信。
> `gh auth refresh -s workflow` でスコープを足せば `.github/workflows` の自動デプロイに切替可能。
