(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function n(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(r){if(r.ep)return;r.ep=!0;const s=n(r);fetch(r.href,s)}})();const X=["again","hard","good","easy"],j={again:{label:"もう一度",quality:2,hint:"思い出せなかった"},hard:{label:"むずかしい",quality:3,hint:"なんとか思い出した"},good:{label:"ふつう",quality:4,hint:"思い出せた"},easy:{label:"かんたん",quality:5,hint:"余裕で思い出せた"}},R=2.5,C=1.3,Z=[{name:"サンプル：四字熟語",cards:[{front:"一期一会",back:"一生に一度の出会い。その機会を大切にすること。"},{front:"温故知新",back:"古いことを学び、そこから新しい知識・見解を得ること。"},{front:"臨機応変",back:"その場の状況に応じて適切に対応すること。"},{front:"千載一遇",back:"めったに訪れない、またとない好機。"}]}];function tt(t){const e=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t.trim());if(!e)return null;const n=Number(e[1]),a=Number(e[2]),r=Number(e[3]),s=new Date(n,a-1,r);return s.getFullYear()!==n||s.getMonth()!==a-1||s.getDate()!==r?null:s}function F(t){const e=t.getFullYear(),n=String(t.getMonth()+1).padStart(2,"0"),a=String(t.getDate()).padStart(2,"0");return`${e}-${n}-${a}`}function D(t){return new Date(t.getFullYear(),t.getMonth(),t.getDate())}function et(t,e){const n=D(t);return n.setDate(n.getDate()+e),F(n)}function nt(t,e,n){const a=j[e].quality;let{repetitions:r,interval:s,easeFactor:c}=t;return a<3?(r=0,s=1):(r===0?s=1:r===1?s=6:s=Math.round(s*c),r+=1),c+=.1-(5-a)*(.08+(5-a)*.02),c<C&&(c=C),c=Math.round(c*100)/100,{repetitions:r,interval:s,easeFactor:c,due:et(n,s),reviews:t.reviews+1,lastReviewed:F(D(n))}}function rt(t,e,n){const a=nt(t,e,n);return{...t,...a,updatedAt:new Date(n.getTime()).toISOString()}}function x(t){return!t.due||t.reviews===0}function _(t,e){if(x(t))return!0;const n=t.due?tt(t.due):null;return n?n.getTime()<=D(e).getTime():!0}function st(t,e){const n=[],a=[];for(const r of t)_(r,e)&&(x(r)?a.push(r):n.push(r));return n.sort((r,s)=>{const c=r.due??"",i=s.due??"";return c!==i?c<i?-1:1:r.createdAt<s.createdAt?-1:r.createdAt>s.createdAt?1:0}),a.sort((r,s)=>r.createdAt<s.createdAt?-1:r.createdAt>s.createdAt?1:0),[...n,...a]}function J(t,e){let n=0,a=0,r=0,s=0;for(const c of t){if(x(c)){n++;continue}r++,_(c,e)?a++:s++}return{total:t.length,fresh:n,due:a,learned:r,later:s}}const P="flashcards.decks",T="flashcards.cards",E="flashcards.seeded";function K(t){const e=Math.random().toString(36).slice(2,8);return`${t}_${Date.now().toString(36)}_${e}`}function Y(t){if(typeof t!="object"||t===null)return!1;const e=t;return typeof e.id=="string"&&typeof e.name=="string"}function B(t){if(typeof t!="object"||t===null)return!1;const e=t;return typeof e.id=="string"&&typeof e.deckId=="string"&&typeof e.front=="string"&&typeof e.back=="string"}function H(t){const e=new Date().toISOString(),n=(a,r)=>typeof a=="number"&&Number.isFinite(a)?a:r;return{id:String(t.id),deckId:String(t.deckId),front:String(t.front),back:String(t.back),repetitions:Math.max(0,Math.trunc(n(t.repetitions,0))),interval:Math.max(0,n(t.interval,0)),easeFactor:n(t.easeFactor,R),due:typeof t.due=="string"?t.due:void 0,reviews:Math.max(0,Math.trunc(n(t.reviews,0))),lastReviewed:typeof t.lastReviewed=="string"?t.lastReviewed:void 0,createdAt:typeof t.createdAt=="string"?t.createdAt:e,updatedAt:typeof t.updatedAt=="string"?t.updatedAt:typeof t.createdAt=="string"?t.createdAt:e}}function U(){try{const t=localStorage.getItem(P);if(!t)return[];const e=JSON.parse(t);return Array.isArray(e)?e.filter(Y):[]}catch{return[]}}function at(){try{const t=localStorage.getItem(T);if(!t)return[];const e=JSON.parse(t);return Array.isArray(e)?e.filter(B).map(H):[]}catch{return[]}}function z(t){try{localStorage.setItem(P,JSON.stringify(t))}catch{}}function G(t){try{localStorage.setItem(T,JSON.stringify(t))}catch{}}function Q(t){return{id:K("dk"),name:t.trim()||"無題のデッキ",createdAt:new Date().toISOString()}}function O(t,e){const n=new Date().toISOString();return{id:K("cd"),deckId:t,front:e.front.trim(),back:e.back.trim(),repetitions:0,interval:0,easeFactor:R,reviews:0,createdAt:n,updatedAt:n}}function ct(){try{if(localStorage.getItem(E))return null;if(U().length>0)return localStorage.setItem(E,"1"),null}catch{return null}const t=[],e=[];for(const n of Z){const a=Q(n.name);t.push(a);for(const r of n.cards)e.push(O(a.id,r))}z(t),G(e);try{localStorage.setItem(E,"1")}catch{}return{decks:t,cards:e}}function it(t,e){return{version:1,decks:t,cards:e}}function ot(t){let e;try{e=JSON.parse(t)}catch{return null}if(typeof e!="object"||e===null)return null;const n=e,a=Array.isArray(n.decks)?n.decks.filter(Y):[],r=Array.isArray(n.cards)?n.cards.filter(B).map(H):[];return a.length===0&&r.length===0?null:{decks:a,cards:r}}const I={enabled:!1,endpoint:"https://api.openai.com/v1/chat/completions",apiKey:"",model:"gpt-4o-mini"},V="flashcards.llm";function dt(){try{const t=localStorage.getItem(V);return t?{...I,...JSON.parse(t)}:{...I}}catch{return{...I}}}function lt(t){localStorage.setItem(V,JSON.stringify(t))}function $(t){return t.enabled&&!!t.apiKey&&!!t.endpoint&&!!t.model}const ut="あなたは学習者のための暗記カード作成アシスタントです。ユーザーが貼り付けたノートや文章から、暗記に適した一問一答のQ&Aカードを作り、指定のJSONだけを返します。余計な説明やコードフェンスは付けません。";async function ft(t,e){var c,i,l;if(!$(e))throw new Error("LLM未設定");if(!t.trim())return[];const n=`次のテキストから暗記カード（一問一答）を作り、JSONのみを返してください。
フォーマット: {"cards":[{"front":"問い","back":"答え"}]}
- front は短い問い、back は簡潔な答え。
- 1枚に1論点。重要な用語・定義・因果・数値を優先。
- 元テキストに無い情報は作らない。

---
`+t,a=await fetch(e.endpoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e.apiKey}`},body:JSON.stringify({model:e.model,messages:[{role:"system",content:ut},{role:"user",content:n}],temperature:.3,response_format:{type:"json_object"}})});if(!a.ok)throw new Error(`LLM APIエラー: ${a.status}`);const r=await a.json(),s=(l=(i=(c=r==null?void 0:r.choices)==null?void 0:c[0])==null?void 0:i.message)==null?void 0:l.content;if(typeof s!="string")throw new Error("LLM応答の形式が不正です");return pt(s)}function pt(t){const e=mt(t);let n;try{n=JSON.parse(e)}catch{throw new Error("LLM応答をJSONとして解釈できませんでした")}const a=n==null?void 0:n.cards;return Array.isArray(a)?a.map(r=>{const s=r??{};return{front:(s.front??"").toString().trim(),back:(s.back??"").toString().trim()}}).filter(r=>r.front.length>0&&r.back.length>0):[]}function mt(t){const e=t.trim(),n=/^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(e);return n?n[1]:e}ct();let p=U(),o=at(),v=dt(),S="home",b=null,f=null,h=[],w=null;const L=document.querySelector("#app");function g(){z(p),G(o)}function m(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function q(t){return o.filter(e=>e.deckId===t)}function W(){return p.find(t=>t.id===b)}function u(){S==="study"&&w?kt():S==="deck"&&W()?bt():(S="home",vt())}function vt(){const t=new Date;L.innerHTML=`
    <h1>🧠 暗記カード</h1>
    <p class="sub">テキストを貼ればAIがカードを自動生成。SM-2間隔反復で効率よく覚えられます。データはこの端末のブラウザにのみ保存されます。</p>

    <div class="card">
      <div class="row between">
        <h2>📚 デッキ</h2>
        <button id="new-deck">＋ 新しいデッキ</button>
      </div>
      ${p.length===0?'<p class="empty">まだデッキがありません。「＋ 新しいデッキ」から始めましょう。</p>':`<ul class="decks">${p.map(e=>ht(e,t)).join("")}</ul>`}
    </div>

    ${wt()}

    <div class="card">
      <details>
        <summary>💾 バックアップ（エクスポート / インポート）</summary>
        <p class="hint">この端末のデータをJSONで書き出し・読み込みできます。別の端末への移行やバックアップに使えます。インポートは既存データに追加されます。</p>
        <div class="row">
          <button type="button" class="ghost" id="export">エクスポート</button>
          <button type="button" class="ghost" id="import-btn">インポート</button>
          <input type="file" id="import-file" accept="application/json" hidden />
        </div>
        <p class="hint" id="io-status"></p>
      </details>
    </div>

    <footer>flashcards — オフラインで動く暗記カード。<a href="../">他のアプリ一覧</a></footer>
  `,$t()}function ht(t,e){const n=J(q(t.id),e);return`
    <li class="deck" data-id="${t.id}">
      <div class="body">
        <div class="name">${m(t.name)}</div>
        <div class="meta">
          <span class="tag total">${n.total}枚</span>
          ${n.due>0?`<span class="tag due">復習 ${n.due}</span>`:""}
          ${n.fresh>0?`<span class="tag fresh">新規 ${n.fresh}</span>`:""}
          ${n.due===0&&n.fresh===0?'<span class="tag done">今日はなし</span>':""}
        </div>
      </div>
      <div class="actions">
        <button class="mini ghost" data-act="open">開く</button>
        <button class="mini danger" data-act="del-deck">削除</button>
      </div>
    </li>`}function bt(){const t=new Date,e=W(),n=q(e.id),a=J(n,t),r=a.due+a.fresh;L.innerHTML=`
    <div class="row between top">
      <button class="ghost back" id="to-home">← デッキ一覧</button>
    </div>
    <h1>${m(e.name)}</h1>

    <div class="card">
      <div class="badges">
        <div class="badge due"><span class="num">${a.due}</span><span class="lbl">復習</span></div>
        <div class="badge fresh"><span class="num">${a.fresh}</span><span class="lbl">新規</span></div>
        <div class="badge"><span class="num">${a.total}</span><span class="lbl">総カード</span></div>
      </div>
      <div class="row end" style="margin-top:12px">
        <button id="start-study" ${r===0?"disabled":""}>
          ${r===0?"今日の学習は完了":`▶ 今日の学習（${r}枚）`}
        </button>
      </div>
    </div>

    <div class="card">
      <h2>🤖 AIでカードを作る</h2>
      <p class="hint">ノートや教科書の文章を貼り付けて「カードを生成」を押すと、AIが一問一答に変換します。プレビューで選んでから追加できます。${$(v)?"":"<br><b>LLM拡張が未設定です。</b>下部の「LLM拡張」で有効化してください（無料で手動追加も使えます）。"}</p>
      <textarea id="ai-text" rows="5" placeholder="例: 鎌倉幕府は1192年に源頼朝が開いた。執権は北条氏が世襲した。&#10;ここに覚えたい内容を貼り付け…"></textarea>
      <div class="row end"><button type="button" id="ai-gen" ${$(v)?"":"disabled"}>カードを生成</button></div>
      <p class="hint" id="ai-status"></p>
      ${h.length>0?yt():""}
    </div>

    <div class="card">
      <h2>${f?"✏️ カードを編集":"✍️ 手動でカードを追加"}</h2>
      <form id="card-form">
        <div class="full"><label>表（問い）*</label><textarea name="front" rows="2" required placeholder="例: 鎌倉幕府の成立年は？"></textarea></div>
        <div class="full" style="margin-top:8px"><label>裏（答え）*</label><textarea name="back" rows="2" required placeholder="例: 1192年（諸説あり）"></textarea></div>
        <div class="row end">
          ${f?'<button type="button" class="ghost" id="cancel-edit">キャンセル</button>':""}
          <button type="submit">${f?"更新":"追加"}</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2>🗂️ カード一覧（${n.length}）</h2>
      ${n.length===0?'<p class="empty">まだカードがありません。AI生成か手動追加で作りましょう。</p>':`<ul class="cardlist">${n.map(gt).join("")}</ul>`}
    </div>

    <footer>flashcards — <a href="../">他のアプリ一覧</a></footer>
  `,At()}function yt(){return`
    <div class="preview">
      <div class="row between">
        <b>生成結果（${h.length}枚）</b>
        <label class="inline"><input type="checkbox" id="prev-all" checked /> 全選択</label>
      </div>
      <ul class="cardlist">
        ${h.map((t,e)=>`
          <li class="pcard">
            <label class="inline"><input type="checkbox" class="prev-chk" data-i="${e}" checked /></label>
            <div class="body">
              <div class="front">${m(t.front)}</div>
              <div class="back">${m(t.back)}</div>
            </div>
          </li>`).join("")}
      </ul>
      <div class="row end">
        <button type="button" class="ghost" id="prev-discard">破棄</button>
        <button type="button" id="prev-add">選択したカードを追加</button>
      </div>
    </div>`}function gt(t){const e=t.reviews===0?"新規":t.due?`次回 ${t.due}`:"";return`
    <li class="ccard" data-id="${t.id}">
      <div class="body">
        <div class="front">${m(t.front)}</div>
        <div class="back">${m(t.back)}</div>
        ${e?`<div class="meta"><span class="tag">${m(e)}</span></div>`:""}
      </div>
      <div class="actions">
        <button class="mini ghost" data-act="edit">編集</button>
        <button class="mini danger" data-act="del">削除</button>
      </div>
    </li>`}function kt(){var a,r;const t=w;if(t.idx>=t.queue.length){L.innerHTML=`
      <h1>🎉 おつかれさま！</h1>
      <div class="card center">
        <p class="big">このデッキの今日の学習が終わりました。</p>
        <p class="hint">${t.reviewed}枚を復習しました。</p>
        <div class="row center" style="margin-top:12px">
          <button id="study-home">デッキ一覧へ</button>
          <button class="ghost" id="study-deck">このデッキを開く</button>
        </div>
      </div>`,(a=document.querySelector("#study-home"))==null||a.addEventListener("click",()=>N()),(r=document.querySelector("#study-deck"))==null||r.addEventListener("click",()=>A(t.deckId));return}const e=t.queue[t.idx],n=t.queue.length-t.idx;L.innerHTML=`
    <div class="row between top">
      <button class="ghost back" id="study-quit">× 中断</button>
      <span class="counter">あと ${n} 枚</span>
    </div>
    <div class="card study">
      <div class="face front">${m(e.front).replace(/\n/g,"<br>")}</div>
      ${t.showBack?`<hr><div class="face back">${m(e.back).replace(/\n/g,"<br>")}</div>`:""}
    </div>
    ${t.showBack?`<div class="grades">${X.map(St).join("")}</div>`:'<div class="row center"><button id="reveal" class="wide">答えを見る</button></div>'}
  `,Et()}function St(t){const e=j[t];return`<button class="grade g-${t}" data-grade="${t}">
    <span class="gl">${e.label}</span><span class="gh">${e.hint}</span>
  </button>`}function wt(){return`
    <div class="card">
      <details class="llm" ${$(v),""}>
        <summary>🤖 LLM拡張（任意）— AIカード生成を有効にする</summary>
        <p class="hint">OpenAI互換のAPIキーを設定すると、デッキ画面でテキストからカードを自動生成できます。<br>
        APIキーはこの端末のブラウザ（localStorage）にのみ保存され、サーバーには送られません。未設定でも手動追加・学習はすべて使えます。</p>
        <div class="grid">
          <label class="inline full"><input type="checkbox" id="llm-enabled" ${v.enabled?"checked":""}/> LLM拡張を有効にする</label>
          <div class="full"><label>エンドポイント</label><input id="llm-endpoint" value="${m(v.endpoint)}" /></div>
          <div><label>モデル</label><input id="llm-model" value="${m(v.model)}" /></div>
          <div><label>APIキー</label><input id="llm-key" type="password" value="${m(v.apiKey)}" placeholder="sk-..." /></div>
        </div>
        <div class="row end"><button type="button" class="ghost" id="llm-save">設定を保存</button></div>
        <p class="hint" id="llm-status"></p>
      </details>
    </div>`}function N(){S="home",b=null,f=null,h=[],w=null,u()}function A(t){S="deck",b=t,f=null,h=[],u()}function $t(){var t,e;(t=document.querySelector("#new-deck"))==null||t.addEventListener("click",()=>{const n=prompt("デッキ名を入力してください","新しいデッキ");if(n===null)return;const a=Q(n);p=[...p,a],g(),A(a.id)}),(e=document.querySelector("ul.decks"))==null||e.addEventListener("click",n=>{const a=n.target.closest("button"),r=n.target.closest("li.deck"),s=r==null?void 0:r.dataset.id;if(!s)return;if((a==null?void 0:a.dataset.act)==="del-deck"){const i=p.find(d=>d.id===s),l=q(s).length;if(!confirm(`「${i==null?void 0:i.name}」を削除しますか？カード${l}枚も削除されます。`))return;p=p.filter(d=>d.id!==s),o=o.filter(d=>d.deckId!==s),g(),u()}else A(s)}),It(),Lt()}function Lt(){var n,a;const t=document.querySelector("#io-status");(n=document.querySelector("#export"))==null||n.addEventListener("click",()=>{const r=JSON.stringify(it(p,o),null,2),s=new Blob([r],{type:"application/json"}),c=URL.createObjectURL(s),i=document.createElement("a");i.href=c,i.download="flashcards-backup.json",i.click(),URL.revokeObjectURL(c)});const e=document.querySelector("#import-file");(a=document.querySelector("#import-btn"))==null||a.addEventListener("click",()=>e==null?void 0:e.click()),e==null||e.addEventListener("change",async()=>{var M;const r=(M=e.files)==null?void 0:M[0];if(!r)return;const s=await r.text(),c=ot(s);if(!c){t&&(t.textContent="読み込めませんでした（形式が不正です）。",t.className="warn");return}const i=new Set(p.map(y=>y.id)),l=new Set(o.map(y=>y.id)),d=c.decks.filter(y=>!i.has(y.id)),k=c.cards.filter(y=>!l.has(y.id));p=[...p,...d],o=[...o,...k],g(),u()})}function At(){var e,n,a,r;(e=document.querySelector("#to-home"))==null||e.addEventListener("click",()=>N()),(n=document.querySelector("#start-study"))==null||n.addEventListener("click",()=>{const s=new Date,c=st(q(b),s);c.length!==0&&(w={deckId:b,queue:c,idx:0,showBack:!1,reviewed:0},S="study",u())});const t=document.querySelector("#card-form");if(f){const s=o.find(c=>c.id===f);s&&(t.elements.namedItem("front").value=s.front,t.elements.namedItem("back").value=s.back)}t.addEventListener("submit",s=>{s.preventDefault();const c=new FormData(t),i=String(c.get("front")??"").trim(),l=String(c.get("back")??"").trim();!i||!l||(f?(o=o.map(d=>d.id===f?{...d,front:i,back:l,updatedAt:new Date().toISOString()}:d),f=null):o=[...o,O(b,{front:i,back:l})],g(),u())}),(a=document.querySelector("#cancel-edit"))==null||a.addEventListener("click",()=>{f=null,u()}),(r=document.querySelector("ul.cardlist"))==null||r.addEventListener("click",s=>{const c=s.target.closest("button");if(!c)return;const i=c.closest("li.ccard"),l=i==null?void 0:i.dataset.id;if(!l)return;const d=c.dataset.act;d==="del"?(o=o.filter(k=>k.id!==l),f===l&&(f=null),g(),u()):d==="edit"&&(f=l,u())}),qt()}function qt(){var e,n,a,r;const t=document.querySelector("#ai-status");(e=document.querySelector("#ai-gen"))==null||e.addEventListener("click",async()=>{const s=document.querySelector("#ai-text").value;if($(v)){if(!s.trim()){t&&(t.textContent="テキストを入力してください。",t.className="warn");return}t&&(t.textContent="生成中…（数秒かかります）",t.className="hint");try{const c=await ft(s,v);if(c.length===0){t&&(t.textContent="カードを生成できませんでした。",t.className="warn");return}h=c,u()}catch(c){const i=document.querySelector("#ai-status");i&&(i.textContent=`失敗: ${c.message}`,i.className="warn")}}}),(n=document.querySelector("#prev-all"))==null||n.addEventListener("change",s=>{const c=s.target.checked;document.querySelectorAll(".prev-chk").forEach(i=>i.checked=c)}),(a=document.querySelector("#prev-discard"))==null||a.addEventListener("click",()=>{h=[],u()}),(r=document.querySelector("#prev-add"))==null||r.addEventListener("click",()=>{const s=[];document.querySelectorAll(".prev-chk").forEach(c=>{if(c.checked){const i=Number(c.dataset.i);h[i]&&s.push(h[i])}}),s.length!==0&&(o=[...o,...s.map(c=>O(b,c))],h=[],g(),u())})}function Et(){var t,e,n;(t=document.querySelector("#study-quit"))==null||t.addEventListener("click",()=>{b?A(b):N()}),(e=document.querySelector("#reveal"))==null||e.addEventListener("click",()=>{w.showBack=!0,u()}),(n=document.querySelector(".grades"))==null||n.addEventListener("click",a=>{const r=a.target.closest("button"),s=r==null?void 0:r.dataset.grade;if(!s)return;const c=w,i=c.queue[c.idx],d=rt(i,s,new Date);o=o.map(k=>k.id===d.id?d:k),g(),c.reviewed+=1,s==="again"&&c.queue.push(d),c.idx+=1,c.showBack=!1,u()})}function It(){var e;const t=document.querySelector("#llm-status");(e=document.querySelector("#llm-save"))==null||e.addEventListener("click",()=>{v={enabled:document.querySelector("#llm-enabled").checked,endpoint:document.querySelector("#llm-endpoint").value.trim(),model:document.querySelector("#llm-model").value.trim(),apiKey:document.querySelector("#llm-key").value.trim()},lt(v),t&&(t.textContent="設定を保存しました。",t.className="hint")})}u();
