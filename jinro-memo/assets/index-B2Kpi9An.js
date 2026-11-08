(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))n(l);new MutationObserver(l=>{for(const o of l)if(o.type==="childList")for(const u of o.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&n(u)}).observe(document,{childList:!0,subtree:!0});function a(l){const o={};return l.integrity&&(o.integrity=l.integrity),l.referrerPolicy&&(o.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?o.credentials="include":l.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(l){if(l.ep)return;l.ep=!0;const o=a(l);fetch(l.href,o)}})();const Q=["villager","wolf","seer","medium","knight","madman","mason","fox"],me=["seer","medium","knight","mason","villager","fox","wolf","madman"],ye=["alive","hanged","bitten","dead"],Oe=["none","white","gray","black"],Ae=["judgment","classic"],Ce=["village","wolf","fox"],K=4,C=20,T=20,V=16,ge=400,st=200,ne=20,v={villager:"村人",wolf:"人狼",seer:"占い師",medium:"霊能者",knight:"騎士",madman:"狂人",mason:"共有者",fox:"妖狐"},le={seer:"占",medium:"霊",knight:"騎",mason:"共",villager:"村",fox:"狐",wolf:"狼",madman:"狂"},oe={villager:"能力はない。話し合いと投票で人狼を探す",wolf:"夜に1人を噛む。人間と同じ数まで減らせば勝ち",seer:"夜に1人を占い、人狼か（黒）そうでないか（白）が分かる",medium:"吊られた人が人狼だったかどうかが分かる（霊能者と霊媒師は同じ役）",knight:"夜に1人を人狼の噛みから守る。自分は守れない（狩人と騎士は同じ役）",madman:"人間だが人狼の味方。占うと白。占い師などを騙ることが多い",mason:"2人1組。お互いが仲間（村側）だと知っている。能力はそれだけだが、2人そろってCOすると村確定になる（双子と共有者は同じ役）",fox:"第三の陣営。噛まれても死なず、占われると死ぬ。最後まで生き残れば勝ち"},nt={judgment:{villager:["市民","市"],knight:["狩人","狩"],mason:["双子","双"]},classic:{villager:["村人","村"],knight:["騎士","騎"],mason:["共有者","共"]}};function Te(e){for(const[t,[a,n]]of Object.entries(nt[e]))v[t]=a,le[t]=n}const Z={village:"村の勝ち",wolf:"人狼の勝ち",fox:"妖狐の勝ち"},fe={alive:"生存",hanged:"吊り",bitten:"噛み",dead:"死亡"},De={none:"なし",white:"白寄り",gray:"灰",black:"黒寄り"},re={white:"○",black:"●"},Ie={white:"白",black:"黒"},lt=()=>Object.fromEntries(Q.map(e=>[e,0])),ee=[{n:5,label:"5人（少人数）",roles:{seer:1,wolf:1,madman:1,villager:2}},{n:9,label:"9人（定番）",roles:{seer:1,medium:1,knight:1,wolf:2,madman:1,villager:3}},{n:11,label:"11人（共有あり）",roles:{seer:1,medium:1,knight:1,mason:2,wolf:2,madman:1,villager:3}},{n:13,label:"13人（狐あり）",roles:{seer:1,medium:1,knight:1,mason:2,wolf:2,madman:1,fox:1,villager:4}},{n:16,label:"16人（大人数）",roles:{seer:1,medium:1,knight:1,mason:2,wolf:3,madman:1,fox:1,villager:6}}];function Ne(e){return{...lt(),...e}}const He=e=>Q.reduce((t,a)=>t+e[a],0);function F(e,t){if(!e)return"（消えた人）";const a=t.indexOf(e);return e.name.trim()||`${a+1}番`}function te(e){return Math.max(1,Math.min(T,e.players.length-1))}const be=e=>e.status==="alive",$e=e=>e.players.filter(be).length;function ot(e){return e<1?0:Math.floor((e-1)/2)}const ve=e=>new Map(e.players.map(t=>[t.id,t]));function I(e,t){const a=e.players.find(n=>n.id===t.by);return(a==null?void 0:a.co)==="seer"||(a==null?void 0:a.co)==="medium"?a.co:null}function Re(e,t){const a={white:0,black:0};for(const n of e.results)n.target===t&&I(e,n)==="seer"&&(a[n.verdict]+=1);return a}function _e(e){return e.white&&e.black?"panda":e.black?"black":e.white?"white":"none"}const rt={none:"判定なし",white:"白",black:"黒",panda:"パンダ（白と黒）"};function Fe(e){const t={none:[],white:[],black:[],panda:[]};for(const a of e.players)!be(a)||a.id===e.meId||a.co&&a.co!=="villager"||t[_e(Re(e,a.id))].push(a);return t}function Pe(e){return["seer","medium","knight","mason","fox","wolf","madman"].map(a=>{const n=e.players.filter(l=>l.co===a);return{co:a,count:n.length,slots:e.roles[a],names:n.map(l=>F(l,e.players))}}).filter(a=>a.count>0)}function it(e){const t=[],a=ve(e),n=u=>F(a.get(u),e.players),l=e.results.filter(u=>a.has(u.by)&&a.has(u.target));for(const u of l){const d=I(e,u),c=a.get(u.target);d==="medium"&&c.status!=="hanged"&&c.status!=="dead"&&t.push({level:"info",text:`${n(u.by)}の霊能結果の${n(u.target)}は、吊られていません。`}),u.by===u.target&&t.push({level:"info",text:`${n(u.by)}が自分自身を占っています。`})}const o=[...new Set(l.map(u=>u.target))];for(const u of o){const d=l.filter(r=>r.target===u&&I(e,r)),c=d.filter(r=>r.verdict==="white").map(r=>n(r.by)),p=d.filter(r=>r.verdict==="black").map(r=>n(r.by));c.length&&p.length&&t.push({level:"warn",text:`${n(u)}について、${ae(c).join("・")}は白、${ae(p).join("・")}は黒。どちらかが偽物です。`})}return t}const ae=e=>[...new Set(e)];function Be(e){let t=0;for(const a of e.players){if(a.status!=="hanged")continue;const n=e.results.filter(l=>l.target===a.id&&I(e,l)==="medium");n.length&&n.every(l=>l.verdict==="black")&&(t+=1)}return Math.min(t,e.roles.wolf)}function ie(e){const t=$e(e),a=ot(t),n=Math.max(0,e.roles.wolf-Be(e));return{alive:t,ropes:a,wolvesLeft:n,spare:a-n}}function Y(e,t){return e.status==="alive"||e.deathDay===null?!0:e.status==="hanged"?e.deathDay>=t:e.deathDay>t}function ze(e,t){const a=new Map(e.players.map((l,o)=>[l.id,o])),n=new Map;for(const l of e.votes)l.day!==t||!a.has(l.to)||!a.has(l.from)||n.set(l.to,[...n.get(l.to)??[],l.from]);return[...n.entries()].map(([l,o])=>({to:l,count:o.length,from:o})).sort((l,o)=>o.count-l.count||a.get(l.to)-a.get(o.to))}function Le(e,t,a){return e.players.filter(n=>n.status===a&&n.deathDay===t)}function We(e){const t=ve(e),a=r=>F(t.get(r),e.players),n=ie(e),l=[`【人狼メモ】${e.day}日目 生存${n.alive}人・縄${n.ropes}`];for(const r of["seer","medium"]){const h=e.players.filter(y=>y.co===r);if(h.length){l.push(`■${v[r]}`);for(const y of h){const A=e.results.filter(k=>k.by===y.id&&t.has(k.target)).sort((k,P)=>k.day-P.day).map(k=>`${k.day}日目 ${a(k.target)}${re[k.verdict]}`);l.push(`${a(y.id)}${be(y)?"":"（死亡）"}: ${A.length?A.join(" / "):"結果なし"}`)}}}const o=e.players.filter(r=>r.co==="knight");for(const r of o){const h=e.guards.filter(y=>y.by===r.id&&t.has(y.target)).sort((y,A)=>y.day-A.day).map(y=>`${y.day}日目 ${a(y.target)}護衛`);h.length&&l.push(`■${v.knight} ${a(r.id)}: ${h.join(" / ")}`)}const u=e.players.filter(r=>r.co&&r.co!=="seer"&&r.co!=="medium");u.length&&l.push(`■その他のCO: ${u.map(r=>`${a(r.id)}(${le[r.co]})`).join(" ")}`);const d=[];for(let r=1;r<=e.day;r++){for(const h of Le(e,r,"bitten"))d.push(`${r}日目 噛み ${a(h.id)}`);for(const h of Le(e,r,"hanged"))d.push(`${r}日目 吊り ${a(h.id)}`);for(const h of e.players.filter(y=>y.status==="dead"&&y.deathDay===r))d.push(`${r}日目 死亡 ${a(h.id)}`)}d.length&&l.push(`■死亡: ${d.join(" / ")}`);const c=Fe(e);l.push(`■グレー: ${c.none.length?c.none.map(r=>a(r.id)).join("、"):"なし"}`),c.white.length&&l.push(`■白: ${c.white.map(r=>a(r.id)).join("、")}`),c.black.length&&l.push(`■黒: ${c.black.map(r=>a(r.id)).join("、")}`),c.panda.length&&l.push(`■パンダ: ${c.panda.map(r=>a(r.id)).join("、")}`);const p=ze(e,e.day);return p.length&&l.push(`■${e.day}日目の投票: ${p.map(r=>`${a(r.to)}${r.count}票`).join(" ")}`),l.join(`
`)}function qe(e){const t=new Map,a=[],n=ve(e),l=i=>F(n.get(i),e.players),o=(i,m)=>{const g=t.get(i)??[];g.some(B=>B.kind===m.kind)||g.push(m),t.set(i,g)},u=e.results.filter(i=>n.has(i.by)&&n.has(i.target)),d=e.players.filter(i=>i.status==="bitten");d.length&&a.push({sure:!0,text:`噛まれた${d.map(i=>l(i.id)).join("・")}は人狼ではありません。`});const c=new Set;for(const i of u)I(e,i)==="seer"&&i.verdict==="black"&&n.get(i.target).status==="bitten"&&c.add(i.by);for(const i of c)o(i,{kind:"fake",text:"破綻",sure:!0}),a.push({sure:!0,text:`${l(i)}は噛まれた人に黒を出したので、偽の占い師です。`});for(const i of Pe(e)){const m=v[i.co];if(i.slots===0){a.push({sure:!0,text:`この村に${m}はいないので、${i.names.join("・")}の${m}COは偽物です。`});for(const g of e.players.filter(B=>B.co===i.co))o(g.id,{kind:"fake",text:"偽",sure:!0})}else i.count>i.slots&&a.push({sure:!0,text:`${m}COが${i.count}人（枠${i.slots}）。${i.names.join("・")}のうち、少なくとも${i.count-i.slots}人は偽物です。`})}const p=e.players.filter(i=>i.co==="seer"),r=p.filter(i=>!c.has(i.id));if(e.roles.seer===1&&r.length===1){const i=r[0],m=p.length===1?"対抗が出ていない":"ほかの占い師が破綻した";o(i.id,{kind:"real",text:"真占い",sure:!1}),a.push({sure:!1,text:`${m}ので、${l(i.id)}を本物の占い師とみなすと…`});for(const x of u.filter(at=>at.by===i.id))x.verdict==="white"?o(x.target,{kind:"human",text:"確白",sure:!1}):o(x.target,{kind:"wolf",text:"確黒",sure:!1});const g=u.filter(x=>x.by===i.id&&x.verdict==="white").map(x=>l(x.target)),B=u.filter(x=>x.by===i.id&&x.verdict==="black").map(x=>l(x.target));g.length&&a.push({sure:!1,text:`　${ae(g).join("・")}は人間（白）。ただし狂人のこともある。`}),B.length&&a.push({sure:!1,text:`　${ae(B).join("・")}は人狼（黒）。`})}const h=e.players.filter(i=>i.co==="mason");if(e.roles.mason>=2&&h.length===e.roles.mason){for(const i of h)o(i.id,{kind:"village",text:"村確定",sure:!1});a.push({sure:!1,text:`${v.mason}が${h.length}人そろってCOしたので、${h.map(i=>l(i.id)).join("・")}は村側で確定とみなせます。`})}const y=e.players.filter(i=>i.co==="medium");if(e.roles.medium===1&&y.length===1)for(const i of u.filter(m=>m.by===y[0].id&&n.get(m.target).status==="hanged"))i.verdict==="black"&&o(i.target,{kind:"wolf",text:"吊った狼",sure:!1});for(let i=2;i<=e.day&&!(e.ended&&i>e.ended.day);i++)if(!e.players.some(m=>m.status==="bitten"&&m.deathDay===i)&&(i<e.day||e.votes.some(m=>m.day===i)||e.players.some(m=>m.deathDay===i&&m.status==="hanged"))){const m=e.guards.filter(g=>g.day===i-1&&n.has(g.target));a.push({sure:!1,text:`${i}日目の朝はだれも噛まれていません（護衛成功・妖狐を噛んだ、など）。${m.length?`${m.map(g=>`${l(g.by)}の護衛先は${l(g.target)}`).join("、")}。`:""}`})}const A=$e(e),k=ie(e),P=Math.max(0,Math.ceil(A/2)-1);return!e.ended&&A>=3&&P<k.wolvesLeft&&a.push({sure:!0,text:`ゲームが続いているので、生きている人狼は${P}人以下です（人狼が生存者の半分に届くと人狼の勝ちで終わるため）。`}),{tags:t,facts:a}}function ct(e){if(e.ended)return null;const t=$e(e);return t<=2?{must:!0,text:`生存者が${t}人です。人狼が残っていれば人狼の勝ち、いなければ村の勝ちで、ゲームはもう終わっています。`,suggest:null}:e.roles.wolf>0&&Be(e)>=e.roles.wolf?{must:!1,text:`霊能結果のとおりなら、人狼${e.roles.wolf}人は全員吊られています。村の勝ちで終わっていませんか？`,suggest:"village"}:null}const Ke="jinro-memo.v1";let dt=0;const Ge=(e="p")=>`${e}${Date.now().toString(36)}${(dt++).toString(36)}${Math.random().toString(36).slice(2,6)}`;function ut(e){const t=new Array(ne).fill(0);for(const a of e)t[a.face]+=1;return t.indexOf(Math.min(...t))}function we(e=[]){return{id:Ge(),name:"",status:"alive",deathDay:null,co:null,mark:"none",note:"",face:ut(e)}}function z(e=9){const t=[];for(let n=0;n<e;n++)t.push(we(t));const a=ee.find(n=>n.n===e)??ee[1];return{day:1,players:t,roles:Ne(a.roles),meId:null,results:[],votes:[],guards:[],terms:"judgment",showFaces:!1,ended:null}}function ft(e){return{day:1,players:e.players.map(t=>({...we(),id:t.id,name:t.name,face:t.face})),roles:{...e.roles},meId:e.meId,results:[],votes:[],guards:[],terms:e.terms,showFaces:e.showFaces,ended:null}}const H=(e,t,a)=>typeof e=="number"&&Number.isInteger(e)&&e>=t&&e<=a,Ve=e=>typeof e=="string"&&e.length>0&&e.length<=40;function pt(e){return e&&Ve(e.id)&&typeof e.name=="string"&&e.name.length<=V&&ye.includes(e.status)&&(e.status==="alive"?e.deathDay===null:H(e.deathDay,1,T))&&(e.co===null||me.includes(e.co))&&Oe.includes(e.mark)&&typeof e.note=="string"&&e.note.length<=ge&&(e.face===void 0||H(e.face,0,ne-1))}function ht(e){return e&&Q.every(t=>H(e[t],0,C))}const mt=(e,t)=>e&&Ve(e.id)&&t.has(e.by)&&t.has(e.target)&&H(e.day,1,T)&&(e.verdict==="white"||e.verdict==="black"),yt=(e,t)=>e&&H(e.day,1,T)&&t.has(e.by)&&t.has(e.target),gt=(e,t)=>e&&H(e.day,1,T)&&t.has(e.from)&&t.has(e.to);function Xe(e){try{const t=JSON.parse(e??"null");if(!t||!H(t.day,1,T)||t.showFaces!==void 0&&typeof t.showFaces!="boolean"||!Array.isArray(t.players)||t.players.length<K||t.players.length>C||!t.players.every(pt)||new Set(t.players.map(o=>o.id)).size!==t.players.length||!ht(t.roles)||!Array.isArray(t.results)||t.results.length>st||!Array.isArray(t.votes)||t.votes.length>C*T||!(t.ended==null||Ce.includes(t.ended.winner)&&H(t.ended.day,1,T)))return z();const a=new Set(t.players.map(o=>o.id));if(!t.results.every(o=>mt(o,a))||!t.votes.every(o=>gt(o,a)))return z();const n=t.guards??[];if(!Array.isArray(n)||n.length>C*T||!n.every(o=>yt(o,a)))return z();const l=Ae.includes(t.terms)?t.terms:"judgment";return{day:t.day,players:t.players.map((o,u)=>({id:o.id,name:o.name,status:o.status,deathDay:o.deathDay,co:o.co,mark:o.mark,note:o.note,face:o.face??u%ne})),roles:Object.fromEntries(Q.map(o=>[o,t.roles[o]])),meId:a.has(t.meId)?t.meId:null,results:t.results.map(o=>({id:o.id,by:o.by,day:o.day,target:o.target,verdict:o.verdict})),votes:t.votes.map(o=>({day:o.day,from:o.from,to:o.to})),guards:n.map(o=>({day:o.day,by:o.by,target:o.target})),terms:l,showFaces:t.showFaces===!0,ended:t.ended?{winner:t.ended.winner,day:t.ended.day}:null}}catch{return z()}}function bt(){try{return Xe(localStorage.getItem(Ke))}catch{return z()}}function Ue(e){try{return localStorage.setItem(Ke,JSON.stringify(e)),!0}catch{return!1}}function $t(e){return e.split(/[\n\r,、，\t]+|\s{2,}|　/).map(t=>t.replace(/^\s*(\d+|[①-⑳])\s*[.．:：)）番]?\s*/,"").trim()).filter(Boolean).map(t=>t.slice(0,V)).slice(0,C)}const vt={plus:'<path d="M12 5l0 14" /> <path d="M5 12l14 0" />',minus:'<path d="M5 12l14 0" />',copy:'<path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" /> <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />',trash:'<path d="M4 7l16 0" /> <path d="M10 11l0 6" /> <path d="M14 11l0 6" /> <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /> <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />',refresh:'<path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /> <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />',"arrow-back-up":'<path d="M9 14l-4 -4l4 -4" /> <path d="M5 10h11a4 4 0 1 1 0 8h-1" />',x:'<path d="M18 6l-12 12" /> <path d="M6 6l12 12" />',"chevron-left":'<path d="M15 6l-6 6l6 6" />',"chevron-right":'<path d="M9 6l6 6l-6 6" />',moon:'<path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" />',check:'<path d="M5 12l5 5l10 -10" />'};function $(e){return`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${vt[e]}</svg>`}let s=bt();Te(s.terms);let je=Ue(s),W=null,L=null;const f=(e,t=document)=>t.querySelector(e);function M(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}const j=e=>s.players.find(t=>t.id===e),S=e=>M(F(j(e),s.players));function w(){je=Ue(s),f("#save-note").textContent=je?"":"この端末では保存できません。閉じると記録が消えます。"}function se(e){W={snap:JSON.stringify(s),label:e}}const wt=`
<svg class="top-art" viewBox="0 0 420 210" role="img" aria-label="月夜の村" focusable="false">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="var(--moon)" stop-opacity="0.55" />
      <stop offset="1" stop-color="var(--moon)" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect class="sky" x="0" y="0" width="420" height="210" rx="22" />
  <g class="stars">
    <circle cx="40" cy="34" r="1.6" /><circle cx="92" cy="62" r="1.2" /><circle cx="150" cy="24" r="1.8" />
    <circle cx="208" cy="52" r="1.1" /><circle cx="236" cy="18" r="1.4" /><circle cx="384" cy="40" r="1.5" />
    <circle cx="398" cy="92" r="1.1" /><circle cx="118" cy="104" r="1" /><circle cx="24" cy="96" r="1.2" />
  </g>
  <circle cx="318" cy="74" r="74" fill="url(#glow)" />
  <circle class="moon" cx="318" cy="74" r="38" />
  <circle class="crater" cx="306" cy="64" r="7" /><circle class="crater" cx="330" cy="88" r="5" /><circle class="crater" cx="326" cy="58" r="3" />
  <path class="cloud" d="M230 96c8-10 24-10 32-2c6-6 18-6 24 2c10 0 16 6 16 12h-84c0-6 4-10 12-12z" />
  <path class="hill-far" d="M0 160c50-26 110-30 170-14c60 16 120 6 170-14c30-12 60-12 80-6v84H0z" />
  <g class="houses">
    <path d="M28 168v-26l20-16l20 16v26z" />
    <path d="M78 168v-40l16-14l16 14v40z" />
    <path d="M118 168v-58l12-30l12 30v58z" />
    <path d="M150 168v-30l24-18l24 18v30z" />
    <path d="M250 168v-22l18-14l18 14v22z" />
    <path d="M292 168v-34l22-16l22 16v34z" />
    <path d="M344 168v-24l16-12l16 12v24z" />
  </g>
  <g class="windows">
    <rect x="44" y="148" width="7" height="8" rx="1" /><rect x="90" y="134" width="7" height="9" rx="1" />
    <rect x="127" y="120" width="6" height="10" rx="3" /><rect x="168" y="146" width="8" height="8" rx="1" />
    <rect x="309" y="144" width="8" height="9" rx="1" /><rect x="355" y="152" width="7" height="7" rx="1" />
  </g>
  <path class="wolf" d="M212 168l3-14l-6-6l2-9l5 3l3-8l3 9c6 1 10 5 12 10l8 4c4 2 5 6 4 11z" />
  <path class="ground" d="M0 168h420v42H0z" />
</svg>`,Ye=f("#app");Ye.innerHTML=`
  <a class="skip" href="#board">盤面へ移動</a>
  <header class="top">
    <div class="top-text">
      <p class="brand">${$("moon")}人狼メモ帳</p>
      <h1>夜ごとの推理を、<br />1枚の盤面に。</h1>
      <p class="lead">CO・占い・霊能・投票を書きとめると、グレーと縄の数、食い違いをその場で整理します。</p>
    </div>
    ${wt}
  </header>

  <nav class="daybar" aria-label="日付と移動">
    <div class="day-ctl">
      <button type="button" class="round-btn" data-act="day-dec" aria-label="前の日へ">${$("chevron-left")}</button>
      <p class="day-label" id="day-label" aria-live="polite"></p>
      <button type="button" class="round-btn" data-act="day-inc" aria-label="次の日へ">${$("chevron-right")}</button>
    </div>
    <p class="day-stat" id="day-stat"></p>
    <ul class="jump">
      <li><a href="#board">盤面</a></li>
      <li><a href="#summary">整理</a></li>
      <li><a href="#setup">設定</a></li>
    </ul>
  </nav>
  <div id="end-banner" class="end-banner" role="status" aria-live="polite"></div>

  <main class="layout">
    <section class="card area-board" id="board" aria-labelledby="h-board" tabindex="-1">
      <h2 id="h-board">盤面</h2>
      <p class="hint">マスを押すと、その日の結果・投票・生死を書けます。名前を押すと、見立てとメモ。</p>
      <div class="grid-wrap" id="grid-wrap"><table class="grid" id="grid"></table></div>
      <p class="legend"><span class="vd vd-white">○</span>白　<span class="vd vd-black">●</span>黒　<span class="vt">→</span>投票先　<span class="gd">護</span>護衛先　名前の左の帯は自分の見立て</p>
      <h3 id="h-tally"></h3>
      <div id="tally"></div>
      <fieldset class="winner"><legend>勝敗</legend><div id="winner"></div></fieldset>
    </section>

    <section class="card area-sum" id="summary" aria-labelledby="h-sum" tabindex="-1">
      <h2 id="h-sum">整理</h2>
      <div id="sum-body"></div>
      <div class="share-actions">
        <button type="button" class="primary-btn" data-act="copy">${$("copy")}<span>まとめをコピー</span></button>
      </div>
      <details class="preview"><summary>コピーする文を見る</summary><pre id="sum-text"></pre></details>
    </section>

    <section class="card area-setup" id="setup" aria-labelledby="h-setup" tabindex="-1">
      <h2 id="h-setup">村の設定</h2>
      <div class="setup-grid">
        <div>
          <h3>参加者</h3>
          <div class="count-row">
            <button type="button" class="round-btn" data-act="dec" aria-label="1人へらす">${$("minus")}</button>
            <label class="count-field">
              <span class="sr-only">人数</span>
              <input id="count" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" />
              <span aria-hidden="true">人</span>
            </label>
            <button type="button" class="round-btn" data-act="inc" aria-label="1人ふやす">${$("plus")}</button>
          </div>
          <p class="hint center">${K}〜${C}人。名前は空なら番号で出ます。</p>
          <ol class="names" id="names"></ol>
          <details class="paste">
            <summary>名前をまとめて貼る</summary>
            <label class="field"><span>参加者の一覧（改行・読点で区切る）</span>
              <textarea id="paste" rows="4" placeholder="例）ハル、ミナト、ソラ、アオイ"></textarea></label>
            <button type="button" class="ghost-btn" data-act="paste">この名前で入れる</button>
          </details>
        </div>
        <div>
          <h3>役職の呼び方</h3>
          <div id="terms"></div>
          <h3>顔の絵</h3>
          <div id="faces-opt"></div>
          <h3>役職の構成</h3>
          <div class="presets" id="presets"></div>
          <ul class="roles" id="roles"></ul>
          <p class="role-total" id="role-total" aria-live="polite"></p>
        </div>
      </div>
    </section>
  </main>

  <footer class="foot">
    <div class="foot-actions">
      <button type="button" class="ghost-btn" data-act="next">${$("refresh")}<span>次のゲーム（名前は残す）</span></button>
      <button type="button" class="ghost-btn danger" data-act="reset">${$("trash")}<span>全部消す</span></button>
    </div>
    <p id="save-note" class="hint"></p>
    <p class="credit">書いた内容は、このスマホ（ブラウザ）の中にだけ残ります。外には送りません。<br />
      <a href="../">ほかのアプリ</a></p>
  </footer>

  <dialog class="dlg" id="dlg" aria-labelledby="dlg-h"></dialog>
  <dialog class="dlg" id="cdlg" aria-labelledby="cdlg-h"></dialog>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;function Je(){var u;f("#day-label").innerHTML=`<b>${s.day}</b>日目`;const e=ie(s);f("#day-stat").innerHTML=`生存 <b>${e.alive}</b>人・縄 <b>${e.ropes}</b>`,f('[data-act="day-dec"]').disabled=s.day<=1;const t=ct(s),a=!!s.ended&&s.day>=s.ended.day,n=f('[data-act="day-inc"]'),l=s.day>=te(s);n.disabled=l||a||!!(t!=null&&t.must),n.setAttribute("aria-label",a?"ゲームは終わっています":t!=null&&t.must?"ゲームが終わっているはずなので進めません":l?`${s.players.length}人の村は${te(s)}日目までです`:"次の日へ"),n.title=n.getAttribute("aria-label");const o=f("#end-banner");s.ended?(o.className="end-banner is-ended",o.innerHTML=`<p><b>${s.ended.day}日目で決着：${Z[s.ended.winner]}</b>　これより先の日には進めません。</p>
      <button type="button" class="ghost-btn" data-act="unend">決着を取り消す</button>`):t?(o.className=`end-banner ${t.must?"is-must":"is-maybe"}`,o.innerHTML=`<p>${t.must?"<b>ゲームは終わっているはずです。</b>":""}${M(t.text)}${t.must?"　次の日には進めません。記録が違うときは、生死を直してください。":""}</p>
      <div class="end-actions">${(t.suggest?[t.suggest]:["village","wolf"]).map(d=>`<button type="button" class="primary-btn" data-end="${d}">${Z[d]}で終了</button>`).join("")}</div>`):(o.className="end-banner",o.innerHTML=""),f("#winner").innerHTML=D("win",["none",...Ce],d=>d==="none"?"まだ":Z[d],((u=s.ended)==null?void 0:u.winner)??"none",4)}function pe(e){s.ended=e?{winner:e,day:s.day}:null,w(),E(),R(e?`${s.day}日目で決着（${Z[e]}）にしました`:"決着を取り消しました")}let Ee=new Map;const ce=(e,t="face")=>s.showFaces?`<img class="${t}" src="./art/face${e.face}.webp" alt="" width="128" height="128" />`:"",de=e=>{const t=j(e);return M(t?[...F(t,s.players)].slice(0,3).join(""):"？")},kt=()=>Array.from({length:s.day},(e,t)=>t+1);function xt(e){return s.results.filter(t=>t.target===e&&I(s,t)).sort((t,a)=>t.day-a.day).map(t=>`<span class="vd vd-${t.verdict}">${I(s,t)==="seer"?"占":"霊"}${re[t.verdict]}</span>`).join("")}function Mt(e,t){const a=[],n=[],l=s.results.find(d=>d.by===e.id&&d.day===t&&j(d.target));l&&I(s,l)&&(a.push(`<span class="vd vd-${l.verdict}">${de(l.target)}${re[l.verdict]}</span>`),n.push(`${I(s,l)==="seer"?"占い":"霊能"} ${S(l.target)} ${Ie[l.verdict]}`));const o=s.guards.find(d=>d.by===e.id&&d.day===t&&j(d.target));o&&e.co==="knight"&&(a.push(`<span class="gd">護${de(o.target)}</span>`),n.push(`護衛 ${S(o.target)}`));const u=s.votes.find(d=>d.from===e.id&&d.day===t);return u&&j(u.to)&&(a.push(`<span class="vt">→${de(u.to)}</span>`),n.push(`投票 ${S(u.to)}`)),e.deathDay===t&&e.status!=="alive"&&(a.push(`<span class="tag tag-dead">${fe[e.status]}</span>`),n.push(fe[e.status])),{html:a.join(""),sr:n.join("、"),empty:a.length===0}}function Qe(){var d;Ee=qe(s).tags;const e=kt(),t=`<thead><tr><th scope="col" class="c-name">参加者</th><th scope="col" class="c-co">CO</th>${e.map(c=>`<th scope="col" class="c-day${c===s.day?" is-today":""}">${c}日目</th>`).join("")}</tr></thead>`,a=s.players.map((c,p)=>{const r=c.status!=="alive",h=c.id===s.meId,y=Ee.get(c.id)??[],A=_e(Re(s,c.id)),k=[c.mark!=="none"?`見立て ${De[c.mark]}`:"",A!=="none"?`占い判定 ${rt[A]}`:""].filter(Boolean).join("、"),P=e.map(i=>{if(!Y(c,i)&&c.deathDay!==i)return'<td class="c-day is-gone"><span aria-hidden="true">—</span></td>';const g=Mt(c,i);return`<td class="c-day${i===s.day?" is-today":""}"><button type="button" class="cell${g.empty?" is-empty":""}" data-cell="${c.id}:${i}">
            <span class="sr-only">${S(c.id)} ${i}日目 ${g.empty?"未入力":g.sr}</span><span aria-hidden="true" class="cell-in">${g.empty?"＋":g.html}</span></button></td>`}).join("");return`<tr class="mk-${c.mark}${r?" is-dead":""}${h?" is-me":""}">
        <th scope="row" class="c-name"><button type="button" class="cell-name" data-open="${c.id}">
          ${ce(c)}<span class="n-body"><span class="n-top"><span class="t-no">${p+1}</span><span class="t-name">${M(c.name.trim()||`${p+1}番`)}</span></span>
          <span class="n-tags">${h?'<span class="tag tag-me">自分</span>':""}${xt(c.id)}${y.map(i=>`<span class="dd dd-${i.kind}${i.sure?" is-sure":""}">${i.text}</span>`).join("")}</span></span>
          ${k?`<span class="sr-only">（${k}）</span>`:""}
        </button></th>
        <td class="c-co"><button type="button" class="cell cell-co" data-cell="${c.id}:0">
          ${c.co?`<span class="co co-${c.co}">${le[c.co]}</span><span class="sr-only">${v[c.co]}CO</span>`:`<span class="plus" aria-hidden="true">＋</span><span class="sr-only">${S(c.id)} CO 未入力</span>`}
        </button></td>
        ${P}
      </tr>`}).join("");f("#grid").classList.toggle("no-faces",!s.showFaces),f("#grid").innerHTML=t+`<tbody>${a}</tbody>`;const n=f("#grid-wrap"),l=n.querySelector("thead .is-today");l&&n.scrollWidth>n.clientWidth&&(n.scrollLeft=Math.max(0,l.offsetLeft-n.clientWidth+l.offsetWidth+8));const o=ze(s,s.day),u=((d=o[0])==null?void 0:d.count)??0;f("#h-tally").textContent=`${s.day}日目の票`,f("#tally").innerHTML=o.length?`<ol class="tally">${o.map(c=>`<li class="${c.count===u?"top-vote":""}"><span class="tl-name">${S(c.to)}</span><span class="tl-bar" data-n="${c.count}" aria-hidden="true"></span><b>${c.count}票</b><small>${c.from.map(S).join("・")}</small></li>`).join("")}</ol>`:`<p class="hint">投票はまだです。表の${s.day}日目のマスから入れられます。</p>`;for(const c of document.querySelectorAll(".tl-bar"))c.style.width=`min(100%, ${Number(c.dataset.n)*14}%)`}f("#grid").addEventListener("click",e=>{const t=e.target,a=t.closest("[data-open]");if(a)return Et(a.dataset.open);const n=t.closest("[data-cell]");if(n){const[l,o]=n.dataset.cell.split(":");et(l,Number(o))}});f("#board").addEventListener("change",e=>{const t=e.target;t.name==="win"&&pe(t.value==="none"?null:t.value)});const O=f("#cdlg");let b=null,G="white";function ue(e,t,a){return`<div class="picks">${t.map(n=>`<button type="button" class="pick" data-pick="${e}:${n.id}" aria-pressed="${n.id===a}">${ce(n,"face face-xs")}<span>${S(n.id)}</span></button>`).join("")}</div>`}function Lt(e){if(!b)return;const t=b.day===0?s.players:s.players.filter(n=>Y(n,b.day)||n.deathDay===b.day),a=t.findIndex(n=>n.id===b.id);return t[(a+e+t.length)%t.length]}function Ze(){const e=b?j(b.id):void 0;if(!e||!b)return;const t=b.day,a=s.players.indexOf(e);let n="";if(t===0)n=`<fieldset><legend>名乗り（CO）</legend>
      ${D("c-co",["none",...me],l=>l==="none"?"なし":v[l],e.co??"none",3)}
      <p class="hint" id="c-co-help">${e.co?`${v[e.co]}：${oe[e.co]}`:"名乗っていなければ「なし」。人狼・狂人COは、終盤の勝ち宣言や騙りのときに。"}</p></fieldset>`;else{const l=s.players.filter(p=>p!==e&&Y(p,t));if(e.co==="seer"||e.co==="medium"){const p=s.results.find(h=>h.by===e.id&&h.day===t);p&&(G=p.verdict);const r=e.co==="medium"?s.players.filter(h=>h!==e&&h.status!=="alive"):s.players.filter(h=>h!==e);n+=`<fieldset><legend>${e.co==="seer"?"占い結果":"霊能結果"}（${t}日目に言ったもの）</legend>
        ${D("c-v",["white","black"],h=>`${re[h]} ${Ie[h]}`,G,2)}
        ${r.length?ue("res",r,p==null?void 0:p.target):'<p class="hint">まだ死んだ人がいません。</p>'}</fieldset>`}if(e.co==="knight"){const p=s.guards.find(r=>r.by===e.id&&r.day===t);n+=`<fieldset><legend>護衛先（${t}日目の夜に守った、と言った人）</legend>${ue("guard",l,p==null?void 0:p.target)}</fieldset>`}const o=s.players.filter(p=>p!==e&&Y(p,t)),u=s.votes.find(p=>p.from===e.id&&p.day===t);n+=Y(e,t)?`<fieldset><legend>${t}日目の投票先</legend>${ue("vote",o,u==null?void 0:u.to)}</fieldset>`:`<p class="hint">${t}日目の朝に噛まれていたので、投票はありません。</p>`;const d=e.status!=="alive"&&e.deathDay!==null&&e.deathDay<t,c=e.status!=="alive"&&e.deathDay===t?e.status:"alive";n+=d?"":`<fieldset><legend>${t}日目の生死</legend>${D("c-st",ye,p=>p==="alive"?"生きている":p==="bitten"?"朝、噛まれていた":p==="hanged"?"夕方、吊られた":"死亡（その他）",c,2)}</fieldset>`}O.innerHTML=`
    <form method="dialog" class="dlg-body">
      <div class="dlg-head">
        ${ce(e,"face face-s")}
        <h2 id="cdlg-h"><span class="t-no">${a+1}</span>${S(e.id)}<small>${t===0?"CO":`${t}日目`}</small></h2>
        <button type="submit" class="icon-btn" aria-label="閉じる">${$("x")}</button>
      </div>
      ${n}
      <div class="cell-nav">
        <button type="button" class="ghost-btn" data-nav="-1">${$("chevron-left")}<span>前の人</span></button>
        <button type="button" class="ghost-btn" data-nav="1"><span>次の人</span>${$("chevron-right")}</button>
      </div>
      <button type="submit" class="primary-btn">閉じる</button>
    </form>`}function et(e,t){var a;b={id:e,day:t},G="white",Ze(),O.open||O.showModal(),(a=O.querySelector(".pick[aria-pressed=true], input:checked, .pick, .icon-btn"))==null||a.focus()}function tt(e){var t;w(),E(),Ze(),e&&((t=O.querySelector(e))==null||t.focus())}function jt(e,t,a){if(a==="alive"){e.deathDay===t&&Object.assign(e,{status:"alive",deathDay:null});return}if(a==="hanged"||a==="bitten")for(const n of s.players)n!==e&&n.status===a&&n.deathDay===t&&Object.assign(n,{status:"alive",deathDay:null});Object.assign(e,{status:a,deathDay:t}),a==="bitten"&&(s.votes=s.votes.filter(n=>!(n.day===t&&(n.from===e.id||n.to===e.id))))}O.addEventListener("click",e=>{var p;if(e.target===O)return O.close();if(!b)return;const t=j(b.id);if(!t)return;const a=e.target,n=a.closest("[data-nav]");if(n){const r=Lt(Number(n.dataset.nav));r&&et(r.id,b.day),(p=O.querySelector(`[data-nav="${n.dataset.nav}"]`))==null||p.focus();return}const l=a.closest("[data-pick]");if(!l)return;const[o,u]=l.dataset.pick.split(":"),d=b.day,c=l.getAttribute("aria-pressed")==="true";o==="vote"?(s.votes=s.votes.filter(r=>!(r.day===d&&r.from===t.id)),c||s.votes.push({day:d,from:t.id,to:u})):o==="guard"?(s.guards=s.guards.filter(r=>!(r.day===d&&r.by===t.id)),c||s.guards.push({day:d,by:t.id,target:u})):o==="res"&&(s.results=s.results.filter(r=>!(r.day===d&&r.by===t.id)),c||s.results.push({id:Ge("r"),by:t.id,day:d,target:u,verdict:G})),tt(`[data-pick="${o}:${u}"]`)});O.addEventListener("change",e=>{if(!b)return;const t=j(b.id);if(!t)return;const a=e.target;if(a.name==="c-co")t.co=a.value==="none"?null:a.value;else if(a.name==="c-v"){G=a.value;const n=s.results.find(l=>l.by===t.id&&l.day===b.day);n&&(n.verdict=G)}else if(a.name==="c-st")jt(t,b.day,a.value);else return;tt(`input[name="${a.name}"][value="${a.value}"]`)});O.addEventListener("close",()=>{const e=b;b=null,e&&setTimeout(()=>{var t;return(t=document.querySelector(`[data-cell="${e.id}:${e.day}"]`))==null?void 0:t.focus()},0)});const N=f("#dlg");function D(e,t,a,n,l){return`<div class="seg cols-${l}">${t.map(o=>`<label class="seg-opt"><input type="radio" name="${e}" value="${o}" ${o===n?"checked":""} /><span>${a(o)}</span></label>`).join("")}</div>`}function ke(){const e=L?j(L):void 0;if(!e)return;const t=s.players.indexOf(e),a=s.meId===e.id,n=Array.from({length:Math.max(s.day,e.deathDay??1)},(l,o)=>o+1);N.innerHTML=`
    <form method="dialog" class="dlg-body">
      <div class="dlg-head">
        <h2 id="dlg-h"><span class="t-no">${t+1}</span><span id="dlg-name">${S(e.id)}</span></h2>
        <button type="submit" class="icon-btn" aria-label="閉じる">${$("x")}</button>
      </div>
      ${s.showFaces?`<details class="face-pick"><summary>${ce(e,"face face-s")}<span>顔を変える</span></summary>
        <fieldset><legend class="sr-only">顔</legend><div class="faces">${Array.from({length:ne},(l,o)=>`<label class="face-opt"><input type="radio" name="d-face" value="${o}" ${o===e.face?"checked":""} /><img src="./art/face${o}.webp" alt="顔${o+1}" width="128" height="128" /></label>`).join("")}</div></fieldset>
      </details>`:""}
      <label class="field"><span>名前</span>
        <input id="d-name" type="text" maxlength="${V}" autocomplete="off" value="${M(e.name)}" placeholder="${t+1}番" /></label>
      <fieldset><legend>名乗り（CO）</legend>
        ${D("d-co",["none",...me],l=>l==="none"?"なし":v[l],e.co??"none",3)}
        <p class="hint" id="co-help">${e.co?`${v[e.co]}：${oe[e.co]}`:"名乗っていなければ「なし」。人狼・狂人COは、終盤の勝ち宣言や騙りのときに。"}</p></fieldset>
      <fieldset><legend>生死</legend>
        ${D("d-st",ye,l=>fe[l],e.status,4)}
        ${e.status!=="alive"?`<label class="field inline"><span>何日目</span><select id="d-day">${n.map(l=>`<option value="${l}" ${l===e.deathDay?"selected":""}>${l}日目</option>`).join("")}</select></label>`:""}
      </fieldset>
      <fieldset><legend>自分の見立て</legend>
        ${D("d-mark",Oe,l=>De[l],e.mark,4)}</fieldset>
      <button type="button" class="toggle-btn" data-act="me" aria-pressed="${a}">${a?$("check"):""}<span>${a?"これは自分":"自分の席にする"}</span></button>
      <label class="field"><span>メモ</span>
        <textarea id="d-note" rows="4" maxlength="${ge}" placeholder="例）初日に占いCO。発言が早い">${M(e.note)}</textarea></label>
      <button type="submit" class="primary-btn">閉じる</button>
    </form>`}function Et(e){L=e,ke(),N.showModal(),f("#d-name").focus()}function xe(){w(),Qe(),Me(),Je()}N.addEventListener("input",e=>{const t=L?j(L):void 0;if(!t)return;const a=e.target;if(a.id==="d-name"){t.name=a.value.slice(0,V),f("#dlg-name").textContent=F(t,s.players);const n=f(`#name-${t.id}`);n&&(n.value=t.name)}else if(a.id==="d-note")t.note=a.value.slice(0,ge);else return;xe()});N.addEventListener("change",e=>{const t=L?j(L):void 0;if(!t)return;const a=e.target;if(a.name==="d-co")t.co=a.value==="none"?null:a.value,f("#co-help").textContent=t.co?`${v[t.co]}：${oe[t.co]}`:"名乗っていなければ「なし」。";else if(a.name==="d-face")t.face=Number(a.value),f(".face-pick summary .face").setAttribute("src",`./art/face${t.face}.webp`);else if(a.name==="d-mark")t.mark=a.value;else if(a.name==="d-st")t.status=a.value,t.deathDay=t.status==="alive"?null:t.deathDay??s.day,ke(),f(`input[name="d-st"][value="${t.status}"]`).focus();else if(a.id==="d-day")t.deathDay=Number(a.value);else return;xe()});N.addEventListener("click",e=>{if(e.target===N)return N.close();!e.target.closest('[data-act="me"]')||!L||(s.meId=s.meId===L?null:L,ke(),f('[data-act="me"]').focus(),xe())});N.addEventListener("close",()=>{const e=L;L=null,_(),setTimeout(()=>{var t;return(t=document.querySelector(`[data-open="${e}"]`))==null?void 0:t.focus()},0)});function X(e,t){return e.length?`<ul class="chips">${e.map(a=>`<li class="chip ${t}">${S(a.id)}</li>`).join("")}</ul>`:'<p class="hint">なし</p>'}function Me(){const e=ie(s),t=it(s),a=Fe(s),n=Pe(s),l=r=>s.players.filter(h=>h.mark===r&&h.status==="alive"),o=e.spare<=0?'<p class="alert">縄が人狼の数と同じかそれ以下です。もう吊り間違えられません。</p>':`<p class="hint">人狼が最大${e.wolvesLeft}人残っているとして、吊り間違えられるのはあと${e.spare}回。</p>`,{facts:u}=qe(s),d=u.filter(r=>r.sure),c=u.filter(r=>!r.sure),p=u.length?`<div class="facts">
        ${d.length?`<h3 class="facts-h">確定していること</h3><ul class="fact-list is-sure">${d.map(r=>`<li>${M(r.text)}</li>`).join("")}</ul>`:""}
        ${c.length?`<h3 class="facts-h">ほぼ確定（前提つき）</h3><ul class="fact-list">${c.map(r=>`<li>${M(r.text)}</li>`).join("")}</ul>`:""}
      </div>`:"";f("#sum-body").innerHTML=p+`
    <dl class="stats">
      <div><dt>生存</dt><dd>${e.alive}<small>人</small></dd></div>
      <div><dt>縄</dt><dd>${e.ropes}<small>本</small></dd></div>
      <div><dt>残り人狼</dt><dd>${e.wolvesLeft}<small>人</small></dd></div>
      <div class="${e.spare<=0?"is-tight":""}"><dt>余裕</dt><dd>${Math.max(0,e.spare)}<small>回</small></dd></div>
    </dl>
    ${o}
    ${t.length?`<h3>気になる点</h3><ul class="issues">${t.map(r=>`<li class="issue issue-${r.level}">${M(r.text)}</li>`).join("")}</ul>`:""}
    <h3>CO</h3>
    ${n.length?`<ul class="co-list">${n.map(r=>`<li><span class="co co-${r.co}">${le[r.co]}</span>${v[r.co]} <b>${r.count}</b>/${r.slots}：${r.names.map(M).join("・")}</li>`).join("")}</ul>`:'<p class="hint">まだだれも名乗っていません。</p>'}
    <h3>グレー（判定なし）</h3>${X(a.none,"chip-gray")}
    <h3>白をもらった人</h3>${X(a.white,"chip-white")}
    ${a.black.length?`<h3>黒が出た人</h3>${X(a.black,"chip-black")}`:""}
    ${a.panda.length?`<h3>パンダ（白と黒）</h3>${X(a.panda,"chip-panda")}`:""}
    ${l("black").length?`<h3>自分の見立て：黒寄り</h3>${X(l("black"),"chip-black")}`:""}
  `,f("#sum-text").textContent=We(s)}f("#summary").addEventListener("click",async e=>{if(!e.target.closest('[data-act="copy"]'))return;let t=!1;try{await navigator.clipboard.writeText(We(s)),t=!0}catch{t=!1}R(t?"まとめをコピーしました":"コピーできませんでした。「コピーする文を見る」から選んでコピーしてください。")});const q=f("#count");function _(){q.value=String(s.players.length),f('[data-act="dec"]').disabled=s.players.length<=K,f('[data-act="inc"]').disabled=s.players.length>=C,f("#names").innerHTML=s.players.map((e,t)=>`
      <li class="name-row">
        <label class="sr-only" for="name-${e.id}">${t+1}人目の名前</label>
        <span class="t-no" aria-hidden="true">${t+1}</span>
        <input id="name-${e.id}" class="name-input" type="text" maxlength="${V}" autocomplete="off" value="${M(e.name)}" placeholder="${t+1}番" data-name="${e.id}" />
      </li>`).join(""),f("#presets").innerHTML=ee.map(e=>`<button type="button" class="chip-btn" data-preset="${e.n}">${e.label}</button>`).join(""),f("#terms").innerHTML=D("terms",Ae,e=>e==="judgment"?"人狼ジャッジメント式<small>市民・狩人・双子</small>":"一般的な呼び方<small>村人・騎士・共有者</small>",s.terms,2),f("#faces-opt").innerHTML=D("faces",["off","on"],e=>e==="off"?"出さない":"出す",s.showFaces?"on":"off",2),J()}function J(){f("#roles").innerHTML=Q.map(a=>`
    <li class="role role-${a}">
      <span class="role-name">${v[a]}<small class="role-help">${oe[a]}</small></span>
      <button type="button" class="round-btn sm" data-role="${a}" data-d="-1" aria-label="${v[a]}を1人へらす" ${s.roles[a]<=0?"disabled":""}>${$("minus")}</button>
      <span class="role-n" aria-live="polite">${s.roles[a]}</span>
      <button type="button" class="round-btn sm" data-role="${a}" data-d="1" aria-label="${v[a]}を1人ふやす" ${s.roles[a]>=C?"disabled":""}>${$("plus")}</button>
    </li>`).join("");const e=He(s.roles),t=s.players.length;f("#role-total").innerHTML=e===t?`<span class="ok">${$("check")}役職の合計 ${e}人 ＝ 参加 ${t}人</span>`:`<span class="ng">役職の合計 ${e}人、参加は ${t}人です。</span>
         <button type="button" class="text-btn" data-act="fit">${v.villager}の数で合わせる</button>`}function U(e){const t=Math.min(C,Math.max(K,e));if(t<s.players.length){se(`${s.players.length-t}人をへらしました`);const a=new Set(s.players.slice(t).map(n=>n.id));s.players=s.players.slice(0,t),s.results=s.results.filter(n=>!a.has(n.by)&&!a.has(n.target)),s.votes=s.votes.filter(n=>!a.has(n.from)&&!a.has(n.to)),s.guards=s.guards.filter(n=>!a.has(n.by)&&!a.has(n.target)),s.meId&&a.has(s.meId)&&(s.meId=null),he()}for(;s.players.length<t;)s.players.push(we(s.players));s.day=Math.min(s.day,te(s)),w(),_(),E()}q.addEventListener("change",()=>{const e=Number(q.value.replace(/[０-９]/g,t=>String.fromCharCode(t.charCodeAt(0)-65248)).replace(/[^\d]/g,""));e?U(e):q.value=String(s.players.length)});q.addEventListener("keydown",e=>{e.key==="Enter"&&q.blur()});f("#setup").addEventListener("change",e=>{const t=e.target;if(t.name==="faces"){s.showFaces=t.value==="on",w(),E();return}t.name==="terms"&&(s.terms=t.value,Te(s.terms),w(),J(),E())});f("#setup").addEventListener("input",e=>{const t=e.target,a=t.dataset.name?j(t.dataset.name):void 0;a&&(a.name=t.value.slice(0,V),w(),E())});f("#setup").addEventListener("click",e=>{var o,u;const t=e.target,a=(o=t.closest("[data-act]"))==null?void 0:o.dataset.act;if(a==="dec")return U(s.players.length-1);if(a==="inc")return U(s.players.length+1);if(a==="fit"){const d=He(s.roles)-s.roles.villager;s.roles.villager=Math.max(0,s.players.length-d),w(),J();return}if(a==="paste"){const d=$t(f("#paste").value);if(d.length<K)return R(`${K}人以上の名前を、改行か読点で区切って貼ってください`);se("名前を入れ替えました");const c=s.players.length;U(d.length),s.players.forEach((p,r)=>p.name=d[r]??p.name),w(),_(),E(),f("#paste").value="",R(`${d.length}人の名前を入れました${c!==d.length?`（${c}人→${d.length}人）`:""}`,!0);return}const n=t.closest("[data-preset]");if(n){const d=ee.find(c=>c.n===Number(n.dataset.preset));s.roles=Ne(d.roles),s.players.length!==d.n&&U(d.n),w(),J(),R(`${d.label}の構成にしました`);return}const l=t.closest("[data-role]");if(l){const d=l.dataset.role;s.roles[d]=Math.min(C,Math.max(0,s.roles[d]+Number(l.dataset.d))),w(),J(),Me(),(u=f(`[data-role="${d}"][data-d="${l.dataset.d}"]`))==null||u.focus()}});Ye.addEventListener("click",e=>{var n;const t=(n=e.target.closest("[data-act]"))==null?void 0:n.dataset.act,a=e.target.closest("[data-end]");if(a)return pe(a.dataset.end);if(t==="unend")return pe(null);t==="day-dec"||t==="day-inc"?(s.day=Math.min(te(s),Math.max(1,s.day+(t==="day-inc"?1:-1))),w(),E()):t==="next"?(se("次のゲームにしました（名前と構成は残しています）"),s=ft(s),w(),_(),E(),he()):t==="reset"&&(se("全部消しました"),s=z(),w(),_(),E(),he())});let Se=0;function R(e,t=!1){const a=f("#toast");a.innerHTML=`<span>${M(e)}</span>${t?`<button type="button" class="toast-btn" data-act="undo">${$("arrow-back-up")}元に戻す</button>`:""}`,a.classList.add("show"),window.clearTimeout(Se),Se=window.setTimeout(()=>a.classList.remove("show"),t?8e3:4e3)}function he(){W&&R(W.label,!0)}f("#toast").addEventListener("click",e=>{!e.target.closest('[data-act="undo"]')||!W||(s=Xe(W.snap),W=null,f("#toast").classList.remove("show"),w(),_(),E(),R("元に戻しました"))});function E(){Je(),Qe(),Me()}_();E();w();"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").then(async e=>{var a;await navigator.serviceWorker.ready;const t=performance.getEntriesByType("resource").map(n=>n.name).filter(n=>n.startsWith(location.origin));(a=e.active??e.waiting??e.installing)==null||a.postMessage({type:"precache",urls:[location.href,...t]})}).catch(()=>{})});
