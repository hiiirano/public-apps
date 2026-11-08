# 素材の出典

## 村の絵（画面上部）・アプリのアイコン
- 画面上部の月夜の村は src/main.ts にインライン SVG で自作。アイコン（../icon-*.png / ../apple-touch-icon.png / ../favicon.png）は 2026-11-08 に Python（Pillow）で自作し、「狼」の字に Shippori Mincho B1 を使用。

## 顔の絵（face0〜face19.webp）: Microsoft Fluent Emoji（3D）
- Man / Woman / Detective / Girl / Old man / Woman blonde hair / Farmer / Woman mage / Boy / Old woman / Cook / Woman curly hair / Man beard / Woman elf / Guard / Princess / Man curly hair / Older person / Man bald / Prince を 128px に縮小
- 取得元: https://github.com/microsoft/fluentui-emoji
- ライセンス: MIT。Copyright (c) Microsoft Corporation. 全文は FLUENT-EMOJI-LICENSE.txt

## 操作アイコン: Tabler Icons（outline。src/icons.ts にインラインで収録）
- plus / minus / copy / trash / refresh / arrow-back-up / x / chevron-left / chevron-right / moon / check
- 取得元: https://github.com/tabler/tabler-icons （icons/outline/*.svg）
- ライセンス: MIT。Copyright (c) 2020-2026 Paweł Kuna. 全文は TABLER-LICENSE.txt

## フォント（画面の文字だけに絞って同梱）
- Shippori Mincho B1 ExtraBold（見出し・数字）: SIL Open Font License 1.1。Copyright 2021 The Shippori Mincho Project Authors. 全文は OFL-ShipporiMinchoB1.txt
- Zen Kaku Gothic New Regular / Bold（本文）: SIL Open Font License 1.1。Copyright 2022 The Zen Kaku Gothic Project Authors. 全文は OFL-ZenKakuGothicNew.txt
