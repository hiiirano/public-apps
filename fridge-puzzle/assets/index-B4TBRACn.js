(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const c of a)if(c.type==="childList")for(const o of c.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function r(a){const c={};return a.integrity&&(c.integrity=a.integrity),a.referrerPolicy&&(c.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?c.credentials="include":a.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function n(a){if(a.ep)return;a.ep=!0;const c=r(a);fetch(a.href,c)}})();const $="hiehie-fridge",g="sweets-02",R=["gothic","kid","grandma","cardigan","athlete","office","hat"],A=[{id:"gothic",revealName:"黒い服の人",image:"./assets/character-gothic.webp"},{id:"kid",revealName:"黄色い服の子",image:"./assets/character-kid.webp"},{id:"grandma",revealName:"赤い服のおばあちゃん",image:"./assets/character-grandma.webp"},{id:"cardigan",revealName:"赤いカーディガンの人",image:"./assets/character-cardigan.webp"},{id:"athlete",revealName:"ジャージの人",image:"./assets/character-athlete.webp"},{id:"office",revealName:"紺色の上着の人",image:"./assets/character-office.webp"},{id:"hat",revealName:"帽子のおじさん",image:"./assets/character-hat.webp"}];function b(t){let e=2166136261;for(let r=0;r<t.length;r+=1)e^=t.charCodeAt(r),e=Math.imul(e,16777619);return e>>>0}function P(t){let e=t||2654435769;return()=>(e^=e<<13,e^=e>>>17,e^=e<<5,(e>>>0)/4294967296)}function C(t){const e=[...R],r=P(b(`${t}:characters`));for(let n=e.length-1;n>0;n-=1){const a=Math.floor(r()*(n+1));[e[n],e[a]]=[e[a],e[n]]}return e}function w(t){if(!y(t))throw new Error("invalid round seed");const e=C(t).slice(0,4),r=e[b(`${t}:answer`)%e.length];return{id:g,seed:t,order:e,correct:r}}function S(){return{slots:["icecream","cake"],selected:null,moves:0}}function M(t,e){if(e!==0&&e!==1)return t;if(t.selected===null)return{...t,selected:e};if(t.selected===e)return{...t,selected:null};const r=[...t.slots];return[r[t.selected],r[e]]=[r[e],r[t.selected]],{slots:r,selected:null,moves:t.moves+1}}function T(t){return t.slots[0]==="cake"&&t.slots[1]==="icecream"}function y(t){return/^[a-z0-9]{8,24}$/.test(t)}function E(t){const e=crypto.getRandomValues(new Uint32Array(2));return Array.from(e,r=>r.toString(36).padStart(7,"0")).join("").slice(0,14)}function O(t,e){const r=t.order.indexOf(e);if(r<0)throw new Error("sender choice is not in this round");return new URLSearchParams({play:$,round:g,seed:t.seed,pick:String(r)}).toString()}function x(t){try{const e=new URLSearchParams(t.replace(/^#/,""));if(e.get("play")!==$||e.get("round")!==g)return null;const r=e.get("seed")??"",n=e.get("pick")??"";return!y(r)||!/^[0-3]$/.test(n)?null:{game:$,round:g,seed:r,senderSlot:Number(n)}}catch{return null}}function q(t,e,r){if(!r)return e===t?"なんで分かった？":"いや知らんわ！";const n=e===t,a=r===t;return n&&a?"この二人、冷蔵庫に詳しすぎる":n?"なんで分かった？":a?"送った人、たまたま当ててます":e===r?"気は合う。正解ではない":"二人とも知らんわ！"}function m(t){const e=A.find(r=>r.id===t);if(!e)throw new Error(`unknown character: ${t}`);return e}const k=document.querySelector("#app");if(!k)throw new Error("#app was not found");const p=k,f=x(window.location.hash);window.location.hash&&!f&&history.replaceState(null,"",`${location.pathname}${location.search}`);let z=f,l=w((f==null?void 0:f.seed)??E()),d=S(),i=null,s="puzzle",h="";const U={cake:{label:"ケーキ",image:"./assets/puzzle-cake.webp"},icecream:{label:"アイス",image:"./assets/puzzle-icecream.webp"}};function D(){z=null,l=w(E()),d=S(),i=null,s="puzzle",h="",history.replaceState(null,"",`${location.pathname}${location.search}`),u()}function I(t){if(s==="puzzle"){if(d=M(d,t),T(d)){s="puzzleClear",u(),window.setTimeout(()=>{s="choosing",u()},1150);return}u()}}function _(t){s==="choosing"&&(i=t,s="pause",u(),window.setTimeout(()=>{s="result",u()},950))}function H(){return z?l.order[z.senderSlot]:void 0}function N(){if(!i)return location.href;const t=O(l,i);return`${location.origin}${location.pathname}${location.search}#${t}`}async function V(){const t=N(),e={title:"ヒエヒエ冷蔵庫",text:`この冷蔵庫、誰んち？ ${i===l.correct?"俺は当てた。":"俺は外した。"}やってみて。`,url:t};try{navigator.share?(await navigator.share(e),h="共有メニューを開きました"):(await navigator.clipboard.writeText(t),h="リンクをコピーしました")}catch(r){if(r instanceof DOMException&&r.name==="AbortError")return;h="コピーできませんでした。リンクを長押ししてください"}u()}function L(t,e){const r=m(t);return`<img class="${e}" src="${r.image}" alt="${r.revealName}">`}function j(t,e){return`
    <button class="character-card ${i===t?"selected":""}" data-choice="${t}" ${s==="choosing"?"":"disabled"} aria-label="候補 ${e+1}">
      ${L(t,"character-image")}
      <span class="candidate-number">${e+1}</span>
    </button>`}function v(t,e){const r=U[t];return`
    <button class="puzzle-slot ${d.selected===e?"selected":""}" data-puzzle-slot="${e}" ${s==="puzzle"?"":"disabled"}>
      <span class="zone-name">${e===0?"冷蔵室":"冷凍室"}</span>
      <img src="${r.image}" alt="${r.label}">
      <strong>${r.label}</strong>
    </button>`}function F(){return`
    <section class="puzzle-board" aria-label="冷蔵庫の入れ替えパズル">
      ${v(d.slots[0],0)}
      <span class="swap-mark" aria-hidden="true">⇄</span>
      ${v(d.slots[1],1)}
    </section>
    <p class="puzzle-help">入れ替える2つを順番にタップ</p>`}function Z(){if(!i)return"";const t=m(l.correct),e=H(),r=q(l.correct,i,e);return`
    <section class="result-card" aria-live="polite">
      <p class="verdict">${i===l.correct?"正解":"正解はこの人"}</p>
      <div class="answer-stage">
        <span class="answer-burst" aria-hidden="true"></span>
        ${L(l.correct,"answer-character")}
      </div>
      <h2>${r}</h2>
      <div class="comparison">
        <div><span>正解</span><strong>${t.revealName}</strong></div>
        <div><span>あなた</span><strong>${m(i).revealName}</strong></div>
        ${e?`<div><span>送った人</span><strong>${m(e).revealName}</strong></div>`:""}
      </div>
      <button class="share-button" id="share">このクソゲー、やってみて</button>
      ${h?`<p class="share-notice">${h}</p>`:""}
      <label class="share-link-label">共有リンク<input class="share-link" readonly value="${N()}" aria-label="共有リンク"></label>
      <button class="text-button" id="new-round">別のクソゲーもやる</button>
    </section>`}function u(){var n,a,c;const t=s==="puzzle"||s==="puzzleClear",e=s==="pause",r=t?"アイスとケーキを正しい段へ入れ替えて！":"で、この冷蔵庫の持ち主は誰？";p.innerHTML=`
    <main class="game-shell">
      <header class="game-header">
        <p class="collection-name">知らんがなゲームス #01</p>
        <h1>ヒエヒエ冷蔵庫</h1>
        <p class="rule ${t?"":"twist-rule"}">${r}</p>
        ${z&&s!=="result"?'<p class="incoming-badge">友達と同じ問題です</p>':""}
      </header>

      <section class="fridge-scene ${t?"puzzle-mode":""} ${e?"thinking":""}" aria-label="甘い物でいっぱいの冷蔵庫">
        <img src="./assets/hiehie-fridge.webp" alt="プリン、ケーキ、アイスなどの甘い物がぎっしり詰まった冷蔵庫">
        ${s==="puzzleClear"?'<div class="clear-label"><strong>CLEAR!</strong><span>おかたづけ完了</span></div>':""}
        ${e?'<div class="thinking-label">判 定 中</div>':""}
      </section>

      ${t?F():s!=="result"?`
        <section class="choices" aria-label="持ち主の候補">
          ${l.order.map(j).join("")}
        </section>
        <p class="tiny-note">持ち主を示すヒントはありません。</p>
      `:Z()}
    </main>`,p.querySelectorAll("[data-puzzle-slot]").forEach(o=>{o.addEventListener("click",()=>I(Number(o.dataset.puzzleSlot)))}),p.querySelectorAll("[data-choice]").forEach(o=>{o.addEventListener("click",()=>_(o.dataset.choice))}),(n=p.querySelector("#share"))==null||n.addEventListener("click",V),(a=p.querySelector(".share-link"))==null||a.addEventListener("click",o=>{o.currentTarget.select()}),(c=p.querySelector("#new-round"))==null||c.addEventListener("click",D)}u();
