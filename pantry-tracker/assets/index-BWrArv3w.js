(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function a(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=a(s);fetch(s.href,r)}})();const _=["fridge","freezer","shelf"],I={fridge:"冷蔵庫",freezer:"冷凍庫",shelf:"棚"},Z=["milk","egg","chicken","bacon","meat","fish","cheese","butter","greens","tomato","cucumber","carrot","broccoli","mushroom","eggplant","apple","strawberry","lemon","juice","rice","shrimp","icecream","noodle","bread","onion","potato","banana","can","onigiri","bento","tea","plate"],Y=t=>typeof t=="string"&&Z.includes(t),N=[{name:"牛乳",art:"milk",place:"fridge",days:7,words:["ミルク","ぎゅうにゅう","豆乳"]},{name:"卵",art:"egg",place:"fridge",days:14,words:["たまご","玉子","タマゴ"]},{name:"鶏肉",art:"chicken",place:"fridge",days:2,words:["とり","鳥","チキン","ささみ","むね肉","もも肉"]},{name:"豚肉",art:"bacon",place:"fridge",days:3,words:["ぶた","ベーコン","ハム","ひき肉"]},{name:"牛肉",art:"meat",place:"fridge",days:3,words:["ぎゅう","肉","ステーキ"]},{name:"魚",art:"fish",place:"fridge",days:2,words:["さかな","鮭","さけ","さば","刺身","あじ"]},{name:"キャベツ",art:"greens",place:"fridge",days:7,words:["レタス","白菜","はくさい","ほうれん草","小松菜","ねぎ","野菜"]},{name:"トマト",art:"tomato",place:"fridge",days:5,words:["ミニトマト"]},{name:"にんじん",art:"carrot",place:"fridge",days:14,words:["人参","ニンジン","大根","だいこん"]},{name:"きゅうり",art:"cucumber",place:"fridge",days:5,words:["キュウリ","胡瓜","ピーマン"]},{name:"ブロッコリー",art:"broccoli",place:"fridge",days:4},{name:"きのこ",art:"mushroom",place:"fridge",days:5,words:["しめじ","えのき","しいたけ","まいたけ","キノコ"]},{name:"なす",art:"eggplant",place:"fridge",days:5,words:["ナス","茄子"]},{name:"チーズ",art:"cheese",place:"fridge",days:30},{name:"バター",art:"butter",place:"fridge",days:60,words:["マーガリン"]},{name:"豆腐・納豆",art:"bento",place:"fridge",days:5,words:["豆腐","とうふ","納豆","なっとう","ヨーグルト"]},{name:"作りおき",art:"bento",place:"fridge",days:3,words:["残り物","おかず","お弁当","弁当"]},{name:"りんご",art:"apple",place:"fridge",days:21,words:["リンゴ","林檎","果物"]},{name:"いちご",art:"strawberry",place:"fridge",days:3,words:["イチゴ","苺"]},{name:"レモン",art:"lemon",place:"fridge",days:14,words:["みかん","オレンジ"]},{name:"ジュース",art:"juice",place:"fridge",days:7,words:["飲み物","麦茶"]},{name:"ごはん",art:"rice",place:"freezer",days:30,words:["ご飯","冷凍ごはん","米","お米"]},{name:"えび",art:"shrimp",place:"freezer",days:60,words:["エビ","海老","シーフード"]},{name:"冷凍めん",art:"noodle",place:"freezer",days:60,words:["うどん","そば","ラーメン","麺","パスタ"]},{name:"アイス",art:"icecream",place:"freezer",days:null,words:["アイスクリーム"]},{name:"パン",art:"bread",place:"shelf",days:4,words:["食パン","ロールパン"]},{name:"たまねぎ",art:"onion",place:"shelf",days:30,words:["玉ねぎ","タマネギ","玉葱"]},{name:"じゃがいも",art:"potato",place:"shelf",days:30,words:["ジャガイモ","さつまいも","いも"]},{name:"バナナ",art:"banana",place:"shelf",days:4},{name:"おにぎり",art:"onigiri",place:"shelf",days:1},{name:"缶詰",art:"can",place:"shelf",days:365,words:["缶","ツナ","レトルト"]},{name:"お茶",art:"tea",place:"shelf",days:180,words:["茶","コーヒー","紅茶"]}],dt=["牛乳","卵","パン","鶏肉","豚肉","魚","キャベツ","トマト","たまねぎ","豆腐・納豆","ごはん","バナナ"],It={milk:"牛乳",egg:"卵",chicken:"鶏肉",bacon:"豚肉",meat:"牛肉",fish:"魚",cheese:"チーズ",butter:"バター",greens:"葉もの野菜",tomato:"トマト",cucumber:"きゅうり",carrot:"にんじん",broccoli:"ブロッコリー",mushroom:"きのこ",eggplant:"なす",apple:"りんご",strawberry:"いちご",lemon:"レモン",juice:"飲み物",rice:"ごはん",shrimp:"えび",icecream:"アイス",noodle:"めん",bread:"パン",onion:"たまねぎ",potato:"いも",banana:"バナナ",can:"缶詰",onigiri:"おにぎり",bento:"おかず",tea:"お茶",plate:"その他"};function mt(t){const e=t.trim();if(!e)return null;const a=N.find(r=>{var o;return r.name===e||((o=r.words)==null?void 0:o.includes(e))});if(a)return a;let n=null,s=0;for(const r of N)for(const o of[r.name,...r.words??[]])o.length>s&&e.includes(o)&&(n=r,s=o.length);return n}const At=/^(\d{4})-(\d{2})-(\d{2})$/,Ct=t=>t%4===0&&t%100!==0||t%400===0;function ft(t,e){return[31,Ct(t)?29:28,31,30,31,30,31,31,30,31,30,31][e-1]}function F(t){if(typeof t!="string")return null;const e=At.exec(t);if(!e)return null;const a=Number(e[1]),n=Number(e[2]),s=Number(e[3]);return a<2e3||a>2199||n<1||n>12||s<1||s>ft(a,n)?null:{y:a,m:n,d:s}}const E=t=>F(t)!==null,X=(t,e=2)=>String(t).padStart(e,"0"),G=(t,e,a)=>`${X(t,4)}-${X(e)}-${X(a)}`;function T(t){const e=F(t);if(!e)throw new RangeError(`日付ではありません: ${t}`);return Date.UTC(e.y,e.m-1,e.d)/864e5}function Ot(t){const e=new Date(t*864e5);return G(e.getUTCFullYear(),e.getUTCMonth()+1,e.getUTCDate())}const z=(t,e)=>Ot(T(t)+e);function Nt(t,e){const a=F(t);if(!a)throw new RangeError(`日付ではありません: ${t}`);const n=a.y*12+(a.m-1)+e,s=Math.floor(n/12),r=n%12+1;return G(s,r,Math.min(a.d,ft(s,r)))}const jt=(t,e)=>T(e)-T(t);function ht(t,e){return G(t.getFullYear(),t.getMonth()+1,t.getDate())}function B(t){const e=F(t);if(!e)return"";const a="日月火水木金土"[new Date(Date.UTC(e.y,e.m-1,e.d)).getUTCDay()];return`${e.m}/${e.d}（${a}）`}const P=20,W=99,tt=300,yt=2e3,S=()=>({items:[],log:[],freq:{}}),j=(t,e)=>t===null?null:jt(e,t);function D(t){return t===null?"none":t<0?"expired":t===0?"today":t<=2?"soon":t<=6?"week":"ok"}function Dt(t){return t===null?"期限なし":t<0?`${-t}日すぎ`:t===0?"今日まで":t===1?"明日まで":`あと${t}日`}const Rt=t=>t==="expired"||t==="today"||t==="soon";function gt(t){const e=a=>a.expiry===null?Number.POSITIVE_INFINITY:T(a.expiry);return[...t].sort((a,n)=>e(a)-e(n)||(a.addedOn<n.addedOn?-1:a.addedOn>n.addedOn?1:0)||(a.id<n.id?-1:1))}function _t(t){const e={fridge:[],freezer:[],shelf:[]};for(const a of gt(t))e[a.place].push(a);return e}function Pt(t,e){const a={expired:0,today:0,soon:0,total:t.length};for(const n of t){const s=D(j(n.expiry,e));s==="expired"?a.expired++:s==="today"?a.today++:s==="soon"&&a.soon++}return a}const Q=t=>Math.min(W,Math.max(1,Math.round(Number.isFinite(t)?t:1))),bt=t=>t.replace(/\s+/g," ").trim().slice(0,P),vt=(t,e)=>e===null?null:z(t,e);function et(t,e,a,n){const s=bt(e.name);if(!s||t.items.length>=tt)return t;const r={id:a,name:s,art:e.art,place:_.includes(e.place)?e.place:"fridge",qty:Q(e.qty),expiry:e.expiry,addedOn:n};return{...t,items:[...t.items,r]}}function Ht(t,e){return{...t,freq:{...t.freq,[e]:Math.min(9999,(t.freq[e]??0)+1)}}}function Ut(t,e,a){return{...t,items:t.items.map(n=>{if(n.id!==e)return n;const s=a.name===void 0?n.name:bt(a.name)||n.name;return{...n,...a,name:s,qty:a.qty===void 0?n.qty:Q(a.qty)}})}}function zt(t,e,a,n,s,r=!1){const o=t.items.find(f=>f.id===e);if(!o)return t;const u=r?o.qty:1,y={id:s,name:o.name,art:o.art,outcome:a,qty:u,date:n},H=o.qty-u<=0?t.items.filter(f=>f.id!==e):t.items.map(f=>f.id===e?{...f,qty:f.qty-u}:f),K=[...t.log,y].slice(-yt);return{...t,items:H,log:K}}const Yt=(t,e)=>({...t,items:t.items.filter(a=>a.id!==e)});function Ft(t,e,a=30){const n=T(e),s=n-(a-1),r=new Map;let o=0,u=0;for(const p of t){const x=T(p.date);if(x<s||x>n)continue;const ct=r.get(p.name)??{name:p.name,art:p.art,used:0,wasted:0};ct[p.outcome]+=p.qty,r.set(p.name,ct),p.outcome==="used"?o+=p.qty:u+=p.qty}const H=[...r.values()].filter(p=>p.wasted>0).sort((p,x)=>x.wasted-p.wasted||p.used-x.used||(p.name<x.name?-1:1)).slice(0,5),K=H.filter(p=>p.wasted>=2&&p.wasted>=p.used),f=o+u;return{days:a,used:o,wasted:u,wasteRate:f===0?null:Math.round(u/f*100),topWasted:H,overbuy:K}}const $t="pantry-tracker.v2",Bt="pantry-tracker.items",Wt="pantry-tracker.llm",wt="pantry-tracker";let Qt=0;const w=(t="i")=>`${t}${Date.now().toString(36)}${(Qt++).toString(36)}${Math.random().toString(36).slice(2,6)}`,at=(t,e,a)=>typeof t=="number"&&Number.isInteger(t)&&t>=e&&t<=a,Jt=/^[A-Za-z0-9_-]{1,64}$/,Kt=t=>typeof t=="string"&&Jt.test(t);function ut(t,e){const a=new Set;return t.map(n=>{let s=Kt(n.id)&&!a.has(n.id)?n.id:w(e);for(;a.has(s);)s=w(e);return a.add(s),{...n,id:s}})}const Mt=t=>typeof t=="string"&&t.trim().length>0&&t.length<=P;function Xt(t){return t&&typeof t=="object"&&Mt(t.name)&&Y(t.art)&&_.includes(t.place)&&at(t.qty,1,W)&&(t.expiry===null||E(t.expiry))&&E(t.addedOn)}function Vt(t){return t&&typeof t=="object"&&Mt(t.name)&&Y(t.art)&&(t.outcome==="used"||t.outcome==="wasted")&&at(t.qty,1,W)&&E(t.date)}function Zt(t){if(!t||typeof t!="object"||Array.isArray(t))return!1;const e=Object.entries(t);return e.length<=200&&e.every(([a,n])=>a.length<=P&&at(n,0,9999))}function qt(t){const e=t;return!e||typeof e!="object"||!Array.isArray(e.items)||e.items.length>tt||!e.items.every(Xt)||!Array.isArray(e.log)||e.log.length>yt||!e.log.every(Vt)||!Zt(e.freq)?null:{items:ut(e.items,"i").map(a=>({id:a.id,name:a.name,art:a.art,place:a.place,qty:a.qty,expiry:a.expiry,addedOn:a.addedOn})),log:ut(e.log,"l").map(a=>({id:a.id,name:a.name,art:a.art,outcome:a.outcome,qty:a.qty,date:a.date})),freq:{...e.freq}}}function Gt(t,e){var n;if(!Array.isArray(t))return null;const a=[];for(const s of t.slice(0,tt)){if(!s||typeof s!="object"||typeof s.name!="string"||!s.name.trim())continue;const r=s.name.trim().slice(0,P),o=s.location==="冷凍"||s.category==="冷凍"?"freezer":s.location==="冷蔵"?"fridge":"shelf",u=Number(s.qty),y=((n=mt(r))==null?void 0:n.art)??"plate";a.push({id:w(),name:r,art:y,place:o,qty:Number.isFinite(u)?Math.min(W,Math.max(1,Math.round(u))):1,expiry:E(s.expiry)?s.expiry:null,addedOn:e})}return{...S(),items:a}}function te(t){try{try{localStorage.removeItem(Wt)}catch{}const e=localStorage.getItem($t);if(e!==null)return qt(JSON.parse(e))??S();const a=localStorage.getItem(Bt);if(a!==null)return Gt(JSON.parse(a),t)??S()}catch{}return S()}function kt(t){try{return localStorage.setItem($t,JSON.stringify(t)),!0}catch{return!1}}function ee(t,e){return JSON.stringify({kind:wt,version:2,exportedOn:e,...t},null,1)}function ae(t){if(t.length>2e6)return null;try{const e=JSON.parse(t);return!e||e.kind!==wt||e.version!==2?null:qt(e)}catch{return null}}const ne={"alert-triangle":'<path d="M12 9v4" /> <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /> <path d="M12 16h.01" />',"arrow-back-up":'<path d="M9 14l-4 -4l4 -4" /> <path d="M5 10h11a4 4 0 1 1 0 8h-1" />',basket:'<path d="M10 14a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /> <path d="M5.001 8h13.999a2 2 0 0 1 1.977 2.304l-1.255 7.152a3 3 0 0 1 -2.966 2.544h-9.512a3 3 0 0 1 -2.965 -2.544l-1.255 -7.152a2 2 0 0 1 1.977 -2.304" /> <path d="M17 10l-2 -6" /> <path d="M7 10l2 -6" />',box:'<path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" /> <path d="M12 12l8 -4.5" /> <path d="M12 12l0 9" /> <path d="M12 12l-8 -4.5" />',calendar:'<path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /> <path d="M16 3v4" /> <path d="M8 3v4" /> <path d="M4 11h16" /> <path d="M11 15h1" /> <path d="M12 15v3" />',"chart-bar":'<path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -6" /> <path d="M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -10" /> <path d="M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -14" /> <path d="M4 20h14" />',check:'<path d="M5 12l5 5l10 -10" />',"chevron-down":'<path d="M6 9l6 6l6 -6" />',clock:'<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /> <path d="M12 7v5l3 3" />',download:'<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /> <path d="M7 11l5 5l5 -5" /> <path d="M12 4l0 12" />',fridge:'<path d="M5 5a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2l0 -14" /> <path d="M5 10h14" /> <path d="M9 13v3" /> <path d="M9 6v1" />',leaf:'<path d="M5 21c.5 -4.5 2.5 -8 7 -10" /> <path d="M9 18c6.218 0 10.5 -3.288 11 -12v-2h-4.014c-9 0 -11.986 4 -12 9c0 1 0 3 2 5h3l.014 0" />',minus:'<path d="M5 12l14 0" />',pencil:'<path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /> <path d="M13.5 6.5l4 4" />',plus:'<path d="M12 5l0 14" /> <path d="M5 12l14 0" />',snowflake:'<path d="M10 4l2 1l2 -1" /> <path d="M12 2v6.5l3 1.72" /> <path d="M17.928 6.268l.134 2.232l1.866 1.232" /> <path d="M20.66 7l-5.629 3.25l.01 3.458" /> <path d="M19.928 14.268l-1.866 1.232l-.134 2.232" /> <path d="M20.66 17l-5.629 -3.25l-2.99 1.738" /> <path d="M14 20l-2 -1l-2 1" /> <path d="M12 22v-6.5l-3 -1.72" /> <path d="M6.072 17.732l-.134 -2.232l-1.866 -1.232" /> <path d="M3.34 17l5.629 -3.25l-.01 -3.458" /> <path d="M4.072 9.732l1.866 -1.232l.134 -2.232" /> <path d="M3.34 7l5.629 3.25l2.99 -1.738" />',sparkles:'<path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6" />',trash:'<path d="M4 7l16 0" /> <path d="M10 11l0 6" /> <path d="M14 11l0 6" /> <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /> <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />',upload:'<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /> <path d="M7 9l5 -5l5 5" /> <path d="M12 4l0 12" />',x:'<path d="M18 6l-12 12" /> <path d="M6 6l12 12" />'};function i(t){return`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ne[t]}</svg>`}let d=ht(new Date),c=te(d),xt=kt(c),L=!1,C=null;const l=(t,e=document)=>e.querySelector(t);function m(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}const k=(t,e="art",a=128)=>`<img class="${e}" src="./art/${t}.webp" alt="" width="${a}" height="${a}" />`,nt={fridge:"fridge",freezer:"snowflake",shelf:"box"},se={expired:"alert-triangle",today:"clock",soon:"clock"};function st(t){const e=j(t.expiry,d),a=D(e),n=se[a];return`<span class="pill lv-${a}">${n?i(n):""}${Dt(e)}</span>`}function v(t,e){c=t,xt=kt(c),rt(e)}function M(t){C={state:c,label:t}}const Lt=l("#app");Lt.innerHTML=`
  <a class="skip" href="#scene">家にある物へ移動</a>
  <header class="top">
    <div class="top-text">
      <p class="brand">${k("basket","brand-art",64)}在庫管理</p>
      <h1>家にある物と期限が、<br />ひと目でわかる。</h1>
      <p class="lead">買ってきた物はボタン1つで入れられます。使ったら「使った」、捨てたら「捨てた」を押すだけ。</p>
    </div>
    <div class="today" id="today" aria-live="polite"></div>
  </header>

  <main class="layout">
    <div class="col-side">
      <section class="card area-urgent" aria-labelledby="h-urgent">
        <h2 id="h-urgent" tabindex="-1">${i("clock")}そろそろ使う物</h2>
        <div id="urgent"></div>
      </section>

      <section class="card area-quick" aria-labelledby="h-quick">
        <h2 id="h-quick" tabindex="-1">${i("basket")}買ってきた物を入れる</h2>
        <p class="hint">押すと、いつもの場所と期限で入ります。あとで直せます。</p>
        <div class="quick-grid" id="quick"></div>
        <div class="row">
          <button type="button" class="btn ghost" id="quick-more" aria-expanded="false"></button>
          <button type="button" class="btn primary" data-act="custom">${i("plus")}ほかの物を入れる</button>
        </div>
      </section>
    </div>

    <div class="col-main">
    <section class="scene" id="scene" aria-labelledby="h-scene" tabindex="-1">
      <h2 id="h-scene" class="scene-title">家にある物</h2>
      <p class="hint scene-hint">絵を押すと、期限や数を直したり、「使った」「捨てた」を記録できます。</p>
      <div class="storages" id="storages"></div>
    </section>

    <div class="col-bottom">
      <section class="card area-stats" aria-labelledby="h-stats">
        <h2 id="h-stats">${i("chart-bar")}この30日の記録</h2>
        <div id="stats"></div>
      </section>

      <section class="card area-data" aria-labelledby="h-data">
        <h2 id="h-data">${i("download")}データ</h2>
        <p class="hint">入れた物と記録は、このスマホ（ブラウザ）の中にだけ残ります。外には送りません。機種を変えるときは「書き出す」でファイルにして、新しい端末で「読み込む」を押します。</p>
        <div class="row">
          <button type="button" class="btn" data-act="export">${i("download")}書き出す</button>
          <button type="button" class="btn" data-act="import">${i("upload")}読み込む</button>
          <button type="button" class="btn ghost" data-act="sample" id="sample-btn">${i("sparkles")}見本を入れる</button>
          <button type="button" class="btn ghost danger" data-act="clear">${i("trash")}すべて消す</button>
        </div>
        <input type="file" id="file" accept="application/json,.json" class="sr-only" tabindex="-1" aria-hidden="true" />
        <p class="field-msg" id="data-msg" aria-live="polite"></p>
        <p class="hint" id="save-note"></p>
      </section>
    </div>
    </div>
  </main>

  <footer class="foot">
    <p>登録不要・通信なし。一度開けば、電波がなくても使えます。</p>
    <p><a href="../">ほかのアプリ</a></p>
  </footer>

  <dialog id="dlg" aria-labelledby="dlg-title">
    <form id="dlg-form" novalidate>
      <div class="dlg-head">
        <img id="dlg-art" class="dlg-art" src="./art/plate.webp" alt="" width="128" height="128" />
        <h2 id="dlg-title">入れる</h2>
        <button type="button" class="icon-btn" data-act="dlg-close" aria-label="閉じる">${i("x")}</button>
      </div>

      <label class="field-label" for="f-name">名前</label>
      <input id="f-name" type="text" maxlength="${P}" autocomplete="off" enterkeyhint="done" placeholder="例: 豆腐" />
      <p class="field-msg" id="f-name-msg" aria-live="polite"></p>

      <details class="art-pick" id="art-pick">
        <summary>絵を選ぶ</summary>
        <div class="art-grid" role="radiogroup" aria-label="絵">
          ${Z.map(t=>`<label class="art-opt"><input type="radio" name="art" value="${t}" class="sr-only" />${k(t,"art",128)}<span class="sr-only">${It[t]}</span></label>`).join("")}
        </div>
      </details>

      <fieldset class="seg">
        <legend class="field-label">置き場所</legend>
        ${_.map(t=>`<label class="seg-opt"><input type="radio" name="place" value="${t}" />${i(nt[t])}<span>${I[t]}</span></label>`).join("")}
      </fieldset>

      <div class="qty-row">
        <span class="field-label" id="qty-label">数</span>
        <button type="button" class="round-btn" data-act="qty-dec" aria-label="1つへらす">${i("minus")}</button>
        <input id="f-qty" type="text" inputmode="numeric" aria-labelledby="qty-label" autocomplete="off" />
        <button type="button" class="round-btn" data-act="qty-inc" aria-label="1つふやす">${i("plus")}</button>
      </div>

      <fieldset class="exp">
        <legend class="field-label">期限</legend>
        <div class="exp-row">
          <input id="f-exp" type="date" min="2000-01-01" max="2199-12-31" aria-label="期限の日付" aria-describedby="f-exp-msg" />
          <p class="exp-msg" id="f-exp-msg" aria-live="polite"></p>
        </div>
        <div class="chips">
          <button type="button" class="chip" data-exp="0">今日</button>
          <button type="button" class="chip" data-exp="3">3日後</button>
          <button type="button" class="chip" data-exp="7">1週間後</button>
          <button type="button" class="chip" data-exp="m1">1か月後</button>
          <button type="button" class="chip" data-exp="none">期限なし</button>
        </div>
      </fieldset>

      <div class="dlg-actions">
        <button type="submit" class="btn primary wide" id="dlg-save">${i("check")}入れる</button>
      </div>

      <div class="finish" id="finish">
        <p class="finish-title">なくなったら記録</p>
        <div class="finish-row">
          <button type="button" class="btn used" data-act="dlg-used">${i("check")}<span>使い切った</span></button>
          <button type="button" class="btn wasted" data-act="dlg-wasted">${i("trash")}<span>捨てた</span></button>
        </div>
        <button type="button" class="link-btn" data-act="dlg-remove">まちがえて入れた（記録せずに消す）</button>
      </div>
    </form>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
`;const q=l("#dlg"),A=l("#dlg-form"),g=l("#f-name"),R=l("#f-qty"),$=l("#f-exp"),U=l("#file");function rt(t){var n,s,r;const e=document.activeElement,a=e==null?void 0:e.dataset.k;re(),oe(),St(),ce(),de(),l("#sample-btn").hidden=c.items.length>0||c.log.length>0,l("#save-note").textContent=xt?"":"この画面では保存できないため、閉じると内容が消えます（その場では使えます）。",a&&!((n=document.activeElement)!=null&&n.isConnected)?(s=document.querySelector(`[data-k="${CSS.escape(a)}"]`)??(t?document.querySelector(t):null))==null||s.focus():t&&(!e||!e.isConnected||e===document.body)&&((r=document.querySelector(t))==null||r.focus())}function re(){const t=Pt(c.items,d),e=(a,n,s)=>`<li class="tchip ${a?s:"zero"}"><span class="tnum">${a}</span><span>${n}</span></li>`;l("#today").innerHTML=`
    <p class="today-date">${i("calendar")}今日は ${B(d)}</p>
    <ul class="tchips" aria-label="期限の近い物の数">
      ${e(t.expired,"期限切れ","lv-expired")}
      ${e(t.today,"今日まで","lv-today")}
      ${e(t.soon,"2日以内","lv-soon")}
    </ul>
    <p class="today-total">家にある物 <strong>${t.total}</strong> 種類</p>`}function oe(){const t=gt(c.items).filter(a=>Rt(D(j(a.expiry,d)))),e=l("#urgent");if(c.items.length===0){e.innerHTML='<p class="empty">まだ何も入っていません。下の「買ってきた物を入れる」から始めましょう。</p>';return}if(t.length===0){e.innerHTML=`<p class="empty good">${i("leaf")}急いで使う物はありません。</p>`;return}e.innerHTML=`<ul class="urgent-list">${t.map(a=>`<li class="urow lv-${D(j(a.expiry,d))}">
        <button type="button" class="urow-main" data-act="edit" data-id="${m(a.id)}" data-k="u-edit-${m(a.id)}">
          ${k(a.art,"art")}<span class="urow-text"><span class="urow-name">${m(a.name)}${a.qty>1?`<span class="qty-inline"> ×${a.qty}</span>`:""}</span><span class="urow-place">${I[a.place]}</span></span>${st(a)}
        </button>
        <div class="urow-btns">
          <button type="button" class="btn small used" data-act="used" data-id="${m(a.id)}" data-k="u-used-${m(a.id)}">${i("check")}<span class="sr-only">${m(a.name)}を${a.qty>1?"1つ":""}</span>使った</button>
          <button type="button" class="btn small wasted" data-act="wasted" data-id="${m(a.id)}" data-k="u-wasted-${m(a.id)}">${i("trash")}<span class="sr-only">${m(a.name)}を${a.qty>1?"1つ":""}</span>捨てた</button>
        </div>
      </li>`).join("")}</ul>`}function le(){const t=e=>dt.includes(e)?dt.indexOf(e):100;return N.map((e,a)=>({p:e,i:t(e.name)*100+a,f:c.freq[e.name]??0})).sort((e,a)=>a.f-e.f||e.i-a.i).map(e=>e.p)}const ie=12;function St(){const t=le(),e=L?t:t.slice(0,ie);l("#quick").innerHTML=e.map(n=>`<button type="button" class="qbtn" data-act="quick" data-name="${m(n.name)}" data-k="q-${m(n.name)}">
        ${k(n.art,"art")}<span class="qname">${m(n.name)}</span><span class="qplace">${i(nt[n.place])}${I[n.place]}</span></button>`).join("");const a=l("#quick-more");a.innerHTML=`${i("chevron-down")}${L?"少なく表示":`ぜんぶ見る（${t.length}）`}`,a.classList.toggle("open",L),a.setAttribute("aria-expanded",String(L))}function ce(){const t=_t(c.items);l("#storages").innerHTML=_.map(e=>{const a=t[e];return`<section class="storage st-${e}" aria-labelledby="h-${e}">
      <div class="st-head">
        <h3 id="h-${e}">${i(nt[e])}${I[e]}</h3>
        <span class="st-count">${a.length?`${a.length}種類`:"空っぽ"}</span>
      </div>
      <div class="st-body">
        ${a.length?`<ul class="tiles">${a.map(n=>`<li><button type="button" class="tile lv-${D(j(n.expiry,d))}" data-act="edit" data-id="${m(n.id)}" data-k="t-${m(n.id)}">
                    ${n.qty>1?`<span class="tqty">×${n.qty}</span>`:""}
                    ${k(n.art,"art")}<span class="tname">${m(n.name)}</span>${st(n)}${n.expiry?`<span class="sr-only">（${B(n.expiry)}）</span>`:""}</button></li>`).join("")}</ul>`:'<p class="st-empty">まだ何もありません</p>'}
      </div>
    </section>`}).join("")}function de(){const t=Ft(c.log,d,30),e=l("#stats");if(t.wasteRate===null){e.innerHTML='<p class="empty">「使った」「捨てた」を押すと、ここにまとまります。捨てる物が多い食材がわかると、買いすぎを防げます。</p>';return}const a=t.used+t.wasted,n=Math.round(t.used/a*100);e.innerHTML=`
    <div class="nums">
      <div class="num used"><span class="nlabel">${i("check")}使い切った</span><span class="nval">${t.used}<small>こ</small></span></div>
      <div class="num wasted"><span class="nlabel">${i("trash")}捨てた</span><span class="nval">${t.wasted}<small>こ</small></span></div>
    </div>
    <svg class="bar" viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label="使い切った ${t.used}こ、捨てた ${t.wasted}こ。捨てた割合 ${t.wasteRate}%">
      <rect class="bar-used" x="0" y="0" width="${n}" height="10" /><rect class="bar-wasted" x="${n}" y="0" width="${100-n}" height="10" />
    </svg>
    <p class="rate">捨てた割合 <strong>${t.wasteRate}%</strong>${t.wasteRate===0?"。すばらしい！":t.wasteRate<=10?"。上手に使えています。":""}</p>
    ${t.overbuy.length?`<div class="overbuy"><p class="overbuy-title">${i("alert-triangle")}買いすぎかも</p><ul>${t.overbuy.map(s=>`<li>${k(s.art,"art")}<span><strong>${m(s.name)}</strong> は ${s.wasted}こ捨てて、使ったのは ${s.used}こ。次は少なめに買うか、早めに冷凍しましょう。</span></li>`).join("")}</ul></div>`:""}
    ${t.topWasted.length?`<p class="sub-title">捨てた物</p><ul class="wlist">${t.topWasted.map(s=>`<li>${k(s.art,"art")}<span class="wname">${m(s.name)}</span><span class="wnum">捨てた ${s.wasted} ／ 使った ${s.used}</span></li>`).join("")}</ul>`:""}`}let V=0;function h(t,e={}){const a=l("#toast");a.innerHTML=`<span class="toast-msg">${m(t)}</span>${e.editId?`<button type="button" class="btn small" data-act="edit" data-id="${m(e.editId)}">${i("pencil")}直す</button>`:""}${e.undo?`<button type="button" class="btn small" data-act="undo">${i("arrow-back-up")}元に戻す</button>`:""}`,a.hidden=!1,clearTimeout(V),V=window.setTimeout(()=>{a.contains(document.activeElement)?V=window.setTimeout(()=>a.hidden=!0,8e3):a.hidden=!0},8e3)}let b=null,ot=!1;function lt(t){l("#dlg-art").src=`./art/${t}.webp`;const e=A.querySelector(`input[name="art"][value="${t}"]`);e&&(e.checked=!0)}function ue(){var e;const t=(e=A.querySelector('input[name="art"]:checked'))==null?void 0:e.value;return Y(t)?t:"plate"}function pe(){var e;const t=(e=A.querySelector('input[name="place"]:checked'))==null?void 0:e.value;return t&&_.includes(t)?t:"fridge"}function J(){const t=$.value,e=l("#f-exp-msg");t?E(t)?e.innerHTML=`${st({expiry:t})}<span class="exp-date">${B(t)}</span>`:e.textContent="日付を選んでください":e.innerHTML='<span class="pill lv-none">期限なし</span>'}function pt(t,e){b=t;const a=t?c.items.find(r=>r.id===t):void 0;if(t&&!a)return;ot=!!a,l("#dlg-title").textContent=a?a.name:"ほかの物を入れる",g.value=(a==null?void 0:a.name)??(e==null?void 0:e.name)??"",l("#f-name-msg").textContent="",g.classList.remove("bad"),lt((a==null?void 0:a.art)??(e==null?void 0:e.art)??"plate"),l("#art-pick").open=!1;const n=(a==null?void 0:a.place)??(e==null?void 0:e.place)??"fridge";A.querySelectorAll('input[name="place"]').forEach(r=>r.checked=r.value===n),R.value=String((a==null?void 0:a.qty)??1),$.value=a?a.expiry??"":vt(d,7)??"",J(),l("#dlg-save").innerHTML=`${i("check")}${a?"保存する":"入れる"}`;const s=l("#finish");if(s.hidden=!a,a){const r=a.qty>1;l('[data-act="dlg-used"] span',s).textContent=r?"1つ使った":"使い切った",l('[data-act="dlg-wasted"] span',s).textContent=r?"1つ捨てた":"捨てた"}q.showModal(),a?l('[data-act="dlg-close"]',q).focus():g.focus()}function O(t){var e;q.close(),t&&((e=document.querySelector(t))==null||e.focus())}g.addEventListener("input",()=>{if(ot)return;const t=mt(g.value);lt((t==null?void 0:t.art)??"plate")});A.addEventListener("change",t=>{const e=t.target;e.name==="art"&&Y(e.value)&&(ot=!0,lt(e.value))});$.addEventListener("input",J);$.addEventListener("change",J);R.addEventListener("change",()=>R.value=String(it()));function it(){const t=Number(R.value.replace(/[０-９]/g,e=>String.fromCharCode(e.charCodeAt(0)-65248)).replace(/[^\d]/g,""));return Q(t||1)}A.addEventListener("submit",t=>{var s,r;t.preventDefault();const e=g.value.trim();if(!e){l("#f-name-msg").textContent="名前を入れてください。",g.classList.add("bad"),g.setAttribute("aria-invalid","true"),g.focus();return}g.removeAttribute("aria-invalid");const a=$.value&&E($.value)?$.value:null,n={name:e,art:ue(),place:pe(),qty:it(),expiry:a};if(b){M("直す");const o=b;O(),v(Ut(c,o,n)),(s=document.querySelector(`[data-k="t-${CSS.escape(o)}"]`))==null||s.focus(),h(`${e}を直しました`,{undo:!0})}else{const o=w(),u=et(c,n,o,d);if(u===c){l("#f-name-msg").textContent="これ以上は入れられません（300種類まで）。";return}M("入れる"),O(),v(u),(r=document.querySelector(`[data-k="t-${CSS.escape(o)}"]`))==null||r.focus(),h(`${e}を${I[n.place]}に入れました`,{undo:!0})}});q.addEventListener("click",t=>{const e=t.target.closest("button");if(t.target===q){q.close();return}if(!e)return;const a=e.dataset.act;if(e.dataset.exp){const n=e.dataset.exp;$.value=n==="none"?"":n==="m1"?Nt(d,1):z(d,Number(n)),J();return}if(a==="dlg-close")O(b?`[data-k="t-${CSS.escape(b)}"]`:void 0);else if(a==="qty-inc"||a==="qty-dec")R.value=String(Q(it()+(a==="qty-inc"?1:-1)));else if((a==="dlg-used"||a==="dlg-wasted")&&b){const n=b;O(),Et(n,a==="dlg-used"?"used":"wasted","#h-scene")}else if(a==="dlg-remove"&&b){const n=c.items.find(s=>s.id===b);if(!n)return;M("消す"),O(),v(Yt(c,n.id),"#h-scene"),l("#h-scene").focus(),h(`${n.name}を消しました（記録はしていません）`,{undo:!0})}});function Et(t,e,a){var o;const n=c.items.find(u=>u.id===t);if(!n)return;M(e);const s=n.qty-1;v(zt(c,t,e,d,w("l")),a),(!document.activeElement||document.activeElement===document.body)&&((o=document.querySelector(a))==null||o.focus());const r=e==="used"?"使った":"捨てた";h(s>0?`${n.name}を1つ${r}と記録しました（残り${s}つ）`:`${n.name}を${r}と記録しました`,{undo:!0})}function me(t){const e=N.find(r=>r.name===t);if(!e)return;const a=w(),n=et(c,{name:e.name,art:e.art,place:e.place,qty:1,expiry:vt(d,e.days)},a,d);if(n===c){h("これ以上は入れられません（300種類まで）。");return}M("入れる"),v(Ht(n,e.name));const s=n.items.find(r=>r.id===a).expiry;h(`${e.name}を${I[e.place]}に入れました（${s?`期限 ${B(s)}`:"期限なし"}）`,{undo:!0,editId:a})}function fe(){const t=r=>N.find(o=>o.name===r),e=[["牛乳",1,1],["卵",9,6],["鶏肉",0,1],["豆腐・納豆",-1,2],["トマト",2,3],["キャベツ",5,1],["チーズ",24,1],["ごはん",20,4],["えび",40,1],["アイス",null,2],["パン",1,1],["たまねぎ",25,3],["バナナ",3,2],["缶詰",200,2]];let a=S();for(const[r,o,u]of e){const y=t(r);a=et(a,{name:y.name,art:y.art,place:y.place,qty:u,expiry:o===null?null:z(d,o)},w(),d)}const s=[["牛乳","wasted",-20,1],["牛乳","used",-14,1],["牛乳","wasted",-6,1],["卵","used",-12,6],["パン","used",-9,1],["パン","wasted",-3,1],["キャベツ","used",-5,1],["鶏肉","used",-4,1],["トマト","used",-2,2]].map(([r,o,u,y])=>({id:w("l"),name:r,art:t(r).art,outcome:o,qty:y,date:z(d,u)}));return{...a,log:s,freq:{牛乳:4,卵:3,パン:3,鶏肉:2,トマト:2}}}Lt.addEventListener("click",t=>{const e=t.target.closest("button[data-act]");if(!e||q.contains(e))return;const a=e.dataset.id??"";switch(e.dataset.act){case"quick":me(e.dataset.name??"");break;case"custom":pt(null);break;case"edit":l("#toast").hidden=!0,pt(a);break;case"used":case"wasted":Et(a,e.dataset.act,"#h-urgent");break;case"undo":if(C){const n=C.label;v(C.state),C=null,l("#toast").hidden=!0,l("#h-scene").focus(),h(`「${n==="used"?"使った":n==="wasted"?"捨てた":n}」を取り消しました`)}break;case"export":he();break;case"import":U.click();break;case"sample":M("見本を入れる"),v(fe(),"#h-scene"),l("#h-scene").focus(),h("見本を入れました。いらなければ「すべて消す」で消せます。",{undo:!0});break;case"clear":if(c.items.length===0&&c.log.length===0){h("消すものはありません。");break}M("すべて消す"),v({...S(),freq:c.freq},"#h-scene"),h("すべて消しました。",{undo:!0});break}});l("#quick-more").addEventListener("click",()=>{L=!L,St()});function he(){const t=new Blob([ee(c,d)],{type:"application/json"}),e=document.createElement("a");e.href=URL.createObjectURL(t),e.download=`pantry-${d}.json`,document.body.append(e),e.click(),e.remove(),setTimeout(()=>URL.revokeObjectURL(e.href),5e3),l("#data-msg").textContent=`「pantry-${d}.json」を書き出しました。`,l("#data-msg").classList.remove("bad")}U.addEventListener("change",async()=>{var n;const t=(n=U.files)==null?void 0:n[0];if(U.value="",!t)return;const e=l("#data-msg"),a=t.size>2e6?null:ae(await t.text());if(!a){e.textContent="このファイルは読み込めません。このアプリで「書き出す」をしたファイルを選んでください。",e.classList.add("bad");return}M("読み込む"),v(a,"#h-scene"),e.textContent=`読み込みました（${a.items.length}種類・記録${a.log.length}件）。`,e.classList.remove("bad"),h("読み込んだ内容に入れ替えました。",{undo:!0})});function Tt(){const t=ht(new Date);t!==d&&(d=t,rt())}setInterval(Tt,6e4);document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&Tt()});rt();"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").then(()=>navigator.serviceWorker.ready).then(t=>{var a;const e=[location.href.split("#")[0],...performance.getEntriesByType("resource").map(n=>n.name).filter(n=>n.startsWith(location.origin)),...[...Z,"basket"].map(n=>new URL(`./art/${n}.webp`,location.href).href)];(a=t.active)==null||a.postMessage({type:"precache",urls:e})}).catch(()=>{})});
