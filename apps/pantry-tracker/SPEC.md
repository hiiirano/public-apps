# pantry-tracker — 家庭の在庫管理アプリ SPEC

家庭の食材・日用品の在庫を管理する静的Webアプリ。
**サーバー/認証/決済 不要**。すべてブラウザの localStorage に保存。GitHub Pages で配信可能。

`meal-planner` の姉妹アプリ。設計思想を踏襲する：
**決定的コアはLLM無しでフル動作し、LLMは任意の上乗せ拡張**。

---

## 1. 解く課題

「家にあるはずの物をまた買ってしまう」「奥の食材を腐らせる」を防ぐ。

- 何が・いくつ・どこに・いつまで、を一覧で持つ
- **消費期限の近い順**で“今使うべき物”が一目で分かる
- **残量が少ない物**（最低在庫割れ）が買い物の合図になる

---

## 2. データモデル

```ts
type Category = "食品" | "飲料" | "調味料" | "冷凍" | "日用品" | "その他";
type Location = "冷蔵" | "冷凍" | "常温" | "その他";

interface Item {
  id: string;          // 一意ID
  name: string;        // 品名（必須）
  qty: number;         // 数量（>= 0）
  unit: string;        // 単位（個 / g / ml / 本 / パック など）
  category: Category;
  location: Location;
  expiry?: string;     // 消費/賞味期限 YYYY-MM-DD（任意）
  minQty: number;      // 最低在庫しきい値（0 なら残量アラート無効）
  note?: string;       // メモ（任意）
  createdAt: string;   // ISO日時
  updatedAt: string;   // ISO日時
}
```

---

## 3. 決定的コアロジック（LLM不要）

### 3.1 緊急度（Urgency）

期限 `expiry` と基準日 `today`（端末日付）の差 `days` で決める：

| days | urgency | 意味 |
|---|---|---|
| < 0 | `expired` | 期限切れ |
| 0..2 | `soon` | 3日以内 |
| 3..6 | `near` | 1週間以内 |
| >= 7 または expiry無し | `ok` | 余裕 / 期限管理なし |

UIで色分け（expired=赤 / soon=橙 / near=黄 / ok=無色）。

### 3.2 残量低下（Low stock）

`minQty > 0 && qty <= minQty` のとき「買い足し候補」フラグを立てる。

### 3.3 並べ替え

既定は **期限が近い順**（expiry昇順、無しは末尾、同期限は名前順）。
副次キーで緊急度（expired→soon→near→ok）を優先しても等価になるよう実装する。

### 3.4 集計

- カテゴリ別 件数
- 場所別 件数
- 期限切れ件数 / 3日以内件数 / 残量低下件数（ダッシュボードのバッジ）

すべて **純関数**（入力配列→出力）。副作用なし。テスト対象。

---

## 4. 永続化

- `localStorage` キー `pantry-tracker.items`（Item配列のJSON）
- `localStorage` キー `pantry-tracker.llm`（LLM設定）
- 読み込み失敗時は空配列にフォールバック（壊さない）

---

## 5. 任意LLM拡張（meal-planner と同型）

- OpenAI互換 Chat Completions（endpoint / apiKey / model）を localStorage に保存
- 機能: **テキスト貼付（レシートやメモ）→ Item候補をJSON抽出**してリストに追加（ユーザー確認の上で取り込み）
- APIキーはこのブラウザのlocalStorageのみ。サーバーに送らない
- 未設定なら拡張パネルは無効。コア機能には一切影響しない

抽出フォーマット（LLMに要求するJSON）:
```json
{ "items": [ { "name": "牛乳", "qty": 1, "unit": "本", "category": "飲料", "location": "冷蔵", "expiry": "2026-07-01" } ] }
```
欠損フィールドはコア側で既定値補完（qty=1, unit="個", category="その他", location="常温", minQty=0）。

---

## 6. 画面（単一ページ）

1. **ダッシュボード**: 期限切れ/3日以内/残量低下のバッジ
2. **追加フォーム**: 品名・数量・単位・カテゴリ・場所・期限・最低在庫・メモ
3. **在庫一覧**: 期限近い順、緊急度色分け、+/- で数量増減、編集・削除
4. **フィルタ**: カテゴリ / 場所 / 「要対応のみ（expired+soon+low stock）」
5. **LLM拡張パネル**（折りたたみ）: 設定 ＋ テキスト取込

---

## 7. 非対象（YAGNI）

- 複数ユーザー / 同期 / クラウド保存
- バーコードスキャン
- 通知（プッシュ）
- meal-planner との実連携（将来。今はデータモデルだけ互換を意識）

---

## 8. 技術

- Vite + TypeScript（strict）、フレームワーク無し（素のDOM）
- `vite.config.ts` は `base: "./"`（相対パス＝サブパス配信可）
- テスト: tsx で純関数ユニットテスト
- 依存ランタイム0（ビルド後は静的アセットのみ）
