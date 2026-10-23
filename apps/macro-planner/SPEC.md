# PFC・TDEE計算（macro-planner） — SPEC

仕様は `docs/` にまとめた。

| 知りたいこと | 書類 |
|---|---|
| 目的・機能・計算の式と根拠・受け入れ基準 | [docs/01_要件定義.md](docs/01_要件定義.md) |
| 画面の並び・部品・状態・色・保存する内容 | [docs/02_画面仕様.md](docs/02_画面仕様.md) |
| テストの種類と結果・不具合と対応 | [docs/03_テスト計画と結果.md](docs/03_テスト計画と結果.md) |
| 版ごとの変更 | [docs/04_リリースノート.md](docs/04_リリースノート.md) |

ファイルの分け方: `src/macro.ts`（計算の純関数）、`src/foods.ts`（よく食べるもの）、`src/storage.ts`（保存と検査）、`src/main.ts`（画面）、`src/icons.ts`（Tabler Icons）。
