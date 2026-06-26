# public-apps

コミュニティ内で広まった **AI活用事例** をベースに、「多くの人に役立つ」小さなアプリを1本ずつ作るモノレポ。
段取り管理に [beads (`bd`)](https://github.com/gastownhall/beads) を実戦投入している。

## アプリ

| # | アプリ | 状態 | 公開URL | 場所 |
|---|---|---|---|---|
| 1 | 週間献立プランナー | 公開中 | https://hiiirano.github.io/public-apps/meal-planner/ | [`apps/meal-planner/`](apps/meal-planner/) |

入口ページ: https://hiiirano.github.io/public-apps/

## デプロイ

GitHub Pages（ソース = `gh-pages` ブランチ）。再デプロイは:

```bash
./deploy.sh   # build → gh-pages へ force push
```

> 現在のトークンに `workflow` スコープが無いため GitHub Actions ではなくブランチ配信。
> `gh auth refresh -s workflow` でスコープを足せば `.github/workflows` の自動デプロイに切替可能。
