(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function r(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(n){if(n.ep)return;n.ep=!0;const o=r(n);fetch(n.href,o)}})();const U={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,athlete:1.9},z={cut:-.2,maintain:0,bulk:.1},g={protein:4,fat:9,carbs:4};function q(t){const e=10*t.weightKg+6.25*t.heightCm-5*t.age;return t.sex==="male"?e+5:e-161}function T(t){return q(t)*U[t.activity]}function V(t){return Math.round(T(t)*(1+z[t.goal]))}function X(t){const e=V(t),r=Math.max(0,Math.round(t.proteinPerKg*t.weightKg)),a=Math.max(0,Math.round(e*t.fatPercent/g.fat)),n=e-r*g.protein-a*g.fat,o=Math.max(0,Math.round(n/g.carbs));return{kcal:e,protein:r,fat:a,carbs:o}}function O(t){return Math.round(t.protein*g.protein+t.fat*g.fat+t.carbs*g.carbs)}function Q(t){return t.reduce((e,r)=>({kcal:e.kcal+r.kcal,protein:e.protein+r.protein,fat:e.fat+r.fat,carbs:e.carbs+r.carbs}),{kcal:0,protein:0,fat:0,carbs:0})}function W(t,e){return{kcal:t.kcal-e.kcal,protein:t.protein-e.protein,fat:t.fat-e.fat,carbs:t.carbs-e.carbs}}function Z(t,e){return t.filter(r=>r.date===e)}function tt(t){const e=t.heightCm/100;return e<=0?0:Math.round(t.weightKg/(e*e)*10)/10}function et(t){return t<=0?"—":t<18.5?"低体重":t<25?"普通体重":t<30?"肥満(1度)":t<35?"肥満(2度)":t<40?"肥満(3度)":"肥満(4度)"}const _="macro.profile",D="macro.log",l={sex:"male",age:30,heightCm:170,weightKg:65,activity:"moderate",goal:"maintain",proteinPerKg:2,fatPercent:.25};function C(t="id"){const e=Math.random().toString(36).slice(2,8);return`${t}_${Date.now().toString(36)}_${e}`}function v(t,e){const r=Number(t);return Number.isFinite(r)?r:e}function L(t){const e=Number(t);return Number.isFinite(e)&&e>0?e:0}function P(t,e=""){return typeof t=="string"?t:e}function $(t,e,r){return Math.min(r,Math.max(e,t))}const nt=["male","female"],rt=["sedentary","light","moderate","active","athlete"],at=["cut","maintain","bulk"];function A(t,e,r){return e.includes(t)?t:r}function j(t){const e=t??{};return{sex:A(e.sex,nt,l.sex),age:$(Math.round(v(e.age,l.age)),10,100),heightCm:$(v(e.heightCm,l.heightCm),100,250),weightKg:$(v(e.weightKg,l.weightKg),25,300),activity:A(e.activity,rt,l.activity),goal:A(e.goal,at,l.goal),proteinPerKg:$(v(e.proteinPerKg,l.proteinPerKg),.5,4),fatPercent:$(v(e.fatPercent,l.fatPercent),.1,.6)}}function E(t){const e=t??{},r=L(e.protein),a=L(e.fat),n=L(e.carbs);return{id:P(e.id)||C("f"),name:P(e.name).trim()||"食事",kcal:Math.round(L(e.kcal)),protein:Math.round(r),fat:Math.round(a),carbs:Math.round(n),date:/^\d{4}-\d{2}-\d{2}$/.test(P(e.date))?P(e.date):K(),createdAt:typeof e.createdAt=="number"&&Number.isFinite(e.createdAt)?e.createdAt:Date.now()}}function K(t=new Date){const e=t.getFullYear(),r=String(t.getMonth()+1).padStart(2,"0"),a=String(t.getDate()).padStart(2,"0");return`${e}-${r}-${a}`}function ot(){try{const t=localStorage.getItem(_);return t?j(JSON.parse(t)):{...l}}catch{return{...l}}}function it(t){localStorage.setItem(_,JSON.stringify(t))}function ct(){try{const t=localStorage.getItem(D);if(!t)return[];const e=JSON.parse(t);return Array.isArray(e)?e.map(E):[]}catch{return[]}}function st(t){localStorage.setItem(D,JSON.stringify(t))}const x={enabled:!1,endpoint:"https://api.openai.com/v1/chat/completions",apiKey:"",model:"gpt-4o-mini"},R="macro.llm";function lt(){try{const t=localStorage.getItem(R);return t?{...x,...JSON.parse(t)}:{...x}}catch{return{...x}}}function ut(t){localStorage.setItem(R,JSON.stringify(t))}function B(t){return t.enabled&&!!t.apiKey&&!!t.endpoint&&!!t.model}const dt="あなたは栄養計算のアシスタントです。ユーザーが貼り付けた食事メモから、各食品の推定カロリーとPFC(タンパク質/脂質/炭水化物)を見積もり、指定のJSONだけを返します。数値は日本の一般的な食品成分の目安で概算し、余計な説明やコードフェンスは付けません。";async function pt(t,e){var i,s,b;if(!B(e))throw new Error("LLM未設定");if(!t.trim())return[];const r=`次の食事メモから、食品ごとにカロリーとPFCを推定し、JSONのみを返してください。
フォーマット: {"foods":[{"name":"鶏むね肉200g","kcal":220,"protein":46,"fat":3,"carbs":0}]}
kcal は整数、protein/fat/carbs はグラムの整数。分量が書かれていれば反映する。

---
`+t,a=await fetch(e.endpoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e.apiKey}`},body:JSON.stringify({model:e.model,messages:[{role:"system",content:dt},{role:"user",content:r}],temperature:.2,response_format:{type:"json_object"}})});if(!a.ok)throw new Error(`LLM APIエラー: ${a.status}`);const n=await a.json(),o=(b=(s=(i=n==null?void 0:n.choices)==null?void 0:i[0])==null?void 0:s.message)==null?void 0:b.content;if(typeof o!="string")throw new Error("LLM応答の形式が不正です");return ft(o)}function ft(t){const e=mt(t);let r;try{r=JSON.parse(e)}catch{return[]}const a=r==null?void 0:r.foods;return Array.isArray(a)?a.map(n=>{const o=n??{},i=s=>Math.max(0,Math.round(Number(s)||0));return{name:typeof o.name=="string"?o.name:"食事",kcal:i(o.kcal),protein:i(o.protein),fat:i(o.fat),carbs:i(o.carbs)}}).filter(n=>n.name.trim()!==""&&(n.kcal>0||n.protein>0||n.fat>0||n.carbs>0)):[]}function mt(t){const e=t.trim(),r=/^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(e);return r?r[1]:e}let d=ot(),m=ct(),f=lt(),h=K(),k=!1;const c=document.querySelector("#app"),I={male:"男性",female:"女性"},N={sedentary:"ほぼ運動なし",light:"軽い運動(週1-3)",moderate:"中程度(週3-5)",active:"活発(週6-7)",athlete:"アスリート級"},J={cut:"減量 (−20%)",maintain:"維持 (±0)",bulk:"増量 (+10%)"};function w(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function M(t){return`${Math.round(t).toLocaleString("ja-JP")}g`}function S(t){return`${Math.round(t).toLocaleString("ja-JP")} kcal`}function y(){it(d),st(m)}function u(){const t=X(d),e=Z(m,h),r=Q(e),a=W(t,r);c.innerHTML=`
    <header>
      <h1>🥗 PFC・TDEE計算 <span class="brand">macro-planner</span></h1>
      <p class="sub">身長体重と目標から1日の目標カロリーとPFCを計算。食事ログで残量が分かる。アカウント不要・この端末だけに保存。</p>
    </header>

    ${gt()}
    ${ht(t)}
    ${bt(t,r,a,e)}

    <section class="card">
      <h2>AI食事取り込み・バックアップ</h2>
      <div class="actions">
        <button id="toggle-llm">${k?"AI設定を隠す":"AIで食事を推定"}</button>
        <button id="export-json">JSONエクスポート</button>
        <button id="import-json">JSONインポート</button>
      </div>
      ${k?yt():""}
    </section>

    <footer>${vt()}</footer>
  `,$t()}function gt(){const t=d,e=Object.keys(I).map(n=>`<option value="${n}" ${n===t.sex?"selected":""}>${I[n]}</option>`).join(""),r=Object.keys(N).map(n=>`<option value="${n}" ${n===t.activity?"selected":""}>${N[n]}</option>`).join(""),a=Object.keys(J).map(n=>`<option value="${n}" ${n===t.goal?"selected":""}>${J[n]}</option>`).join("");return`
    <section class="card">
      <h2>プロフィール</h2>
      <form id="profile-form" class="profile-grid">
        <label>性別<select id="p-sex">${e}</select></label>
        <label>年齢<input id="p-age" type="number" min="10" max="100" step="1" value="${t.age}" /></label>
        <label>身長(cm)<input id="p-height" type="number" min="100" max="250" step="0.1" value="${t.heightCm}" /></label>
        <label>体重(kg)<input id="p-weight" type="number" min="25" max="300" step="0.1" value="${t.weightKg}" /></label>
        <label>活動量<select id="p-activity">${r}</select></label>
        <label>目標<select id="p-goal">${a}</select></label>
        <label>タンパク質(g/kg体重)<input id="p-protein" type="number" min="0.5" max="4" step="0.1" value="${t.proteinPerKg}" /></label>
        <label>脂質割合(%)<input id="p-fat" type="number" min="10" max="60" step="1" value="${Math.round(t.fatPercent*100)}" /></label>
      </form>
      <p class="muted">値を変えると即座に下の目標が更新されます。<button id="reset-profile" class="link">初期値に戻す</button></p>
    </section>
  `}function ht(t){const e=tt(d),r=Y(t,{kcal:0,protein:0,fat:0,carbs:0},!0);return`
    <section class="card result">
      <h2>あなたの1日の目標</h2>
      <div class="bigstats">
        <div class="stat"><span class="v">${Math.round(q(d)).toLocaleString("ja-JP")}</span><span class="k">基礎代謝 BMR</span></div>
        <div class="stat"><span class="v">${Math.round(T(d)).toLocaleString("ja-JP")}</span><span class="k">消費 TDEE</span></div>
        <div class="stat accent"><span class="v">${t.kcal.toLocaleString("ja-JP")}</span><span class="k">目標カロリー</span></div>
        <div class="stat"><span class="v">${e||"—"}</span><span class="k">BMI (${et(e)})</span></div>
      </div>
      <h3>目標PFC（合計 ${S(O(t))}）</h3>
      ${r}
    </section>
  `}function bt(t,e,r,a){const n=a.length===0?'<p class="muted">この日の記録はまだありません。</p>':'<ul class="foods">'+[...a].sort((i,s)=>s.createdAt-i.createdAt).map(i=>`
        <li>
          <div class="f-main">
            <span class="f-name">${w(i.name)}</span>
            <span class="f-kcal">${S(i.kcal)}</span>
          </div>
          <div class="f-sub muted">P ${M(i.protein)} / F ${M(i.fat)} / C ${M(i.carbs)}</div>
          <button class="del-food danger" data-id="${i.id}">削除</button>
        </li>`).join("")+"</ul>",o=r.kcal<0;return`
    <section class="card">
      <h2>食事ログ</h2>
      <div class="daterow">
        <label>日付<input id="log-date" type="date" value="${h}" /></label>
        <span class="muted">摂取 ${S(e.kcal)} / 目標 ${S(t.kcal)}
          <strong class="${o?"neg":"pos"}">（残り ${o?"超過 ":""}${S(Math.abs(r.kcal))}）</strong></span>
      </div>

      <h3>残量</h3>
      ${Y(t,e,!1)}

      <form id="food-form" class="food-form">
        <div class="row">
          <input id="f-name" type="text" placeholder="食品名（例: 鶏むね肉200g）" maxlength="40" />
          <input id="f-kcal" type="number" min="0" step="1" placeholder="kcal(空欄でPFCから自動)" />
        </div>
        <div class="row">
          <input id="f-protein" type="number" min="0" step="0.1" placeholder="P(g)" />
          <input id="f-fat" type="number" min="0" step="0.1" placeholder="F(g)" />
          <input id="f-carbs" type="number" min="0" step="0.1" placeholder="C(g)" />
          <button type="submit" class="primary">追加</button>
        </div>
      </form>

      ${n}
    </section>
  `}function Y(t,e,r){return'<div class="bars">'+[["カロリー","kcal","kcal"],["タンパク質 P","protein","g"],["脂質 F","fat","g"],["炭水化物 C","carbs","g"]].map(([n,o,i])=>{const s=t[o],b=e[o],G=s>0?Math.min(100,Math.round(b/s*100)):0,F=s>0&&b>s,H=r?`${Math.round(s).toLocaleString("ja-JP")}${i==="kcal"?" kcal":i}`:`${Math.round(b).toLocaleString("ja-JP")} / ${Math.round(s).toLocaleString("ja-JP")}${i==="kcal"?" kcal":i}`;return`
        <div class="bar-row">
          <div class="bar-label"><span>${n}</span><span class="${F?"neg":"muted"}">${H}</span></div>
          <div class="bar-track"><div class="bar-fill ${F?"over":""}" style="width:${r?100:G}%"></div></div>
        </div>`}).join("")+"</div>"}function yt(){return`
    <div class="llm">
      <p class="muted">食事メモを貼ると AI が各食品の kcal/PFC を推定して追加します（推定値・目安。OpenAI互換APIキーはこの端末のみに保存）。</p>
      <div class="row">
        <label><input type="checkbox" id="llm-enabled" ${f.enabled?"checked":""}/> 有効</label>
      </div>
      <div class="row">
        <input id="llm-endpoint" type="text" placeholder="エンドポイント" value="${w(f.endpoint)}" />
        <input id="llm-model" type="text" placeholder="モデル" value="${w(f.model)}" />
      </div>
      <div class="row">
        <input id="llm-key" type="password" placeholder="APIキー" value="${w(f.apiKey)}" />
        <button id="llm-save">設定を保存</button>
      </div>
      <textarea id="llm-text" placeholder="例: 鶏むね肉200g、白米150g、卵2個、味噌汁" rows="3"></textarea>
      <button id="llm-extract" ${B(f)?"":"disabled"}>AIで推定して ${h} に追加</button>
      <p id="llm-msg" class="muted"></p>
    </div>
  `}function vt(){return"一般的な推定式(Mifflin-St Jeor)による目安で、医療・栄養指導ではありません。データはこの端末のブラウザ(localStorage)だけに保存され、サーバーには送信されません。"}function $t(){const t=c.querySelector("#profile-form");t.addEventListener("input",()=>{d=St(),y(),u()}),t.addEventListener("submit",e=>e.preventDefault()),c.querySelector("#reset-profile").addEventListener("click",()=>{d={...l},y(),u()}),c.querySelector("#log-date").addEventListener("change",e=>{const r=e.target.value;/^\d{4}-\d{2}-\d{2}$/.test(r)&&(h=r),u()}),c.querySelector("#food-form").addEventListener("submit",e=>{e.preventDefault();const r=(c.querySelector("#f-name").value||"").trim()||"食事",a=p("#f-protein"),n=p("#f-fat"),o=p("#f-carbs");let i=p("#f-kcal");if(i<=0&&(i=O({protein:a,fat:n,carbs:o})),i<=0&&a<=0&&n<=0&&o<=0){alert("kcal または PFC を入力してください。");return}m.push(E({id:C("f"),name:r,kcal:i,protein:a,fat:n,carbs:o,date:h,createdAt:Date.now()})),y(),u()}),c.querySelectorAll(".del-food").forEach(e=>e.addEventListener("click",()=>{m=m.filter(r=>r.id!==e.dataset.id),y(),u()})),c.querySelector("#toggle-llm").addEventListener("click",()=>{k=!k,u()}),c.querySelector("#export-json").addEventListener("click",()=>{Lt(`macro-planner-${K()}.json`,JSON.stringify({profile:d,log:m},null,2))}),c.querySelector("#import-json").addEventListener("click",Pt),k&&kt()}function St(){return j({sex:c.querySelector("#p-sex").value,age:p("#p-age"),heightCm:p("#p-height"),weightKg:p("#p-weight"),activity:c.querySelector("#p-activity").value,goal:c.querySelector("#p-goal").value,proteinPerKg:p("#p-protein"),fatPercent:p("#p-fat")/100})}function p(t){const e=c.querySelector(t),r=Number(e==null?void 0:e.value);return Number.isFinite(r)?r:0}function kt(){c.querySelector("#llm-save").addEventListener("click",()=>{f={enabled:c.querySelector("#llm-enabled").checked,endpoint:c.querySelector("#llm-endpoint").value.trim(),model:c.querySelector("#llm-model").value.trim(),apiKey:c.querySelector("#llm-key").value.trim()},ut(f),u()});const t=c.querySelector("#llm-extract");t&&t.addEventListener("click",async()=>{const e=c.querySelector("#llm-text").value,r=c.querySelector("#llm-msg");r.textContent="推定中…";try{const a=await pt(e,f);for(const n of a)m.push(E({id:C("f"),name:n.name,kcal:n.kcal||O(n),protein:n.protein,fat:n.fat,carbs:n.carbs,date:h,createdAt:Date.now()}));y(),r.textContent=`${a.length}件を ${h} に追加しました。`,setTimeout(u,600)}catch(a){r.textContent=`推定に失敗しました: ${a.message}`}})}function Lt(t,e){const r=new Blob([e],{type:"application/json"}),a=URL.createObjectURL(r),n=document.createElement("a");n.href=a,n.download=t,n.click(),URL.revokeObjectURL(a)}function Pt(){const t=document.createElement("input");t.type="file",t.accept="application/json",t.addEventListener("change",()=>{var a;const e=(a=t.files)==null?void 0:a[0];if(!e)return;const r=new FileReader;r.onload=()=>{try{const n=JSON.parse(String(r.result));n.profile&&(d=j(n.profile)),Array.isArray(n.log)&&(m=n.log.map(E)),y(),u()}catch{alert("JSONの読み込みに失敗しました。")}},r.readAsText(e)}),t.click()}u();
