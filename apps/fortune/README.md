# 星と余白（占いコーナー）

ChatGPT が 2026-11-04 に企画〜実装まで作った単体 HTML（`docs/original_chatgpt_20261104.html`）を、
`scripts/build.py` で公開用に手直しして `dist/index.html` を作る。元ファイルは編集しない。

- 企画書: `docs/00_企画書_ChatGPT_20261104.pdf`（50案のカタログ・有料化の注意点）
- 公開時の手直し: 「未公開版」表記と noindex を外す／7〜14px の文字を 11〜16px へ底上げ
- 法的な整理: 無料・登録なし・決済なし・外部送信なし。各占いに「伝統形式／簡易計算／創作」の区分と
  「未来を保証しない」旨を表示済み。有料化するなら Stripe が占いを禁止業種にしている点、特商法表示が先。
- 未対応（DELIVERY_STANDARD との差）: Vite+TS 化、単体/E2E テスト、PWA、axe 検査、ChatGPT の絵
