(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&a(s)}).observe(document,{childList:!0,subtree:!0});function n(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(o){if(o.ep)return;o.ep=!0;const r=n(o);fetch(o.href,r)}})();const w=["必需","娯楽","文化","予備"],J={必需:"生きるのに必要（食費・家賃・光熱・交通・医療）",娯楽:"欲しいけど無くても困らない（外食・買い物・サブスク・趣味）",文化:"心を豊かに（書籍・映画・習い事・美術）",予備:"突発・想定外（冠婚葬祭・修理・急な出費）"},N={必需:"🍚",娯楽:"🎉",文化:"📚",予備:"🧰"};function tt(t){return{month:t,income:0,savingsGoal:0,budgets:{必需:0,娯楽:0,文化:0,予備:0}}}function A(t){const e=t.getFullYear(),n=String(t.getMonth()+1).padStart(2,"0");return`${e}-${n}`}function D(t){const e=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t.trim());return e?`${e[1]}-${e[2]}`:""}function F(t){const e=/^(\d{4})-(\d{2})$/.exec(t.trim());if(!e)return 30;const n=Number(e[1]),a=Number(e[2]);return new Date(n,a,0).getDate()}function et(t,e){const n=A(e),a=F(t);return n<t?0:n>t?a:Math.min(e.getDate(),a)}function nt(t){return Math.max(0,t.income-t.savingsGoal)}function P(t){return w.reduce((e,n)=>e+(t.budgets[n]||0),0)}function q(t,e){return t.filter(n=>D(n.date)===e)}function ot(t,e){const n={必需:0,娯楽:0,文化:0,予備:0};for(const a of q(t,e))n[a.category]=(n[a.category]||0)+(a.amount||0);return n}function G(t,e,n){const a=et(e,n);if(a<=0)return 0;const o=F(e);return Math.round(t/a*o)}function at(t,e,n,a,o){const r=G(n,a,o),s=e>0?n/e:n>0?1/0:0;return{category:t,budget:e,spent:n,remaining:e-n,ratio:s,projected:r,overBudget:n>e,projectedOver:e>0?r>e:n>0}}function rt(t,e,n){const a=t.month,o=ot(e,a),r=w.map(S=>at(S,t.budgets[S]||0,o[S]||0,a,n)),s=r.reduce((S,L)=>S+L.spent,0),b=G(s,a,n),y=nt(t),h=t.income-b;return{month:a,income:t.income,savingsGoal:t.savingsGoal,available:y,budgetTotal:P(t),spentTotal:s,remainingTotal:y-s,projectedSpent:b,projectedSavings:h,savingsOnTrack:h>=t.savingsGoal,byCategory:r}}function B(t){return[...t].sort((e,n)=>e.date!==n.date?e.date<n.date?1:-1:e.createdAt<n.createdAt?1:e.createdAt>n.createdAt?-1:0)}function u(t){return`${t<0?"-":""}¥${Math.abs(Math.round(t)).toLocaleString("ja-JP")}`}function st(t){const e=["date","amount","category","memo"],n=o=>/[",\n]/.test(o)?`"${o.replace(/"/g,'""')}"`:o,a=B(t).map(o=>[o.date,String(o.amount),o.category,n(o.memo??"")].join(","));return[e.join(","),...a].join(`
`)}const R="kakeibo.expenses",_="kakeibo.budgets";function ct(){const t=Math.random().toString(36).slice(2,8);return`ex_${Date.now().toString(36)}_${t}`}function x(t){const e=Math.round(Number(t));return Number.isFinite(e)&&e>=0?e:0}function K(t){return w.includes(t)}function it(t){return/^\d{4}-\d{2}-\d{2}$/.test(t.trim())}function Y(t){const e=(t.date??"").toString().trim();return{date:it(e)?e:U(),amount:x(t.amount),category:K(t.category)?t.category:"必需",memo:t.memo?t.memo.toString().trim():void 0}}function U(t=new Date){const e=t.getFullYear(),n=String(t.getMonth()+1).padStart(2,"0"),a=String(t.getDate()).padStart(2,"0");return`${e}-${n}-${a}`}function lt(t){if(typeof t!="object"||t===null)return!1;const e=t;return typeof e.id=="string"&&typeof e.date=="string"&&typeof e.amount=="number"&&K(e.category)}function z(){try{const t=localStorage.getItem(R);if(!t)return[];const e=JSON.parse(t);return Array.isArray(e)?e.filter(lt).map(n=>({...n,amount:x(n.amount),memo:n.memo?String(n.memo):void 0,createdAt:n.createdAt??new Date().toISOString()})):[]}catch{return[]}}function dt(t){try{localStorage.setItem(R,JSON.stringify(t))}catch{}}function V(t){return{...t,id:ct(),createdAt:new Date().toISOString()}}function ut(t){if(typeof t!="object"||t===null)return!1;const e=t;return typeof e.month=="string"&&typeof e.budgets=="object"}function mt(){try{const t=localStorage.getItem(_);if(!t)return{};const e=JSON.parse(t);if(typeof e!="object"||e===null)return{};const n={};for(const[a,o]of Object.entries(e))ut(o)&&(n[a]=H(o));return n}catch{return{}}}function H(t){var n;const e={必需:0,娯楽:0,文化:0,予備:0};for(const a of w)e[a]=x((n=t.budgets)==null?void 0:n[a]);return{month:t.month,income:x(t.income),savingsGoal:x(t.savingsGoal),budgets:e}}function pt(t){try{localStorage.setItem(_,JSON.stringify(t))}catch{}}function vt(t,e){return t[e]?H(t[e]):tt(e)}const M={enabled:!1,endpoint:"https://api.openai.com/v1/chat/completions",apiKey:"",model:"gpt-4o-mini"},X="kakeibo.llm";function ft(){try{const t=localStorage.getItem(X);return t?{...M,...JSON.parse(t)}:{...M}}catch{return{...M}}}function gt(t){localStorage.setItem(X,JSON.stringify(t))}function Q(t){return t.enabled&&!!t.apiKey&&!!t.endpoint&&!!t.model}const bt="あなたは家計簿の入力を手伝うアシスタントです。ユーザーが貼り付けたレシートや明細から、支出を抽出して指定のJSONだけを返します。余計な説明やコードフェンスは付けません。";async function yt(t,e,n){var b,y,h;if(!Q(e))throw new Error("LLM未設定");if(!t.trim())return[];const a=`次のテキストから支出を抽出し、JSONのみを返してください。
フォーマット: {"expenses":[{"date":"2026-06-30","amount":1200,"category":"必需","memo":"スーパー"}]}
category は 必需/娯楽/文化/予備 のいずれか。必需=食費や生活必需、娯楽=外食や趣味、文化=書籍や学び、予備=突発の出費。
date が不明な項目は ${n} を使う。amount は円の整数。

---
`+t,o=await fetch(e.endpoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e.apiKey}`},body:JSON.stringify({model:e.model,messages:[{role:"system",content:bt},{role:"user",content:a}],temperature:.2,response_format:{type:"json_object"}})});if(!o.ok)throw new Error(`LLM APIエラー: ${o.status}`);const r=await o.json(),s=(h=(y=(b=r==null?void 0:r.choices)==null?void 0:b[0])==null?void 0:y.message)==null?void 0:h.content;if(typeof s!="string")throw new Error("LLM応答の形式が不正です");return ht(s,n)}function ht(t,e){const n=St(t);let a;try{a=JSON.parse(n)}catch{throw new Error("LLM応答をJSONとして解釈できませんでした")}const o=a==null?void 0:a.expenses;return Array.isArray(o)?o.map(r=>{const s=r??{};return Y({...s,date:s.date||e})}).filter(r=>r.amount>0):[]}function St(t){const e=t.trim(),n=/^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(e);return n?n[1]:e}let c=z(),g=mt(),$=ft(),d=A(new Date),v=null;const W=document.querySelector("#app");function E(){dt(c)}function T(){pt(g)}function p(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function I(t,e){return t.map(n=>`<option value="${p(n)}"${n===e?" selected":""}>${p(n)}</option>`).join("")}function $t(){const t=new Set([d]);for(const e of c){const n=D(e.date);n&&t.add(n)}for(const e of Object.keys(g))t.add(e);return[...t].sort().reverse()}function f(){const t=new Date,e=vt(g,d),n=rt(e,c,t),a=B(q(c,d)),o=v?c.find(r=>r.id===v)??null:null;W.innerHTML=`
    <h1>📒 家計簿 <span class="brand">kakeibo</span></h1>
    <p class="sub">使う前に向き合う家計簿。データはこの端末のブラウザだけに保存され、サーバーには送られません。登録不要・無料。</p>

    <div class="card">
      <div class="monthbar">
        <label class="inline">対象月
          <select id="month-select">${I($t(),d)}</select>
        </label>
        <input type="month" id="month-pick" value="${d}" />
      </div>
    </div>

    ${wt(n)}

    ${xt(e,n.available)}

    <div class="card">
      <h2>${o?"✏️ 支出を編集":"➕ 支出を記録"}</h2>
      <form id="exp-form">
        <div class="grid">
          <div>
            <label>日付</label>
            <input name="date" type="date" value="${p((o==null?void 0:o.date)??Z())}" />
          </div>
          <div>
            <label>金額（円）</label>
            <input name="amount" type="number" min="0" step="1" inputmode="numeric" placeholder="例: 1200" value="${o?String(o.amount):""}" />
          </div>
          <div>
            <label>分類</label>
            <select name="category">${I(w,(o==null?void 0:o.category)??"必需")}</select>
          </div>
          <div class="full">
            <label>メモ（任意）</label>
            <input name="memo" autocomplete="off" placeholder="例: スーパー / ランチ" value="${p((o==null?void 0:o.memo)??"")}" />
          </div>
        </div>
        <p class="hint" id="cat-hint">${p(J[(o==null?void 0:o.category)??"必需"])}</p>
        <div class="row end">
          ${o?'<button type="button" class="ghost" id="cancel-edit">キャンセル</button>':""}
          <button type="submit">${o?"更新":"記録"}</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2>📋 ${p(d)} の支出（${a.length}件）</h2>
      ${a.length===0?'<p class="empty">この月の支出はまだありません。上のフォームから記録してください。</p>':`<ul class="items">${a.map(Lt).join("")}</ul>`}
      ${a.length>0?'<div class="row end"><button type="button" class="ghost" id="export-csv">CSV出力</button><button type="button" class="ghost" id="export-json">JSON出力</button></div>':""}
    </div>

    ${Et(n)}

    <div class="card">
      <details class="llm">
        <summary>🤖 LLM拡張（任意）— レシート/明細から支出を取り込む</summary>
        <p class="hint">レシートや明細を貼り付けて、支出を自動抽出します。OpenAI互換APIキーが必要です。<br>
        APIキーはこの端末のブラウザ（localStorage）にのみ保存され、サーバーには送られません。未設定でも本体機能はすべて使えます。</p>
        <div class="grid">
          <label class="inline full"><input type="checkbox" id="llm-enabled" ${$.enabled?"checked":""}/> LLM拡張を有効にする</label>
          <div class="full"><label>エンドポイント</label><input id="llm-endpoint" value="${p($.endpoint)}" /></div>
          <div><label>モデル</label><input id="llm-model" value="${p($.model)}" /></div>
          <div><label>APIキー</label><input id="llm-key" type="password" value="${p($.apiKey)}" placeholder="sk-..." /></div>
        </div>
        <div class="row end"><button type="button" class="ghost" id="llm-save">設定を保存</button></div>
        <div class="full" style="margin-top:10px">
          <label>取り込むテキスト</label>
          <textarea id="llm-text" rows="4" placeholder="例: 6/30 スーパー 2380円 / ランチ 980円 / 文庫本 760円"></textarea>
        </div>
        <div class="row end"><button type="button" id="llm-extract">抽出して追加</button></div>
        <p class="hint" id="llm-status"></p>
      </details>
    </div>

    <div class="card danger-zone">
      <div class="row" style="justify-content:space-between">
        <span class="hint">バックアップから戻す／全消去</span>
        <span>
          <label class="ghost-btn">JSON取り込み<input type="file" id="import-json" accept="application/json" hidden /></label>
          <button type="button" class="danger mini" id="wipe">全データ削除</button>
        </span>
      </div>
    </div>

    <footer>kakeibo — オフラインで動く家計簿。<a href="../">他のアプリ一覧</a></footer>
  `,Ot()}function Z(){const t=new Date;return A(t)===d?U(t):`${d}-01`}function wt(t){const e=t.available>0?Math.min(100,Math.round(t.spentTotal/t.available*100)):t.spentTotal>0?100:0,n=t.savingsOnTrack?"ok":"warn-text";return`
    <div class="card">
      <div class="badges">
        <div class="badge"><span class="num">${u(t.available)}</span><span class="lbl">使えるお金</span></div>
        <div class="badge"><span class="num">${u(t.spentTotal)}</span><span class="lbl">使った</span></div>
        <div class="badge ${t.remainingTotal<0?"over":""}"><span class="num">${u(t.remainingTotal)}</span><span class="lbl">残り</span></div>
      </div>
      <div class="bar" title="使えるお金に対する支出">
        <div class="bar-fill ${e>=100?"over":""}" style="width:${e}%"></div>
      </div>
      <p class="savings ${n}">
        ${t.savingsOnTrack?"✅":"⚠️"} このペースでの貯金見込み <b>${u(t.projectedSavings)}</b>
        （目標 ${u(t.savingsGoal)}）
      </p>
    </div>`}function xt(t,e){const n=P(t),a=n>e&&e>0,o=w.map(r=>`
      <div class="brow">
        <span class="bname">${N[r]} ${r}</span>
        <input class="bval" data-cat="${r}" type="number" min="0" step="1" inputmode="numeric" value="${t.budgets[r]||0}" />
      </div>`).join("");return`
    <div class="card">
      <details ${t.income===0?"open":""}>
        <summary>⚙️ ${p(d)} の予算設定（収入・貯金目標・4分類）</summary>
        <div class="grid" style="margin-top:10px">
          <div><label>今月の収入</label><input id="b-income" type="number" min="0" step="1" inputmode="numeric" value="${t.income||0}" /></div>
          <div><label>貯金目標</label><input id="b-savings" type="number" min="0" step="1" inputmode="numeric" value="${t.savingsGoal||0}" /></div>
        </div>
        <p class="hint">使えるお金 = 収入 − 貯金目標 = <b>${u(e)}</b>。これを4分類に配分します。</p>
        <div class="budgets">${o}</div>
        <p class="hint ${a?"warn-text":""}">配分合計 <b>${u(n)}</b> / 使えるお金 ${u(e)}${a?"（配分が使えるお金を超えています）":""}</p>
        <div class="row end">
          <button type="button" class="ghost" id="budget-auto">均等に自動配分</button>
          <button type="button" id="budget-save">予算を保存</button>
        </div>
      </details>
    </div>`}function Et(t){return`
    <div class="card">
      <h2>📊 分類別の予算ペース</h2>
      <p class="hint">「このペースだと月末に超過」を先回りで警告します（バーンレート予測）。━ は月末の着地予測位置。</p>
      ${t.byCategory.map(n=>{const a=n.budget>0?Math.min(100,Math.round(n.spent/n.budget*100)):n.spent>0?100:0,o=n.budget>0?Math.min(110,Math.round(n.projected/n.budget*100)):0,r=n.overBudget?"over":n.projectedOver?"pace":"",s=n.overBudget?`<span class="tag over">予算超過 ${u(-n.remaining)}</span>`:n.projectedOver?`<span class="tag pace">このペースだと月末 ${u(n.projected)}</span>`:`<span class="tag">残り ${u(n.remaining)}</span>`;return`
        <div class="cat">
          <div class="cat-head">
            <span class="bname">${N[n.category]} ${n.category}</span>
            <span class="cat-amt">${u(n.spent)} / ${u(n.budget)}</span>
          </div>
          <div class="bar small">
            <div class="bar-fill ${r}" style="width:${a}%"></div>
            ${o>a?`<div class="bar-proj" style="left:${Math.min(100,o)}%" title="月末予測"></div>`:""}
          </div>
          <div class="cat-note">${s}</div>
        </div>`}).join("")}
    </div>`}function Lt(t){return`
    <li class="item cat-${t.category}" data-id="${t.id}">
      <div class="body">
        <div class="name">${u(t.amount)} <span class="tag">${N[t.category]} ${t.category}</span></div>
        <div class="meta">${p(t.date)}${t.memo?" ・ "+p(t.memo):""}</div>
      </div>
      <div class="actions">
        <button class="mini ghost" data-act="edit">編集</button>
        <button class="mini danger" data-act="del">削除</button>
      </div>
    </li>`}function Ot(){var e,n,a,o,r,s,b,y,h,S,L;(e=document.querySelector("#month-select"))==null||e.addEventListener("change",l=>{d=l.target.value,v=null,f()}),(n=document.querySelector("#month-pick"))==null||n.addEventListener("change",l=>{const i=l.target.value;/^\d{4}-\d{2}$/.test(i)&&(d=i,v=null,f())}),(a=document.querySelector("#budget-save"))==null||a.addEventListener("click",kt),(o=document.querySelector("#budget-auto"))==null||o.addEventListener("click",()=>{const l=k("#b-income"),i=k("#b-savings"),m=Math.max(0,l-i),O=Math.floor(m/w.length);document.querySelectorAll(".bval").forEach(j=>{j.value=String(O)})});const t=document.querySelector("#exp-form");t.addEventListener("submit",l=>{l.preventDefault();const i=jt(t);i.amount<=0||(v?(c=c.map(m=>m.id===v?{...m,...i}:m),v=null):c=[...c,V(i)],E(),f())}),(r=t.querySelector('[name="category"]'))==null||r.addEventListener("change",l=>{const i=document.querySelector("#cat-hint"),m=l.target.value;i&&(i.textContent=J[m]??"")}),(s=document.querySelector("#cancel-edit"))==null||s.addEventListener("click",()=>{v=null,f()}),(b=document.querySelector("ul.items"))==null||b.addEventListener("click",l=>{var O;const i=l.target.closest("button");if(!i)return;const m=(O=i.closest("li.item"))==null?void 0:O.dataset.id;m&&(i.dataset.act==="del"?(c=c.filter(j=>j.id!==m),v===m&&(v=null),E(),f()):i.dataset.act==="edit"&&(v=m,f(),W.scrollIntoView({behavior:"smooth",block:"start"})))}),(y=document.querySelector("#export-csv"))==null||y.addEventListener("click",()=>{const l="\uFEFF"+st(q(c,d));C(`kakeibo-${d}.csv`,l,"text/csv;charset=utf-8")}),(h=document.querySelector("#export-json"))==null||h.addEventListener("click",()=>{const l=JSON.stringify({expenses:c,budgets:g},null,2);C("kakeibo-backup.json",l,"application/json")}),(S=document.querySelector("#import-json"))==null||S.addEventListener("change",Mt),(L=document.querySelector("#wipe"))==null||L.addEventListener("click",()=>{confirm("この端末のkakeiboデータ（支出・予算）を全て削除します。よろしいですか？")&&(c=[],g={},E(),T(),f())}),At()}function kt(){const t={month:d,income:k("#b-income"),savingsGoal:k("#b-savings"),budgets:{必需:0,娯楽:0,文化:0,予備:0}};document.querySelectorAll(".bval").forEach(e=>{const n=e.dataset.cat;t.budgets[n]=Math.max(0,Math.round(Number(e.value)||0))}),g={...g,[d]:t},T(),f()}function k(t){const e=document.querySelector(t);return Math.max(0,Math.round(Number(e==null?void 0:e.value)||0))}function jt(t){const e=new FormData(t);return Y({date:String(e.get("date")??""),amount:Number(e.get("amount")),category:e.get("category"),memo:e.get("memo")||void 0})}function C(t,e,n){const a=new Blob([e],{type:n}),o=URL.createObjectURL(a),r=document.createElement("a");r.href=o,r.download=t,r.click(),URL.revokeObjectURL(o)}function Mt(t){var a;const e=(a=t.target.files)==null?void 0:a[0];if(!e)return;const n=new FileReader;n.onload=()=>{try{const o=JSON.parse(String(n.result));Array.isArray(o.expenses)&&(c=Nt(o.expenses),E()),o.budgets&&typeof o.budgets=="object"&&(g={...g,...o.budgets},T()),f(),alert("取り込みました。")}catch{alert("JSONの読み込みに失敗しました。")}},n.readAsText(e)}function Nt(t){const e=JSON.stringify(t);try{localStorage.setItem("kakeibo.expenses",e)}catch{}return z()}function At(){var e,n;const t=document.querySelector("#llm-status");(e=document.querySelector("#llm-save"))==null||e.addEventListener("click",()=>{$={enabled:document.querySelector("#llm-enabled").checked,endpoint:document.querySelector("#llm-endpoint").value.trim(),model:document.querySelector("#llm-model").value.trim(),apiKey:document.querySelector("#llm-key").value.trim()},gt($),t.textContent="設定を保存しました。",t.className="hint"}),(n=document.querySelector("#llm-extract"))==null||n.addEventListener("click",async()=>{const a=document.querySelector("#llm-text").value;if(!Q($)){t.textContent="先にLLM拡張を有効化し、APIキー等を保存してください。",t.className="warn";return}t.textContent="抽出中…",t.className="hint";try{const o=await yt(a,$,Z());if(o.length===0){t.textContent="抽出できる支出が見つかりませんでした。",t.className="warn";return}c=[...c,...o.map(s=>V(s))],E(),f();const r=document.querySelector("#llm-status");r&&(r.textContent=`${o.length}件を追加しました。`,r.className="hint"),document.querySelector("details.llm").open=!0}catch(o){t.textContent=`失敗: ${o.message}`,t.className="warn"}})}f();
