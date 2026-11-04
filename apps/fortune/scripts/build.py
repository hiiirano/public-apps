# docs/original_chatgpt_*.html を公開用に手直しして dist/index.html を作る。
# 元ファイルは触らない。直したい点はここに足す。
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'docs' / 'original_chatgpt_20261104.html').read_text(encoding='utf-8')
reps = [
  ('<meta name="robots" content="noindex,nofollow">', ''),
  ('未公開の占いアトリエ。', '小さな占いアトリエ。'),
  ('<span class="private-label"><i></i> 未公開版</span>', '<span class="private-label"><i></i> 無料・登録不要</span>'),
  ('現在は開発中の未公開版です。料金・決済・会員登録・AIへの送信機能はありません。', '料金・決済・会員登録はなく、入力した内容が外部へ送られることもありません。'),
  ('HIRANO LAB / PRIVATE PROTOTYPE', 'HIRANO LAB'),
]
for a, b in reps:
    if a not in src: sys.exit(f'build: not found: {a[:40]}')
    src = src.replace(a, b)
# 文字が小さすぎる（7〜12px）のをスマホで読める大きさへ底上げ
bump = {7:11, 8:11, 9:12, 10:13, 11:14, 12:15, 13:15, 14:16}
src = re.sub(r'font-size:(\d+)px', lambda m: f'font-size:{bump.get(int(m.group(1)), int(m.group(1)))}px', src)
out = root / 'dist'; out.mkdir(exist_ok=True)
(out / 'index.html').write_text(src, encoding='utf-8')
print('built', out / 'index.html')
