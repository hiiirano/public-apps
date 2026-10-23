// 暗記カード — 見本の単語帳
import type { CardPair, DeckArt } from "./types";

export interface Sample {
  id: string;
  name: string;
  art: DeckArt;
  note: string;
  cards: CardPair[];
}

const pairs = (s: string): CardPair[] =>
  s
    .trim()
    .split("\n")
    .map((l) => {
      const [front, back] = l.split("|");
      return { front: front.trim(), back: back.trim() };
    });

export const SAMPLES: readonly Sample[] = [
  {
    id: "en-junior-20",
    name: "中学英単語 20",
    art: "english",
    note: "英語 → 日本語",
    cards: pairs(`
important|大切な
remember|覚えている・思い出す
library|図書館
borrow|借りる
because|なぜなら・〜だから
different|ちがう
explain|説明する
weather|天気
believe|信じる
favorite|いちばん好きな
breakfast|朝ごはん
quickly|すばやく
answer|答え・答える
dangerous|危ない
interesting|おもしろい
forget|忘れる
station|駅
practice|練習・練習する
example|例
tomorrow|あした
`),
  },
  {
    id: "jp-capitals-47",
    name: "都道府県の県庁所在地",
    art: "japan",
    note: "47都道府県",
    cards: pairs(`
北海道|札幌市
青森県|青森市
岩手県|盛岡市
宮城県|仙台市
秋田県|秋田市
山形県|山形市
福島県|福島市
茨城県|水戸市
栃木県|宇都宮市
群馬県|前橋市
埼玉県|さいたま市
千葉県|千葉市
東京都|新宿区（東京）
神奈川県|横浜市
新潟県|新潟市
富山県|富山市
石川県|金沢市
福井県|福井市
山梨県|甲府市
長野県|長野市
岐阜県|岐阜市
静岡県|静岡市
愛知県|名古屋市
三重県|津市
滋賀県|大津市
京都府|京都市
大阪府|大阪市
兵庫県|神戸市
奈良県|奈良市
和歌山県|和歌山市
鳥取県|鳥取市
島根県|松江市
岡山県|岡山市
広島県|広島市
山口県|山口市
徳島県|徳島市
香川県|高松市
愛媛県|松山市
高知県|高知市
福岡県|福岡市
佐賀県|佐賀市
長崎県|長崎市
熊本県|熊本市
大分県|大分市
宮崎県|宮崎市
鹿児島県|鹿児島市
沖縄県|那覇市
`),
  },
  {
    id: "elements-20",
    name: "元素記号 1〜20番",
    art: "element",
    note: "元素の名前 → 記号",
    cards: pairs(`
水素|H
ヘリウム|He
リチウム|Li
ベリリウム|Be
ホウ素|B
炭素|C
窒素|N
酸素|O
フッ素|F
ネオン|Ne
ナトリウム|Na
マグネシウム|Mg
アルミニウム|Al
ケイ素|Si
リン|P
硫黄|S
塩素|Cl
アルゴン|Ar
カリウム|K
カルシウム|Ca
`),
  },
];
