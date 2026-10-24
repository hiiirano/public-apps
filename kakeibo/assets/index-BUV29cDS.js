(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function n(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(s){if(s.ep)return;s.ep=!0;const o=n(s);fetch(s.href,o)}})();const H=[{id:"food",label:"食費",hint:"スーパー・コンビニ",fixed:!1},{id:"eatout",label:"外食",hint:"ランチ・カフェ",fixed:!1},{id:"daily",label:"日用品",hint:"洗剤・服・雑貨",fixed:!1},{id:"home",label:"住まい",hint:"家賃・光熱・通信",fixed:!0},{id:"transit",label:"交通",hint:"電車・ガソリン",fixed:!1},{id:"hobby",label:"趣味",hint:"本・映画・習い事",fixed:!1},{id:"social",label:"交際",hint:"贈り物・会費",fixed:!1},{id:"medical",label:"医療",hint:"病院・薬",fixed:!1},{id:"other",label:"その他",hint:"どれでもないもの",fixed:!1}],Q=H.map(t=>t.id);function X(t){return H.find(e=>e.id===t)}function yt(t){return typeof t=="string"&&Q.includes(t)}const Y=99999999,lt=999999999,P=40,et=2e4,$t=2e3,vt=2100;function Tt(t){return t%4===0&&t%100!==0||t%400===0}function xt(t,e){return e===2?Tt(t)?29:28:[4,6,9,11].includes(e)?30:31}function G(t){const e=/^(\d{4})-(\d{2})$/.exec(t);if(!e)return null;const n=Number(e[1]),a=Number(e[2]);return n<$t||n>vt||a<1||a>12?null:{y:n,m:a}}const wt=t=>typeof t=="string"&&G(t)!==null;function Ft(t){const e=G(t);if(!e)throw new Error(`月の形が違います: ${t}`);return xt(e.y,e.m)}function U(t){if(typeof t!="string")return!1;const e=/^(\d{4}-\d{2})-(\d{2})$/.exec(t);if(!e)return!1;const n=G(e[1]),a=Number(e[2]);return!!n&&a>=1&&a<=xt(n.y,n.m)}const S=t=>t.slice(0,7),Z=t=>Number(t.slice(8,10)),st=t=>String(t).padStart(2,"0"),Yt=(t,e)=>`${t}-${st(e)}`,Kt=(t,e,n)=>`${t}-${st(e)}-${st(n)}`;function kt(t=new Date){return Kt(t.getFullYear(),t.getMonth()+1,t.getDate())}function Rt(t,e){const n=G(t);if(!n)throw new Error(`月の形が違います: ${t}`);let a=n.y*12+(n.m-1)+e;return a=Math.min(vt*12+11,Math.max($t*12,a)),Yt(Math.floor(a/12),a%12+1)}function _t(t){let e=Number(t.slice(0,4)),n=Number(t.slice(5,7));const a=Z(t);n<3&&(n+=12,e-=1);const s=e%100,o=Math.floor(e/100);return((a+Math.floor(13*(n+1)/5)+s+Math.floor(s/4)+Math.floor(o/4)+5*o)%7+6)%7}const Jt=["日","月","火","水","木","金","土"];function tt(t){return`${Number(t.slice(5,7))}月${Z(t)}日（${Jt[_t(t)]}）`}function C(t){const e=G(t);return`${e.y}年${e.m}月`}function Pt(t,e){return S(e)===t?e:`${t}-01`}const qt=.9;function Vt(t,e){const n=S(e);return t<n?"past":t>n?"future":"current"}function Ht(t,e,n,a){const s=Ft(e),o=Vt(e,n),r=o==="past"?s:o==="future"?0:Math.min(Z(n),s),l=a!==null&&a>0?a:null,c=new Array(s).fill(0);let p=0,g=0,u=0;for(const y of t){if(S(y.date)!==e)continue;const h=Z(y.date);p+=y.amount,c[h-1]+=y.amount,h>r||X(y.cat).fixed?g+=y.amount:u+=y.amount}let w;o==="current"?w=g+Math.round(u/r*s):w=p;const N=[];let j=0;for(let y=0;y<s;y++)j+=c[y],N.push(y<r?j:null);let x="none";l!==null&&(p>l?x="already":w>l?x="over":w>l*qt?x="near":x="ok");const O=o==="current"?s-r+1:0,at=l!==null&&o==="current"?Math.max(0,Math.floor((l-p)/O)):null;return{month:e,phase:o,days:s,elapsed:r,spent:p,fixedSpent:g,variableSpent:u,projected:w,budget:l,over:l===null?null:w-l,status:x,daysLeft:O,perDayLeft:at,idealToDate:l===null?null:Math.round(l*r/s),cumulative:N,rough:o==="current"&&r<5}}function Xt(t,e=4){if(!(t>0))return 1;const n=t/e,a=10**Math.floor(Math.log10(n)),s=n/a;return(s<=1?1:s<=2?2:s<=5?5:10)*a}function Gt(t,e=640,n=260){const a={l:8,r:8,t:16,b:28},s=Math.max(t.budget??0,t.projected,t.spent,1),o=Xt(s),r=Math.ceil(s*1.08/o)*o,l=e-a.l-a.r,c=n-a.t-a.b,p=h=>a.l+l*h/t.days,g=h=>a.t+c-c*h/r,u=h=>Math.round(h*10)/10,w=[`${u(p(0))},${u(g(0))}`];t.cumulative.forEach((h,Bt)=>{h!==null&&w.push(`${u(p(Bt+1))},${u(g(h))}`)});const N=t.elapsed,j=N>0?t.cumulative[N-1]??0:0,x=t.phase==="current"?{x:u(p(N)),y:u(g(j))}:null,O={x:u(p(t.days)),y:u(g(t.projected))},at=t.phase==="current"?`${x.x},${x.y} ${O.x},${O.y}`:"",y=[];for(let h=o;h<=r;h+=o)y.push({value:h,y:u(g(h))});return{width:e,height:n,yMax:r,actual:t.phase==="future"?"":w.join(" "),projection:at,budgetY:t.budget===null?null:u(g(t.budget)),ideal:t.budget===null?"":`${u(p(0))},${u(g(0))} ${u(p(t.days))},${u(g(t.budget))}`,today:x,end:O,ticks:y,pad:a}}function ct(t,e){let n=null;for(const s of Object.keys(t))s<=e&&(n===null||s>n)&&(n=s);if(n===null)return null;const a=t[n];return a>0?a:null}function Ut(t,e){return e in t?t[e]>0?"this":"none":ct(t,e)===null?"none":"carried"}function Wt(t,e){return t.filter(n=>S(n.date)===e)}function zt(t){return[...t].sort((e,n)=>e.date!==n.date?e.date<n.date?1:-1:n.at-e.at)}function Qt(t){const e=[];for(const n of zt(t)){const a=e[e.length-1];a&&a.date===n.date?(a.items.push(n),a.total+=n.amount):e.push({date:n.date,total:n.amount,items:[n]})}return e}function Zt(t){const e=new Map;let n=0;for(const a of t){const s=e.get(a.cat)??{total:0,count:0};s.total+=a.amount,s.count+=1,e.set(a.cat,s),n+=a.amount}return Q.filter(a=>e.has(a)).map(a=>({cat:a,...e.get(a),share:n>0?e.get(a).total/n:0})).sort((a,s)=>s.total-a.total||Q.indexOf(a.cat)-Q.indexOf(s.cat))}const D=()=>({expenses:[],budgets:{}}),te=t=>t.expenses.length>=et;function ee(t,e){return te(t)?null:{...t,expenses:[...t.expenses,e]}}function ne(t,e,n){return{...t,expenses:t.expenses.map(a=>a.id===e?{...a,...n}:a)}}function ae(t,e){return{...t,expenses:t.expenses.filter(n=>n.id!==e)}}function se(t,e,n){return{...t,budgets:{...t.budgets,[e]:n??0}}}function Mt(t){const e=t.normalize("NFKC").replace(/[,，、\s円¥￥\\]/g,"");return e===""?null:/^\d+$/.test(e)?e.length>15?Number.MAX_SAFE_INTEGER:Number(e):NaN}function E(t){return Math.round(t).toLocaleString("ja-JP")}function d(t){const e=Math.round(t);return`${e<0?"−":""}¥${Math.abs(e).toLocaleString("ja-JP")}`}const W=(t,e,n)=>typeof t=="number"&&Number.isInteger(t)&&t>=e&&t<=n,dt=t=>typeof t=="string"&&/^[\w-]{1,60}$/.test(t);function St(t){return typeof t!="string"?"":[...t.replace(/[\u0000-\u001f\u007f]+/g," ").trim()].slice(0,P).join("").trim()}function Et(t){const e=t;return!!e&&typeof e=="object"&&dt(e.id)&&U(e.date)&&W(e.amount,1,Y)&&yt(e.cat)&&typeof e.memo=="string"&&[...e.memo].length<=P&&typeof e.at=="number"&&Number.isFinite(e.at)}function jt(t){const e={};if(!t||typeof t!="object"||Array.isArray(t))return e;for(const[n,a]of Object.entries(t))wt(n)&&W(a,0,lt)&&(e[n]=a);return e}function Ot(t){if(!t||typeof t!="object")return null;const e=t;if(!Array.isArray(e.expenses))return null;const n=new Set,a=[];let s=0;for(const o of e.expenses)Et(o)&&!n.has(o.id)?(n.add(o.id),a.push({id:o.id,date:o.date,amount:o.amount,cat:o.cat,memo:o.memo,at:o.at})):s++;return{book:{expenses:a,budgets:jt(e.budgets)},dropped:s}}const oe=["必需","娯楽","文化","予備"];function Nt(t,e){const n=t;if(!n||typeof n!="object")return null;const a=Math.round(Number(n.amount));if(!U(n.date)||!W(a,1,Y))return null;const s=typeof n.category=="string"&&oe.includes(n.category)?n.category:"",o=St(`${s?`[${s}] `:""}${typeof n.memo=="string"?n.memo:""}`),r=Date.parse(String(n.createdAt));return{id:dt(n.id)?n.id:e(),date:n.date,amount:a,cat:"other",memo:o,at:Number.isFinite(r)?r:0}}function It(t){const e={};if(!t||typeof t!="object")return e;for(const[n,a]of Object.entries(t)){if(!wt(n)||!a||typeof a!="object")continue;const s=Math.round(Number(a.income))||0,o=Math.round(Number(a.savingsGoal))||0,r=a.budgets&&typeof a.budgets=="object"?Object.values(a.budgets).reduce((c,p)=>c+(Math.round(Number(p))||0),0):0,l=s-o>0?s-o:r;W(l,1,lt)&&(e[n]=l)}return e}const re="kakeibo",ie=2;function le(t,e){const n=[...t.expenses].sort((a,s)=>a.date<s.date?-1:a.date>s.date?1:a.at-s.at);return JSON.stringify({app:re,version:ie,exportedAt:e,expenses:n,budgets:t.budgets},null,1)}const ce=t=>H.find(e=>e.id===t).label;function de(t){const e=/^[=+\-@']/.test(t)?`'${t}`:t;return/[",\n\r]/.test(e)?`"${e.replace(/"/g,'""')}"`:e}const ue=["日付","金額","費目","メモ","id"];function pe(t){const e=[...t].sort((n,a)=>n.date<a.date?-1:n.date>a.date?1:n.at-a.at).map(n=>[n.date,String(n.amount),ce(n.cat),de(n.memo),n.id].join(","));return[ue.join(","),...e].join(`\r
`)+`\r
`}function fe(t){const e=[];let n=[],a="",s=!1;const o=t.replace(/^﻿/,"");for(let r=0;r<o.length;r++){const l=o[r];s?l==='"'?o[r+1]==='"'?(a+='"',r++):s=!1:a+=l:l==='"'?s=!0:l===","?(n.push(a),a=""):l===`
`||l==="\r"?(l==="\r"&&o[r+1]===`
`&&r++,n.push(a),e.push(n),n=[],a=""):a+=l}return(a!==""||n.length)&&(n.push(a),e.push(n)),e.filter(r=>r.some(l=>l.trim()!==""))}class q extends Error{}function be(t){const e=t.trim(),n=H.find(a=>a.label===e||a.id===e);return n?{cat:n.id,note:""}:{cat:"other",note:e?`[${e}] `:""}}function me(t){const e=/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(t.normalize("NFKC").trim());return e?`${e[1]}-${e[2].padStart(2,"0")}-${e[3].padStart(2,"0")}`:""}function he(t,e,n){const a=fe(t);if(a.length===0)throw new q("ファイルが空です。");const s=a[0].map(c=>c.trim().toLowerCase()),o=(...c)=>s.findIndex(p=>c.includes(p)),r={date:o("日付","date"),amount:o("金額","amount"),cat:o("費目","category","分類"),memo:o("メモ","memo"),id:o("id")};if(r.date<0||r.amount<0)throw new q("「日付」と「金額」の列が見つかりません。");const l={expenses:[],budgets:{},bad:0};return a.slice(1).forEach((c,p)=>{const g=me(c[r.date]??""),u=Number((c[r.amount]??"").normalize("NFKC").replace(/[,\s円¥]/g,""));if(!U(g)||!W(u,1,Y)){l.bad++;return}const{cat:w,note:N}=be(r.cat>=0?c[r.cat]??"":"");let j=r.memo>=0?c[r.memo]??"":"";/^'[=+\-@']/.test(j)&&(j=j.slice(1));const x=r.id>=0?(c[r.id]??"").trim():"",O=dt(x);l.expenses.push({e:{id:O?x:e(),date:g,amount:u,cat:w,memo:St(N+j),at:n+p},hadId:O})}),l}function ge(t,e){let n;try{n=JSON.parse(t.replace(/^﻿/,""))}catch{throw new q("JSON として読めませんでした。")}if(!n||typeof n!="object"||!Array.isArray(n.expenses))throw new q("この家計簿のファイルではないようです。");const a={expenses:[],budgets:{},bad:0},s=n.expenses.some(o=>o&&typeof o=="object"&&"category"in o&&!("cat"in o));for(const o of n.expenses)if(s){const r=Nt(o,e);r?a.expenses.push({e:r,hadId:!0}):a.bad++}else Et(o)?a.expenses.push({e:{...o},hadId:!0}):a.bad++;return a.budgets=s?It(n.budgets):jt(n.budgets),a}function ye(t,e,n,a){return/\.json$/i.test(t)||/^\s*[{[]/.test(e.replace(/^﻿/,""))?ge(e,n):he(e,n,a)}const bt=t=>`${t.date}|${t.amount}|${t.cat}|${t.memo}`;function $e(t,e){const n=new Set(t.expenses.map(c=>c.id)),a=new Set(t.expenses.map(bt)),s=[...t.expenses];let o=0,r=0,l=0;for(const{e:c,hadId:p}of e.expenses){if(n.has(c.id)||!p&&a.has(bt(c))){r++;continue}if(s.length>=et){l++;continue}s.push(c),n.add(c.id),o++}return{book:{expenses:s,budgets:{...t.budgets,...e.budgets}},added:o,same:r,full:l}}const ot="kakeibo.notebook.v2",ve="kakeibo.notebook.v2.broken",K={expenses:"kakeibo.expenses",budgets:"kakeibo.budgets",llm:"kakeibo.llm"};let xe=0;const ut=()=>`e${Date.now().toString(36)}${(xe++).toString(36)}${Math.random().toString(36).slice(2,6)}`;function we(t){if(t===null)return{book:D(),dropped:0,broken:!1};try{const e=Ot(JSON.parse(t));if(e)return{...e,broken:!1}}catch{}return{book:D(),dropped:0,broken:!0}}function ke(t,e){var a;if(t===null&&e===null)return null;const n=D();try{const s=JSON.parse(t??"[]");if(Array.isArray(s))for(const o of s){const r=Nt(o,ut);r&&n.expenses.push(r)}}catch{}try{n.budgets=It(JSON.parse(e??"{}"))}catch{}return((a=Ot(n))==null?void 0:a.book)??D()}function R(t){try{return t(),!0}catch{return!1}}function Me(t){let e,n=null,a=null;try{e=t.getItem(ot),e===null&&(n=t.getItem(K.expenses),a=t.getItem(K.budgets))}catch{return{book:D(),dropped:0,migrated:!1,broken:!1}}if(R(()=>t.removeItem(K.llm)),e===null){const o=ke(n,a);if(o)return R(()=>t.setItem(ot,JSON.stringify(o)))&&(R(()=>t.removeItem(K.expenses)),R(()=>t.removeItem(K.budgets))),{book:o,dropped:0,migrated:!0,broken:!1}}const s=we(e);return s.broken&&e!==null&&R(()=>t.setItem(ve,e)),{...s,migrated:!1}}function Se(){try{return Me(localStorage)}catch{return{book:D(),dropped:0,migrated:!1,broken:!1}}}function Lt(t){try{return localStorage.setItem(ot,JSON.stringify(t)),!0}catch{return!1}}const Ee={"alert-triangle":'<path d="M12 9v4" /> <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /> <path d="M12 16h.01" />',"arrow-back-up":'<path d="M9 14l-4 -4l4 -4" /> <path d="M5 10h11a4 4 0 1 1 0 8h-1" />',check:'<path d="M5 12l5 5l10 -10" />',"chevron-left":'<path d="M15 6l-6 6l6 6" />',"chevron-right":'<path d="M9 6l6 6l-6 6" />',download:'<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /> <path d="M7 11l5 5l5 -5" /> <path d="M12 4l0 12" />',pencil:'<path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /> <path d="M13.5 6.5l4 4" />',trash:'<path d="M4 7l16 0" /> <path d="M10 11l0 6" /> <path d="M14 11l0 6" /> <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /> <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />',upload:'<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /> <path d="M7 9l5 -5l5 5" /> <path d="M12 4l0 12" />'};function m(t){return`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${Ee[t]}</svg>`}const _=Se();let f=_.book,rt=Lt(f),k=kt(),b=S(k),M=null,I=null;const i=(t,e=document)=>e.querySelector(t);function J(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}const pt=(t,e="cat-img")=>`<img class="${e}" src="./art/cat-${t}.svg" alt="" width="40" height="40" />`,it=i("#app");it.innerHTML=`
  <a class="skip" href="#entry">書きこむ欄へ移動</a>
  <header class="masthead">
    <div class="title-row">
      <img class="ledger" src="./art/ledger.svg" alt="" width="56" height="56" />
      <div>
        <h1>家計簿ノート</h1>
        <p class="lead">使いすぎを、月の途中で先回り。</p>
      </div>
    </div>
    <nav class="month-nav" aria-label="月の切り替え">
      <button type="button" class="icon-btn" data-act="prev" aria-label="前の月">${m("chevron-left")}</button>
      <p class="month-title" id="month-title" aria-live="polite"></p>
      <button type="button" class="icon-btn" data-act="next" aria-label="次の月">${m("chevron-right")}</button>
      <button type="button" class="text-btn" data-act="this-month" id="this-month" hidden>今月へ</button>
    </nav>
  </header>

  <main class="layout">
    <section class="card area-pace" id="pace" aria-labelledby="h-pace">
      <h2 id="h-pace">今月のペース</h2>
      <div id="pace-body"></div>
    </section>

    <section class="card area-entry" id="entry" aria-labelledby="h-entry" tabindex="-1">
      <h2 id="h-entry">書きこむ</h2>
      <form id="entry-form" novalidate autocomplete="off">
        <label class="field-label" for="amount"><span class="step">1</span>金額</label>
        <div class="amount-row">
          <input id="amount" class="amount" type="text" inputmode="numeric" enterkeyhint="done"
            placeholder="0" aria-describedby="amount-msg" />
          <span class="yen" aria-hidden="true">円</span>
        </div>
        <p id="amount-msg" class="field-msg" aria-live="polite"></p>

        <fieldset class="cats" aria-describedby="cat-msg">
          <legend class="field-label"><span class="step">2</span>費目</legend>
          <div class="cat-grid">
            ${H.map(t=>`
              <label class="cat">
                <input type="radio" name="cat" value="${t.id}" />
                ${pt(t.id)}
                <span class="cat-name">${t.label}</span>
              </label>`).join("")}
          </div>
          <p id="cat-msg" class="field-msg" aria-live="polite"></p>
          <p id="cat-hint" class="hint">住まい（家賃・光熱・通信）は月1回の支払いとして、見込みでのばしません。</p>
        </fieldset>

        <details class="more" id="more">
          <summary><span>日付・メモ</span><span class="more-sum" id="more-sum"></span></summary>
          <div class="more-body">
            <label class="small-label" for="date">日付</label>
            <input id="date" class="text-input" type="date" min="2000-01-01" max="2100-12-31" aria-describedby="date-msg" />
            <p id="date-msg" class="field-msg" aria-live="polite"></p>
            <label class="small-label" for="memo">メモ（なくてもよい・${P}文字まで）</label>
            <input id="memo" class="text-input" type="text" maxlength="${P}" enterkeyhint="done" placeholder="例: スーパー" />
          </div>
        </details>

        <div class="form-actions">
          <button type="submit" class="primary-btn" id="save-btn"><span class="step step-on">3</span><span id="save-label">書きこむ</span></button>
          <button type="button" class="ghost-btn" data-act="cancel-edit" id="cancel-edit" hidden>やめる</button>
        </div>
      </form>
    </section>

    <section class="card area-break" aria-labelledby="h-break">
      <h2 id="h-break">費目ごと</h2>
      <div id="break-body"></div>
    </section>

    <section class="card area-list notebook" aria-labelledby="h-list">
      <h2 id="h-list" tabindex="-1">記録</h2>
      <div id="list-body"></div>
    </section>

    <section class="card area-settings" id="settings" aria-labelledby="h-settings">
      <h2 id="h-settings">予算とデータ</h2>
      <div class="settings-grid">
        <div class="setting">
          <h3>1か月の予算</h3>
          <label class="small-label" for="budget" id="budget-label"></label>
          <div class="amount-row">
            <input id="budget" class="amount amount-s" type="text" inputmode="numeric" enterkeyhint="done" placeholder="なし" aria-describedby="budget-msg budget-note" />
            <span class="yen" aria-hidden="true">円</span>
          </div>
          <p id="budget-msg" class="field-msg" aria-live="polite"></p>
          <p id="budget-note" class="hint"></p>
          <button type="button" class="ghost-btn" data-act="budget-save">${m("check")}<span>予算を決める</span></button>
        </div>
        <div class="setting">
          <h3>ほかの端末へ移す</h3>
          <p class="hint">書き出したファイルを、新しい端末で「読み込む」と移せます。同じ記録は二重になりません。</p>
          <div class="btn-col">
            <button type="button" class="ghost-btn" data-act="export-json">${m("download")}<span>バックアップを書き出す（JSON）</span></button>
            <button type="button" class="ghost-btn" data-act="export-csv">${m("download")}<span>表計算用に書き出す（CSV）</span></button>
            <label class="ghost-btn file-btn">${m("upload")}<span>ファイルを読み込む</span>
              <input type="file" id="import-file" class="sr-only" accept=".json,.csv,application/json,text/csv" />
            </label>
          </div>
        </div>
        <div class="setting">
          <h3>記録を消す</h3>
          <p class="hint">この端末の記録と予算を、すべて消します。</p>
          <button type="button" class="ghost-btn danger" data-act="wipe" id="wipe-btn" aria-expanded="false" aria-controls="wipe-confirm">${m("trash")}<span>全部消す</span></button>
          <div id="wipe-confirm" class="confirm" hidden>
            <p>本当に消しますか？ 先にバックアップを書き出しておくと安心です。</p>
            <div class="btn-row">
              <button type="button" class="danger-btn" data-act="wipe-yes">消す</button>
              <button type="button" class="ghost-btn" data-act="wipe-no">やめる</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="foot">
    <p id="save-note" class="warn-note" hidden></p>
    <p class="credit">記録は、このスマホ（ブラウザ）の中にだけ残ります。キャッシュと同じで、外には送りません。<br />
      <a href="../">ほかのアプリ</a></p>
  </footer>

  <div class="bottom-bar" id="bottom-bar" hidden>
    <button type="button" class="primary-btn" data-act="go-entry">${m("pencil")}<span>書きこむ</span></button>
  </div>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;const v=i("#amount"),T=i("#date"),z=i("#memo"),L=i("#budget"),F=i("#entry-form");function A(t,e){e&&(I={book:f,label:e}),f=t,rt=Lt(f),V()}function V(){const t=kt();t!==k&&(k=t);const e=b===S(k);i("#month-title").textContent=C(b),i("#this-month").hidden=e,i("#h-pace").textContent=e?"今月のペース":b<S(k)?"この月のふりかえり":"この月の予定";const n=ct(f.budgets,b),a=Wt(f.expenses,b);Oe(Ht(a,b,k,n)),Ne(a),Ie(a),Ae(),it.querySelectorAll("[data-w]").forEach(o=>o.style.width=`${o.dataset.w}%`),it.querySelectorAll("[data-left]").forEach(o=>o.style.left=`${o.dataset.left}%`),M||At();const s=i("#save-note");s.hidden=rt,s.textContent=rt?"":"この画面では保存できないため、閉じると記録が消えます。"}function je(t){const e=t.budget,n=e-t.projected;switch(t.status){case"ok":return`<p class="verdict v-ok">${m("check")}<span>予算内のペースです（余裕 ${d(n)}）。</span></p>`;case"near":return`<p class="verdict v-near">${m("alert-triangle")}<span>予算ぎりぎりのペースです（余裕 ${d(n)}）。</span></p>`;case"over":return`<p class="verdict v-over">${m("alert-triangle")}<span>このままだと予算を <b>${d(-n)}</b> こえます。</span></p>`;case"already":return`<p class="verdict v-over">${m("alert-triangle")}<span>予算を <b>${d(t.spent-e)}</b> こえています。</span></p>`;default:return""}}function mt(t){const e=Gt(t,640,280),n=t.status==="over"||t.status==="already",a=e.width-e.pad.r,s=e.actual?`${e.actual} ${e.today?e.today.x:e.end.x},${e.height-e.pad.b} ${e.pad.l},${e.height-e.pad.b}`:"",o=t.phase==="current"?`1日から今日までに ${d(t.spent)}。このままだと月末 ${d(t.projected)}${t.budget?`、予算は ${d(t.budget)}`:""}。`:`この月の合計 ${d(t.spent)}${t.budget?`、予算は ${d(t.budget)}`:""}。`;return`
    <figure class="chart">
      <svg viewBox="0 0 ${e.width} ${e.height}" role="img" aria-label="${J(o)}" preserveAspectRatio="xMidYMid meet">
        ${e.ticks.map(r=>`<line class="c-grid" x1="${e.pad.l}" x2="${a}" y1="${r.y}" y2="${r.y}" />`).join("")}
        <line class="c-axis" x1="${e.pad.l}" x2="${a}" y1="${e.height-e.pad.b}" y2="${e.height-e.pad.b}" />
        ${e.budgetY!==null&&n?`<rect class="c-overzone" x="${e.pad.l}" y="${e.pad.t}" width="${a-e.pad.l}" height="${Math.max(0,e.budgetY-e.pad.t)}" />`:""}
        ${e.ideal?`<polyline class="c-ideal" points="${e.ideal}" />`:""}
        ${e.budgetY!==null?`<line class="c-budget" x1="${e.pad.l}" x2="${a}" y1="${e.budgetY}" y2="${e.budgetY}" />`:""}
        ${s?`<polygon class="c-area" points="${s}" />`:""}
        ${e.actual?`<polyline class="c-actual" points="${e.actual}" />`:""}
        ${e.projection?`<polyline class="c-proj${n?" is-over":""}" points="${e.projection}" />`:""}
        ${e.today?`<circle class="c-today" cx="${e.today.x}" cy="${e.today.y}" r="6" />`:""}
        ${t.phase==="current"?`<circle class="c-end${n?" is-over":""}" cx="${e.end.x}" cy="${e.end.y}" r="7" />`:""}
      </svg>
      <div class="c-days" aria-hidden="true"><span>1日</span>${t.phase==="current"&&t.elapsed/t.days>.12&&t.elapsed/t.days<.88?`<span class="c-todaylabel" data-left="${(t.elapsed/t.days*100).toFixed(2)}">今日</span>`:""}<span>${t.days}日</span></div>
      <figcaption class="legend">
        <span class="lg lg-actual">使った額</span>
        ${t.phase==="current"?'<span class="lg lg-proj">このままの見込み</span>':""}
        ${t.budget?'<span class="lg lg-budget">予算</span><span class="lg lg-ideal">予算どおりのペース</span>':""}
      </figcaption>
    </figure>`}function Oe(t){const e=i("#pace-body"),n=`
    <dl class="stats">
      <div><dt>予算</dt><dd>${t.budget?d(t.budget):"なし"}</dd></div>
      <div><dt>使った</dt><dd>${d(t.spent)}</dd></div>
      <div><dt>残り</dt><dd class="${t.budget&&t.spent>t.budget?"neg":""}">${t.budget?d(t.budget-t.spent):"—"}</dd></div>
    </dl>`,a=t.budget?"":'<div class="nudge"><p>予算を決めると、使いすぎを先に知らせます。</p><button type="button" class="ghost-btn" data-act="go-budget">予算を決める</button></div>';if(t.phase==="future"){e.innerHTML=`
      <p class="kicker">まだ始まっていない月です</p>
      <p class="big"><span class="big-label">予定として書いた額</span><span class="big-num">${d(t.spent)}</span></p>
      ${n}${a}`;return}if(t.spent===0){e.innerHTML=`
      <div class="empty">
        <img src="./art/notepad.svg" alt="" width="64" height="64" />
        <p>${t.phase==="current"?"まだ記録がありません。金額と費目をえらんで書きこむと、月末の見込みがここに出ます。":"この月の記録はありません。"}</p>
      </div>
      ${t.budget?n:a}`;return}if(t.phase==="past"){const o=t.budget?t.budget-t.spent:null;e.innerHTML=`
      <p class="big"><span class="big-label">この月の合計</span><span class="big-num">${d(t.spent)}</span></p>
      ${o===null?"":o>=0?`<p class="verdict v-ok">${m("check")}<span>予算より ${d(o)} 少なく収まりました。</span></p>`:`<p class="verdict v-over">${m("alert-triangle")}<span>予算を ${d(-o)} こえました。</span></p>`}
      ${mt(t)}${n}${a}`;return}const s=t.perDayLeft!==null?t.status==="already"?'<p class="perday">これからの支出は、できるだけおさえましょう。</p>':`<p class="perday">残り ${t.daysLeft}日（今日をふくむ）。<b>1日 ${d(t.perDayLeft)}</b> までなら予算に収まります。</p>`:"";e.innerHTML=`
    <p class="big"><span class="big-label">このままだと月末</span><span class="big-num${t.status==="over"||t.status==="already"?" is-over":""}">${d(t.projected)}</span></p>
    ${je(t)}
    ${mt(t)}
    ${n}
    ${s}
    ${t.rough?'<p class="hint">月のはじめは、見込みが大きくぶれます。</p>':""}
    ${a}`}function Ne(t){var a;const e=Zt(t),n=((a=e[0])==null?void 0:a.total)??0;i("#break-body").innerHTML=e.length?`<ul class="breakdown">${e.map(s=>`
        <li>
          ${pt(s.cat,"cat-img-s")}
          <span class="b-name">${X(s.cat).label}<small>${s.count}件</small></span>
          <span class="b-bar" aria-hidden="true"><span data-w="${n?Math.max(2,s.total/n*100).toFixed(2):0}"></span></span>
          <span class="b-amt">${d(s.total)}<small>${Math.round(s.share*100)}%</small></span>
        </li>`).join("")}</ul>`:'<p class="hint">記録すると、費目ごとの合計がここに出ます。</p>'}function Ie(t){const e=Qt(t);i("#list-body").innerHTML=e.length?e.map(n=>`
      <section class="day" aria-label="${tt(n.date)}">
        <h3><span>${tt(n.date)}</span><span class="day-total">${d(n.total)}</span></h3>
        <ul class="rows">${n.items.map(Le).join("")}</ul>
      </section>`).join(""):`<p class="hint">${C(b)}の記録はまだありません。</p>`}function Le(t){const e=X(t.cat),n=`${tt(t.date)}の${e.label} ${E(t.amount)}円`;return`
    <li class="row${t.id===M?" is-editing":""}" data-id="${t.id}">
      ${pt(t.cat,"cat-img-s")}
      <span class="row-main"><span class="row-cat">${e.label}</span>${t.memo?`<span class="row-memo">${J(t.memo)}</span>`:""}</span>
      <span class="row-amt">${d(t.amount)}</span>
      <span class="row-btns">
        <button type="button" class="icon-btn small" data-act="edit" aria-label="${J(n)}を直す">${m("pencil")}</button>
        <button type="button" class="icon-btn small danger" data-act="delete" aria-label="${J(n)}を消す">${m("trash")}</button>
      </span>
    </li>`}function Ae(){const t=Ut(f.budgets,b),e=ct(f.budgets,b);i("#budget-label").textContent=`${C(b)}から`,document.activeElement!==L&&(L.value=e?E(e):"");let n="";if(t==="carried")for(const a of Object.keys(f.budgets))a<b&&(!n||a>n)&&(n=a);i("#budget-note").textContent=t==="carried"?`${C(n)}に決めた予算を引き継いでいます。変えると、この月から先に効きます。`:"決めた月から先の月にも、同じ予算が引き継がれます。空にすると予算なしになります。"}function At(){T.value=Pt(b,k),nt()}function nt(){const t=T.value,e=z.value.trim();i("#more-sum").textContent=`${U(t)?t===k?"今日":tt(t):"日付を確認"}${e?`・${e}`:""}`}function ft(t,e,n,a){const s=Mt(t.value);let o="";if(s===null?o=a?"":"金額を入れてください。":Number.isNaN(s)?o="数字だけで入れてください（例: 1200）。":s>n?o=`${E(n)}円までです。`:s===0&&!a&&(o="1円以上で入れてください。"),e.textContent=o,o){t.setAttribute("aria-invalid","true");return}return t.removeAttribute("aria-invalid"),s}function Ce(){var e;const t=(e=F.querySelector('input[name="cat"]:checked'))==null?void 0:e.value;return yt(t)?t:null}F.addEventListener("submit",t=>{t.preventDefault();const e=ft(v,i("#amount-msg"),Y,!1),n=Ce();i("#cat-msg").textContent=n?"":"費目をえらんでください。";const a=T.value,s=U(a);if(i("#date-msg").textContent=s?"":"日付を入れてください（2000〜2100年）。",e==null)return v.focus();if(!n)return F.querySelector('input[name="cat"]').focus();if(!s)return i("#more").open=!0,T.focus();const o=z.value.trim().slice(0,P),r=`${X(n).label} ${E(e)}円`;if(M)A(ne(f,M,{amount:e,cat:n,date:a,memo:o}),`${r} に直しました`),B();else{const c=ee(f,{id:ut(),amount:e,cat:n,date:a,memo:o,at:Date.now()});if(!c){$(`記録は${E(et)}件までです。書き出して保管したあと、古い記録を消してください。`);return}A(c,`${r} を書きました`),Ct()}const l=S(a)!==b?`（${C(S(a))}のページに）`:"";$(`${I.label}${l}`,!0),v.focus()});function Ct(){v.value="",z.value="",F.querySelectorAll('input[name="cat"]').forEach(t=>t.checked=!1);for(const t of["#amount-msg","#cat-msg","#date-msg"])i(t).textContent="";v.removeAttribute("aria-invalid"),i("#more").open=!1,At()}function De(t){const e=f.expenses.find(n=>n.id===t);e&&(M=t,v.value=E(e.amount),F.querySelector(`input[name="cat"][value="${e.cat}"]`).checked=!0,T.value=e.date,z.value=e.memo,i("#more").open=!0,i("#h-entry").textContent="記録を直す",i("#save-label").textContent="直す",i("#cancel-edit").hidden=!1,nt(),V(),i("#entry").scrollIntoView({block:"start"}),v.focus())}function B(){M=null,i("#h-entry").textContent="書きこむ",i("#save-label").textContent="書きこむ",i("#cancel-edit").hidden=!0,Ct()}v.addEventListener("input",()=>{v.hasAttribute("aria-invalid")&&ft(v,i("#amount-msg"),Y,!0)});v.addEventListener("blur",()=>{const t=Mt(v.value);t!==null&&!Number.isNaN(t)&&t<=Y&&(v.value=E(t))});F.addEventListener("change",t=>{t.target.name==="cat"&&(i("#cat-msg").textContent="")});T.addEventListener("input",nt);z.addEventListener("input",nt);function Dt(){const t=ft(L,i("#budget-msg"),lt,!0);if(t===void 0)return L.focus();const e=t===null||t===0?null:t;A(se(f,b,e),"予算を変えました"),L.value=e?E(e):"",$(e?`${C(b)}からの予算を ${d(e)} にしました`:`${C(b)}から予算なしにしました`,!0)}L.addEventListener("keydown",t=>{t.key==="Enter"&&Dt()});function ht(t,e,n){const a=URL.createObjectURL(new Blob([e],{type:n})),s=document.createElement("a");s.href=a,s.download=t,document.body.append(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(a),1e3)}i("#import-file").addEventListener("change",async t=>{var a;const e=t.target,n=(a=e.files)==null?void 0:a[0];if(e.value="",!!n){if(n.size>5*1024*1024)return $("ファイルが大きすぎます（5MBまで）。");try{const s=ye(n.name,await n.text(),ut,Date.now()),o=$e(f,s),r=[o.same?`同じ記録 ${o.same}件`:"",s.bad?`読めない行 ${s.bad}件`:"",o.full?`上限（${E(et)}件）で入らない ${o.full}件`:""].filter(Boolean).join("・"),l=Object.keys(s.budgets).length>0;if(o.added===0&&!l)return $(`新しい記録はありませんでした${r?`（${r}）`:""}。`);A(o.book,"読み込みました"),$(`${o.added}件を読み込みました${r?`（${r}はとばしました）`:""}。`,!0)}catch(s){$(s instanceof q?s.message:"ファイルを読めませんでした。")}}});document.addEventListener("click",t=>{var s;const e=t.target.closest("[data-act]");if(!e)return;const n=e.dataset.act,a=(s=e.closest(".row"))==null?void 0:s.dataset.id;switch(n){case"prev":case"next":case"this-month":b=n==="this-month"?S(k):Rt(b,n==="prev"?-1:1),M&&B(),V();break;case"edit":a&&De(a);break;case"delete":{const o=f.expenses.find(r=>r.id===a);if(!o)break;M===o.id&&B(),A(ae(f,o.id),`${X(o.cat).label} ${E(o.amount)}円 を消しました`),$(I.label,!0),i("#h-list").focus();break}case"cancel-edit":B(),V();break;case"go-entry":i("#entry").scrollIntoView({block:"start"}),v.focus({preventScroll:!0});break;case"go-budget":i("#settings").scrollIntoView({block:"start"}),L.focus();break;case"budget-save":Dt();break;case"export-json":ht(`kakeibo-${k}.json`,le(f,new Date().toISOString()),"application/json"),$(`バックアップを書き出しました（${f.expenses.length}件）。`);break;case"export-csv":ht(`kakeibo-${k}.csv`,"\uFEFF"+pe(f.expenses),"text/csv;charset=utf-8"),$(`CSV を書き出しました（${f.expenses.length}件）。`);break;case"wipe":case"wipe-no":{const o=n==="wipe";i("#wipe-confirm").hidden=!o,i("#wipe-btn").setAttribute("aria-expanded",String(o)),o?i('[data-act="wipe-yes"]').focus():i("#wipe-btn").focus();break}case"wipe-yes":i("#wipe-confirm").hidden=!0,i("#wipe-btn").setAttribute("aria-expanded","false"),M&&B(),A(D(),"全部消しました"),$("全部消しました",!0);break;case"undo":I&&(M&&B(),A(I.book),I=null,$("元に戻しました"));break}});if("IntersectionObserver"in window){const t=i("#bottom-bar"),e=window.matchMedia("(min-width: 960px)");let n=!0;const a=()=>t.hidden=e.matches||n;new IntersectionObserver(s=>{n=s.some(o=>o.isIntersecting),a()}).observe(i("#entry-form")),e.addEventListener("change",a)}let gt=0;function $(t,e=!1){const n=i("#toast");n.innerHTML=`<span>${J(t)}</span>${e&&I?`<button type="button" class="toast-btn" data-act="undo">${m("arrow-back-up")}元に戻す</button>`:""}`,n.classList.add("show"),window.clearTimeout(gt),gt=window.setTimeout(()=>n.classList.remove("show"),e?8e3:5e3)}V();_.migrated?$("前の版の記録を引き継ぎました。前の分類はメモに残しています。"):_.broken?$("保存内容が読めなかったため、新しく始めます。"):_.dropped&&$(`読めなかった記録 ${_.dropped}件をのぞきました。`);"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").then(()=>navigator.serviceWorker.ready).then(t=>{var n;const e=[location.href.split("#")[0],...performance.getEntriesByType("resource").map(a=>a.name).filter(a=>a.startsWith(location.origin))];(n=t.active)==null||n.postMessage({type:"precache",urls:e})}).catch(()=>{})});
