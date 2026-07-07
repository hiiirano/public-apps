(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function n(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(o){if(o.ep)return;o.ep=!0;const r=n(o);fetch(o.href,r)}})();function D(e,t){const[n,s,o]=e.split("-").map(Number),[r,c,i]=t.split("-").map(Number),d=Date.UTC(n,s-1,o),l=Date.UTC(r,c-1,i);return Math.round((d-l)/864e5)}function N(e){const t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0");return`${t}-${n}-${s}`}function ce(e,t){const n=new Map(t.map(o=>[o.id,o])),s=new Set;for(const o of e.exercises){if(o.sets.length===0)continue;const r=n.get(o.exerciseId);r&&s.add(r.group)}return s}function X(e){let t=0;for(const n of e.exercises)for(const s of n.sets)s.weight!=null&&(t+=s.weight*s.reps);return t}function q(e){return e.exercises.reduce((t,n)=>t+n.sets.length,0)}function ae(e,t){return e.filter(n=>{const s=D(t,n.date);return s>=0&&s<7&&q(n)>0})}function V(e,t,n){const s=[...e].sort((o,r)=>r.startedAt-o.startedAt);for(const o of s){if(o.id===n)continue;const r=o.exercises.find(c=>c.exerciseId===t&&c.sets.length>0);if(r)return r.sets}return null}const K={upper:"上半身",lower:"下半身"};function de(e,t,n){const s=e.filter(f=>q(f)>0);if(s.some(f=>f.date===n))return{kind:"rest",reason:"今日はもうトレーニング済み。しっかり回復しましょう"};const o=new Set(s.map(f=>f.date)),r=s.length>0&&[...o].some(f=>D(n,f)===1),c=s.length>0&&[...o].some(f=>D(n,f)===2);if(r&&c)return{kind:"rest",reason:"2日連続でトレーニング済み。今日は休養日がおすすめ"};const i={upper:null,lower:null};for(const f of s)for(const k of ce(f,t))k!=="core"&&(i[k]===null||f.date>i[k])&&(i[k]=f.date);if(i.upper===null&&i.lower===null)return{kind:"upper",reason:"まだ記録がありません。上半身から始めましょう"};const d=i.upper===null?"upper":i.lower===null?"lower":i.upper<i.lower?"upper":i.upper>i.lower?"lower":"upper",l=i[d];if(l===null)return{kind:d,reason:`${K[d]}はまだ未記録。今日やってみましょう`};const g=D(n,l),[,u,y]=l.split("-").map(Number);return{kind:d,reason:`${K[d]}は${g}日空いています（前回 ${u}/${y}）`}}function le(e,t){var c;const n=new Map(t.map(i=>[i.id,i])),s=i=>/[",\n]/.test(i)?`"${i.replace(/"/g,'""')}"`:i,o=["date,exercise,set,weight_kg,reps"],r=[...e].sort((i,d)=>i.startedAt-d.startedAt);for(const i of r)for(const d of i.exercises){const l=((c=n.get(d.exerciseId))==null?void 0:c.name)??d.exerciseId;d.sets.forEach((g,u)=>{o.push(`${i.date},${s(l)},${u+1},${g.weight??""},${g.reps}`)})}return o.join(`
`)+`
`}const z="gymlog.exercises.v1",Q="gymlog.workouts.v1",Z="gymlog.settings.v1",ue=[{id:"pushup",name:"腕立て伏せ",kind:"bodyweight",group:"upper",metric:"reps"},{id:"pullup",name:"懸垂",kind:"bodyweight",group:"upper",metric:"reps"},{id:"dips",name:"ディップス",kind:"bodyweight",group:"upper",metric:"reps"},{id:"squat",name:"スクワット",kind:"bodyweight",group:"lower",metric:"reps"},{id:"lunge",name:"ランジ",kind:"bodyweight",group:"lower",metric:"reps"},{id:"plank",name:"プランク",kind:"bodyweight",group:"core",metric:"seconds"},{id:"crunch",name:"クランチ",kind:"bodyweight",group:"core",metric:"reps"},{id:"chest-press",name:"チェストプレス",kind:"machine",group:"upper",metric:"reps"},{id:"lat-pulldown",name:"ラットプルダウン",kind:"machine",group:"upper",metric:"reps"},{id:"shoulder-press",name:"ショルダープレス",kind:"machine",group:"upper",metric:"reps"},{id:"biceps-curl",name:"バイセップスカール",kind:"machine",group:"upper",metric:"reps"},{id:"dip-machine",name:"ディップスマシン",kind:"machine",group:"upper",metric:"reps"},{id:"abdominal",name:"アブドミナル（腹筋）",kind:"machine",group:"core",metric:"reps"},{id:"leg-press",name:"レッグプレス",kind:"machine",group:"lower",metric:"reps"},{id:"adduction",name:"アダクション（内もも）",kind:"machine",group:"lower",metric:"reps"}],pe={wakeLock:!0};function ee(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36)}function M(e){try{const t=localStorage.getItem(e);return t?JSON.parse(t):null}catch{return null}}function te(){const e=M(z);if(e&&Array.isArray(e)&&e.length>0)return e;const t=ue.map(n=>({...n}));return ne(t),t}function ne(e){localStorage.setItem(z,JSON.stringify(e))}function fe(){const e=M(Q);return e&&Array.isArray(e)?e:[]}function me(e){localStorage.setItem(Q,JSON.stringify(e))}function he(){return{...pe,...M(Z)??{}}}function ge(e){localStorage.setItem(Z,JSON.stringify(e))}function ve(e,t){return{app:"gym-log",version:1,exportedAt:new Date().toISOString(),exercises:e,workouts:t}}function be(e){const t=JSON.parse(e);if(t.app!=="gym-log"||!Array.isArray(t.exercises)||!Array.isArray(t.workouts))throw new Error("gym-log のバックアップ形式ではありません");return t}let v=te(),m=fe(),B=he(),$="today",S=!1,E=!1,x=null,T=null;const O=document.querySelector("#app"),se={upper:"上半身",lower:"下半身",core:"体幹・腹筋"},W={bodyweight:"自重",machine:"マシン"},we={upper:"上半身の日",lower:"下半身の日",rest:"休養日"},ye={upper:"💪",lower:"🦵",rest:"😴"};function j(e){return v.find(t=>t.id===e)}function L(){return m.find(e=>e.endedAt===null)}function h(){me(m),ne(v),ge(B)}let b=null;async function J(){var t;const e=B.wakeLock&&!!L()&&document.visibilityState==="visible";try{e&&!b&&"wakeLock"in navigator?(b=await navigator.wakeLock.request("screen"),(t=b.addEventListener)==null||t.call(b,"release",()=>{b=null})):!e&&b&&(await b.release(),b=null)}catch{b=null}}document.addEventListener("visibilitychange",()=>void J());function a(e){const t=document.createElement("template");return t.innerHTML=e.trim(),t.content.firstElementChild}function oe(e,t){const n=t==="seconds"?"秒":"回";return e.weight!=null?`${e.weight}kg×${e.reps}`:`${e.reps}${n}`}function re(e){const t=Math.round(e/6e4);return t<60?`${t}分`:`${Math.floor(t/60)}時間${t%60}分`}function Y(e){const[t,n,s]=e.split("-").map(Number),o="日月火水木金土"[new Date(t,n-1,s).getDay()];return`${n}/${s}(${o})`}function H(e,t,n){const s=URL.createObjectURL(new Blob([t],{type:n})),o=document.createElement("a");o.href=s,o.download=e,o.click(),URL.revokeObjectURL(s)}function ke(){const e=new Date;m.push({id:ee(),date:N(e),startedAt:e.getTime(),endedAt:null,exercises:[]}),h(),p()}function $e(){const e=L();if(e){if(e.exercises=e.exercises.filter(t=>t.sets.length>0),e.exercises.length===0){if(!confirm("セットが1つも記録されていません。このワークアウトを破棄しますか？"))return;m=m.filter(t=>t.id!==e.id)}else e.endedAt=Date.now();h(),p()}}function Ee(e){const t=L();t&&(t.exercises.some(n=>n.exerciseId===e)||t.exercises.push({exerciseId:e,sets:[]}),S=!1,h(),p())}function xe(e){const t=L();if(!t)return;const n=t.exercises.find(r=>r.exerciseId===e);if(!n)return;const s=V(m,e,t.id),o=n.sets[n.sets.length-1]??(s==null?void 0:s[n.sets.length])??(s==null?void 0:s[0])??{weight:null,reps:10};n.sets.push({weight:o.weight,reps:o.reps}),h(),p()}function p(){O.innerHTML="",O.append(a(`
    <header>
      <h1>🏋️ 筋トレ記録 <span class="brand">gym-log</span></h1>
      <p class="sub">データはこの端末のブラウザだけに保存。登録不要・無料。</p>
    </header>
  `));const e=a("<main></main>");$==="today"&&Se(e),$==="history"&&Ie(e),$==="exercises"&&Oe(e),$==="settings"&&De(e),O.append(e);const t=[["today","🏠 今日"],["history","📅 履歴"],["exercises","📋 種目"],["settings","⚙️ 設定"]],n=a('<nav class="tabbar"></nav>');for(const[s,o]of t){const r=a(`<button class="tab ${$===s?"active":""}">${o}</button>`);r.addEventListener("click",()=>{$=s,S=!1,p()}),n.append(r)}O.append(n),J()}function Se(e){const t=N(new Date),n=L();if(n)Le(e,n);else{const c=de(m,v,t);e.append(a(`
      <section class="card rec rec-${c.kind}">
        <div class="rec-title">${ye[c.kind]} 今日のおすすめ: <b>${we[c.kind]}</b></div>
        <div class="rec-reason">${c.reason}</div>
      </section>
    `));const i=a('<button class="primary big">▶ トレーニング開始</button>');i.addEventListener("click",ke),e.append(i)}const s=ae(m.filter(c=>c.endedAt!==null),t),o=s.reduce((c,i)=>c+X(i),0),r=s.reduce((c,i)=>c+q(i),0);e.append(a(`
    <section class="card stats">
      <div class="stat"><div class="num">${s.length}</div><div class="lbl">今週の回数</div></div>
      <div class="stat"><div class="num">${r}</div><div class="lbl">セット数</div></div>
      <div class="stat"><div class="num">${Math.round(o).toLocaleString()}</div><div class="lbl">ボリューム(kg)</div></div>
    </section>
  `))}function Le(e,t){const n=a(`
    <section class="card active-head">
      <div>🔴 記録中 <span class="elapsed" id="elapsed"></span></div>
    </section>
  `),s=a('<button class="finish">終了</button>');s.addEventListener("click",$e),n.append(s),e.append(n);const o=n.querySelector("#elapsed"),r=()=>{o.textContent=re(Date.now()-t.startedAt),document.body.contains(o)||clearInterval(c)},c=setInterval(r,15e3);r();for(const d of t.exercises){const l=j(d.exerciseId);if(!l)continue;const g=l.metric,u=V(m,l.id,t.id),y=a(`
      <section class="card exercise">
        <div class="ex-head">
          <div>
            <b>${l.name}</b> <span class="badge">${W[l.kind]}</span>
            <div class="prev">${u?"前回: "+u.map(w=>oe(w,g)).join(", "):"初めての種目"}</div>
          </div>
        </div>
        <div class="sets"></div>
      </section>
    `),f=a('<button class="ghost small">削除</button>');f.addEventListener("click",()=>{t.exercises=t.exercises.filter(w=>w!==d),h(),p()}),y.querySelector(".ex-head").append(f);const k=y.querySelector(".sets");d.sets.forEach((w,A)=>{var R,U;const ie=g==="seconds"?"秒":"回",I=a(`
        <div class="set-row">
          <span class="set-no">${A+1}</span>
          <input type="number" inputmode="decimal" step="0.5" min="0" class="w"
                 value="${w.weight??""}" placeholder="${((R=u==null?void 0:u[A])==null?void 0:R.weight)??"自重"}" /><span class="u">kg</span>
          <input type="number" inputmode="numeric" step="1" min="0" class="r"
                 value="${w.reps||""}" placeholder="${((U=u==null?void 0:u[A])==null?void 0:U.reps)??""}" /><span class="u">${ie}</span>
        </div>
      `);I.querySelector(".w").addEventListener("change",C=>{const F=C.target.value;w.weight=F===""?null:Number(F),h()}),I.querySelector(".r").addEventListener("change",C=>{w.reps=Number(C.target.value)||0,h()});const P=a('<button class="ghost small">×</button>');P.addEventListener("click",()=>{d.sets.splice(A,1),h(),p()}),I.append(P),k.append(I)});const _=a('<button class="secondary">＋ セット</button>');_.addEventListener("click",()=>xe(l.id)),y.append(_),e.append(y)}const i=a('<button class="primary">＋ 種目を追加</button>');i.addEventListener("click",()=>{S=!S,p()}),e.append(i),S&&e.append(Ae(t))}function Ae(e){const t=a('<section class="card picker"></section>'),n=new Set(e.exercises.map(o=>o.exerciseId));for(const o of["upper","lower","core"]){const r=v.filter(c=>c.group===o&&!c.archived&&!n.has(c.id));if(r.length!==0){t.append(a(`<div class="picker-group">${se[o]}</div>`));for(const c of r){const i=a(`<button class="pick">${c.name} <span class="badge">${W[c.kind]}</span></button>`);i.addEventListener("click",()=>Ee(c.id)),t.append(i)}}}const s=a('<p class="hint">見つからない種目は「種目」タブで追加できます。</p>');return t.append(s),t}function Ie(e){const t=m.filter(n=>n.endedAt!==null).sort((n,s)=>s.startedAt-n.startedAt);if(t.length===0){e.append(a('<p class="hint">まだ記録がありません。「今日」タブから始めましょう。</p>'));return}for(const n of t){const s=X(n),o=n.exercises.map(c=>{var i;return`${((i=j(c.exerciseId))==null?void 0:i.name)??"?"}×${c.sets.length}`}).join("・"),r=a(`
      <section class="card history">
        <div class="hist-head">
          <b>${Y(n.date)}</b>
          <span class="muted">${re((n.endedAt??n.startedAt)-n.startedAt)}${s>0?` / ${Math.round(s).toLocaleString()}kg`:""}</span>
        </div>
        <div class="hist-summary">${o}</div>
      </section>
    `);if(r.addEventListener("click",()=>{T=T===n.id?null:n.id,p()}),T===n.id){const c=a('<div class="hist-detail"></div>');for(const d of n.exercises){const l=j(d.exerciseId);c.append(a(`
          <div class="hist-ex">
            <b>${(l==null?void 0:l.name)??"?"}</b>
            <span>${d.sets.map(g=>oe(g,(l==null?void 0:l.metric)??"reps")).join(", ")}</span>
          </div>
        `))}const i=a('<button class="ghost small danger">この記録を削除</button>');i.addEventListener("click",d=>{d.stopPropagation(),confirm(`${Y(n.date)} の記録を削除しますか？`)&&(m=m.filter(l=>l.id!==n.id),h(),p())}),c.append(i),r.append(c)}e.append(r)}}function Oe(e){const t=a('<button class="primary">＋ 種目を作る</button>');t.addEventListener("click",()=>{E=!E,x=null,p()}),e.append(t),E&&e.append(G(null));for(const s of["upper","lower","core"]){const o=v.filter(r=>r.group===s&&!r.archived);if(o.length!==0){e.append(a(`<h2 class="group-h">${se[s]}</h2>`));for(const r of o){const c=a(`
        <section class="card ex-item">
          <div><b>${r.name}</b> <span class="badge">${W[r.kind]}</span>${r.metric==="seconds"?' <span class="badge">秒</span>':""}</div>
        </section>
      `),i=a('<div class="row-btns"></div>'),d=a('<button class="ghost small">編集</button>');d.addEventListener("click",()=>{x=x===r.id?null:r.id,E=!1,p()});const l=a('<button class="ghost small">非表示</button>');l.addEventListener("click",()=>{r.archived=!0,h(),p()}),i.append(d,l),c.append(i),x===r.id&&c.append(G(r)),e.append(c)}}}const n=v.filter(s=>s.archived);if(n.length>0){e.append(a('<h2 class="group-h">非表示中</h2>'));for(const s of n){const o=a(`<section class="card ex-item muted"><div>${s.name}</div></section>`),r=a('<button class="ghost small">戻す</button>');r.addEventListener("click",()=>{s.archived=!1,h(),p()}),o.append(r),e.append(o)}}}function G(e){const t=a(`
    <form class="card ex-form">
      <label>名前 <input name="name" required value="${(e==null?void 0:e.name)??""}" placeholder="例: レッグエクステンション" /></label>
      <label>部位
        <select name="group">
          <option value="upper" ${(e==null?void 0:e.group)==="upper"?"selected":""}>上半身</option>
          <option value="lower" ${(e==null?void 0:e.group)==="lower"?"selected":""}>下半身</option>
          <option value="core" ${(e==null?void 0:e.group)==="core"?"selected":""}>体幹・腹筋</option>
        </select>
      </label>
      <label>種類
        <select name="kind">
          <option value="machine" ${(e==null?void 0:e.kind)!=="bodyweight"?"selected":""}>マシン</option>
          <option value="bodyweight" ${(e==null?void 0:e.kind)==="bodyweight"?"selected":""}>自重</option>
        </select>
      </label>
      <label>数え方
        <select name="metric">
          <option value="reps" ${(e==null?void 0:e.metric)!=="seconds"?"selected":""}>回数</option>
          <option value="seconds" ${(e==null?void 0:e.metric)==="seconds"?"selected":""}>秒数（プランク等）</option>
        </select>
      </label>
      <button class="primary" type="submit">${e?"保存":"追加"}</button>
    </form>
  `);return t.addEventListener("submit",n=>{n.preventDefault();const s=new FormData(t),o=String(s.get("name")).trim();if(!o)return;const r=s.get("group"),c=s.get("kind"),i=s.get("metric");e?Object.assign(e,{name:o,group:r,kind:c,metric:i}):v.push({id:ee(),name:o,group:r,kind:c,metric:i}),E=!1,x=null,h(),p()}),t}function De(e){const t=a(`
    <section class="card">
      <label class="toggle">
        <input type="checkbox" ${B.wakeLock?"checked":""} />
        記録中は画面をスリープさせない
      </label>
      <p class="hint">対応ブラウザのみ（Android Chrome対応）。YouTube等の音楽再生とは競合しません。</p>
    </section>
  `);t.querySelector("input").addEventListener("change",d=>{B.wakeLock=d.target.checked,h(),J()}),e.append(t);const n=a('<section class="card io"><b>バックアップ</b></section>'),s=a('<button class="secondary">JSONエクスポート</button>');s.addEventListener("click",()=>{H(`gym-log-${N(new Date)}.json`,JSON.stringify(ve(v,m),null,2),"application/json")});const o=a('<button class="secondary">CSVエクスポート</button>');o.addEventListener("click",()=>{H(`gym-log-${N(new Date)}.csv`,le(m,v),"text/csv")});const r=a('<label class="secondary file-btn">JSONインポート<input type="file" accept=".json,application/json" hidden /></label>');r.querySelector("input").addEventListener("change",async d=>{var g;const l=(g=d.target.files)==null?void 0:g[0];if(l)try{const u=be(await l.text());if(!confirm(`${u.workouts.length}件のワークアウトを読み込みます。現在のデータは上書きされます。よろしいですか？`))return;v=u.exercises,m=u.workouts,h(),p(),alert("インポートしました")}catch(u){alert(`インポート失敗: ${u instanceof Error?u.message:u}`)}}),n.append(s,o,r),e.append(n);const c=a('<section class="card"><b>データ</b></section>'),i=a('<button class="ghost danger">全データを削除</button>');i.addEventListener("click",()=>{confirm("すべての記録と種目を削除します。元に戻せません。よろしいですか？")&&(localStorage.removeItem("gymlog.workouts.v1"),localStorage.removeItem("gymlog.exercises.v1"),m=[],v=te(),p())}),c.append(i),e.append(c),e.append(a(`
    <p class="hint">
      Phase 2 予定: Androidアプリ化（Capacitor）でヘルスコネクトに筋トレセッションを自動記録。
      それまでの記録もこのアプリ内にすべて残ります。
    </p>
  `))}"serviceWorker"in navigator&&navigator.serviceWorker.register("./sw.js").catch(()=>{});p();
