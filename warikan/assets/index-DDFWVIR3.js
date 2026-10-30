(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))o(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&o(l)}).observe(document,{childList:!0,subtree:!0});function n(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function o(s){if(s.ep)return;s.ep=!0;const i=n(s);fetch(s.href,i)}})();const Z=["gift","less","normal","more"],tt=[1,10,100,500,1e3],N=2,q=30,x=9999999,et=12;function z(t){const e=t.normalize("NFKC").replace(/[,，、\s円¥\\]/g,"");return e===""?null:/^\d+$/.test(e)?Number(e):NaN}function d(t){return t.toLocaleString("ja-JP")}function C(t){return t%10===0?String(t/10):(t/10).toFixed(1)}const A={lessTenths:8,moreTenths:12,unit:100,rounding:"up"},I={min:1,max:9},S={min:11,max:30},k={gift:"おごり",less:"少なめ",normal:"ふつう",more:"多め"};function nt(t,e){switch(t){case"gift":return 0;case"less":return e.lessTenths;case"normal":return 10;case"more":return e.moreTenths}}function W(t,e){return`×${C(nt(t,e))}`}const B=(t,e)=>t.name.trim()||`${e+1}人目`;function pt(t,e,n,o){if(t===null||t===0)return{kind:"empty"};if(!Number.isSafeInteger(t)||t<0)return{kind:"error",message:"会計の金額は数字で入れてください。"};if(t>x)return{kind:"error",message:`会計は${d(x)}円までです。`};const s=e.findIndex(p=>p.id===o);if(s<0)return{kind:"error",message:"幹事を1人選んでください。"};const i=e.reduce((p,b)=>p+(b.fixed??0),0);if(i>t)return{kind:"error",message:`金額を指定した人の合計（${d(i)}円）が、会計（${d(t)}円）を超えています。指定した金額を減らしてください。`};const l=t-i,m=e.map(p=>p.fixed===null?nt(p.level,n):0),M=m.reduce((p,b)=>p+b,0);if(l>0&&M===0)return{kind:"error",message:e.some(b=>b.fixed!==null)?`残りの${d(l)}円を払う人がいません。だれか1人を「ふつう」などにしてください。`:"全員が「おごり」になっています。だれか1人を「ふつう」などにしてください。"};const{unit:c,rounding:v}=n,w=e.map((p,b)=>{if(p.fixed!==null)return p.fixed;if(m[b]===0)return 0;const Y=l*m[b],R=M*c;return Math.floor(v==="up"?(Y+R-1)/R:Y/R)*c}),L=w.reduce((p,b)=>p+b,0),X=L-w[s];return{kind:"ok",total:t,amounts:w,collected:L,difference:L-t,hostIndex:s,received:X,hostActual:t-X}}function P(t){return t>0?`幹事のおつり ${d(t)}円`:t<0?`幹事が ${d(-t)}円 足す`:"ぴったり（おつりなし）"}function ft(t,e,n){const o=[`本日の会計 ${d(n.total)}円（${t.length}人）`],s=c=>c.fixed!==null?"（金額指定）":c.level==="normal"?"":`（${k[c.level]} ${W(c.level,e)}）`,i=new Map;t.forEach((c,v)=>{if(v===n.hostIndex)return;if(c.name.trim()){o.push(`・${c.name.trim()}さん ${d(n.amounts[v])}円${s(c)}`);return}const w=`${n.amounts[v]}|${s(c)}`,L=i.get(w)??{count:0,amount:n.amounts[v],tag:s(c)};L.count+=1,i.set(w,L)});const l=o.length>1;for(const c of i.values()){const v=l?`ほか${c.count}人`:`${c.count}人`;o.push(c.count===1?`・${v} ${d(c.amount)}円${c.tag}`:`・${v} 各${d(c.amount)}円${c.tag}`)}const m=t[n.hostIndex],M=m.name.trim()?`${m.name.trim()}さん`:`${n.hostIndex+1}人目`;return o.push(`幹事: ${M}（自分の分 ${d(n.amounts[n.hostIndex])}円）`),o.push(`幹事に払ってください。${P(n.difference)}`),o.join(`
`)}const at="warikan.on-the-spot.v3",K=20;let mt=0;const ht=()=>`p${Date.now().toString(36)}${(mt++).toString(36)}${Math.random().toString(36).slice(2,6)}`;function bt(t){const e=new Array(et).fill(0);for(const o of t)e[o.face]+=1;const n=Math.min(...e);return e.indexOf(n)}function st(t){return{id:ht(),name:"",level:"normal",fixed:null,face:bt(t)}}function H(){const t=[];for(let e=0;e<4;e++)t.push(st(t));return{amount:null,people:t,hostId:t[0].id,settings:{...A}}}const O=(t,e,n)=>typeof t=="number"&&Number.isInteger(t)&&t>=e&&t<=n;function gt(t){return t&&typeof t.id=="string"&&t.id.length>0&&t.id.length<=40&&typeof t.name=="string"&&t.name.length<=K&&Z.includes(t.level)&&(t.fixed===null||O(t.fixed,0,x))&&O(t.face,0,et-1)}function vt(t){return t&&O(t.lessTenths,I.min,I.max)&&O(t.moreTenths,S.min,S.max)&&tt.includes(t.unit)&&(t.rounding==="up"||t.rounding==="down")}function $t(t){try{const e=JSON.parse(t??"null");return!e||!(e.amount===null||O(e.amount,0,x))||!Array.isArray(e.people)||e.people.length<N||e.people.length>q||!e.people.every(gt)||new Set(e.people.map(n=>n.id)).size!==e.people.length||!e.people.some(n=>n.id===e.hostId)||!vt(e.settings)?H():{amount:e.amount,people:e.people.map(n=>({...n})),hostId:e.hostId,settings:{...e.settings}}}catch{return H()}}function yt(){try{return $t(localStorage.getItem(at))}catch{return H()}}function ot(t){try{return localStorage.setItem(at,JSON.stringify(t)),!0}catch{return!1}}const xt={plus:'<path d="M12 5l0 14" /> <path d="M5 12l14 0" />',minus:'<path d="M5 12l14 0" />',copy:'<path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" /> <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />',share:'<path d="M3 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /> <path d="M15 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /> <path d="M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /> <path d="M8.7 10.7l6.6 -3.4" /> <path d="M8.7 13.3l6.6 3.4" />',trash:'<path d="M4 7l16 0" /> <path d="M10 11l0 6" /> <path d="M14 11l0 6" /> <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /> <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />',refresh:'<path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /> <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />',"arrow-back-up":'<path d="M9 14l-4 -4l4 -4" /> <path d="M5 10h11a4 4 0 1 1 0 8h-1" />',"adjustments-horizontal":'<path d="M12 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /> <path d="M4 6l8 0" /> <path d="M16 6l4 0" /> <path d="M6 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /> <path d="M4 12l2 0" /> <path d="M10 12l10 0" /> <path d="M15 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /> <path d="M4 18l11 0" /> <path d="M19 18l1 0" />',wallet:'<path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" /> <path d="M20 12v4h-4a2 2 0 0 1 0 -4h4" />',x:'<path d="M18 6l-12 12" /> <path d="M6 6l12 12" />'};function h(t){return`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${xt[t]}</svg>`}let a=yt(),it=ot(a),y=null,_=!1;const r=(t,e=document)=>e.querySelector(t);function T(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}const rt=(t,e="face")=>`<img class="${e}" src="./art/face${t.face}.webp" alt="" width="96" height="96" />`;function f(){it=ot(a),ct()}const lt=r("#app");lt.innerHTML=`
  <a class="skip" href="#result">結果へ移動</a>
  <header class="top">
    <div class="top-text">
      <p class="brand">その場の割り勘</p>
      <h1>飲み会のお会計を、<br />30秒で割り勘。</h1>
      <p class="lead">金額と人数を入れるだけ。多め・少なめ・おごりも、そのまま計算します。</p>
    </div>
    <img class="top-art" src="./art/table.webp" alt="" width="960" height="391" />
  </header>

  <main class="layout">
    <section class="card area-amount" aria-labelledby="h-amount">
      <h2 id="h-amount"><span class="step">1</span>お会計の金額</h2>
      <label class="amount-label" for="amount">伝票の合計</label>
      <div class="amount-row">
        <input id="amount" class="amount" type="text" inputmode="numeric" autocomplete="off"
          enterkeyhint="done" placeholder="0" aria-describedby="amount-msg" />
        <span class="yen" aria-hidden="true">円</span>
      </div>
      <p id="amount-msg" class="field-msg" aria-live="polite"></p>
    </section>

    <section class="card area-people" aria-labelledby="h-people">
      <h2 id="h-people"><span class="step">2</span>だれと割る？</h2>
      <div class="count-row">
        <button type="button" class="round-btn" data-act="dec" aria-label="1人へらす">${h("minus")}</button>
        <label class="count-field">
          <span class="sr-only">人数</span>
          <input id="count" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" />
          <span aria-hidden="true">人</span>
        </label>
        <button type="button" class="round-btn" data-act="inc" aria-label="1人ふやす">${h("plus")}</button>
      </div>
      <p class="hint">人数は${N}〜${q}人。名前は空のままでも使えます。</p>
      <ol class="people" id="people"></ol>
      <button type="button" class="wide-btn" id="ratio-toggle" aria-expanded="false" aria-controls="ratio-panel">
        ${h("adjustments-horizontal")}<span>少なめ・多めの割合を変える</span>
      </button>
      <div id="ratio-panel" class="ratio-panel" hidden></div>
    </section>

    <section class="card result area-result" id="result" aria-labelledby="h-result" tabindex="-1">
      <h2 id="h-result"><span class="step">3</span>みんなの支払い</h2>
      <div id="result-body"></div>
    </section>

    <section class="card area-round" id="rounding-card" aria-labelledby="h-round">
      <h2 id="h-round">端数の設定</h2>
      <fieldset class="seg-field">
        <legend>集める単位</legend>
        <div class="seg seg-5" id="units"></div>
      </fieldset>
      <fieldset class="seg-field">
        <legend>端数の扱い</legend>
        <div class="seg seg-2" id="rounding"></div>
      </fieldset>
    </section>
  </main>

  <div class="bottom-bar" id="bottom-bar" hidden>
    <p id="bottom-text"></p>
    <a class="bottom-link" href="#result">結果を見る</a>
  </div>

  <footer class="foot">
    <div class="foot-actions">
      <button type="button" class="ghost-btn" data-act="new">${h("refresh")}<span>新しい会計</span></button>
      <button type="button" class="ghost-btn danger" data-act="reset">メンバーも消す</button>
    </div>
    <p id="save-note" class="hint"></p>
    <p class="credit">入力した内容は、このスマホ（ブラウザ）の中にだけ残ります。キャッシュと同じで、外には送りません。<br />
      <a href="../">ほかのアプリ</a></p>
  </footer>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <p class="sr-only" id="sr-live" aria-live="polite"></p>
`;const u=r("#amount"),E=r("#count"),$=r("#people");u.value=a.amount===null?"":d(a.amount);function Mt(){const t=z(u.value),e=r("#amount-msg");if(t===null)a.amount=null,e.textContent="";else if(Number.isNaN(t)){e.textContent="数字だけで入れてください（例: 12800）。",u.setAttribute("aria-invalid","true");return}else if(t>x){e.textContent=`${d(x)}円までです。`,u.setAttribute("aria-invalid","true");return}else a.amount=t,e.textContent="";u.removeAttribute("aria-invalid"),f()}u.addEventListener("input",Mt);u.addEventListener("blur",()=>{a.amount!==null&&!u.hasAttribute("aria-invalid")&&(u.value=d(a.amount))});u.addEventListener("focus",()=>{a.amount!==null&&(u.value=String(a.amount))});function dt(t){const e=Math.min(q,Math.max(N,t));if(e<a.people.length){const n=a.people.length-e;U(`${n}人をへらしました`),a.people=a.people.slice(0,e),a.people.some(o=>o.id===a.hostId)||(a.hostId=a.people[0].id)}for(;a.people.length<e;)a.people.push(st(a.people));g(),f()}E.addEventListener("change",()=>{const t=z(E.value);t===null||Number.isNaN(t)?E.value=String(a.people.length):dt(t)});E.addEventListener("keydown",t=>{t.key==="Enter"&&E.blur()});function U(t){y={people:a.people.map(e=>({...e})),hostId:a.hostId,label:t}}function wt(t,e){const n=B(t,e),o=t.id===a.hostId,s=t.fixed!==null,i=Z.map(l=>`
      <label class="lv lv-${l}">
        <input type="radio" name="lv-${t.id}" value="${l}" data-k="${t.id}:lv:${l}" ${!s&&t.level===l?"checked":""} />
        <span class="lv-name">${k[l]}</span>
        <span class="lv-ratio">${W(l,a.settings)}</span>
      </label>`).join("");return`
    <li class="person${o?" is-host":""}${s?" is-fixed":""}" data-id="${t.id}">
      <div class="p-head">
        ${rt(t)}
        <label class="sr-only" for="name-${t.id}">${e+1}人目の名前</label>
        <input id="name-${t.id}" class="p-name" type="text" value="${T(t.name)}" placeholder="${e+1}人目"
          maxlength="${K}" autocomplete="off" enterkeyhint="done" data-k="${t.id}:name" />
        <button type="button" class="icon-btn" data-act="remove" data-k="${t.id}:remove"
          aria-label="${T(n)}を外す" ${a.people.length<=N?"disabled":""}>${h("trash")}</button>
      </div>
      <fieldset class="levels">
        <legend class="sr-only">${T(n)}の払い方</legend>
        <div class="lv-grid">${i}</div>
      </fieldset>
      <div class="p-opts">
      <label class="host-pick">
        <input type="radio" name="host" value="${t.id}" data-k="${t.id}:host" ${o?"checked":""} />
        <span>${o?`${h("wallet")}幹事（集める人）`:"幹事にする"}</span>
      </label>
      ${s?`<div class="fixed-row">
              <label for="fixed-${t.id}">この人は</label>
              <input id="fixed-${t.id}" class="fixed-input" type="text" inputmode="numeric" autocomplete="off"
                value="${d(t.fixed)}" data-k="${t.id}:fixed" />
              <span>円</span>
              <button type="button" class="text-btn" data-act="unfix" data-k="${t.id}:unfix">指定をやめる</button>
            </div>`:`<button type="button" class="text-btn" data-act="fix" data-k="${t.id}:fix">金額を指定</button>`}
      </div>
    </li>`}function g(){var n;const t=document.activeElement,e=t==null?void 0:t.dataset.k;$.innerHTML=a.people.map(wt).join(""),E.value=String(a.people.length),r('[data-act="dec"]').disabled=a.people.length<=N,r('[data-act="inc"]').disabled=a.people.length>=q,e&&((n=$.querySelector(`[data-k="${e}"]`))==null||n.focus())}const G=t=>{var n;const e=(n=t.closest("[data-id]"))==null?void 0:n.dataset.id;return a.people.find(o=>o.id===e)};$.addEventListener("input",t=>{const e=t.target,n=G(e);if(n){if(e.classList.contains("p-name"))n.name=e.value.slice(0,K),f();else if(e.classList.contains("fixed-input")){const o=z(e.value);if(o===null||Number.isNaN(o)||o>x){e.setAttribute("aria-invalid","true");return}e.removeAttribute("aria-invalid"),n.fixed=o,f()}}});$.addEventListener("change",t=>{const e=t.target,n=G(e);if(n){if(e.name==="host")a.hostId=n.id;else if(e.name.startsWith("lv-"))n.level=e.value,n.fixed=null;else if(e.classList.contains("fixed-input")){e.value=n.fixed===null?"":d(n.fixed),e.removeAttribute("aria-invalid");return}else return;g(),f()}});$.addEventListener("click",t=>{var s,i;const e=t.target.closest("button[data-act]");if(!e)return;const n=G(e);if(!n)return;const o=a.people.indexOf(n);if(e.dataset.act==="remove"){if(a.people.length<=N)return;U(`${B(n,o)}を外しました`),a.people.splice(o,1),n.id===a.hostId&&(a.hostId=a.people[0].id),g(),f();const l=a.people[Math.min(o,a.people.length-1)];(s=$.querySelector(`[data-k="${l.id}:remove"]`))==null||s.focus(),V()}else if(e.dataset.act==="fix"){n.fixed=0,g(),f();const l=$.querySelector(`[data-k="${n.id}:fixed"]`);l&&(l.value="",l.focus())}else e.dataset.act==="unfix"&&(n.fixed=null,g(),f(),(i=$.querySelector(`[data-k="${n.id}:fix"]`))==null||i.focus())});function J(){const t=a.settings;r("#units").innerHTML=tt.map(s=>`
      <label class="seg-opt">
        <input type="radio" name="unit" value="${s}" ${t.unit===s?"checked":""} />
        <span>${s===1e3?"千円":`${s}円`}</span>
      </label>`).join("");const e=[["up","多めに集める","幹事におつりが出る"],["down","少なめに集める","足りない分は幹事が出す"]];r("#rounding").innerHTML=e.map(([s,i,l])=>`
      <label class="seg-opt seg-tall">
        <input type="radio" name="rounding" value="${s}" ${t.rounding===s?"checked":""} />
        <span><b>${i}</b><small>${l}</small></span>
      </label>`).join("");const n=(s,i,l,m)=>`
    <div class="ratio-row">
      <span class="ratio-name">${k[s]}</span>
      <button type="button" class="round-btn" data-ratio="${s}" data-d="-1" ${i<=l?"disabled":""}
        aria-label="${k[s]}の割合を0.1下げる">${h("minus")}</button>
      <output class="ratio-val" aria-live="polite">×${C(i)}</output>
      <button type="button" class="round-btn" data-ratio="${s}" data-d="1" ${i>=m?"disabled":""}
        aria-label="${k[s]}の割合を0.1上げる">${h("plus")}</button>
    </div>`,o=r("#ratio-panel");o.hidden=!_,r("#ratio-toggle").setAttribute("aria-expanded",String(_)),o.innerHTML=`
    <p class="hint">「ふつう」の人を ×1 として、何倍払うかです。×0.8 なら、ふつうの人の8割。</p>
    ${n("less",t.lessTenths,I.min,I.max)}
    ${n("more",t.moreTenths,S.min,S.max)}
    <button type="button" class="text-btn" data-ratio="reset">はじめの割合に戻す（×${C(A.lessTenths)}・×${C(A.moreTenths)}）</button>`}r("#rounding-card").addEventListener("change",t=>{const e=t.target;if(e.name==="unit")a.settings.unit=Number(e.value);else if(e.name==="rounding")a.settings.rounding=e.value;else return;f()});r("#ratio-toggle").addEventListener("click",()=>{_=!_,J()});r("#ratio-panel").addEventListener("click",t=>{const e=t.target.closest("button[data-ratio]");if(!e)return;const n=a.settings,o=e.dataset.ratio;o==="reset"?(n.lessTenths=A.lessTenths,n.moreTenths=A.moreTenths):o==="less"?n.lessTenths=Math.min(I.max,Math.max(I.min,n.lessTenths+Number(e.dataset.d))):o==="more"&&(n.moreTenths=Math.min(S.max,Math.max(S.min,n.moreTenths+Number(e.dataset.d))));const s=o==="reset"?null:`button[data-ratio="${o}"][data-d="${e.dataset.d}"]`;J(),g(),f();const i=s?r(s):null;(i&&!i.disabled?i:r("#ratio-toggle")).focus()});let D=0;function ct(){const t=r("#result-body"),e=pt(a.amount,a.people,a.settings,a.hostId),n=r("#bottom-bar");if(e.kind==="empty"){t.innerHTML='<p class="empty">お会計の金額を入れると、ここに1人ずつの金額が出ます。</p>',n.dataset.ready="",j();return}if(e.kind==="error"){t.innerHTML=`<p class="error" role="alert">${T(e.message)}</p>`,n.dataset.ready="",j();return}const o=a.people.map((i,l)=>{const m=l===e.hostIndex,M=i.fixed!==null?'<span class="tag">金額指定</span>':i.level!=="normal"?`<span class="tag tag-${i.level}">${k[i.level]} ${W(i.level,a.settings)}</span>`:"";return`
        <li class="pay${m?" pay-host":""}">
          ${rt(i,"face face-s")}
          <span class="pay-who">
            <span class="pay-name">${T(B(i,l))}${i.name.trim()?"さん":""}</span>
            ${m?'<span class="tag tag-host">幹事・自分の分</span>':""}${M}
          </span>
          <span class="pay-amount">${d(e.amounts[l])}<small>円</small></span>
        </li>`}).join(""),s=e.difference>0?"diff-plus":e.difference<0?"diff-minus":"diff-zero";t.innerHTML=`
    <ul class="pays">${o}</ul>
    <p class="diff ${s}">${P(e.difference)}</p>
    <dl class="sums">
      <div><dt>お会計</dt><dd>${d(e.total)}円</dd></div>
      <div><dt>集める合計（幹事の分も含む）</dt><dd>${d(e.collected)}円</dd></div>
      <div><dt>幹事がみんなから受け取る</dt><dd>${d(e.received)}円</dd></div>
      <div><dt>幹事が実際に出す額</dt><dd>${d(e.hostActual)}円</dd></div>
    </dl>
    <div class="share-actions">
      <button type="button" class="primary-btn" data-act="copy">${h("copy")}<span>LINEで送る文をコピー</span></button>
      ${"share"in navigator?`<button type="button" class="ghost-btn" data-act="share">${h("share")}<span>共有</span></button>`:""}
    </div>
    <details class="preview">
      <summary>送る文を見る</summary>
      <pre id="share-text"></pre>
    </details>`,r("#share-text").textContent=ft(a.people,a.settings,e),n.dataset.ready="1",r("#bottom-text").innerHTML=`集める合計 <b>${d(e.collected)}円</b><span class="bar-diff">${P(e.difference)}</span>`,j(),window.clearTimeout(D),D=window.setTimeout(()=>{r("#sr-live").textContent=`${a.people.length}人で${d(e.collected)}円を集めます。${P(e.difference)}。`},1200)}r("#result").addEventListener("click",async t=>{const e=t.target.closest("button[data-act]");if(!e)return;const n=r("#share-text").textContent??"";if(e.dataset.act==="copy"){const o=await Lt(n);F(o?"コピーしました。LINEのトークに貼り付けてください。":"コピーできませんでした。「送る文を見る」から選んでコピーしてください。"),o||(r(".preview").open=!0)}else if(e.dataset.act==="share")try{await navigator.share({text:n})}catch{}});async function Lt(t){try{return await navigator.clipboard.writeText(t),!0}catch{const e=document.createElement("textarea");e.value=t,e.setAttribute("readonly",""),e.style.position="fixed",e.style.opacity="0",document.body.append(e),e.select();let n=!1;try{n=document.execCommand("copy")}catch{n=!1}return e.remove(),n}}let ut=!1;function j(){const t=r("#bottom-bar");t.hidden=!t.dataset.ready||ut}"IntersectionObserver"in window&&new IntersectionObserver(([t])=>{ut=t.isIntersecting,j()},{threshold:.15}).observe(r("#result"));let Q=0;function F(t,e=!1){const n=r("#toast");n.innerHTML=`<span>${T(t)}</span>${e?`<button type="button" class="toast-btn" data-act="undo">${h("arrow-back-up")}元に戻す</button>`:""}`,n.classList.add("show"),window.clearTimeout(Q),Q=window.setTimeout(()=>n.classList.remove("show"),e?8e3:4e3)}function V(){y&&F(y.label,!0)}r("#toast").addEventListener("click",t=>{!t.target.closest('[data-act="undo"]')||!y||(a.people=y.people,a.hostId=y.hostId,y=null,r("#toast").classList.remove("show"),g(),f(),F("元に戻しました"))});r(".foot").addEventListener("click",t=>{const e=t.target.closest("button[data-act]");if(e){if(e.dataset.act==="new")a.amount=null,a.people.forEach(n=>n.fixed=null),u.value="",r("#amount-msg").textContent="",g(),f(),u.focus(),F("金額を消しました。メンバーはそのままです。");else if(e.dataset.act==="reset"){U("メンバーを消しました");const n=a.settings;a=H(),a.settings=n,u.value="",g(),f(),u.focus(),V()}}});lt.addEventListener("click",t=>{const e=t.target.closest('button[data-act="inc"], button[data-act="dec"]');e&&(dt(a.people.length+(e.dataset.act==="inc"?1:-1)),e.dataset.act==="dec"&&V())});J();g();ct();it||(r("#save-note").textContent="この画面では保存できないため、閉じると入力が消えます（計算はできます）。");"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").then(()=>navigator.serviceWorker.ready).then(t=>{var n;const e=[location.href.split("#")[0],...performance.getEntriesByType("resource").map(o=>o.name).filter(o=>o.startsWith(location.origin))];(n=t.active)==null||n.postMessage({type:"precache",urls:e})}).catch(()=>{})});
