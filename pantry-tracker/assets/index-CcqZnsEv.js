(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))o(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function n(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(a){if(a.ep)return;a.ep=!0;const r=n(a);fetch(a.href,r)}})();const x=["食品","飲料","調味料","冷凍","日用品","その他"],L=["冷蔵","冷凍","常温","その他"],_=["個","本","袋","パック","枚","g","kg","ml","L","缶","箱"],C=2,F=6,O={expired:0,soon:1,near:2,ok:3};function Y(e){const t=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e.trim());if(!t)return null;const n=Number(t[1]),o=Number(t[2]),a=Number(t[3]),r=new Date(n,o-1,a);return r.getFullYear()!==n||r.getMonth()!==o-1||r.getDate()!==a?null:r}function P(e){return new Date(e.getFullYear(),e.getMonth(),e.getDate())}function h(e,t){if(!e.expiry)return null;const n=Y(e.expiry);if(!n)return null;const o=P(t).getTime(),a=n.getTime();return Math.round((a-o)/864e5)}function v(e,t){const n=h(e,t);return n===null?"ok":n<0?"expired":n<=C?"soon":n<=F?"near":"ok"}function q(e){return e.minQty>0&&e.qty<=e.minQty}function A(e,t){return[...e].sort((n,o)=>{const a=O[v(n,t)],r=O[v(o,t)];if(a!==r)return a-r;const i=h(n,t),l=h(o,t);return i!==l?i===null?1:l===null?-1:i-l:n.name<o.name?-1:n.name>o.name?1:0})}function E(e,t,n){var a;const o=(a=t.query)==null?void 0:a.trim().toLowerCase();return e.filter(r=>{if(t.category&&r.category!==t.category||t.location&&r.location!==t.location||o&&!r.name.toLowerCase().includes(o))return!1;if(t.actionableOnly){const i=v(r,n);if(!(i==="expired"||i==="soon"||q(r)))return!1}return!0})}function j(e,t){const n={},o={};let a=0,r=0,i=0;for(const l of e){n[l.category]=(n[l.category]??0)+1,o[l.location]=(o[l.location]??0)+1;const s=v(l,t);s==="expired"?a++:s==="soon"&&r++,q(l)&&i++}return{total:e.length,expired:a,soon:r,lowStock:i,byCategory:n,byLocation:o}}const D="pantry-tracker.items";function J(){const e=Math.random().toString(36).slice(2,8);return`it_${Date.now().toString(36)}_${e}`}function M(e){const t=Number(e.qty),n=Number(e.minQty);return{name:(e.name??"").toString().trim(),qty:Number.isFinite(t)&&t>=0?t:1,unit:(e.unit??"").toString().trim()||"個",category:x.includes(e.category)?e.category:"その他",location:L.includes(e.location)?e.location:"常温",expiry:e.expiry?e.expiry.toString().trim():void 0,minQty:Number.isFinite(n)&&n>=0?n:0,note:e.note?e.note.toString().trim():void 0}}function R(e){if(typeof e!="object"||e===null)return!1;const t=e;return typeof t.id=="string"&&typeof t.name=="string"&&typeof t.qty=="number"&&typeof t.unit=="string"}function K(){try{const e=localStorage.getItem(D);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(R).map(n=>G(n)):[]}catch{return[]}}function G(e){return{...e,minQty:typeof e.minQty=="number"&&e.minQty>=0?e.minQty:0,createdAt:e.createdAt??new Date().toISOString(),updatedAt:e.updatedAt??e.createdAt??new Date().toISOString()}}function U(e){try{localStorage.setItem(D,JSON.stringify(e))}catch{}}function k(e){const t=new Date().toISOString();return{...e,id:J(),createdAt:t,updatedAt:t}}const w={enabled:!1,endpoint:"https://api.openai.com/v1/chat/completions",apiKey:"",model:"gpt-4o-mini"},Q="pantry-tracker.llm";function z(){try{const e=localStorage.getItem(Q);return e?{...w,...JSON.parse(e)}:{...w}}catch{return{...w}}}function H(e){localStorage.setItem(Q,JSON.stringify(e))}function I(e){return e.enabled&&!!e.apiKey&&!!e.endpoint&&!!e.model}const B="あなたは家庭の在庫を整理するアシスタントです。ユーザーが貼り付けたレシートやメモから、在庫アイテムを抽出して指定のJSONだけを返します。余計な説明やコードフェンスは付けません。";async function V(e,t){var i,l,s;if(!I(t))throw new Error("LLM未設定");if(!e.trim())return[];const n=`次のテキストから在庫アイテムを抽出し、JSONのみを返してください。
フォーマット: {"items":[{"name":"牛乳","qty":1,"unit":"本","category":"飲料","location":"冷蔵","expiry":"2026-07-01"}]}
category は 食品/飲料/調味料/冷凍/日用品/その他 のいずれか。location は 冷蔵/冷凍/常温/その他 のいずれか。expiry は分かる場合のみ YYYY-MM-DD。不明な項目は省略可。

---
`+e,o=await fetch(t.endpoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t.apiKey}`},body:JSON.stringify({model:t.model,messages:[{role:"system",content:B},{role:"user",content:n}],temperature:.2,response_format:{type:"json_object"}})});if(!o.ok)throw new Error(`LLM APIエラー: ${o.status}`);const a=await o.json(),r=(s=(l=(i=a==null?void 0:a.choices)==null?void 0:i[0])==null?void 0:l.message)==null?void 0:s.content;if(typeof r!="string")throw new Error("LLM応答の形式が不正です");return W(r)}function W(e){const t=X(e);let n;try{n=JSON.parse(t)}catch{throw new Error("LLM応答をJSONとして解釈できませんでした")}const o=n==null?void 0:n.items;return Array.isArray(o)?o.map(a=>M(a??{})).filter(a=>a.name.length>0):[]}function X(e){const t=e.trim(),n=/^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(t);return n?n[1]:t}let c=K(),m=z(),u=null;const p={},Z=document.querySelector("#app");function $(){U(c)}function d(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function S(e,t){return e.map(n=>`<option value="${d(n)}"${n===t?" selected":""}>${d(n)}</option>`).join("")}function ee(e,t){const n=h(e,t),o=v(e,t);return o==="expired"?`<span class="tag expired">期限切れ ${-n}日</span>`:o==="soon"?`<span class="tag soon">あと${n}日</span>`:o==="near"?`<span class="tag near">あと${n}日</span>`:e.expiry?`<span class="tag">${d(e.expiry)}</span>`:""}function f(){const e=new Date,t=j(c,e),n=A(E(c,p,e),e);Z.innerHTML=`
    <h1>🧺 在庫管理</h1>
    <p class="sub">家にある物を、消費期限と残量で管理。データはこの端末のブラウザだけに保存されます。</p>

    <div class="card">
      <div class="badges">
        <div class="badge expired"><span class="num">${t.expired}</span><span class="lbl">期限切れ</span></div>
        <div class="badge soon"><span class="num">${t.soon}</span><span class="lbl">3日以内</span></div>
        <div class="badge low"><span class="num">${t.lowStock}</span><span class="lbl">残量わずか</span></div>
        <div class="badge"><span class="num">${t.total}</span><span class="lbl">総アイテム</span></div>
      </div>
    </div>

    <div class="card">
      <h2>${u?"✏️ 在庫を編集":"➕ 在庫を追加"}</h2>
      <form id="item-form">
        <div class="grid">
          <div class="full">
            <label>品名 *</label>
            <input name="name" required placeholder="例: 牛乳" autocomplete="off" />
          </div>
          <div>
            <label>数量</label>
            <input name="qty" type="number" min="0" step="any" value="1" />
          </div>
          <div>
            <label>単位</label>
            <input name="unit" list="units" value="個" autocomplete="off" />
            <datalist id="units">${S(_)}</datalist>
          </div>
          <div>
            <label>カテゴリ</label>
            <select name="category">${S(x)}</select>
          </div>
          <div>
            <label>保管場所</label>
            <select name="location">${S(L)}</select>
          </div>
          <div>
            <label>消費/賞味期限（任意）</label>
            <input name="expiry" type="date" />
          </div>
          <div>
            <label>最低在庫（0=通知なし）</label>
            <input name="minQty" type="number" min="0" step="any" value="0" />
          </div>
          <div class="full">
            <label>メモ（任意）</label>
            <input name="note" autocomplete="off" />
          </div>
        </div>
        <div class="row end">
          ${u?'<button type="button" class="ghost" id="cancel-edit">キャンセル</button>':""}
          <button type="submit">${u?"更新":"追加"}</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2>📋 在庫一覧</h2>
      <div class="filters">
        <select id="f-category"><option value="">カテゴリ：全部</option>${S(x,p.category)}</select>
        <select id="f-location"><option value="">場所：全部</option>${S(L,p.location)}</select>
        <label class="inline"><input type="checkbox" id="f-actionable" ${p.actionableOnly?"checked":""}/> 要対応のみ</label>
        <input id="f-query" placeholder="品名で検索" value="${d(p.query??"")}" style="flex:1;min-width:120px" />
      </div>
      ${n.length===0?`<p class="empty">${c.length===0?"まだ在庫がありません。上のフォームから追加してください。":"条件に合う在庫がありません。"}</p>`:`<ul class="items">${n.map(o=>T(o,e)).join("")}</ul>`}
    </div>

    <div class="card">
      <details class="llm" ${I(m),""}>
        <summary>🤖 LLM拡張（任意）— テキストから在庫を取り込む</summary>
        <p class="hint">レシートやメモを貼り付けて、在庫アイテムを自動抽出します。OpenAI互換APIキーが必要です。<br>
        APIキーはこの端末のブラウザ（localStorage）にのみ保存され、サーバーには送られません。未設定でも本体機能はすべて使えます。</p>
        <div class="grid">
          <label class="inline full"><input type="checkbox" id="llm-enabled" ${m.enabled?"checked":""}/> LLM拡張を有効にする</label>
          <div class="full"><label>エンドポイント</label><input id="llm-endpoint" value="${d(m.endpoint)}" /></div>
          <div><label>モデル</label><input id="llm-model" value="${d(m.model)}" /></div>
          <div><label>APIキー</label><input id="llm-key" type="password" value="${d(m.apiKey)}" placeholder="sk-..." /></div>
        </div>
        <div class="row end"><button type="button" class="ghost" id="llm-save">設定を保存</button></div>
        <div class="full" style="margin-top:10px">
          <label>取り込むテキスト</label>
          <textarea id="llm-text" rows="4" placeholder="例: 牛乳1本 2026-07-01まで / 卵1パック / トイレットペーパー2袋"></textarea>
        </div>
        <div class="row end"><button type="button" id="llm-extract">抽出して追加</button></div>
        <p class="hint" id="llm-status"></p>
      </details>
    </div>

    <footer>pantry-tracker — オフラインで動く在庫管理。<a href="../">他のアプリ一覧</a></footer>
  `,ne()}function T(e,t){const n=v(e,t),o=q(e);return`
    <li class="item ${n}" data-id="${e.id}">
      <div class="body">
        <div class="name">${d(e.name)}</div>
        <div class="meta">
          <span class="tag">${d(e.category)}</span>
          <span class="tag">${d(e.location)}</span>
          ${ee(e,t)}
          ${o?'<span class="tag low">残量わずか</span>':""}
          ${e.note?d(e.note):""}
        </div>
      </div>
      <div class="qty">
        <button class="mini ghost" data-act="dec" title="減らす">−</button>
        <span class="val">${te(e.qty)}${d(e.unit)}</span>
        <button class="mini ghost" data-act="inc" title="増やす">＋</button>
      </div>
      <div class="actions">
        <button class="mini ghost" data-act="edit">編集</button>
        <button class="mini danger" data-act="del">削除</button>
      </div>
    </li>`}function te(e){return Number.isInteger(e)?String(e):e.toFixed(1)}function ne(e){var o,a,r;const t=document.querySelector("#item-form");if(u){const i=c.find(l=>l.id===u);i&&oe(t,i)}t.addEventListener("submit",i=>{i.preventDefault();const l=ae(t);l.name&&(u?(c=c.map(s=>s.id===u?{...s,...l,updatedAt:new Date().toISOString()}:s),u=null):c=[...c,k(l)],$(),f())}),(o=document.querySelector("#cancel-edit"))==null||o.addEventListener("click",()=>{u=null,f()}),(a=document.querySelector("ul.items"))==null||a.addEventListener("click",i=>{const l=i.target.closest("button");if(!l)return;const s=l.closest("li.item"),y=s==null?void 0:s.dataset.id;if(!y)return;const b=l.dataset.act;b==="del"?(c=c.filter(g=>g.id!==y),u===y&&(u=null)):b==="edit"?u=y:(b==="inc"||b==="dec")&&(c=c.map(g=>g.id===y?{...g,qty:Math.max(0,+(g.qty+(b==="inc"?1:-1)).toFixed(2)),updatedAt:new Date().toISOString()}:g)),$(),f()}),N("#f-category","category"),N("#f-location","location"),(r=document.querySelector("#f-actionable"))==null||r.addEventListener("change",i=>{p.actionableOnly=i.target.checked,f()});const n=document.querySelector("#f-query");n==null||n.addEventListener("input",()=>{p.query=n.value;const i=new Date,l=A(E(c,p,i),i),s=document.querySelector("ul.items");s&&(s.innerHTML=l.map(y=>T(y,i)).join(""))}),re()}function N(e,t){var n;(n=document.querySelector(e))==null||n.addEventListener("change",o=>{const a=o.target.value;p[t]=a||void 0,f()})}function ae(e){const t=new FormData(e);return M({name:String(t.get("name")??""),qty:Number(t.get("qty")),unit:String(t.get("unit")??""),category:t.get("category"),location:t.get("location"),expiry:t.get("expiry")||void 0,minQty:Number(t.get("minQty")),note:t.get("note")||void 0})}function oe(e,t){e.elements.namedItem("name").value=t.name,e.elements.namedItem("qty").value=String(t.qty),e.elements.namedItem("unit").value=t.unit,e.elements.namedItem("category").value=t.category,e.elements.namedItem("location").value=t.location,e.elements.namedItem("expiry").value=t.expiry??"",e.elements.namedItem("minQty").value=String(t.minQty),e.elements.namedItem("note").value=t.note??""}function re(){var t,n;const e=document.querySelector("#llm-status");(t=document.querySelector("#llm-save"))==null||t.addEventListener("click",()=>{m={enabled:document.querySelector("#llm-enabled").checked,endpoint:document.querySelector("#llm-endpoint").value.trim(),model:document.querySelector("#llm-model").value.trim(),apiKey:document.querySelector("#llm-key").value.trim()},H(m),e.textContent="設定を保存しました。",e.className="hint"}),(n=document.querySelector("#llm-extract"))==null||n.addEventListener("click",async()=>{const o=document.querySelector("#llm-text").value;if(!I(m)){e.textContent="先にLLM拡張を有効化し、APIキー等を保存してください。",e.className="warn";return}e.textContent="抽出中…",e.className="hint";try{const a=await V(o,m);if(a.length===0){e.textContent="抽出できる在庫が見つかりませんでした。",e.className="warn";return}c=[...c,...a.map(i=>k(i))],$(),f();const r=document.querySelector("#llm-status");r&&(r.textContent=`${a.length}件を追加しました。`,r.className="hint"),document.querySelector("details.llm").open=!0}catch(a){e.textContent=`失敗: ${a.message}`,e.className="warn"}})}f();
