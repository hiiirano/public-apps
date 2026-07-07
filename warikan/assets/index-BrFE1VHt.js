(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))o(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&o(c)}).observe(document,{childList:!0,subtree:!0});function t(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(s){if(s.ep)return;s.ep=!0;const r=t(s);fetch(s.href,r)}})();function U(e){const{amount:n,participantIds:t,shares:o}=e,s={};if(o){for(const u of t)s[u]=Math.round(o[u]??0);return s}const r=t.length;if(r===0)return s;const c=Math.floor(n/r);let a=n-c*r;const l=[...t].sort();for(const u of l)s[u]=c+(a>0?1:0),a>0&&a--;return s}function E(e){const n={},t={};for(const o of e.members)n[o.id]=0,t[o.id]=0;for(const o of e.expenses){n[o.payerId]!==void 0&&(n[o.payerId]+=o.amount);const s=U(o);for(const[r,c]of Object.entries(s))t[r]!==void 0&&(t[r]+=c)}return e.members.map(o=>({memberId:o.id,paid:n[o.id],owed:t[o.id],net:n[o.id]-t[o.id]}))}function N(e,n=0){const t=e.filter(a=>a.net>n).map(a=>({id:a.memberId,amount:a.net})).sort((a,l)=>l.amount-a.amount||a.id.localeCompare(l.id)),o=e.filter(a=>a.net<-n).map(a=>({id:a.memberId,amount:-a.net})).sort((a,l)=>l.amount-a.amount||a.id.localeCompare(l.id)),s=[];let r=0,c=0;for(;r<t.length&&c<o.length;){const a=t[r],l=o[c],u=Math.min(a.amount,l.amount);u>n&&s.push({from:l.id,to:a.id,amount:u}),a.amount-=u,l.amount-=u,a.amount<=n&&r++,l.amount<=n&&c++}return s}function w(e,n){var t;return((t=e.find(o=>o.id===n))==null?void 0:t.name)??"(不明)"}function M(e){return e.expenses.reduce((n,t)=>n+t.amount,0)}const T="warikan.groups",J="warikan.current";function b(e="id"){const n=Math.random().toString(36).slice(2,8);return`${e}_${Date.now().toString(36)}_${n}`}function k(e){const n=Math.round(Number(e));return Number.isFinite(n)&&n>=0?n:0}function v(e,n=""){return typeof e=="string"?e:n}function _(e){const n=e??{};return{id:v(n.id)||b("m"),name:v(n.name).trim()||"メンバー"}}function H(e,n){const t=e??{},o=Array.isArray(t.participantIds)?t.participantIds.filter(r=>n.has(r)):[];let s;if(t.shares&&typeof t.shares=="object"){s={};for(const[r,c]of Object.entries(t.shares))n.has(r)&&(s[r]=k(c))}return{id:v(t.id)||b("e"),title:v(t.title).trim()||"支出",amount:k(t.amount),payerId:n.has(v(t.payerId))?v(t.payerId):"",participantIds:o,shares:s,createdAt:typeof t.createdAt=="number"&&Number.isFinite(t.createdAt)?t.createdAt:Date.now()}}function L(e){const n=e??{},t=Array.isArray(n.members)?n.members.map(_):[],o=new Set(t.map(r=>r.id)),s=Array.isArray(n.expenses)?n.expenses.map(r=>H(r,o)):[];return{id:v(n.id)||b("g"),name:v(n.name).trim()||"割り勘",members:t,expenses:s,updatedAt:typeof n.updatedAt=="number"&&Number.isFinite(n.updatedAt)?n.updatedAt:Date.now()}}function F(){try{const e=localStorage.getItem(T);if(!e)return[];const n=JSON.parse(e);return Array.isArray(n)?n.map(L):[]}catch{return[]}}function G(e){localStorage.setItem(T,JSON.stringify(e))}function K(){return localStorage.getItem(J)}function z(e){localStorage.setItem(J,e)}function B(e){let n="";for(let t=0;t<e.length;t++)n+=String.fromCharCode(e[t]);return btoa(n)}function Y(e){const n=atob(e),t=new Uint8Array(n.length);for(let o=0;o<n.length;o++)t[o]=n.charCodeAt(o);return t}function Q(e){const n=JSON.stringify(e),t=new TextEncoder().encode(n);return B(t).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function V(e){try{let n=e.replace(/-/g,"+").replace(/_/g,"/");for(;n.length%4!==0;)n+="=";const t=Y(n),o=new TextDecoder().decode(t),s=JSON.parse(o);return!s||typeof s!="object"?null:L(s)}catch{return null}}function W(e,n){const t=Q(e);return`${n.split("#")[0]}#data=${t}`}function X(e){const n=/[#&]data=([^&]+)/.exec(e);return n?V(n[1]):null}const A={enabled:!1,endpoint:"https://api.openai.com/v1/chat/completions",apiKey:"",model:"gpt-4o-mini"},C="warikan.llm";function Z(){try{const e=localStorage.getItem(C);return e?{...A,...JSON.parse(e)}:{...A}}catch{return{...A}}}function ee(e){localStorage.setItem(C,JSON.stringify(e))}function P(e){return e.enabled&&!!e.apiKey&&!!e.endpoint&&!!e.model}const te="あなたは割り勘の入力を手伝うアシスタントです。ユーザーが貼り付けた明細やメモから、立替支出を抽出して指定のJSONだけを返します。余計な説明やコードフェンスは付けません。";async function ne(e,n,t){var a,l,u;if(!P(n))throw new Error("LLM未設定");if(!e.trim())return[];const o=`次のテキストから立替支出を抽出し、JSONのみを返してください。
フォーマット: {"expenses":[{"title":"居酒屋","amount":12000,"payer":"太郎"}]}
payer は誰が立て替えたか。可能なら次の名前から選ぶ: ${t.join(" / ")||"(未指定)"}。
amount は円の整数。タイトルは短く。

---
`+e,s=await fetch(n.endpoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n.apiKey}`},body:JSON.stringify({model:n.model,messages:[{role:"system",content:te},{role:"user",content:o}],temperature:.2,response_format:{type:"json_object"}})});if(!s.ok)throw new Error(`LLM APIエラー: ${s.status}`);const r=await s.json(),c=(u=(l=(a=r==null?void 0:r.choices)==null?void 0:a[0])==null?void 0:l.message)==null?void 0:u.content;if(typeof c!="string")throw new Error("LLM応答の形式が不正です");return re(c)}function re(e){const n=oe(e);let t;try{t=JSON.parse(n)}catch{return[]}const o=t==null?void 0:t.expenses;return Array.isArray(o)?o.map(s=>{const r=s??{};return{title:typeof r.title=="string"?r.title:"支出",amount:Math.max(0,Math.round(Number(r.amount)||0)),payer:typeof r.payer=="string"?r.payer:void 0}}).filter(s=>s.amount>0):[]}function oe(e){const n=e.trim(),t=/^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(n);return t?t[1]:n}let f=F(),y=K(),x=Z(),h=null,g=!1;const i=document.querySelector("#app");function p(){G(f),y&&z(y)}function j(){return f.find(e=>e.id===y)??null}function $(e){e.updatedAt=Date.now()}function m(e){return e.replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function S(e){return`¥${Math.round(e).toLocaleString("ja-JP")}`}function se(e){const n=E(e),t=N(n);i.innerHTML=`
    <header>
      <h1>👀 共有された割り勘</h1>
      <p class="sub">読み取り専用プレビュー。あなたの端末にはまだ保存されていません。</p>
    </header>
    <section class="card">
      <h2>${m(e.name)}</h2>
      <p class="muted">メンバー ${e.members.length}人 / 支出 ${e.expenses.length}件 / 総額 ${S(M(e))}</p>
      ${R(e,t)}
    </section>
    <div class="actions">
      <button id="import-shared" class="primary">この割り勘を取り込む</button>
      <button id="discard-shared">破棄して自分のデータを開く</button>
    </div>
    <footer>${q()}</footer>
  `,i.querySelector("#import-shared").addEventListener("click",()=>{const o=L({...e,id:b("g")});f.push(o),y=o.id,p(),O(),d()}),i.querySelector("#discard-shared").addEventListener("click",()=>{O(),d()})}function O(){typeof location<"u"&&history.replaceState(null,"",location.pathname+location.search)}function R(e,n){const o=E(e).map(r=>{const c=r.net>0?"pos":r.net<0?"neg":"zero",a=r.net>0?"受取":r.net<0?"支払":"±0";return`<tr>
        <td>${m(w(e.members,r.memberId))}</td>
        <td class="num">${S(r.paid)}</td>
        <td class="num">${S(r.owed)}</td>
        <td class="num ${c}">${r.net>0?"+":""}${S(r.net)} <span class="tag">${a}</span></td>
      </tr>`}).join(""),s=n.length===0?'<p class="muted">精算の必要はありません（全員清算済み）。</p>':'<ul class="settle">'+n.map(r=>`<li><strong>${m(w(e.members,r.from))}</strong> → <strong>${m(w(e.members,r.to))}</strong> <span class="amt">${S(r.amount)}</span></li>`).join("")+"</ul>";return`
    <h3>収支</h3>
    <table class="balances">
      <thead><tr><th>名前</th><th class="num">立替</th><th class="num">負担</th><th class="num">差引</th></tr></thead>
      <tbody>${o}</tbody>
    </table>
    <h3>精算（最小 ${n.length} 回の送金）</h3>
    ${s}
  `}function d(){if(typeof location<"u"){const t=X(location.hash);if(t){se(t);return}}if(f.length===0){ae();return}j()||(y=f[0].id);const e=j(),n=N(E(e));i.innerHTML=`
    <header>
      <h1>🧮 割り勘 <span class="brand">warikan</span></h1>
      <p class="sub">アカウント不要・この端末だけに保存。結果はURLで共有できます。</p>
    </header>

    <section class="card">
      <div class="grouprow">
        <label>グループ
          <select id="group-select">
            ${f.map(t=>`<option value="${t.id}" ${t.id===y?"selected":""}>${m(t.name)}</option>`).join("")}
          </select>
        </label>
        <button id="new-group">＋新規</button>
        <button id="rename-group">名前変更</button>
        <button id="delete-group" class="danger">削除</button>
      </div>
    </section>

    <section class="card">
      <h2>メンバー（${e.members.length}人）</h2>
      <div class="members">
        ${e.members.map(t=>`<span class="chip">${m(t.name)} <button class="rm-member" data-id="${t.id}" title="削除">×</button></span>`).join("")}
      </div>
      <form id="member-form" class="inline">
        <input id="member-name" type="text" placeholder="名前を追加" maxlength="20" />
        <button type="submit">追加</button>
      </form>
    </section>

    <section class="card">
      <h2>支出（${e.expenses.length}件 / 総額 ${S(M(e))}）</h2>
      ${e.members.length<1?'<p class="muted">先にメンバーを追加してください。</p>':ie(e)}
      ${ce(e)}
    </section>

    <section class="card result">
      ${R(e,n)}
    </section>

    <section class="card">
      <h2>共有・バックアップ</h2>
      <div class="actions">
        <button id="share-url" class="primary">共有リンクをコピー</button>
        <button id="export-json">JSONエクスポート</button>
        <button id="import-json">JSONインポート</button>
        <button id="toggle-llm">${g?"LLM設定を隠す":"AI明細取り込み"}</button>
      </div>
      <p id="share-msg" class="muted"></p>
      ${g?le():""}
    </section>

    <footer>${q()}</footer>
  `,de(e)}function ae(){i.innerHTML=`
    <header>
      <h1>🧮 割り勘 <span class="brand">warikan</span></h1>
      <p class="sub">アカウント不要・この端末だけに保存。結果はURLで共有できます。</p>
    </header>
    <section class="card">
      <h2>はじめる</h2>
      <p class="muted">旅行・飲み会・同棲など、精算したいグループを作成します。</p>
      <form id="first-group" class="inline">
        <input id="first-group-name" type="text" placeholder="グループ名（例: 沖縄旅行）" maxlength="30" />
        <button type="submit" class="primary">作成</button>
      </form>
    </section>
    <footer>${q()}</footer>
  `,i.querySelector("#first-group").addEventListener("submit",e=>{e.preventDefault();const n=(i.querySelector("#first-group-name").value||"").trim()||"割り勘";D(n)})}function ie(e){var s;const n=h?e.expenses.find(r=>r.id===h):null,t=r=>e.members.map(c=>`<option value="${c.id}" ${c.id===r?"selected":""}>${m(c.name)}</option>`).join(""),o=e.members.map(r=>{const c=n?n.participantIds.includes(r.id):!0;return`<label class="check"><input type="checkbox" class="part" value="${r.id}" ${c?"checked":""}/> ${m(r.name)}</label>`}).join("");return`
    <form id="expense-form" class="expense-form">
      <div class="row">
        <input id="ex-title" type="text" placeholder="項目（例: 居酒屋）" maxlength="40" value="${n?m(n.title):""}" />
        <input id="ex-amount" type="number" min="0" step="1" placeholder="金額" value="${n?n.amount:""}" />
        <label>立替
          <select id="ex-payer">${t((n==null?void 0:n.payerId)??((s=e.members[0])==null?void 0:s.id))}</select>
        </label>
      </div>
      <div class="parts">対象: ${o}</div>
      <div class="row">
        <button type="submit" class="primary">${n?"更新":"追加"}</button>
        ${n?'<button type="button" id="cancel-edit">キャンセル</button>':""}
      </div>
    </form>
  `}function ce(e){return e.expenses.length===0?'<p class="muted">まだ支出がありません。</p>':`<ul class="expenses">${[...e.expenses].sort((t,o)=>o.createdAt-t.createdAt).map(t=>`
      <li>
        <div class="ex-main">
          <span class="ex-title">${m(t.title)}</span>
          <span class="ex-amt">${S(t.amount)}</span>
        </div>
        <div class="ex-sub muted">
          ${m(w(e.members,t.payerId))} が立替 / 対象 ${t.participantIds.length}人
        </div>
        <div class="ex-actions">
          <button class="edit-ex" data-id="${t.id}">編集</button>
          <button class="del-ex danger" data-id="${t.id}">削除</button>
        </div>
      </li>`).join("")}</ul>`}function le(){return`
    <div class="llm">
      <p class="muted">明細やメモを貼ると AI が支出を抽出します（任意・OpenAI互換APIキーはこの端末のみに保存）。</p>
      <div class="row">
        <label><input type="checkbox" id="llm-enabled" ${x.enabled?"checked":""}/> 有効</label>
      </div>
      <div class="row">
        <input id="llm-endpoint" type="text" placeholder="エンドポイント" value="${m(x.endpoint)}" />
        <input id="llm-model" type="text" placeholder="モデル" value="${m(x.model)}" />
      </div>
      <div class="row">
        <input id="llm-key" type="password" placeholder="APIキー" value="${m(x.apiKey)}" />
        <button id="llm-save">設定を保存</button>
      </div>
      <textarea id="llm-text" placeholder="ここに明細/メモを貼り付け" rows="4"></textarea>
      <button id="llm-extract" ${P(x)?"":"disabled"}>AIで抽出して追加</button>
      <p id="llm-msg" class="muted"></p>
    </div>
  `}function q(){return"データはこの端末のブラウザ(localStorage)だけに保存され、サーバーには送信されません。"}function de(e){i.querySelector("#group-select").addEventListener("change",t=>{y=t.target.value,h=null,p(),d()}),i.querySelector("#new-group").addEventListener("click",()=>{const t=(prompt("新しいグループ名")||"").trim();t&&D(t)}),i.querySelector("#rename-group").addEventListener("click",()=>{const t=(prompt("グループ名を変更",e.name)||"").trim();t&&(e.name=t,$(e),p(),d())}),i.querySelector("#delete-group").addEventListener("click",()=>{var t;confirm(`「${e.name}」を削除しますか？この操作は取り消せません。`)&&(f=f.filter(o=>o.id!==e.id),y=((t=f[0])==null?void 0:t.id)??null,h=null,p(),d())}),i.querySelector("#member-form").addEventListener("submit",t=>{t.preventDefault();const s=(i.querySelector("#member-name").value||"").trim();s&&(e.members.push({id:b("m"),name:s}),$(e),p(),d())}),i.querySelectorAll(".rm-member").forEach(t=>{t.addEventListener("click",()=>{const o=t.dataset.id;if(!(e.expenses.some(r=>r.payerId===o||r.participantIds.includes(o))&&!confirm("このメンバーは支出に関係しています。削除すると関連も外れます。続けますか？"))){e.members=e.members.filter(r=>r.id!==o),e.expenses=e.expenses.filter(r=>r.payerId!==o);for(const r of e.expenses)r.participantIds=r.participantIds.filter(c=>c!==o),r.shares&&delete r.shares[o];$(e),p(),d()}})});const n=i.querySelector("#expense-form");if(n){n.addEventListener("submit",o=>{o.preventDefault();const s=(i.querySelector("#ex-title").value||"").trim()||"支出",r=Math.max(0,Math.round(Number(i.querySelector("#ex-amount").value)||0)),c=i.querySelector("#ex-payer").value,a=Array.from(i.querySelectorAll(".part:checked")).map(l=>l.value);if(r<=0){alert("金額を入力してください。");return}if(a.length===0){alert("対象メンバーを1人以上選んでください。");return}if(h){const l=e.expenses.find(u=>u.id===h);l&&(l.title=s,l.amount=r,l.payerId=c,l.participantIds=a),h=null}else e.expenses.push({id:b("e"),title:s,amount:r,payerId:c,participantIds:a,createdAt:Date.now()});$(e),p(),d()});const t=i.querySelector("#cancel-edit");t&&t.addEventListener("click",()=>{h=null,d()})}i.querySelectorAll(".edit-ex").forEach(t=>t.addEventListener("click",()=>{h=t.dataset.id,d()})),i.querySelectorAll(".del-ex").forEach(t=>t.addEventListener("click",()=>{e.expenses=e.expenses.filter(o=>o.id!==t.dataset.id),$(e),p(),d()})),i.querySelector("#share-url").addEventListener("click",async()=>{const t=W(e,location.href),o=i.querySelector("#share-msg");try{await navigator.clipboard.writeText(t),o.textContent="共有リンクをコピーしました。相手はアカウント不要で結果を見られます。"}catch{o.textContent=t}}),i.querySelector("#export-json").addEventListener("click",()=>{me(`warikan-${e.name}.json`,JSON.stringify(e,null,2))}),i.querySelector("#import-json").addEventListener("click",()=>{pe()}),i.querySelector("#toggle-llm").addEventListener("click",()=>{g=!g,d()}),g&&ue(e)}function ue(e){i.querySelector("#llm-save").addEventListener("click",()=>{x={enabled:i.querySelector("#llm-enabled").checked,endpoint:i.querySelector("#llm-endpoint").value.trim(),model:i.querySelector("#llm-model").value.trim(),apiKey:i.querySelector("#llm-key").value.trim()},ee(x),d()});const n=i.querySelector("#llm-extract");n&&n.addEventListener("click",async()=>{var s,r;const t=i.querySelector("#llm-text").value,o=i.querySelector("#llm-msg");o.textContent="抽出中…";try{const c=await ne(t,x,e.members.map(l=>l.name));let a=0;for(const l of c){const u=((s=e.members.find(I=>I.name===l.payer))==null?void 0:s.id)??((r=e.members[0])==null?void 0:r.id);if(!u)break;e.expenses.push({id:b("e"),title:l.title,amount:l.amount,payerId:u,participantIds:e.members.map(I=>I.id),createdAt:Date.now()}),a++}$(e),p(),o.textContent=`${a}件を追加しました。`,setTimeout(d,600)}catch(c){o.textContent=`抽出に失敗しました: ${c.message}`}})}function D(e){const n={id:b("g"),name:e,members:[],expenses:[],updatedAt:Date.now()};f.push(n),y=n.id,h=null,p(),d()}function me(e,n){const t=new Blob([n],{type:"application/json"}),o=URL.createObjectURL(t),s=document.createElement("a");s.href=o,s.download=e,s.click(),URL.revokeObjectURL(o)}function pe(){const e=document.createElement("input");e.type="file",e.accept="application/json",e.addEventListener("change",()=>{var o;const n=(o=e.files)==null?void 0:o[0];if(!n)return;const t=new FileReader;t.onload=()=>{try{const s=JSON.parse(String(t.result)),r=L({...s,id:b("g")});f.push(r),y=r.id,p(),d()}catch{alert("JSONの読み込みに失敗しました。")}},t.readAsText(n)}),e.click()}typeof window<"u"&&window.addEventListener("hashchange",d);d();
