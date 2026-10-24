(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const l of o.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&n(l)}).observe(document,{childList:!0,subtree:!0});function a(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(s){if(s.ep)return;s.ep=!0;const o=a(s);fetch(s.href,o)}})();const ot=["again","hard","good","easy"],Dt={again:"わからない",hard:"むずかしい",good:"わかった",easy:"かんたん"},zt=["own","english","japan","element"],U=30,k=300,R=200,S=2e4,Lt=[5,10,20,30,50],it=20,ct=2.5,lt=1.3,dt=3,pt=3650;function tt(t){const e=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t);if(!e)return null;const a=Number(e[1]),n=Number(e[2]),s=Number(e[3]),o=new Date(a,n-1,s);return o.getFullYear()!==a||o.getMonth()!==n-1||o.getDate()!==s?null:o}function x(t){const e=String(t.getFullYear()).padStart(4,"0"),a=String(t.getMonth()+1).padStart(2,"0"),n=String(t.getDate()).padStart(2,"0");return`${e}-${a}-${n}`}function F(t){return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function Qt(t,e){const a=F(t);return a.setDate(a.getDate()+e),x(a)}function Vt(t,e){const a=tt(t),n=tt(e);return!a||!n?0:Math.round((Date.UTC(n.getFullYear(),n.getMonth(),n.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/864e5)}const Zt={again:2,hard:3,good:4,easy:5},te={hard:1,good:2,easy:4},ee={hard:3,good:6,easy:10},G=t=>Math.min(pt,Math.max(1,Math.round(t)));function It(t,e){if(e==="again")return 1;const a=t.repetitions;if(a<=0)return te[e];if(a===1)return ee[e];const n=Math.max(1,t.interval),s=et(t.easeFactor);return G(e==="hard"?Math.max(n+1,n*1.2):e==="good"?Math.max(n+1,n*s):Math.max(n+2,n*s*1.3))}function et(t){return Number.isFinite(t)?Math.min(dt,Math.max(lt,t)):ct}function ae(t,e,a){const n=Zt[e],s=It(t,e),o=et(et(t.easeFactor)+.1-(5-n)*(.08+(5-n)*.02)),l=x(F(a));return{repetitions:e==="again"?0:Math.max(0,t.repetitions)+1,interval:s,easeFactor:Math.round(o*100)/100,due:Qt(a,s),reviews:t.reviews+1,lapses:t.lapses+(e==="again"?1:0),introduced:t.introduced??l,lastReviewed:l}}function ne(t,e,a){return{...t,...ae(t,e,a)}}function se(t){return t<=1?"あした":t===2?"あさって":t<30?`${t}日後`:t<365?`${Math.round(t/30)}か月後`:`${Math.round(t/365*10)/10}年後`}const T=t=>t.reviews===0||!t.due;function Et(t,e){return T(t)?!1:t.due<=x(F(e))}function Tt(t,e){const a=x(F(e));return t.filter(n=>n.introduced===a).length}function re(t,e,a){const n=t.filter(l=>Et(l,e));n.sort((l,i)=>l.due<i.due?-1:l.due>i.due?1:wt(l,i));const s=Math.max(0,a-Tt(t,e)),o=t.filter(T).sort(wt).slice(0,s);return[...n,...o]}function wt(t,e){return t.createdAt<e.createdAt?-1:t.createdAt>e.createdAt?1:t.id<e.id?-1:t.id>e.id?1:0}function Ct(t,e,a){let n=0,s=0,o=0;for(const i of t)T(i)?n++:Et(i,e)&&s++,i.repetitions>=3&&o++;const l=Math.max(0,a-Tt(t,e));return{total:t.length,fresh:n,due:s,today:s+Math.min(n,l),learned:t.length-n,mastered:o}}function oe(t){return{queue:[...t],done:0,first:t.length,counts:{again:0,hard:0,good:0,easy:0}}}function ie(t,e){if(t.queue.length===0)return t;const[a,...n]=t.queue,s=n.slice();return e==="again"&&s.splice(Math.min(3,s.length),0,a),{queue:s,done:t.done+1,first:t.first,counts:{...t.counts,[e]:t.counts[e]+1}}}function ce(t,e,a){const n=x(F(e)),s=new Set(t);return s.add(n),[...s].sort().slice(-800)}function Nt(t,e){const a=new Set(t);let n=F(e);a.has(x(n))||(n=new Date(n.getFullYear(),n.getMonth(),n.getDate()-1));let s=0;for(;a.has(x(n));)s++,n=new Date(n.getFullYear(),n.getMonth(),n.getDate()-1);return s}const le=2e3;function kt(t){const e=t.trim();return e.length>=2&&e.startsWith('"')&&e.endsWith('"')?e.slice(1,-1).replace(/""/g,'"').trim():e}function de(t){if(t.indexOf("	")>=0){const s=t.split("	");return[s[0],s[1]??""]}const a=/^\s*"((?:[^"]|"")*)"\s*[,，](.*)$/.exec(t);if(a)return[a[1].replace(/""/g,'"'),a[2]];const n=/[,，]/.exec(t);return n?[t.slice(0,n.index),t.slice(n.index+1)]:null}function qt(t){const e=t.replace(/\r\n?/g,`
`).split(`
`),a=[],n=[];let s=null;const o=(l,i,r,d)=>{const u=kt(r),$=kt(d);!u||!$?n.push({line:l,text:i,reason:"empty"}):u.length>k||$.length>k?n.push({line:l,text:i,reason:"too-long"}):a.length<le&&a.push({front:u,back:$})};if(e.forEach((l,i)=>{const r=l.replace(/[ \u3000]+$/,""),d=i+1;if(r.trim()===""){s&&n.push({line:s.line,text:s.text,reason:"no-back"}),s=null;return}const u=de(r);if(s&&!u){o(s.line,`${s.text} / ${r.trim()}`,s.text,r),s=null;return}s&&n.push({line:s.line,text:s.text,reason:"no-back"}),s=null,u?o(d,r.trim(),u[0],u[1]):s={line:d,text:r.trim()}}),s){const l=s;n.push({line:l.line,text:l.text,reason:"no-back"})}return{pairs:a,problems:n}}function Rt(t,e){const a=o=>`${o.front}\0${o.back}`,n=new Set(e.map(a)),s=[];for(const o of t){const l=a(o);n.has(l)||(n.add(l),s.push(o))}return{fresh:s,skipped:t.length-s.length}}function pe(t){const e=a=>a.replace(/[\t\r\n]+/g," ");return t.map(a=>`${e(a.front)}	${e(a.back)}`).join(`
`)}const z=t=>t.trim().split(`
`).map(e=>{const[a,n]=e.split("|");return{front:a.trim(),back:n.trim()}}),Ft=[{id:"en-junior-20",name:"中学英単語 20",art:"english",note:"英語 → 日本語",cards:z(`
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
`)},{id:"jp-capitals-47",name:"都道府県の県庁所在地",art:"japan",note:"47都道府県",cards:z(`
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
`)},{id:"elements-20",name:"元素記号 1〜20番",art:"element",note:"元素の名前 → 記号",cards:z(`
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
`)}],Ot="flashcards.v2",ue="flashcards.v2.broken",fe="flashcards.decks",he="flashcards.cards";let me=0;const W=t=>`${t}${Date.now().toString(36)}${(me++).toString(36)}${Math.random().toString(36).slice(2,6)}`;function Q(){return{version:2,decks:[],cards:[],days:[],newPerDay:it}}function Pt(t,e="own",a){const n={id:W("d"),name:ut(t),art:e,createdAt:new Date().toISOString()};return a&&(n.sample=a),n}function ut(t){return t.replace(/\s+/g," ").trim().slice(0,U)||"新しい単語帳"}function ft(t,e,a=0){return{id:W("c"),deckId:t,front:e.front.trim().slice(0,k),back:e.back.trim().slice(0,k),repetitions:0,interval:0,easeFactor:ct,reviews:0,lapses:0,createdAt:new Date(Date.now()+a).toISOString()}}const E=(t,e,a)=>typeof t=="string"&&t.length>=e&&t.length<=a,I=(t,e,a)=>typeof t=="number"&&Number.isInteger(t)&&t>=e&&t<=a,_=t=>typeof t=="string"&&tt(t)!==null,X=t=>typeof t=="string"&&t.length<=40&&!Number.isNaN(Date.parse(t)),V=t=>t===void 0||_(t),be=/^[A-Za-z0-9_-]{1,60}$/,Mt=t=>typeof t=="string"&&be.test(t);function ge(t){return!!t&&typeof t.id=="string"&&E(t.name,1,U)&&zt.includes(t.art)&&(t.sample===void 0||E(t.sample,1,60))&&X(t.createdAt)}function ye(t){return!!t&&typeof t.id=="string"&&typeof t.deckId=="string"&&E(t.front,1,k)&&E(t.back,1,k)&&I(t.repetitions,0,1e5)&&I(t.interval,0,pt)&&typeof t.easeFactor=="number"&&t.easeFactor>=lt&&t.easeFactor<=dt&&I(t.reviews,0,1e6)&&I(t.lapses,0,1e6)&&V(t.due)&&V(t.introduced)&&V(t.lastReviewed)&&(t.reviews===0?t.due===void 0:t.due!==void 0)&&X(t.createdAt)}const ve=t=>{const e={id:t.id,name:t.name,art:t.art,createdAt:t.createdAt};return t.sample&&(e.sample=t.sample),e},$e=t=>{const e={id:t.id,deckId:t.deckId,front:t.front,back:t.back,repetitions:t.repetitions,interval:t.interval,easeFactor:t.easeFactor,reviews:t.reviews,lapses:t.lapses,createdAt:t.createdAt};return t.due&&(e.due=t.due),t.introduced&&(e.introduced=t.introduced),t.lastReviewed&&(e.lastReviewed=t.lastReviewed),e};function ht(t){if(t===null)return null;let e;try{e=JSON.parse(t)}catch{return null}if(!e||typeof e!="object"||e.version!==2||!Array.isArray(e.decks)||!Array.isArray(e.cards))return null;const a=[],n=new Map;let s=0,o=0;for(const u of e.decks){if(!ge(u)||n.has(u.id)){o++;continue}if(a.length>=R){s++,n.set(u.id,"");continue}const $=Mt(u.id)&&!a.some(D=>D.id===u.id)?u.id:W("d");n.set(u.id,$),a.push(ve({...u,id:$}))}const l=[],i=new Set;for(const u of e.cards){const $=ye(u)?n.get(u.deckId):void 0;if($===""){s++;continue}if(!$){o++;continue}if(l.length>=S){s++;continue}if(i.has(u.id)){o++;continue}const D=Mt(u.id)?u.id:W("c");i.add(D),l.push($e({...u,id:D,deckId:$}))}const r=Array.isArray(e.days)?[...new Set(e.days.filter(_))].sort().slice(-800):[],d=Lt.includes(e.newPerDay)?e.newPerDay:it;return{data:{version:2,decks:a,cards:l,days:r,newPerDay:d},dropped:o,over:s}}function we(t,e){try{const a=JSON.parse(t??"null"),n=JSON.parse(e??"[]");if(!Array.isArray(a)||!Array.isArray(n))return null;const s=new Date().toISOString(),o=a.filter(r=>r&&E(r.id,1,60)&&typeof r.name=="string").map(r=>({id:r.id,name:ut(r.name),art:"own",createdAt:X(r.createdAt)?r.createdAt:s})),l=n.filter(r=>r&&E(r.id,1,60)&&E(r.deckId,1,60)&&typeof r.front=="string"&&typeof r.back=="string").map(r=>{const d=I(r.reviews,0,1e6)?r.reviews:0,u=d>0&&_(r.due)?r.due:void 0;return{id:r.id,deckId:r.deckId,front:String(r.front).trim().slice(0,k),back:String(r.back).trim().slice(0,k),repetitions:u&&I(r.repetitions,0,1e5)?r.repetitions:0,interval:u&&I(r.interval,0,pt)?r.interval:0,easeFactor:typeof r.easeFactor=="number"?Math.min(dt,Math.max(lt,r.easeFactor)):ct,reviews:u?d:0,lapses:0,due:u,lastReviewed:u&&_(r.lastReviewed)?r.lastReviewed:void 0,introduced:u&&_(r.lastReviewed)?r.lastReviewed:void 0,createdAt:X(r.createdAt)?r.createdAt:s}}),i=ht(JSON.stringify({version:2,decks:o,cards:l,days:[],newPerDay:it}));return i&&i.data.decks.length?i.data:null}catch{return null}}function ke(){try{const t=localStorage.getItem(Ot);if(t===null){const a=we(localStorage.getItem(fe),localStorage.getItem(he));return a?{data:a,note:"migrated"}:{data:Q(),note:""}}const e=ht(t);if(!e){try{localStorage.setItem(ue,t)}catch{}return{data:Q(),note:"broken"}}return{data:e.data,note:e.dropped||e.over?"dropped":""}}catch{return{data:Q(),note:""}}}function _t(t){try{return localStorage.setItem(Ot,JSON.stringify(t)),!0}catch{return!1}}function Me(t){return JSON.stringify({app:"flashcards",exportedAt:new Date().toISOString(),...t},null,1)}function Se(t){const e=a=>String(a).padStart(2,"0");return`anki-cards-${t.getFullYear()}${e(t.getMonth()+1)}${e(t.getDate())}.json`}function xe(t,e){const a=new Set(t.decks.map(d=>d.id)),n=new Set(t.cards.map(d=>d.id)),s=e.decks.filter(d=>!a.has(d.id)),o=s.slice(0,Math.max(0,R-t.decks.length)),l=new Set([...a,...o.map(d=>d.id)]),i=e.cards.filter(d=>!n.has(d.id)),r=i.filter(d=>l.has(d.deckId)).slice(0,Math.max(0,S-t.cards.length));return{data:{version:2,decks:[...t.decks,...o],cards:[...t.cards,...r],days:[...new Set([...t.days,...e.days])].sort().slice(-800),newPerDay:t.newPerDay},decks:o.length,cards:r.length,skipped:e.cards.length-i.length,over:s.length-o.length+(i.length-r.length)}}const Ae={"arrow-back-up":'<path d="M9 14l-4 -4l4 -4" /> <path d="M5 10h11a4 4 0 1 1 0 8h-1" />',"arrow-left":'<path d="M5 12l14 0" /> <path d="M5 12l6 6" /> <path d="M5 12l6 -6" />',cards:'<path d="M3.604 7.197l7.138 -3.109a.96 .96 0 0 1 1.27 .527l4.924 11.902a1 1 0 0 1 -.514 1.304l-7.137 3.109a.96 .96 0 0 1 -1.271 -.527l-4.924 -11.903a1 1 0 0 1 .514 -1.304l0 .001" /> <path d="M15 4h1a1 1 0 0 1 1 1v3.5" /> <path d="M20 6c.264 .112 .52 .217 .768 .315a1 1 0 0 1 .53 1.311l-2.298 5.374" />',check:'<path d="M5 12l5 5l10 -10" />',copy:'<path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" /> <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />',download:'<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /> <path d="M7 11l5 5l5 -5" /> <path d="M12 4l0 12" />',keyboard:'<path d="M2 8a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2l0 -8" /> <path d="M6 10l0 .01" /> <path d="M10 10l0 .01" /> <path d="M14 10l0 .01" /> <path d="M18 10l0 .01" /> <path d="M6 14l0 .01" /> <path d="M18 14l0 .01" /> <path d="M10 14l4 .01" />',pencil:'<path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /> <path d="M13.5 6.5l4 4" />',plus:'<path d="M12 5l0 14" /> <path d="M5 12l14 0" />',"rotate-2":'<path d="M15 4.55a8 8 0 0 0 -6 14.9m0 -4.45v5h-5" /> <path d="M18.37 7.16l0 .01" /> <path d="M13 19.94l0 .01" /> <path d="M16.84 18.37l0 .01" /> <path d="M19.37 15.1l0 .01" /> <path d="M19.94 11l0 .01" />',trash:'<path d="M4 7l16 0" /> <path d="M10 11l0 6" /> <path d="M14 11l0 6" /> <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /> <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />',upload:'<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /> <path d="M7 9l5 -5l5 5" /> <path d="M12 4l0 12" />',x:'<path d="M18 6l-12 12" /> <path d="M6 6l12 12" />'};function g(t){return`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${Ae[t]}</svg>`}const at=ke();let c=at.data,jt=_t(c),C=null,M=null,nt=0,Y=null,A="",J=!1;const Z=15;let m=null;const De=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches,O=()=>new Date;function h(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}const j=t=>h(t).replace(/\n/g,"<br />"),p=(t,e=document)=>e.querySelector(t),N=t=>c.decks.find(e=>e.id===t),q=t=>c.cards.filter(e=>e.deckId===t),st=(t,e="deck-art")=>`<img class="${e}" src="./art/deck-${t.art}.webp" alt="" width="80" height="80" />`;function w(){jt=_t(c)}const Le=p("#app");Le.innerHTML=`
  <a class="skip" href="#main">本文へ移動</a>
  <div id="notice" class="notice" role="status" hidden></div>
  <main id="main" tabindex="-1"></main>
  <footer class="foot">
    <p id="save-note" class="hint"></p>
    <p class="credit">カードは、このスマホ（ブラウザ）の中にだけ残ります。キャッシュと同じで、外には送りません。<br />
      <a href="../">ほかのアプリ</a></p>
  </footer>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <p class="sr-only" id="live" aria-live="polite"></p>
`;const f=p("#main");let St=0;function v(t,e=!1){const a=p("#toast");a.innerHTML=`<span>${h(t)}</span>${e?`<button type="button" class="toast-btn" data-act="undo">${g("arrow-back-up")}<span>元に戻す</span></button>`:""}`,a.classList.add("show"),clearTimeout(St),St=window.setTimeout(()=>{a.classList.remove("show"),a.innerHTML="",e&&(C=null)},e?8e3:3500)}function rt(t){const e=p("#live");e.textContent="",window.setTimeout(()=>e.textContent=t,30)}function K(t){C={data:structuredClone(c),label:t}}p("#toast").addEventListener("click",t=>{if(!t.target.closest('[data-act="undo"]')||!C)return;c=C.data;const a=C.label;C=null,w(),m=null,b(),v(`${a}を取り消しました。`)});function H(){const t=/^#\/(deck|study)\/([\w-]+)$/.exec(location.hash);return t&&N(t[2])?{view:t[1],id:t[2]}:{view:"home"}}function Yt(t){location.hash===t?b(!0):location.hash=t}window.addEventListener("hashchange",()=>b(!0));function b(t=!1){var a;const e=H();document.body.dataset.view=e.view,e.view!=="study"&&(m=null),t&&(J=!1,Y=null,A=""),e.view==="home"?Ee():e.view==="deck"?Ce(N(e.id)):Re(N(e.id)),Ie(),p("#save-note").textContent=jt?"":"この画面では保存できないため、閉じるとカードが消えます（めくることはできます）。",t&&(window.scrollTo(0,0),(a=p("[data-autofocus]",f)??p("h1",f))==null||a.focus({preventScroll:!0}))}function Ie(){f.querySelectorAll("[data-pct]").forEach(t=>t.style.setProperty("--pct",`${t.dataset.pct}%`))}const Ht=(t,e)=>e<=0?0:Math.round(t/e*100);function Ee(){const t=O(),e=c.decks.map(r=>({d:r,s:Ct(q(r.id),t,c.newPerDay)})),a=e.reduce((r,d)=>r+d.s.today,0),n=Nt(c.days,t),s=c.decks.length===0,o=s?'<p class="today-msg">まず単語帳を1冊入れましょう。<br />下の<b>見本</b>を入れると、すぐにためせます。</p>':a>0?`<p class="today-num"><span class="num">${a}</span><span>枚 めくります</span></p>
         <p class="hint">忘れかけたカードと、新しいカードです。</p>`:'<div class="today-done"><img src="./art/done-today.webp" alt="" width="64" height="64" /><p class="today-msg">今日の分は、ぜんぶ終わりました。<br />また明日。</p></div>',l=e.map(({d:r,s:d})=>`
      <li class="deck-tile">
        <a class="deck-link" href="#/deck/${h(r.id)}">
          <span class="hole" aria-hidden="true"></span>
          ${st(r)}
          <span class="deck-name">${h(r.name)}</span>
          <span class="deck-meta">全${d.total}枚・覚えた${d.mastered}枚</span>
          <span class="bar" data-pct="${Ht(d.mastered,d.total)}" aria-hidden="true"><span></span></span>
        </a>
        ${d.today>0?`<a class="btn primary tile-go" href="#/study/${h(r.id)}">${g("cards")}<span>めくる <b>${d.today}</b>枚</span></a>`:`<p class="tile-done">${d.total===0?"カードがありません":"今日はおわり"}</p>`}
      </li>`).join(""),i=`
    <section class="panel" aria-labelledby="h-samples">
      <h2 id="h-samples" class="hand">見本の単語帳</h2>
      <p class="hint">ためしに入れてみましょう。あとで消せます。</p>
      <ul class="sample-list">
        ${Ft.map(r=>{const d=c.decks.find(u=>u.sample===r.id);return`<li class="sample">
            ${st(r,"sample-art")}
            <span class="sample-text"><span class="sample-name">${h(r.name)}</span><span class="hint">${h(r.note)}・${r.cards.length}枚</span></span>
            ${d?`<a class="btn ghost" href="#/deck/${h(d.id)}">開く</a>`:`<button type="button" class="btn ${s?"primary":"ghost"}" data-sample="${h(r.id)}" aria-label="${h(r.name)}を入れる">${g("plus")}<span>入れる</span></button>`}
          </li>`}).join("")}
      </ul>
    </section>`;f.innerHTML=`
    <header class="top">
      <div class="top-text">
        <p class="brand hand">暗記カード</p>
        <h1 class="hand" tabindex="-1"><span class="nw">めくって覚える、</span><span class="nw">単語カード。</span></h1>
        <p class="lead">忘れかけたころに、もう一度出してくれます。</p>
      </div>
      <div class="ring-art" aria-hidden="true">
        <span class="ra-card ra-3"></span><span class="ra-card ra-2"></span>
        <span class="ra-card ra-1"><span class="ra-word">apple</span></span>
        <span class="ra-ring"></span>
      </div>
    </header>

    <div class="home-grid">
      <section class="panel today" aria-labelledby="h-today">
        <h2 id="h-today" class="hand">今日の分</h2>
        ${o}
        ${n>0?`<p class="streak"><img src="./art/streak.webp" alt="" width="40" height="40" /><span><b>${n}</b>日つづけています</span></p>`:""}
      </section>

      ${s?i:""}

      <section class="panel decks" aria-labelledby="h-decks">
        <h2 id="h-decks" class="hand">わたしの単語帳</h2>
        ${l?`<ul class="deck-grid">${l}</ul>`:'<p class="hint">まだありません。</p>'}
        <form class="new-deck" id="new-deck" novalidate>
          <label for="new-deck-name">新しい単語帳を作る</label>
          <div class="input-row">
            <input id="new-deck-name" name="name" type="text" maxlength="${U}" placeholder="例: 英検3級の単語" autocomplete="off" />
            <button type="submit" class="btn primary">${g("plus")}<span>作る</span></button>
          </div>
          <p class="msg" id="new-deck-msg" role="alert"></p>
        </form>
      </section>

      ${s?"":i}

      <section class="panel data" aria-labelledby="h-data">
        <h2 id="h-data" class="hand">データの書き出し・読み込み</h2>
        <p class="hint">機種変更のときや、念のための控えに。書き出したファイルを、別のスマホやパソコンで読み込めます。</p>
        <div class="btn-row">
          <button type="button" class="btn ghost" data-act="export" ${s?"disabled":""}>${g("download")}<span>書き出す</span></button>
          <button type="button" class="btn ghost" data-act="import">${g("upload")}<span>読み込む</span></button>
          <input type="file" id="import-file" accept=".json,application/json" hidden />
        </div>
        <div id="import-box">${Te()}</div>
        <div class="setting">
          <label for="new-per-day">新しいカードは1日に（1冊ごと）</label>
          <select id="new-per-day">${Lt.map(r=>`<option value="${r}" ${r===c.newPerDay?"selected":""}>${r}枚まで</option>`).join("")}</select>
        </div>
      </section>
    </div>
  `}function Te(){if(!M)return"";const t=M;return`<div class="import-confirm" role="group" aria-labelledby="import-msg">
    <p id="import-msg">単語帳 <b>${t.decks.length}</b>冊・カード <b>${t.cards.length}</b>枚が入っています。どうしますか？</p>
    ${nt?`<p class="msg">${h(Gt(nt))}</p>`:""}
    <div class="btn-row">
      <button type="button" class="btn primary" data-act="import-add" data-autofocus>今のデータに足す</button>
      <button type="button" class="btn ghost" data-act="import-replace">今のデータと入れかえる</button>
      <button type="button" class="btn ghost" data-act="import-cancel">やめる</button>
    </div>
  </div>`}function Ce(t){const e=O(),a=q(t.id),n=Ct(a,e,c.newPerDay),s=a.filter(i=>!T(i)).map(i=>i.due).filter(i=>i>x(e)).sort()[0],o=s?a.filter(i=>i.due===s).length:0,l=n.total===0?'<p class="today-msg">まだカードがありません。<br />下の「まとめて入れる」に貼り付けてください。</p>':n.today>0?`<a class="btn primary big" href="#/study/${h(t.id)}">${g("cards")}<span>めくる（${n.today}枚）</span></a>
         <p class="hint">復習 ${n.due}枚・新しいカード ${n.today-n.due}枚</p>`:`<div class="today-done"><img src="./art/done-today.webp" alt="" width="64" height="64" /><p class="today-msg">今日の分は終わりました。${s?`<br />次は${h(Bt(s,e))} ${o}枚です。`:""}</p></div>`;f.innerHTML=`
    <nav class="crumb"><a class="back" href="#/">${g("arrow-left")}<span>単語帳の一覧</span></a></nav>
    <header class="deck-head">
      ${st(t,"deck-head-art")}
      <div>
        <h1 tabindex="-1">${h(t.name)}</h1>
        <p class="hint">全${n.total}枚・覚えた${n.mastered}枚（3回つづけて「わかった」）</p>
      </div>
    </header>
    <section class="panel deck-go" aria-label="今日の分">${l}</section>

    <div class="deck-cols">
      <div class="col">
        <section class="panel" aria-labelledby="h-paste">
          <h2 id="h-paste" class="hand">まとめて入れる</h2>
          <p class="hint">1行に「表」と「裏」を、<b>タブ</b>か<b>カンマ</b>で区切って書きます。区切らずに<b>2行で1枚</b>（表・裏の順）でも作れます。エクセルやメモから、そのまま貼り付けできます。</p>
          <div class="example" aria-label="書き方の例"><span>apple,りんご</span><span>library,図書館</span><span>北海道</span><span>札幌市</span></div>
          <label for="paste">ここに貼り付け</label>
          <textarea id="paste" rows="6" spellcheck="false" placeholder="apple,りんご">${h(A)}</textarea>
          <div id="paste-preview" class="paste-preview">${Kt(t)}</div>
        </section>

        <section class="panel" aria-labelledby="h-one">
          <h2 id="h-one" class="hand">1枚ずつ入れる</h2>
          <form id="one-form" class="one-form" novalidate>
            <label for="one-front">表（問題）</label>
            <textarea id="one-front" rows="2" maxlength="${k}" placeholder="例: borrow"></textarea>
            <label for="one-back">裏（答え）</label>
            <textarea id="one-back" rows="2" maxlength="${k}" placeholder="例: 借りる"></textarea>
            <p class="msg" id="one-msg" role="alert"></p>
            <button type="submit" class="btn primary">${g("plus")}<span>1枚入れる</span></button>
          </form>
        </section>
      </div>

      <div class="col">
        <section class="panel" aria-labelledby="h-list">
          <h2 id="h-list" class="hand">カード</h2>
          <p class="hint">${n.total}枚</p>
          ${a.length?`<ul class="card-list">${(J?a:a.slice(0,Z)).map(i=>Ne(i,e)).join("")}</ul>`:'<p class="hint">まだありません。</p>'}
          ${!J&&a.length>Z?`<button type="button" class="btn ghost more-btn" data-act="show-all">のこり ${a.length-Z}枚も見る</button>`:""}
        </section>

        <section class="panel" aria-labelledby="h-deck-set">
          <h2 id="h-deck-set" class="hand">この単語帳</h2>
          <form id="rename-form" class="new-deck" novalidate>
            <label for="rename">名前</label>
            <div class="input-row">
              <input id="rename" type="text" maxlength="${U}" value="${h(t.name)}" autocomplete="off" />
              <button type="submit" class="btn ghost">${g("check")}<span>変える</span></button>
            </div>
          </form>
          <div class="btn-row">
            <button type="button" class="btn ghost" data-act="copy-tsv" ${a.length?"":"disabled"}>${g("copy")}<span>文字でコピー</span></button>
            <button type="button" class="btn ghost danger" data-act="delete-deck">${g("trash")}<span>この単語帳を消す</span></button>
          </div>
          <p class="hint">「文字でコピー」した文字は、「まとめて入れる」にそのまま貼り付けられます。</p>
        </section>
      </div>
    </div>
  `}function Bt(t,e){const a=Vt(x(e),t);return a===1?"あした":a===2?"あさって":`${a}日後`}function Ne(t,e){if(Y===t.id)return`<li class="card-row editing" data-id="${h(t.id)}">
      <form class="edit-form" data-id="${h(t.id)}" novalidate>
        <label for="edit-front">表</label>
        <textarea id="edit-front" rows="2" maxlength="${k}" data-autofocus>${h(t.front)}</textarea>
        <label for="edit-back">裏</label>
        <textarea id="edit-back" rows="2" maxlength="${k}">${h(t.back)}</textarea>
        <p class="msg" id="edit-msg" role="alert"></p>
        <div class="btn-row">
          <button type="submit" class="btn primary">${g("check")}<span>保存</span></button>
          <button type="button" class="btn ghost" data-act="edit-cancel">やめる</button>
        </div>
      </form>
    </li>`;const a=T(t)?"まだ":t.due<=x(e)?"今日":`次は${Bt(t.due,e)}`;return`<li class="card-row" data-id="${h(t.id)}">
    <span class="mini-card"><span class="mc-front">${j(t.front)}</span><span class="mc-back">${j(t.back)}</span></span>
    <span class="row-side">
      <span class="tag ${T(t)?"tag-new":""}">${h(a)}</span>
      <span class="row-btns">
        <button type="button" class="icon-btn" data-act="edit" aria-label="「${h(t.front.slice(0,20))}」を直す">${g("pencil")}</button>
        <button type="button" class="icon-btn danger" data-act="delete-card" aria-label="「${h(t.front.slice(0,20))}」を消す">${g("trash")}</button>
      </span>
    </span>
  </li>`}const qe={"no-back":"裏がありません",empty:"表か裏が空です","too-long":`${k}文字までです`};function Kt(t){if(!A.trim())return'<p class="hint">貼り付けると、ここに何枚できるか出ます。</p>';const{pairs:e,problems:a}=qt(A),{fresh:n,skipped:s}=Rt(e,q(t.id)),o=S-c.cards.length,l=Math.min(n.length,o);return`
    <p class="paste-count" aria-live="polite"><b>${l}</b>枚 作れます${s?`（同じカード ${s}枚は、とばします）`:""}</p>
    ${n.length?`<ul class="paste-sample">${n.slice(0,3).map(i=>`<li><span>${h(i.front)}</span><span aria-hidden="true">→</span><span class="sr-only">、裏は</span><span>${h(i.back)}</span></li>`).join("")}${n.length>3?`<li class="more">ほか ${n.length-3}枚</li>`:""}</ul>`:""}
    ${a.length?`<div class="problems"><p><b>${a.length}行</b>は入れられません</p><ul>${a.slice(0,5).map(i=>`<li>${i.line}行目「${h(i.text.slice(0,24))}」: ${qe[i.reason]}</li>`).join("")}</ul></div>`:""}
    ${n.length>o?`<p class="msg">カードは全部で ${S.toLocaleString()}枚までです。</p>`:""}
    <div class="btn-row">
      <button type="button" class="btn primary" data-act="paste-add" ${l?"":"disabled"}>${g("plus")}<span>${l}枚を入れる</span></button>
      <button type="button" class="btn ghost" data-act="paste-clear">消す</button>
    </div>`}function xt(t){const e=[...t].length;return e<=8?"t-l":e<=24?"t-m":"t-s"}function Re(t){if(!m||m.deckId!==t.id){const o=re(q(t.id),O(),c.newPerDay);m={deckId:t.id,session:oe(o.map(l=>l.id)),flipped:!1,busy:!1,last:null}}const e=m;for(;e.session.queue.length&&!c.cards.some(o=>o.id===e.session.queue[0]);)e.session.queue.shift();if(e.session.queue.length===0){f.innerHTML=e.session.done>0?Fe(t,e.session):Oe(t);return}const a=c.cards.find(o=>o.id===e.session.queue[0]),n=e.session.queue.length,s=T(a);f.innerHTML=`
    <div class="study">
      <div class="study-top">
        <a class="back" href="#/deck/${h(t.id)}">${g("x")}<span>やめる</span></a>
        <p class="study-deck">${h(t.name)}</p>
        ${e.last?`<button type="button" class="btn ghost small-btn" data-act="study-undo">${g("arrow-back-up")}<span>ひとつ戻す</span></button>`:'<span class="spacer"></span>'}
      </div>
      <h1 class="sr-only" tabindex="-1">めくる: ${h(t.name)}</h1>
      <p class="left">のこり <b>${n}</b>枚</p>
      <div class="bar study-bar" data-pct="${Ht(e.session.done,e.session.done+n)}" aria-hidden="true"><span></span></div>

      <div class="stack ${n>1?"has-more":""}">
        <div class="flash ${e.flipped?"flipped":""}" id="flash" data-act="flip">
          <div class="flash-inner">
            <div class="face face-front" ${e.flipped?'aria-hidden="true" inert':""}>
              <span class="hole" aria-hidden="true"></span>
              <span class="face-tag">${s?"新しい":"復習"}</span>
              <p class="face-text ${xt(a.front)}"><span class="sr-only">表: </span>${j(a.front)}</p>
            </div>
            <div class="face face-back" ${e.flipped?"":'aria-hidden="true" inert'}>
              <span class="hole" aria-hidden="true"></span>
              <p class="face-q">${j(a.front)}</p>
              <p class="face-text ${xt(a.back)}" id="answer" tabindex="-1"><span class="sr-only">答え: </span>${j(a.back)}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="study-actions" id="study-actions">${Wt(a,e.flipped)}</div>
    </div>
  `}function Wt(t,e){return`${e?`<p class="ask">思い出せましたか？</p>
       <div class="grades">${ot.map((n,s)=>{const o=It(t,n);return`<button type="button" class="grade g-${n}" data-grade="${n}" aria-keyshortcuts="${s+1}">
           <span class="g-label">${Dt[n]}</span>
           <span class="g-when">${n==="again"?"もう一度":`次は${se(o)}`}</span>
         </button>`}).join("")}</div>`:`<button type="button" class="btn primary big flip-btn" data-act="flip" id="flip-btn" aria-keyshortcuts="Space">${g("rotate-2")}<span>めくって答えを見る</span></button>`}<p class="keys">${g("keyboard")}<span>スペースでめくる・1〜4で答える</span></p>`}function Fe(t,e){const a=Nt(c.days,O());return`
    <div class="done">
      <img class="stamp" src="./art/reward.webp" alt="大変よくできました" width="200" height="200" />
      <h1 class="hand" tabindex="-1"><span class="nw">今日の分、</span><span class="nw">おわり！</span></h1>
      <p class="done-sub">${e.done}回めくりました。</p>
      <ul class="tally">${ot.map(n=>`<li class="t-${n}"><span>${Dt[n]}</span><b>${e.counts[n]}</b></li>`).join("")}</ul>
      ${a>0?`<p class="streak"><img src="./art/streak.webp" alt="" width="40" height="40" /><span><b>${a}</b>日つづけています</span></p>`:""}
      <div class="btn-row center">
        <a class="btn primary" href="#/" data-autofocus>単語帳の一覧へ</a>
        <a class="btn ghost" href="#/deck/${h(t.id)}">この単語帳を見る</a>
      </div>
    </div>`}function Oe(t){return`
    <div class="done">
      <img src="./art/done-today.webp" alt="" width="96" height="96" />
      <h1 class="hand" tabindex="-1"><span class="nw">今日めくるカードは</span><span class="nw">ありません</span></h1>
      <p class="done-sub">また明日、忘れかけたころに出します。</p>
      <div class="btn-row center">
        <a class="btn primary" href="#/deck/${h(t.id)}" data-autofocus>この単語帳を見る</a>
        <a class="btn ghost" href="#/">単語帳の一覧へ</a>
      </div>
    </div>`}function Xt(){var s,o;if(!m||m.busy||!m.session.queue.length)return;m.flipped=!m.flipped;const t=p("#flash",f),e=c.cards.find(l=>l.id===m.session.queue[0]);if(!t||!e)return b();t.classList.toggle("flipped",m.flipped);const[a,n]=[p(".face-front",t),p(".face-back",t)];for(const[l,i]of[[a,m.flipped],[n,!m.flipped]])l.toggleAttribute("inert",i),i?l.setAttribute("aria-hidden","true"):l.removeAttribute("aria-hidden");p("#study-actions",f).innerHTML=Wt(e,m.flipped),m.flipped?(s=p("#answer",f))==null||s.focus({preventScroll:!0}):(o=p("#flip-btn",f))==null||o.focus({preventScroll:!0})}function Jt(t){const e=m;if(!e||e.busy||!e.flipped)return;const a=c.cards.find(i=>i.id===e.session.queue[0]);if(!a)return;e.busy=!0;const n=O();e.last={card:a,session:e.session,days:c.days};const s=ne(a,t,n);c={...c,cards:c.cards.map(i=>i.id===a.id?s:i),days:ce(c.days,n)},w(),e.session=ie(e.session,t);const o=()=>{var i,r,d;e.flipped=!1,e.busy=!1,b(),e.session.queue.length?((i=p(".flash",f))==null||i.classList.add("enter"),(r=p("#flip-btn",f))==null||r.focus({preventScroll:!0}),rt(t==="again"?"もう一度、少しあとで出します。":`次のカード。のこり${e.session.queue.length}枚。`)):((d=p("[data-autofocus]",f))==null||d.focus({preventScroll:!0}),rt("今日の分、おわりです。"))},l=p("#flash",f);l&&!De()?(l.classList.add(t==="again"?"leave-back":"leave-up"),window.setTimeout(o,320)):o()}function Pe(){var s;const t=m;if(!(t!=null&&t.last)||t.busy)return;const{card:e,session:a,days:n}=t.last;c={...c,cards:c.cards.map(o=>o.id===e.id?e:o),days:n},w(),t.session=a,t.last=null,t.flipped=!0,b(),(s=p("#answer",f))==null||s.focus({preventScroll:!0}),rt("ひとつ前のカードに戻しました。")}const Ut=`単語帳は ${R}冊までです。使わない単語帳を消してから作ってください。`,Gt=t=>t>0?`上限（単語帳 ${R}冊・カード ${S.toLocaleString()}枚）をこえる ${t}件は入りません。`:"";function _e(t){var n;const e=Ft.find(s=>s.id===t);if(!e)return;if(c.decks.length>=R)return v(Ut);if(c.cards.length+e.cards.length>S)return v(`カードは全部で ${S.toLocaleString()}枚までです。`);const a=Pt(e.name,e.art,e.id);c={...c,decks:[...c.decks,a],cards:[...c.cards,...e.cards.map((s,o)=>ft(a.id,s,o))]},w(),b(),v(`「${e.name}」を入れました。`),(n=f.querySelector(`a[href="#/study/${CSS.escape(a.id)}"]`))==null||n.focus()}function je(t,e){const a=URL.createObjectURL(new Blob([e],{type:"application/json"})),n=document.createElement("a");n.href=a,n.download=t,document.body.append(n),n.click(),n.remove(),window.setTimeout(()=>URL.revokeObjectURL(a),1e3)}async function Ye(t){try{return await navigator.clipboard.writeText(t),!0}catch{return!1}}f.addEventListener("click",async t=>{var u,$,D,mt,bt,gt,yt,vt;const e=t.target,a=e.closest("[data-sample]");if(a)return _e(a.dataset.sample);const n=e.closest("[data-grade]");if(n)return Jt(n.dataset.grade);const s=e.closest("[data-act]");if(!s)return;const o=s.dataset.act,l=H(),i=l.view!=="home"?N(l.id):void 0;if(o==="flip")return Xt();if(o==="show-all"){J=!0;const y=f.querySelectorAll(".card-row").length;return b(),(u=f.querySelectorAll(".card-row [data-act='edit']")[y])==null?void 0:u.focus()}if(o==="study-undo")return Pe();if(o==="export")return je(Se(O()),Me(c)),v(`カード ${c.cards.length}枚を書き出しました。`);if(o==="import")return($=p("#import-file"))==null?void 0:$.click();if(o==="import-cancel")return M=null,b(),(D=p('[data-act="import"]',f))==null?void 0:D.focus();if(o==="import-add"&&M){K("読み込み");const y=xe(c,M);return c=y.data,M=null,w(),b(),v(`単語帳 ${y.decks}冊・カード ${y.cards}枚を足しました。${y.skipped?`（同じもの ${y.skipped}枚は、とばしました）`:""}${Gt(y.over)}`,!0)}if(o==="import-replace"&&M)return K("入れかえ"),c={...M,newPerDay:c.newPerDay},M=null,w(),b(),v("読み込んだデータと入れかえました。",!0);if(!i)return;if(o==="paste-add"){const{pairs:y}=qt(A),{fresh:$t}=Rt(y,q(i.id)),P=$t.slice(0,S-c.cards.length);return P.length?(c={...c,cards:[...c.cards,...P.map((B,L)=>ft(i.id,B,L))]},A="",w(),b(),v(`${P.length}枚を入れました。`),(mt=p("#paste",f))==null?void 0:mt.focus()):void 0}if(o==="paste-clear")return A="",b(),(bt=p("#paste",f))==null?void 0:bt.focus();if(o==="copy-tsv"){const y=await Ye(pe(q(i.id)));return v(y?"表と裏を、文字でコピーしました。":"コピーできませんでした。")}if(o==="delete-deck")return K(`「${i.name}」を消したの`),c={...c,decks:c.decks.filter(y=>y.id!==i.id),cards:c.cards.filter(y=>y.deckId!==i.id)},w(),Yt("#/"),v(`「${i.name}」を消しました。`,!0);const r=s.closest(".card-row"),d=r==null?void 0:r.dataset.id;if(o==="edit"&&d)return Y=d,b(),(gt=p("#edit-front",f))==null?void 0:gt.focus();if(o==="edit-cancel")return Y=null,b(),(yt=p(`.card-row[data-id="${CSS.escape(d??"")}"] [data-act="edit"]`,f))==null?void 0:yt.focus();if(o==="delete-card"&&d){const y=c.cards.find(L=>L.id===d);K("カードを消したの");const P=[...f.querySelectorAll(".card-row")].findIndex(L=>L.dataset.id===d);c={...c,cards:c.cards.filter(L=>L.id!==d)},w(),b();const B=f.querySelectorAll(".card-row [data-act='delete-card']");return(vt=B[Math.min(P,B.length-1)]??p("h1",f))==null||vt.focus(),v(`「${y.front.slice(0,16)}」を消しました。`,!0)}});f.addEventListener("input",t=>{const e=t.target;if(e.id==="paste"){A=e.value;const a=H();a.view==="deck"&&(p("#paste-preview",f).innerHTML=Kt(N(a.id)))}});f.addEventListener("change",async t=>{var a,n,s;const e=t.target;if(e.id==="new-per-day")return c={...c,newPerDay:Number(e.value)},w(),b(),(a=p("#new-per-day",f))==null||a.focus(),v(`新しいカードは1日 ${c.newPerDay}枚までにしました。`);if(e.id==="import-file"){const o=e,l=(n=o.files)==null?void 0:n[0];if(o.value="",!l)return;if(l.size>20*1024*1024)return v("ファイルが大きすぎます。");const i=ht(await l.text());if(!i||!i.data.decks.length&&!i.data.cards.length)return v("このファイルは読み込めません。このアプリで書き出したファイルを選んでください。");M=i.data,nt=i.over,b(),(s=p('[data-act="import-add"]',f))==null||s.focus()}});f.addEventListener("submit",t=>{var s,o,l,i;t.preventDefault();const e=t.target,a=H();if(e.id==="new-deck"){const r=p("#new-deck-name",e);if(c.decks.length>=R)return p("#new-deck-msg",e).textContent=Ut,r.focus();const d=Pt(r.value);c={...c,decks:[...c.decks,d]},w(),Yt(`#/deck/${d.id}`),v(`「${d.name}」を作りました。カードを入れましょう。`);return}const n=a.view==="deck"?N(a.id):void 0;if(n){if(e.id==="rename-form"){const r=ut(p("#rename",e).value);return c={...c,decks:c.decks.map(d=>d.id===n.id?{...d,name:r}:d)},w(),b(),(s=p("#rename",f))==null||s.focus(),v("名前を変えました。")}if(e.id==="one-form"){const r=p("#one-front",e).value.trim(),d=p("#one-back",e).value.trim(),u=p("#one-msg",e);if(!r||!d)return u.textContent=r?"裏を入れてください。":"表を入れてください。",(o=p(r?"#one-back":"#one-front",e))==null?void 0:o.focus();if(c.cards.length>=S){u.textContent=`カードは全部で ${S.toLocaleString()}枚までです。`;return}return c={...c,cards:[...c.cards,ft(n.id,{front:r,back:d})]},w(),b(),(l=p("#one-front",f))==null||l.focus(),v(`「${r.slice(0,16)}」を入れました。`)}if(e.classList.contains("edit-form")){const r=e.dataset.id,d=p("#edit-front",e).value.trim(),u=p("#edit-back",e).value.trim();if(!d||!u){p("#edit-msg",e).textContent="表と裏の両方を入れてください。";return}return c={...c,cards:c.cards.map($=>$.id===r?{...$,front:d,back:u}:$)},Y=null,w(),b(),(i=p(`.card-row[data-id="${CSS.escape(r)}"] [data-act="edit"]`,f))==null||i.focus(),v("カードを直しました。")}}});document.addEventListener("keydown",t=>{if(H().view!=="study"||!m||t.altKey||t.ctrlKey||t.metaKey)return;const e=t.target;if(e.closest("input, textarea, select"))return;const a=!!e.closest("button, a");if((t.key===" "||t.key==="Enter")&&!a){t.preventDefault(),m.flipped||Xt();return}const n=Number(t.key);m.flipped&&n>=1&&n<=4&&(t.preventDefault(),Jt(ot[n-1]))});b();const At=p("#notice"),He={broken:"保存されていた内容を読めなかったため、空の状態で始めました。",migrated:"前の版の単語帳を引き継ぎました。",dropped:"読めないカードがあったため、一部をとばしました。"};at.note&&(At.textContent=He[at.note],At.hidden=!1);"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").then(()=>navigator.serviceWorker.ready).then(t=>{var a;const e=[location.href.split("#")[0],...performance.getEntriesByType("resource").map(n=>n.name).filter(n=>n.startsWith(location.origin)),...["reward","streak","done-today","deck-own","deck-english","deck-japan","deck-element"].map(n=>new URL(`./art/${n}.webp`,location.href).href)];(a=t.active)==null||a.postMessage({type:"precache",urls:e})}).catch(()=>{})});
