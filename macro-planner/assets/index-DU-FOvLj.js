(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function e(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(r){if(r.ep)return;r.ep=!0;const i=e(r);fetch(r.href,i)}})();const H=["sedentary","light","moderate","active","athlete"],U=["cut","maintain","bulk"],f={age:{min:18,max:100},heightCm:{min:120,max:230},weightKg:{min:30,max:250},proteinPerKg:{min:.8,max:2.5},fatPercent:{min:15,max:40}},I=30,Q=3e3,y={kcal:5e3,g:500},z={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,athlete:1.9},tt={cut:-.2,maintain:0,bulk:.1},v={protein:4,fat:9,carbs:4},C={protein:{min:13,max:20},fat:{min:20,max:30},carbs:{min:50,max:65}},E=1.5,T=25;function R(t){const a=10*t.weightKg+6.25*t.heightCm-5*t.age;return t.sex==="male"?a+5:a-161}function X(t){return R(t)*z[t.activity]}function ft(t){const a=X(t)*(1+tt[t.goal]),e=R(t);return t.goal==="cut"&&a<e?{kcal:Math.round(e),raisedToBmr:!0}:{kcal:Math.round(a),raisedToBmr:!1}}function at(t){const{kcal:a,raisedToBmr:e}=ft(t),n=Math.round(t.proteinPerKg*t.weightKg),r=Math.round(a*t.fatPercent/100/v.fat),i=a-n*v.protein-r*v.fat,s=Math.max(0,Math.round(i/v.carbs));return{kcal:a,protein:n,fat:r,carbs:s,raisedToBmr:e,carbsShort:i<0}}function ht(t){return Math.round(t.protein*v.protein+t.fat*v.fat+t.carbs*v.carbs)}function Y(t){const a=[t.protein*v.protein,t.fat*v.fat,t.carbs*v.carbs].map(c=>Math.max(0,c)),e=a[0]+a[1]+a[2];if(e<=0)return{protein:0,fat:0,carbs:0};const n=a.map(c=>c/e*100),r=n.map(Math.floor);let i=100-r.reduce((c,d)=>c+d,0);const s=[0,1,2].sort((c,d)=>n[d]-r[d]-(n[c]-r[c])||c-d);for(const c of s){if(i<=0)break;r[c]+=1,i-=1}return{protein:r[0],fat:r[1],carbs:r[2]}}function bt(t){const a=Y(t),e=[];for(const n of["protein","fat","carbs"])a[n]<C[n].min?e.push({key:n,dir:"low"}):a[n]>C[n].max&&e.push({key:n,dir:"high"});return e}function vt(t,a){const e=t/100;return!(e>0)||!(a>0)?0:Math.round(a/(e*e)*10)/10}function $t(t){return t>0?t<18.5?"低体重":t<25?"普通体重":t<30?"肥満（1度）":t<35?"肥満（2度）":t<40?"肥満（3度）":"肥満（4度）":"—"}function yt(t){const a=t/100;return Math.round(22*a*a*10)/10}const P={rice:{kcal:234},bread:{carbs:27.8},chicken:{protein:23.3},egg:{protein:6.1},butter:{fat:9.7}};function L(t){return!Number.isFinite(t)||t<=0?0:Math.round(t*2)/2}function kt(t){return{perMealKcal:Math.round(t.kcal/3/10)*10,riceBowls:L(t.kcal/P.rice.kcal),breadSlices:L(t.carbs/P.bread.carbs),chickenGrams:Math.round(t.protein/P.chicken.protein*100/10)*10,eggs:L(t.protein/P.egg.protein),butterSpoons:L(t.fat/P.butter.fat)}}const xt={kcal:0,protein:0,fat:0,carbs:0};function Mt(t){const a=t.reduce((n,r)=>({kcal:n.kcal+r.kcal,protein:n.protein+r.protein,fat:n.fat+r.fat,carbs:n.carbs+r.carbs}),{...xt}),e=n=>Math.round(n*10)/10;return{kcal:Math.round(a.kcal),protein:e(a.protein),fat:e(a.fat),carbs:e(a.carbs)}}function wt(t,a){const e=n=>Math.round(n*10)/10;return{kcal:t.kcal-a.kcal,protein:e(t.protein-a.protein),fat:e(t.fat-a.fat),carbs:e(t.carbs-a.carbs)}}function Ct(t,a){return t.filter(e=>e.date===a)}function et(t){const a=t.replace(/[０-９．，]/g,e=>String.fromCharCode(e.charCodeAt(0)-65248)).replace(/[,\s]/g,"").replace(/(歳|才|cm|ｃｍ|センチ|kg|ｋｇ|キロ|kcal|g|ｇ|%|％)$/i,"");return a===""?null:!/^\d+(\.\d+)?$/.test(a)&&!/^\.\d+$/.test(a)?Number.NaN:Number(a)}function nt(t,a){const e=et(a);if(e===null)return{value:null,error:""};if(Number.isNaN(e))return{value:null,error:"数字で入れてください。"};const n=f[t];return e<n.min||e>n.max?{value:null,error:`${n.min}〜${n.max} の数で入れてください。`}:{value:t==="age"||t==="fatPercent"?Math.round(e):Math.round(e*10)/10,error:""}}function rt(t){return t.sex===null||t.age===null||t.heightCm===null||t.weightKg===null?null:{sex:t.sex,age:t.age,heightCm:t.heightCm,weightKg:t.weightKg,activity:t.activity,goal:t.goal,proteinPerKg:t.proteinPerKg,fatPercent:t.fatPercent}}const st=[{id:"rice",name:"ごはん",amount:"茶碗1杯 150g",art:"rice",kcal:234,protein:3.8,fat:.5,carbs:55.7},{id:"onigiri",name:"おにぎり",amount:"1個 110g",art:"onigiri",kcal:187,protein:2.9,fat:.3,carbs:42.8},{id:"bread",name:"食パン",amount:"6枚切り1枚",art:"bread",kcal:149,protein:5.3,fat:2.5,carbs:27.8},{id:"udon",name:"うどん",amount:"ゆで1玉 250g",art:"udon",kcal:238,protein:6.5,fat:1,carbs:54},{id:"pasta",name:"スパゲッティ",amount:"ゆで1皿 250g",art:"spaghetti",kcal:375,protein:14.5,fat:2.3,carbs:80.5},{id:"egg",name:"卵",amount:"1個 50g",art:"egg",kcal:71,protein:6.1,fat:5.1,carbs:.2},{id:"chicken",name:"鶏むね肉",amount:"皮なし 100g",art:"chicken",kcal:105,protein:23.3,fat:1.9,carbs:.1},{id:"pork",name:"豚ロース肉",amount:"100g",art:"meat",kcal:248,protein:19.3,fat:19.2,carbs:.2},{id:"salmon",name:"さけ",amount:"1切れ 80g",art:"fish",kcal:99,protein:17.8,fat:3.3,carbs:.1},{id:"milk",name:"牛乳",amount:"コップ1杯 200mL",art:"milk",kcal:126,protein:6.8,fat:7.8,carbs:9.9},{id:"cheese",name:"チーズ",amount:"1切れ 20g",art:"cheese",kcal:63,protein:4.5,fat:5.2,carbs:.3},{id:"banana",name:"バナナ",amount:"1本 100g",art:"banana",kcal:93,protein:1.1,fat:.2,carbs:22.5},{id:"mikan",name:"みかん",amount:"1個 80g",art:"mikan",kcal:39,protein:.6,fat:.1,carbs:9.6},{id:"choco",name:"チョコ",amount:"板1枚 50g",art:"chocolate",kcal:275,protein:3.5,fat:17.1,carbs:27.9}],St=t=>st.find(a=>a.id===t),lt="macro-planner.v2",A={profile:"macro.profile",log:"macro.log",llm:"macro.llm"};let Pt=0;const At=()=>`f${Date.now().toString(36)}${(Pt++).toString(36)}${Math.random().toString(36).slice(2,6)}`;function Et(){return{sex:null,age:null,heightCm:null,weightKg:null,activity:"light",goal:"maintain",proteinPerKg:E,fatPercent:T}}function x(){return{draft:Et(),log:[]}}const $=(t,a)=>typeof t=="number"&&Number.isFinite(t)&&t>=a.min&&t<=a.max,D=(t,a)=>t===null||$(t,a);function it(t){return t&&(t.sex===null||t.sex==="male"||t.sex==="female")&&D(t.age,f.age)&&D(t.heightCm,f.heightCm)&&D(t.weightKg,f.weightKg)&&H.includes(t.activity)&&U.includes(t.goal)&&$(t.proteinPerKg,f.proteinPerKg)&&$(t.fatPercent,f.fatPercent)}const Tt=/^\d{4}-\d{2}-\d{2}$/;function ot(t){const a={min:0,max:y.g};return t&&typeof t.id=="string"&&t.id.length>0&&t.id.length<=40&&typeof t.name=="string"&&t.name.length>0&&t.name.length<=I&&$(t.kcal,{min:0,max:y.kcal})&&$(t.protein,a)&&$(t.fat,a)&&$(t.carbs,a)&&typeof t.date=="string"&&Tt.test(t.date)&&typeof t.createdAt=="number"&&Number.isFinite(t.createdAt)}const Kt=t=>({...t}),ct=t=>({id:t.id,name:t.name,kcal:t.kcal,protein:t.protein,fat:t.fat,carbs:t.carbs,date:t.date,createdAt:t.createdAt});function dt(t){try{const a=JSON.parse(t??"null");if(!a||!it(a.draft)||!Array.isArray(a.log))return x();const e=a.log.filter(ot).slice(-Q).map(ct);return{draft:Kt(a.draft),log:e}}catch{return x()}}function Lt(t,a){if(t===null&&a===null)return null;const e=x();try{const n=JSON.parse(t??"null");if(n&&typeof n=="object"){const r=e.draft;(n.sex==="male"||n.sex==="female")&&(r.sex=n.sex),$(n.age,f.age)&&(r.age=Math.round(n.age)),$(n.heightCm,f.heightCm)&&(r.heightCm=Math.round(n.heightCm*10)/10),$(n.weightKg,f.weightKg)&&(r.weightKg=Math.round(n.weightKg*10)/10),H.includes(n.activity)&&(r.activity=n.activity),U.includes(n.goal)&&(r.goal=n.goal)}}catch{}try{const n=JSON.parse(a??"null");Array.isArray(n)&&(e.log=n.map(r=>r&&typeof r.name=="string"?{...r,name:r.name.trim().slice(0,I)}:r).filter(ot).slice(-Q).map(ct))}catch{}return e}function Nt(t){try{const a=t.getItem(lt);if(a!==null)return dt(a);const e=Lt(t.getItem(A.profile),t.getItem(A.log));try{t.removeItem(A.llm)}catch{}if(!e)return x();if(ut(t,e))try{t.removeItem(A.profile),t.removeItem(A.log)}catch{}return e}catch{return x()}}function Ot(){try{return Nt(localStorage)}catch{return x()}}function ut(t,a){try{return t.setItem(lt,JSON.stringify(a)),!0}catch{return!1}}function pt(t){try{return ut(localStorage,t)}catch{return!1}}function Ft(t){return JSON.stringify({app:"macro-planner",version:2,...t},null,2)}function jt(t){try{const a=JSON.parse(t);return!a||a.app!=="macro-planner"||!it(a.draft)||!Array.isArray(a.log)?null:dt(JSON.stringify({draft:a.draft,log:a.log}))}catch{return null}}function G(t=new Date){return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}const It={plus:'<path d="M12 5l0 14" /> <path d="M5 12l14 0" />',trash:'<path d="M4 7l16 0" /> <path d="M10 11l0 6" /> <path d="M14 11l0 6" /> <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /> <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />',"arrow-back-up":'<path d="M9 14l-4 -4l4 -4" /> <path d="M5 10h11a4 4 0 1 1 0 8h-1" />',download:'<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /> <path d="M7 11l5 5l5 -5" /> <path d="M12 4l0 12" />',upload:'<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /> <path d="M7 9l5 -5l5 5" /> <path d="M12 4l0 12" />',"chevron-down":'<path d="M6 9l6 6l6 -6" />',"info-circle":'<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /> <path d="M12 9h.01" /> <path d="M11 12h1v4h1" />',"alert-triangle":'<path d="M12 9v4" /> <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /> <path d="M12 16h.01" />',sparkles:'<path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6" />',calendar:'<path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /> <path d="M16 3v4" /> <path d="M8 3v4" /> <path d="M4 11h16" /> <path d="M11 15h1" /> <path d="M12 15v3" />'};function p(t){return`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${It[t]}</svg>`}let l=Ot(),W=pt(l),M=G(),h=null,V=0,Z=0;const u=(t,a=document)=>a.querySelector(t);function O(t){return t.replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}const o=t=>Math.round(t).toLocaleString("ja-JP"),m=t=>(Math.round(t*10)/10).toLocaleString("ja-JP",{maximumFractionDigits:1}),b=(t,a="art",e=64)=>`<img class="${a}" src="./art/${t}.webp" alt="" width="${e}" height="${e}" />`,Rt={female:"女性",male:"男性"},F={sedentary:{title:"ほとんど動かない",desc:"座り仕事が中心。運動はしない",art:"couch"},light:{title:"すこし動く",desc:"軽い運動を週1〜3回。通勤で歩く",art:"walk"},moderate:{title:"ふつうに動く",desc:"運動を週3〜5回",art:"run"},active:{title:"よく動く",desc:"運動を週6〜7回。立ち仕事",art:"bike"},athlete:{title:"とてもよく動く",desc:"毎日はげしい運動。力仕事",art:"lift"}},j={cut:{title:"やせたい",desc:"食べる量を 20% へらす",art:"down",phrase:"体重をへらすための量"},maintain:{title:"いまの体重",desc:"食べる量はそのまま",art:"keep",phrase:"いまの体重をたもつ量"},bulk:{title:"ふやしたい",desc:"食べる量を 10% ふやす",art:"up",phrase:"体重をふやすための量"}},J={protein:"たんぱく質",fat:"脂質",carbs:"炭水化物"},_t={protein:"P",fat:"F",carbs:"C"},qt={sex:"female",age:30,heightCm:158,weightKg:52},Dt=[{key:"age",label:"年齢",unit:"歳",ph:"30",mode:"numeric"},{key:"heightCm",label:"身長",unit:"cm",ph:"160",mode:"decimal"},{key:"weightKg",label:"体重",unit:"kg",ph:"55",mode:"decimal"}],B=(t,a="num-field")=>`
  <div class="${a}">
    <label for="in-${t.key}">${t.label}</label>
    <div class="num-row">
      <input id="in-${t.key}" data-field="${t.key}" type="text" inputmode="${t.mode}" autocomplete="off"
        enterkeyhint="next" placeholder="${t.ph}" aria-describedby="msg-${t.key}" />
      <span class="unit" aria-hidden="true">${t.unit}</span>
    </div>
    <p id="msg-${t.key}" class="field-msg" aria-live="polite"></p>
  </div>`,K=u("#app");K.innerHTML=`
  <a class="skip" href="#result">結果へ移動</a>
  <header class="top">
    <div class="top-text">
      <p class="brand">PFC・TDEE計算</p>
      <h1><span class="nb">1日に食べる量の</span><span class="nb">目安がわかる。</span></h1>
    </div>
    ${b("salad","top-art",160)}
    <p class="lead">体のことを入れるだけ。目標カロリーと、たんぱく質・脂質・炭水化物（PFC）のバランスを出します。</p>
  </header>

  <main class="layout">
    <section class="card area-profile" aria-labelledby="h-profile">
      <h2 id="h-profile"><span class="step">1</span>あなたのこと</h2>
      <fieldset class="group">
        <legend>性別</legend>
        <div class="seg seg-2">
          ${["female","male"].map(t=>`<label class="seg-btn"><input class="vh" type="radio" name="sex" value="${t}" /><span>${Rt[t]}</span></label>`).join("")}
        </div>
      </fieldset>
      <div class="nums">${Dt.map(t=>B(t)).join("")}</div>

      <fieldset class="group">
        <legend>ふだんの動き</legend>
        <div class="choices choices-act">
          ${H.map(t=>`<label class="choice"><input class="vh" type="radio" name="activity" value="${t}" />
              ${b(F[t].art,"choice-art",48)}
              <span class="choice-text"><strong>${F[t].title}</strong><span>${F[t].desc}</span></span></label>`).join("")}
        </div>
      </fieldset>

      <fieldset class="group">
        <legend>目的</legend>
        <div class="choices choices-goal">
          ${U.map(t=>`<label class="choice choice-v"><input class="vh" type="radio" name="goal" value="${t}" />
              ${b(j[t].art,"choice-art",48)}
              <span class="choice-text"><strong>${j[t].title}</strong><span>${j[t].desc}</span></span></label>`).join("")}
        </div>
      </fieldset>

      <details class="adv" id="adv">
        <summary>PFC の割合を変える${p("chevron-down")}</summary>
        <div class="adv-body">
          ${B({key:"proteinPerKg",label:"たんぱく質（体重1kgあたり）",unit:"g",ph:String(E),mode:"decimal"},"num-field wide")}
          <p class="hint">はじめは ${E}g。${f.proteinPerKg.min}〜${f.proteinPerKg.max}g で決めます。運動をよくする人は多めにします。</p>
          ${B({key:"fatPercent",label:"脂質（カロリーのうち）",unit:"%",ph:String(T),mode:"numeric"},"num-field wide")}
          <p class="hint">はじめは ${T}%。国の目安は ${C.fat.min}〜${C.fat.max}% です。炭水化物は残りから決まります。</p>
          <button type="button" class="ghost-btn" data-act="adv-reset">${p("arrow-back-up")}<span>はじめの値に戻す</span></button>
        </div>
      </details>
    </section>

    <section class="card result area-result" id="result" aria-labelledby="h-result" tabindex="-1">
      <h2 id="h-result"><span class="step">2</span>1日の目標</h2>
      <div id="result-body"></div>
    </section>

    <section class="card area-log" aria-labelledby="h-log">
      <h2 id="h-log"><span class="step">3</span>食べたものを記録</h2>
      <div class="log-date">
        <label for="log-date">日付</label>
        <input id="log-date" type="date" required />
        <button type="button" class="ghost-btn" data-act="today">${p("calendar")}<span>今日</span></button>
      </div>
      <div id="log-summary" class="log-summary"></div>
      <div class="log-grid">
        <div>
          <h3>よく食べるもの</h3>
          <p class="hint">押すと、その量を1つ記録します。</p>
          <div class="foods">
            ${st.map(t=>`<button type="button" class="food" data-food="${t.id}">
                ${b(t.art,"food-art",44)}
                <span class="food-text"><span class="food-name">${t.name}</span><span class="food-amt">${t.amount}</span></span>
                <span class="food-kcal">${o(t.kcal)}<small>kcal</small></span>
              </button>`).join("")}
          </div>
          <details class="adv custom" id="custom">
            <summary>${p("plus")}そのほかの食べ物を入れる${p("chevron-down")}</summary>
            <form id="custom-form" class="adv-body" novalidate>
              <div class="num-field wide">
                <label for="c-name">食べ物の名前</label>
                <input id="c-name" type="text" maxlength="${I}" autocomplete="off" placeholder="例: 牛丼 並" />
              </div>
              <p class="hint">袋やメニューの「栄養成分表示」を見て入れます。カロリーが空なら PFC から計算します。</p>
              <div class="nums nums-4">
                ${[{key:"kcal",label:"カロリー",unit:"kcal",ph:"0",mode:"decimal"},{key:"protein",label:"たんぱく質",unit:"g",ph:"0",mode:"decimal"},{key:"fat",label:"脂質",unit:"g",ph:"0",mode:"decimal"},{key:"carbs",label:"炭水化物",unit:"g",ph:"0",mode:"decimal"}].map(t=>`<div class="num-field">
                    <label for="c-${t.key}">${t.label}</label>
                    <div class="num-row"><input id="c-${t.key}" type="text" inputmode="${t.mode}" autocomplete="off" placeholder="${t.ph}" aria-describedby="c-msg" /><span class="unit" aria-hidden="true">${t.unit}</span></div>
                  </div>`).join("")}
              </div>
              <p id="c-msg" class="field-msg" aria-live="polite"></p>
              <button type="submit" class="main-btn">${p("plus")}<span>記録する</span></button>
            </form>
          </details>
        </div>
        <div>
          <h3 id="h-entries">この日に食べたもの</h3>
          <ul class="entries" id="entries" aria-labelledby="h-entries"></ul>
        </div>
      </div>
    </section>
  </main>

  <footer class="foot">
    <div class="foot-actions">
      <button type="button" class="ghost-btn" data-act="export">${p("download")}<span>記録を書き出す</span></button>
      <button type="button" class="ghost-btn" data-act="import">${p("upload")}<span>書き出した記録を読み込む</span></button>
      <button type="button" class="ghost-btn danger" data-act="reset">${p("trash")}<span>すべて消す</span></button>
      <input type="file" id="import-file" accept="application/json,.json" hidden />
    </div>
    <p id="save-note" class="hint"></p>
    <p class="note">${p("info-circle")}<span>計算は一般的な式による目安です。病気の治療中・妊娠中・成長期の人は、医師や管理栄養士の指示を優先してください。</span></p>
    <p class="credit">入力した内容は、このスマホ（ブラウザ）の中にだけ残ります。キャッシュと同じで、外には送りません。<br />
      <a href="../">ほかのアプリ</a></p>
  </footer>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <p class="sr-only" id="live" aria-live="polite"></p>
`;function w(){const t=l.draft;for(const e of document.querySelectorAll('input[name="sex"]'))e.checked=e.value===t.sex;for(const e of document.querySelectorAll('input[name="activity"]'))e.checked=e.value===t.activity;for(const e of document.querySelectorAll('input[name="goal"]'))e.checked=e.value===t.goal;const a=["age","heightCm","weightKg","proteinPerKg","fatPercent"];for(const e of a){const n=u(`#in-${e}`),r=t[e];n.value=r===null?"":String(r),n.removeAttribute("aria-invalid"),u(`#msg-${e}`).textContent=""}u("#log-date").value=M}function g(){W=pt(l),Jt(),Xt(),u("#save-note").textContent=W?"":"この画面では保存できないため、閉じると入力が消えます（計算はできます）。"}function Bt(t){const a=Y(t),e=["protein","fat","carbs"],n=1;let r=0;const i=e.map(c=>{const d=a[c],_=d>0?`<circle class="ring-${c}" cx="60" cy="60" r="46" pathLength="100" stroke-dasharray="${Math.max(0,d-n)} ${100-Math.max(0,d-n)}" stroke-dashoffset="${-r}" />`:"";return r+=d,_}).join("");return`<svg class="ring" viewBox="0 0 120 120" role="img" aria-label="${`PFC の割合。${e.map(c=>`${J[c]} ${a[c]}%`).join("、")}`}">
    <circle class="ring-bg" cx="60" cy="60" r="46" />
    <g transform="rotate(-90 60 60)">${i}</g>
    <text x="60" y="56" class="ring-small" text-anchor="middle">PFC</text>
    <text x="60" y="76" class="ring-small" text-anchor="middle">バランス</text>
  </svg>`}function Gt(t){const a=[t.sex===null?"性別":"",t.age===null?"年齢":"",t.heightCm===null?"身長":"",t.weightKg===null?"体重":""].filter(Boolean);return`<div class="empty">
    ${b("plate","empty-art",96)}
    <p><strong>${a.join("・")}</strong>を入れると、ここに1日の目標カロリーと PFC が出ます。</p>
    <button type="button" class="main-btn" data-act="sample">${p("sparkles")}<span>見本の値で試す</span></button>
    <p class="hint">見本: 30歳・女性・158cm・52kg</p>
  </div>`}function Jt(){const t=rt(l.draft),a=u("#result-body");if(!t){a.innerHTML=Gt(l.draft);return}const e=at(t),n=Y(e),r=kt(e),i=bt(e),s=vt(t.heightCm,t.weightKg),c=["protein","fat","carbs"];a.innerHTML=`
    <div class="target">
      <p class="target-label">1日の目標カロリー</p>
      <p class="target-num"><span class="num" id="target-kcal">${o(e.kcal)}</span><span class="unit">kcal</span></p>
      <p class="target-phrase">${j[t.goal].phrase}</p>
      ${e.raisedToBmr?`<p class="warn">${p("alert-triangle")}<span>減らしすぎないよう、基礎代謝（${o(e.kcal)} kcal）まで引き上げています。</span></p>`:""}
    </div>

    <div class="pfc">
      ${Bt(e)}
      <ul class="pfc-list">
        ${c.map(d=>`<li class="pfc-${d}">
              <span class="dot" aria-hidden="true"></span>
              <span class="pfc-name">${J[d]}<small>（${_t[d]}）</small></span>
              <span class="pfc-g" data-macro="${d}">${o(e[d])}<small>g</small></span>
              <span class="pfc-pct">${n[d]}%<small>目安 ${C[d].min}〜${C[d].max}%</small></span>
            </li>`).join("")}
      </ul>
    </div>
    ${e.carbsShort?`<p class="warn">${p("alert-triangle")}<span>たんぱく質と脂質だけで目標カロリーを超えています。「PFC の割合を変える」で少なくしてください。</span></p>`:i.length?`<p class="note-box">${p("info-circle")}<span>${i.map(d=>`${J[d.key]}が国の目安より${d.dir==="high"?"多め":"少なめ"}`).join("、")}です。</span></p>`:""}

    <h3 class="eq-title">1日の食事の目安</h3>
    <p class="hint">1日分を、ひとつの食べ物にたとえると…</p>
    <ul class="eq">
      <li>${b("plate","eq-art",56)}<span><strong>1食あたり 約${o(r.perMealKcal)}<small>kcal</small></strong><small>朝・昼・夜の3食に分けると</small></span></li>
      <li>${b("rice","eq-art",56)}<span><strong>ごはん 約${m(r.riceBowls)}杯分</strong><small>カロリーを茶碗（150g）で</small></span></li>
      <li>${b("chicken","eq-art",56)}<span><strong>鶏むね肉 約${o(r.chickenGrams)}g分</strong><small>たんぱく質 ${o(e.protein)}g（卵なら約${m(r.eggs)}個）</small></span></li>
      <li>${b("bread","eq-art",56)}<span><strong>食パン 約${m(r.breadSlices)}枚分</strong><small>炭水化物 ${o(e.carbs)}g（6枚切り）</small></span></li>
      <li>${b("butter","eq-art",56)}<span><strong>バター 大さじ約${m(r.butterSpoons)}杯分</strong><small>脂質 ${o(e.fat)}g</small></span></li>
    </ul>

    <dl class="stats">
      <div><dt>基礎代謝</dt><dd>${o(R(t))}<small>kcal</small></dd></div>
      <div><dt>1日の消費</dt><dd>${o(X(t))}<small>kcal</small></dd></div>
      <div><dt>BMI</dt><dd>${s.toFixed(1)}<small>${$t(s)}</small></dd></div>
    </dl>
    <p class="hint">BMI 22 になる体重は ${m(yt(t.heightCm))}kg です。</p>

    <details class="adv how">
      <summary>計算のしかた${p("chevron-down")}</summary>
      <div class="adv-body">${Ht(t,e)}</div>
    </details>
  `,Ut(e)}function Ht(t,a){const e=`10×${m(t.weightKg)} ＋ 6.25×${m(t.heightCm)} − 5×${t.age} ${t.sex==="male"?"＋ 5":"− 161"}`,n=tt[t.goal];return`<ol class="how-list">
    <li><strong>基礎代謝</strong>（何もしなくても使う量）= ${e} = <b>${o(R(t))} kcal</b><br /><small>Mifflin-St Jeor 式</small></li>
    <li><strong>1日の消費</strong> = 基礎代謝 × ${z[t.activity]}（${F[t.activity].title}）= <b>${o(X(t))} kcal</b></li>
    <li><strong>目標カロリー</strong> = 1日の消費 × ${n===0?"1":`${1+n}（${n>0?"＋":"−"}${Math.abs(n*100)}%）`} = <b>${o(a.kcal)} kcal</b></li>
    <li><strong>たんぱく質</strong> = 体重 ${m(t.weightKg)}kg × ${t.proteinPerKg}g = <b>${o(a.protein)}g</b></li>
    <li><strong>脂質</strong> = 目標カロリーの ${t.fatPercent}% ÷ 9 = <b>${o(a.fat)}g</b></li>
    <li><strong>炭水化物</strong> = 残りのカロリー ÷ 4 = <b>${o(a.carbs)}g</b></li>
  </ol>
  <p class="hint">1g あたり たんぱく質と炭水化物は 4kcal、脂質は 9kcal で計算します。</p>`}function Ut(t){window.clearTimeout(Z),Z=window.setTimeout(()=>{u("#live").textContent=`目標は1日 ${o(t.kcal)} キロカロリー。たんぱく質 ${o(t.protein)}g、脂質 ${o(t.fat)}g、炭水化物 ${o(t.carbs)}g。`},1200)}function N(t,a,e,n,r){const i=e&&e>0?Math.min(100,a/e*100):0,s=e!==null&&a>e;return`<div class="bar ${r}${s?" over":""}">
    <div class="bar-label"><span>${t}</span><span>${n==="kcal"?o(a):m(a)}${e!==null?` / ${o(e)}`:""}<small>${n}</small></span></div>
    <div class="bar-track" aria-hidden="true"><div class="bar-fill" data-pct="${i.toFixed(1)}"></div></div>
  </div>`}function Xt(){const t=rt(l.draft),a=t?at(t):null,e=Ct(l.log,M).sort((s,c)=>c.createdAt-s.createdAt),n=Mt(e);let r;if(!a)r='<p class="hint">目標は「1 あなたのこと」を入れると出ます。記録だけでも使えます。</p>';else{const s=wt(a,n);r=s.kcal>=0?`<p class="left"><span>あと</span><strong>${o(s.kcal)}</strong><span>kcal 食べられます</span></p>`:`<p class="left over"><span>目標より</span><strong>${o(-s.kcal)}</strong><span>kcal 多く食べています</span></p>`}u("#log-summary").innerHTML=`${r}
    ${N("カロリー",n.kcal,a?a.kcal:null,"kcal","bar-kcal")}
    <div class="bars-3">
      ${N("たんぱく質",n.protein,a?a.protein:null,"g","bar-protein")}
      ${N("脂質",n.fat,a?a.fat:null,"g","bar-fat")}
      ${N("炭水化物",n.carbs,a?a.carbs:null,"g","bar-carbs")}
    </div>`;for(const s of document.querySelectorAll("#log-summary .bar-fill"))s.style.width=`${s.dataset.pct}%`;const i=u("#entries");i.innerHTML=e.length?e.map(s=>`<li class="entry">
          <span class="entry-text"><span class="entry-name">${O(s.name)}</span>
            <span class="entry-sub"><span class="entry-kcal">${o(s.kcal)}<small>kcal</small></span>
            <span class="entry-pfc">P ${m(s.protein)}g・F ${m(s.fat)}g・C ${m(s.carbs)}g</span></span></span>
          <button type="button" class="icon-btn" data-del="${O(s.id)}" aria-label="${O(s.name)}を消す">${p("trash")}</button>
        </li>`).join(""):'<li class="entries-empty">まだありません。左の食べ物を押すと記録できます。</li>'}function k(t,a){const e=u("#toast");e.innerHTML=`<span>${O(t)}</span>${a?`<button type="button" data-act="undo">${p("arrow-back-up")}<span>元に戻す</span></button>`:""}`,e.classList.add("show"),window.clearTimeout(V),V=window.setTimeout(()=>{e.classList.remove("show"),h=null},a?8e3:3e3)}function mt(t,a=t.name){h={log:l.log.slice()},l.log.push({...t,id:At(),date:M,createdAt:Date.now()}),l.log.length>3e3&&l.log.shift(),g(),k(`${a}を記録しました`,!0)}K.addEventListener("input",t=>{const a=t.target,e=a.dataset.field;if(!e)return;const n=nt(e,a.value),r=u(`#msg-${e}`);r.textContent=n.error,n.error?a.setAttribute("aria-invalid","true"):a.removeAttribute("aria-invalid"),!n.error&&(e==="proteinPerKg"||e==="fatPercent"?l.draft[e]=n.value??(e==="proteinPerKg"?E:T):l.draft[e]=n.value,g())});K.addEventListener("focusout",t=>{var r;const a=t.target,e=(r=a.dataset)==null?void 0:r.field;if(!e)return;const n=nt(e,a.value);!n.error&&n.value!==null&&(a.value=String(n.value))});K.addEventListener("change",t=>{const a=t.target;if(a.name==="sex")l.draft.sex=a.value;else if(a.name==="activity")l.draft.activity=a.value;else if(a.name==="goal")l.draft.goal=a.value;else if(a.id==="log-date")/^\d{4}-\d{2}-\d{2}$/.test(a.value)?M=a.value:a.value=M;else if(a.id==="import-file"){Wt(a);return}else return;g()});K.addEventListener("click",t=>{const a=t.target.closest("button");if(a){if(a.dataset.food){const e=St(a.dataset.food);e&&mt({name:`${e.name}（${e.amount}）`,kcal:e.kcal,protein:e.protein,fat:e.fat,carbs:e.carbs},e.name);return}if(a.dataset.del){const e=l.log.find(n=>n.id===a.dataset.del);if(!e)return;h={log:l.log.slice()},l.log=l.log.filter(n=>n.id!==e.id),g(),k(`${e.name}を消しました`,!0),u("#h-entries").setAttribute("tabindex","-1"),u("#h-entries").focus();return}switch(a.dataset.act){case"sample":Object.assign(l.draft,qt),w(),g(),u("#result").focus();break;case"adv-reset":l.draft.proteinPerKg=E,l.draft.fatPercent=T,w(),g();break;case"today":M=G(),u("#log-date").value=M,g();break;case"undo":h&&(l.log=h.log,h.draft&&(l.draft=h.draft),h=null,w(),g(),k("元に戻しました",!1));break;case"export":Yt(`pfc-kiroku-${G()}.json`,Ft(l));break;case"import":u("#import-file").click();break;case"reset":{h={log:l.log.slice(),draft:{...l.draft}},l=x(),w(),g(),k("すべて消しました",!0);break}}}});u("#custom-form").addEventListener("submit",t=>{t.preventDefault();const a=u("#c-msg"),e=(q,gt)=>{const S=et(u(`#c-${q}`).value);return S===null?null:Number.isNaN(S)||S<0||S>gt?"bad":Math.round(S*10)/10},n={kcal:e("kcal",y.kcal),protein:e("protein",y.g),fat:e("fat",y.g),carbs:e("carbs",y.g)};if(Object.values(n).includes("bad")){a.textContent=`数字で入れてください（カロリーは ${o(y.kcal)}、ほかは ${y.g}g まで）。`;return}const r=n;if(r.kcal===null&&r.protein===null&&r.fat===null&&r.carbs===null){a.textContent="カロリーか PFC のどれかを入れてください。";return}const i=r.protein??0,s=r.fat??0,c=r.carbs??0,d=r.kcal??Math.min(y.kcal,ht({protein:i,fat:s,carbs:c})),_=u("#c-name").value.trim().slice(0,I)||"食べたもの";a.textContent="";for(const q of["name","kcal","protein","fat","carbs"])u(`#c-${q}`).value="";mt({name:_,kcal:Math.round(d),protein:i,fat:s,carbs:c})});function Yt(t,a){const e=URL.createObjectURL(new Blob([a],{type:"application/json"})),n=document.createElement("a");n.href=e,n.download=t,document.body.append(n),n.click(),n.remove(),window.setTimeout(()=>URL.revokeObjectURL(e),1e3)}function Wt(t){var e;const a=(e=t.files)==null?void 0:e[0];t.value="",a&&a.text().then(n=>{const r=jt(n);if(!r){k("読み込めませんでした。このアプリで書き出したファイルを選んでください。",!1);return}h={log:l.log.slice(),draft:{...l.draft}},l=r,w(),g(),k(`読み込みました（記録 ${r.log.length}件）`,!0)},()=>k("ファイルを開けませんでした。",!1))}w();g();"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").then(()=>navigator.serviceWorker.ready).then(t=>{var e;const a=[location.href.split("#")[0],...performance.getEntriesByType("resource").map(n=>n.name).filter(n=>n.startsWith(location.origin))];(e=t.active)==null||e.postMessage({type:"precache",urls:a})}).catch(()=>{})});
