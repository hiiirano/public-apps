(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const u of o.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&s(u)}).observe(document,{childList:!0,subtree:!0});function a(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(n){if(n.ep)return;n.ep=!0;const o=a(n);fetch(n.href,o)}})();const _=4,r=(e,t)=>({x:e*_,y:t*_}),y=(e,t,a,s,n,o,u)=>({id:e,label:t,shortLabel:a,kind:s,selectable:s==="landmark",x:n*_,y:o*_,art:u}),g=(e,t,a,s,n,o,u,m,f,M,c)=>({id:e,from:t,to:a,distanceM:s,kind:n,instruction:{forward:o,reverse:u},basis:m,points:f,sourceIds:M,availability:c}),te={version:"2026-10-23-beta.2",checkedOn:"2026年8月23日",places:[y("tocho","東京都庁","都庁","landmark",8,58,"classical-building"),y("west_walkway","西口の地下歩道（都庁へ向かう道）","西口地下歩道","junction",26,57),y("west_exit","新宿駅 西口","西口","landmark",43,50,"station"),y("east_exit","新宿駅 東口","東口","landmark",54,49,"station"),y("metro","メトロプロムナード（東口の地下）","メトロ","junction",59,40),y("subnade","新宿サブナード","サブナード","junction",68,25),y("ward_15b","サブナード 15B出口","15B出口","entrance",76.5,21),y("ward_office","新宿区役所","区役所","landmark",79,19,"office-building"),y("sanchome","新宿三丁目駅","三丁目","landmark",91,49,"metro")],edges:[g("u_tocho_westwalk","tocho","west_walkway",520,"underground","都庁から地下歩道に入り、新宿駅の方へ進みます。","地下歩道を都庁の方へまっすぐ進みます。","ターミナルマップで地下歩道として描かれている",[r(8,58),r(16,58),r(26,57)],["terminal-map"]),g("u_westwalk_west","west_walkway","west_exit",360,"underground","地下歩道から西口の地下広場へ進みます。","西口の地下広場から「東京都庁」の案内に従って進みます。","ターミナルマップで地下通路として描かれている",[r(26,57),r(34,55),r(43,50)],["terminal-map"]),g("c_west_east","west_exit","east_exit",140,"covered","駅の東西自由通路を通って東口へ進みます。","駅の東西自由通路を通って西口へ進みます。","線路の下を通る駅の自由通路（屋根の下）。新宿区の整備案内による",[r(43,50),r(49,50),r(54,49)],["terminal-map","east-west"],"駅の通路です。夜間は通れない時間があるかもしれません。"),g("u_east_metro","east_exit","metro",130,"underground","東口の地下広場から丸ノ内線・メトロプロムナードの方へ進みます。","メトロプロムナードから「JR東口」の案内に従って進みます。","ターミナルマップ・東京メトロ構内図で地下通路として描かれている",[r(54,49),r(56,44),r(59,40)],["terminal-map","metro-map"],"電車が動いている時間を想定しています。"),g("u_metro_subnade","metro","subnade",240,"underground","メトロプロムナードからサブナードの方へ進みます。","サブナードから丸ノ内線・JR新宿駅の方へ進みます。","ターミナルマップで地下街としてつながっている",[r(59,40),r(62,33),r(68,25)],["terminal-map","metro-map"],"地下街です。開いている時間と、閉まっている出口に注意してください。"),g("u_subnade_ward","subnade","ward_15b",150,"underground","サブナードを区役所の方へ進み、15B出口を目印にします。","15B出口からサブナードに入り、新宿駅の方へ進みます。","ターミナルマップ・区役所のアクセス案内で 15B 出口が最寄りとされている",[r(68,25),r(73,23),r(76.5,21)],["terminal-map","ward-office"],"地下街です。開いている時間に注意してください。"),g("o_15b_office","ward_15b","ward_office",50,"outdoor","15B出口から地上に出て、区役所まで歩きます。","区役所から15B出口へ歩き、サブナードに入ります。","地上の道。屋根の有無は未確認のため日なたとして数える",[r(76.5,21),r(79,19)],["terminal-map","ward-office"]),g("u_metro_sanchome","metro","sanchome",650,"underground","メトロプロムナードを新宿三丁目の方へまっすぐ進み、A5出口の方を目印にします。","A5出口の方からメトロプロムナードを新宿駅の方へまっすぐ進みます。","ターミナルマップ・東京メトロ構内図で地下通路として描かれている",[r(59,40),r(70,42),r(81,46),r(91,49)],["terminal-map","metro-map"],"出入口によっては使える時間が決まっています。"),g("o_tocho_west","tocho","west_exit",780,"outdoor","地上の中央通りを新宿駅西口の方へ歩きます。","地上の中央通りを都庁の方へ歩きます。","地上の道。ビルや街路樹の影は数えていない",[r(8,58),r(18,49),r(31,45),r(43,50)],["terminal-map"]),g("o_east_ward","east_exit","ward_office",480,"outdoor","東口から地上を歌舞伎町の方へ歩き、区役所通りへ向かいます。","区役所通りから地上を新宿駅東口の方へ歩きます。","地上の道。ビルや街路樹の影は数えていない",[r(54,49),r(60,39),r(69,29),r(79,19)],["terminal-map","ward-office"]),g("o_east_sanchome","east_exit","sanchome",760,"outdoor","地上の新宿通りを新宿三丁目の方へ歩きます。","地上の新宿通りを新宿駅東口の方へ歩きます。","地上の道。アーケードやビルの影は数えていない",[r(54,49),r(66,51),r(79,51),r(91,49)],["terminal-map"]),g("o_ward_sanchome","ward_office","sanchome",690,"outdoor","区役所の前から地上を明治通りの方へ歩きます。","明治通りの方から地上を区役所の方へ歩きます。","地上の道。ビルや街路樹の影は数えていない",[r(79,19),r(84,28),r(88,39),r(91,49)],["terminal-map"])],sources:[{id:"terminal-map",title:"新宿ターミナルマップ（日英版）",publisher:"新宿区・新宿ターミナル案内サイン連絡会",url:"https://www.city.shinjuku.lg.jp/content/000423320.pdf",updated:"2025年11月時点"},{id:"east-west",title:"新宿駅東西自由通路の整備",publisher:"新宿区",url:"https://www.city.shinjuku.lg.jp/soshiki/toshikei01_002133.html",updated:"2025年3月27日更新"},{id:"metro-map",title:"新宿駅 構内図・出口案内",publisher:"東京メトロ",url:"https://www.tokyometro.jp/station/shinjuku/yardmap/index_print.html"},{id:"ward-office",title:"新宿区役所本庁舎 交通アクセス",publisher:"新宿区",url:"https://www.city.shinjuku.lg.jp/shisetsu/map1-1.html",updated:"2024年2月13日更新"}]},se={"arrows-up-down":'<path d="M7 3l0 18" /> <path d="M10 6l-3 -3l-3 3" /> <path d="M20 18l-3 3l-3 -3" /> <path d="M17 21l0 -18" />',sun:'<path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /> <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />',umbrella:'<path d="M4 12a8 8 0 0 1 16 0l-16 0" /> <path d="M12 12v6a2 2 0 0 0 4 0" />',clock:'<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /> <path d="M12 7v5l3 3" />',walk:'<path d="M12 4a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /> <path d="M7 21l3 -4" /> <path d="M16 21l-2 -4l-3 -3l1 -6" /> <path d="M6 12l2 -3l4 -1l3 3l3 1" />',"map-pin":'<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /> <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" />',"info-circle":'<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /> <path d="M12 9h.01" /> <path d="M11 12h1v4h1" />',"alert-triangle":'<path d="M12 9v4" /> <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /> <path d="M12 16h.01" />',"chevron-down":'<path d="M6 9l6 6l6 -6" />',flag:'<path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9" /> <path d="M5 21v-7" />',"building-arch":'<path d="M3 21l18 0" /> <path d="M4 21v-15a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v15" /> <path d="M9 21v-8a3 3 0 0 1 6 0v8" />',"stairs-down":'<path d="M22 21h-5v-5h-5v-5h-5v-5h-5" /> <path d="M18 3v7" /> <path d="M15 7l3 3l3 -3" />',"external-link":'<path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /> <path d="M11 13l9 -9" /> <path d="M15 4h5v5" />'};function p(e){return`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${se[e]}</svg>`}const L=60,ae=5,J=e=>e.kind!=="outdoor";function ne(e,t){return t==="shortest"||J(e)?e.distanceM:e.distanceM*ae}const P=e=>e<=0?0:Math.ceil(e/L);class T extends Error{constructor(t){super(t==="unknown-place"?"Unknown start or destination":"No route found"),this.code=t}}function q(e,t,a,s,n){let o=0,u=0;for(const f of s)o+=f.edge.distanceM,J(f.edge)&&(u+=f.edge.distanceM);const m=o-u;return{mode:e,from:t,to:a,steps:s,nodeIds:n,distanceM:o,shadeM:u,sunM:m,shadeRatio:o===0?100:Math.floor(u*100/o),minutes:P(o),sunMinutes:P(m)}}function R(e,t,a,s){const n=e.places.map(i=>i.id);if(!n.includes(t)||!n.includes(a))throw new T("unknown-place");if(t===a)return q(s,t,a,[],[t]);const o=new Map(n.map(i=>[i,Number.POSITIVE_INFINITY])),u=new Map(n.map(i=>[i,Number.POSITIVE_INFINITY])),m=new Map,f=new Set;for(o.set(t,0),u.set(t,0);;){let i=null;for(const v of n){if(f.has(v))continue;const w=o.get(v);Number.isFinite(w)&&(i===null||w<o.get(i))&&(i=v)}if(i===null||i===a)break;f.add(i);const k=o.get(i),C=u.get(i);for(const v of e.edges){const w=v.from===i?v.to:v.to===i?v.from:null;if(w===null||f.has(w))continue;const S=k+ne(v,s),A=o.get(w);(S<A-1e-9||Math.abs(S-A)<=1e-9&&C+1<u.get(w))&&(o.set(w,S),u.set(w,C+1),m.set(w,{nodeId:i,edge:v}))}}if(!m.has(a))throw new T("no-route");const M=[],c=[a];let h=a;for(;h!==t;){const i=m.get(h),k=i.edge.from===i.nodeId;M.unshift({edge:i.edge,from:i.nodeId,to:h,instruction:k?i.edge.instruction.forward:i.edge.instruction.reverse,points:k?i.edge.points.slice():i.edge.points.slice().reverse()}),h=i.nodeId,c.unshift(h)}return q(s,t,a,M,c)}function W(e,t,a){const s=R(e,t,a,"shortest"),n=R(e,t,a,"shade"),o=s.steps.length===n.steps.length&&s.steps.every((u,m)=>u.edge.id===n.steps[m].edge.id);return{shortest:s,shade:n,same:o,extraMinutes:Math.max(0,n.minutes-s.minutes),sunSavedMinutes:Math.max(0,s.sunMinutes-n.sunMinutes)}}function oe(e){return e.places.filter(t=>t.selectable)}const re=["shortest","shade"],D="shade-map.shinjuku.v2",K={from:"west_exit",to:"ward_office",mode:"shade"};function ce(e,t){const a=()=>({...K});try{const s=JSON.parse(e??"null");return!s||typeof s!="object"||typeof s.from!="string"||typeof s.to!="string"||!t.includes(s.from)||!t.includes(s.to)||s.from===s.to||!re.includes(s.mode)?a():{from:s.from,to:s.to,mode:s.mode}}catch{return a()}}function U(e,t){const a=new URLSearchParams(e.replace(/^#/,"")),s=a.get("from"),n=a.get("to"),o=a.get("mode")==="shortest"?"shortest":"shade";return!s||!n||s===n||!t.includes(s)||!t.includes(n)?null:{from:s,to:n,mode:o}}function ie(e){try{return ce(localStorage.getItem(D),e)}catch{return{...K}}}function V(e){try{return localStorage.setItem(D,JSON.stringify(e)),!0}catch{return!1}}const $=te,de=document.querySelector("#app"),I=oe($),N=I.map(e=>e.id),j=new Map($.places.map(e=>[e.id,e])),l=e=>e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),Y=U(location.hash,N);let d=Y??ie(N);const z=()=>history.replaceState(null,"",location.pathname+location.search);Y&&z();let G=V(d);const B={shade:"日陰の道",shortest:"近い道"},O={underground:"地下",covered:"屋根の下",outdoor:"地上（日なた）"},Z={underground:"stairs-down",covered:"umbrella",outdoor:"sun"},b=e=>j.get(e).shortLabel;function le(e){const t=[];for(const a of e.steps){const s=a.edge.kind==="outdoor",n=t[t.length-1];n&&n.sun===s?n.m+=a.edge.distanceM:t.push({sun:s,m:a.edge.distanceM})}return`<span class="strip" aria-hidden="true">${t.map(a=>`<span class="seg ${a.sun?"sun":"shade"}" data-m="${a.m}"></span>`).join("")}</span>`}function F(e,t,a,s){return`
    <span class="rc-head">
      <img class="rc-art" src="./art/${a}.webp" alt="" width="44" height="44" />
      <span class="rc-name">${l(t)}</span>
      ${s?'<span class="rc-on">地図に表示中</span>':'<span class="rc-tap">押すと地図に出ます</span>'}
    </span>
    <span class="rc-main">
      <span class="rc-label">${p("sun")}日なた</span>
      <span class="rc-big"><b>${e.sunMinutes}</b>分</span>
    </span>
    <span class="rc-stats">
      <span>${p("walk")}歩く 約${e.minutes}分</span>
      <span>${p("umbrella")}日陰 ${e.shadeRatio}%</span>
    </span>
    ${le(e)}
    <span class="rc-dist">${e.distanceM.toLocaleString("ja-JP")}m のうち 日なた ${e.sunM}m</span>`}function ue(e){if(e.same)return`<div class="cards one"><div class="route-card shade is-active">${F(e.shade,"日陰の道＝近い道","deciduous-tree",!0)}</div></div>`;const t=(a,s)=>{const n=d.mode===a.mode;return`<button type="button" class="route-card ${a.mode} ${n?"is-active":""}" data-mode="${a.mode}" aria-pressed="${n}">${F(a,B[a.mode],s,n)}</button>`};return`<div class="cards" role="group" aria-label="地図に出す道を選ぶ">${t(e.shade,"deciduous-tree")}${t(e.shortest,"sun")}</div>`}function Q(e){if(e.same)return"この2か所は、いちばん近い道がそのまま日陰の道です。";const t=e.sunSavedMinutes>0?`日なたが約${e.sunSavedMinutes}分へります`:"日なたの時間はほぼ同じです",a=e.extraMinutes>0?`歩くのは約${e.extraMinutes}分のびます`:"歩く時間はほぼ同じです";return`日陰の道にすると、${t}。${a}。`}const X=e=>e.map(t=>`${t.x},${t.y}`).join(" "),pe=e=>{let t=0;const a=[];for(let n=1;n<e.length;n++){const o=Math.hypot(e[n].x-e[n-1].x,e[n].y-e[n-1].y);a.push(o),t+=o}let s=t/2;for(let n=1;n<e.length;n++){if(s<=a[n-1]){const o=a[n-1]===0?0:s/a[n-1];return{x:e[n-1].x+(e[n].x-e[n-1].x)*o,y:e[n-1].y+(e[n].y-e[n-1].y)*o}}s-=a[n-1]}return e[0]},he={tocho:{dx:0,dy:34,anchor:"middle"},west_exit:{dx:-6,dy:36,anchor:"end"},east_exit:{dx:6,dy:36,anchor:"start"},ward_office:{dx:22,dy:-10,anchor:"start"},sanchome:{dx:0,dy:36,anchor:"middle"}};function E(e,t){return e.map(a=>`<polyline class="${t} ${a.edge.kind==="outdoor"?"sun":"shade"}" points="${X(a.points)}" />`).join("")}function me(e){const t=e.same||d.mode==="shade"?e.shade:e.shortest,a=e.same?null:d.mode==="shade"?e.shortest:e.shade,s=j.get(d.from),n=j.get(d.to),o=t.steps.filter(c=>c.edge.kind==="outdoor").map(c=>{const h=pe(c.points);return`<use href="#sunmark" x="${h.x-11}" y="${h.y-11}" width="22" height="22" />`}).join(""),u=$.places.filter(c=>!c.selectable).map(c=>`<circle class="junction" cx="${c.x}" cy="${c.y}" r="4" />`).join(""),m=I.map(c=>{const h=he[c.id]??{dx:0,dy:34,anchor:"middle"};return`<g class="place">
        <image href="./art/${c.art}.webp" x="${c.x-17}" y="${c.y-17}" width="34" height="34" />
        <text class="place-label" x="${c.x+h.dx}" y="${c.y+h.dy}" text-anchor="${h.anchor}">${l(c.shortLabel)}</text>
      </g>`}).join(""),f=(c,h,i)=>`<g class="pin ${h}"><path d="M${c.x} ${c.y-15} l-7.5 -10 a13.5 13.5 0 1 1 15 0 z" /><text x="${c.x}" y="${c.y-31.5}" text-anchor="middle">${i}</text></g>`,M=`${b(d.from)}から${b(d.to)}までの${e.same?"道":B[t.mode]}。${t.steps.map(c=>`${O[c.edge.kind]}${c.edge.distanceM}m`).join("、")}。`;return`
    <svg class="map" viewBox="0 0 400 304" role="img" aria-label="${l(M)}">
      <defs>
        <symbol id="sunmark" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" class="sunmark-bg" /><g class="sunmark-fg" fill="none" stroke-width="2" stroke-linecap="round"><path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></g></symbol>
        <clipPath id="mapclip"><rect width="400" height="304" rx="18" /></clipPath>
      </defs>
      <g clip-path="url(#mapclip)">
        <rect class="map-bg" width="400" height="304" />
        <path class="park" d="M-10 150 C 14 146 22 168 18 196 C 14 230 22 262 10 320 L -10 320 Z" />
        <path class="park" d="M300 262 C 330 244 380 246 410 252 L 410 320 L 290 320 C 286 296 290 274 300 262 Z" />
        <g class="trees">
          <circle cx="6" cy="176" r="7" /><circle cx="2" cy="210" r="8" /><circle cx="8" cy="262" r="7" /><circle cx="2" cy="290" r="6" />
          <circle cx="318" cy="284" r="8" /><circle cx="348" cy="270" r="9" /><circle cx="380" cy="276" r="8" /><circle cx="336" cy="298" r="7" /><circle cx="368" cy="298" r="8" />
        </g>
        <path class="road-case" d="M8 232 C112 232 148 188 192 188 C272 192 336 200 404 188" />
        <path class="road-case" d="M216 32 C240 88 276 136 364 208" />
        <path class="road" d="M8 232 C112 232 148 188 192 188 C272 192 336 200 404 188" />
        <path class="road" d="M216 32 C240 88 276 136 364 208" />
        <rect class="rail" x="186" y="-4" width="20" height="312" />
        <path class="rail-tie" d="M196 -4 V 308" />
        <text class="area" x="70" y="44">西新宿</text>
        <text class="area" x="232" y="44">歌舞伎町</text>
        <text class="area small" x="352" y="296" text-anchor="middle">新宿御苑</text>
        <text class="area small" x="196" y="20" text-anchor="middle" transform="rotate(90 196 20)" dx="40">JR線</text>
        ${$.edges.map(c=>`<polyline class="net ${c.kind==="outdoor"?"sun":"shade"}" points="${X(c.points)}" />`).join("")}
        ${a?E(a.steps,"other"):""}
        ${E(t.steps,"case")}
        ${E(t.steps,"active")}
        ${o}
        ${u}
        ${m}
        ${f(s,"start","出")}
        ${f(n,"goal","着")}
      </g>
    </svg>`}function fe(e){return e.steps.map((t,a)=>{const s=t.edge.kind,n=Math.max(1,Math.round(t.edge.distanceM/L));return`<li class="step ${s}">
        <span class="step-no" aria-hidden="true">${a+1}</span>
        <div class="step-body">
          <p class="step-tags"><span class="tag ${s}">${p(Z[s])}${O[s]}</span><span class="tag plain">約${t.edge.distanceM}m・${n}分</span></p>
          <p class="step-text">${l(t.instruction)}</p>
          <p class="step-to">${p("flag")}${l(j.get(t.to).label)} へ</p>
          ${t.edge.availability?`<p class="step-warn">${p("alert-triangle")}${l(t.edge.availability)}</p>`:""}
        </div>
      </li>`}).join("")}function ge(){const e={underground:0,covered:0,outdoor:0};for(const s of $.edges)e[s.kind]+=1;const t=$.edges.map(s=>{const n=b(s.from),o=b(s.to);return`<li><p class="ev-head"><b>${l(n)} – ${l(o)}</b><span class="tag ${s.kind}">${p(Z[s.kind])}${O[s.kind]}</span><span class="ev-m">約${s.distanceM}m</span></p><p class="ev-basis">${l(s.basis)}</p></li>`}).join(""),a=$.sources.map(s=>`<li><a href="${l(s.url)}" target="_blank" rel="noopener noreferrer">${l(s.title)}${p("external-link")}<span class="sr-only">（別の画面で開きます）</span></a><span class="src-meta">${l(s.publisher)}${s.updated?`・${l(s.updated)}`:""}</span></li>`).join("");return`
    <dl class="facts">
      <div><dt>${p("stairs-down")}日陰とした道</dt><dd>地下通路と、駅の自由通路のような屋根の下の道（${e.underground+e.covered}区間）。暑さはありますが、日差しは当たりません。</dd></div>
      <div><dt>${p("sun")}日なたとした道</dt><dd>屋根のない地上の道はすべて日なたとして数えます（${e.outdoor}区間）。実際はビルや街路樹の影になる所もあります。</dd></div>
      <div><dt>${p("clock")}季節と時刻</dt><dd>考えていません。朝でも夕方でも、夏でも冬でも同じ答えです。地下街や駅の通路が閉まる夜間・早朝は使えないことがあります。</dd></div>
      <div><dt>${p("walk")}歩く時間</dt><dd>分速${L}m（ゆっくりめ）で計算し、切り上げています。距離は公式の地図の縮尺から読んだ概算です。</dd></div>
      <div><dt>${p("map-pin")}使える場所</dt><dd>新宿駅のまわりの5か所の間だけです。絵地図の位置と形は目安で、縮尺は正確ではありません。</dd></div>
    </dl>
    <details class="more">
      <summary>${p("chevron-down")}道ごとの根拠を見る（${$.edges.length}区間）</summary>
      <ul class="evidence">${t}</ul>
      <p class="checked">${l($.checkedOn)}に、下の公式の資料を見て手で入力しました。データ版 ${l($.version)}</p>
      <ul class="sources">${a}</ul>
    </details>
    <ul class="cautions">
      <li>工事・閉鎖・営業時間で通れないことがあります。<b>現地の案内を優先</b>してください。</li>
      <li>熱中症を防げることは約束できません。水分と休けいをとってください。</li>
    </ul>`}function H(e){return I.map(t=>`<option value="${l(t.id)}"${t.id===e?" selected":""}>${l(t.label)}</option>`).join("")}function ee(e){var n;const t=W($,d.from,d.to),a=t.same||d.mode==="shade"?t.shade:t.shortest,s=t.same?"道":B[a.mode];de.innerHTML=`
    <a class="skip" href="#compare">くらべる所へ</a>
    <header class="top">
      <div class="top-text">
        <p class="brand">新宿β</p>
        <h1>日陰MAP 新宿</h1>
        <p class="lead">地下や屋根の下を通って、<br />日なたを歩く時間をへらす道をさがします。</p>
      </div>
      <img class="top-art" src="./art/umbrella.webp" alt="" width="128" height="128" />
    </header>
    <p class="notice">${p("info-circle")}<span><b>目安です。</b>地下・屋根のある道を公式の地図から手で拾いました。建物の影・季節・時刻は計算していません。<a href="#about">くわしく</a></span></p>

    <main class="layout">
      <section class="card pick" aria-labelledby="pick-title">
        <h2 id="pick-title"><span class="num" aria-hidden="true">1</span>どこからどこへ？</h2>
        <div class="pick-grid">
          <div class="field"><span class="field-label"><i class="dot start" aria-hidden="true">出</i><label for="from">出発</label></span>
            <select id="from">${H(d.from)}</select></div>
          <button id="swap" class="swap" type="button" aria-label="出発と到着を入れかえる">${p("arrows-up-down")}</button>
          <div class="field"><span class="field-label"><i class="dot goal" aria-hidden="true">着</i><label for="to">到着</label></span>
            <select id="to">${H(d.to)}</select></div>
        </div>
      </section>

      <section class="compare" id="compare" aria-labelledby="cmp-title" tabindex="-1">
        <h2 id="cmp-title"><span class="num" aria-hidden="true">2</span>2つの道をくらべる</h2>
        <p class="summary">${l(Q(t))}</p>
        ${ue(t)}
        <p class="key" aria-hidden="true"><span class="sw shade"></span>日陰（地下・屋根）<span class="sw sun"></span>日なた（地上）</p>
      </section>

      <section class="card map-card" aria-labelledby="map-title">
        <h2 id="map-title"><span class="num" aria-hidden="true">3</span>絵地図で見る</h2>
        <p class="map-note">${l(b(d.from))} → ${l(b(d.to))}・${l(s)}。位置と形は目安です。</p>
        ${me(t)}
        <ul class="legend">
          <li><span class="ln shade"></span>日陰（地下・屋根）</li>
          <li><span class="ln sun"></span>日なた（地上）</li>
          ${t.same?"":'<li><span class="ln other"></span>もう1つの道</li>'}
        </ul>
      </section>

      <section class="card steps-card" aria-labelledby="steps-title">
        <h2 id="steps-title"><span class="num" aria-hidden="true">4</span>歩き方<span class="h-sub">${l(s)}・約${a.minutes}分</span></h2>
        <ol class="steps">${fe(a)}</ol>
      </section>

      <section class="card about" id="about" aria-labelledby="about-title" tabindex="-1">
        <h2 id="about-title">${p("info-circle")}このデータについて</h2>
        ${ge()}
      </section>
    </main>

    <footer class="foot">
      ${G?"":'<p class="nosave">この画面では選んだ場所を保存できません（道さがしはできます）。</p>'}
      <p>位置情報は使いません。選んだ場所はこのスマホ（ブラウザ）の中にだけ残り、外には送りません。</p>
      <p><a href="../">ほかのアプリ</a></p>
    </footer>
    <div id="live" class="sr-only" aria-live="polite"></div>
  `,ve(),e&&((n=document.getElementById(e))==null||n.focus())}function $e(){const e=W($,d.from,d.to),t=document.getElementById("live");t&&(t.textContent=`${b(d.from)}から${b(d.to)}。${Q(e)}`)}function x(e,t){d={...d,...e},G=V(d),ee(t),$e()}function ve(){document.querySelectorAll(".seg[data-m]").forEach(a=>{a.style.flexGrow=a.dataset.m??"1"});const e=document.querySelector("#from"),t=document.querySelector("#to");e.addEventListener("change",()=>{const a=e.value;x(a===d.to?{from:a,to:d.from}:{from:a},"from")}),t.addEventListener("change",()=>{const a=t.value;x(a===d.from?{to:a,from:d.to}:{to:a},"to")}),document.querySelector("#swap").addEventListener("click",()=>x({from:d.to,to:d.from},"swap")),document.querySelectorAll("button[data-mode]").forEach(a=>{a.addEventListener("click",()=>{var s;x({mode:a.dataset.mode}),(s=document.querySelector(`button[data-mode="${a.dataset.mode}"]`))==null||s.focus()})})}ee();window.addEventListener("hashchange",()=>{const e=U(location.hash,N);e&&(z(),x(e))});"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").then(()=>navigator.serviceWorker.ready).then(e=>{var a;const t=[location.href.split("#")[0],...performance.getEntriesByType("resource").map(s=>s.name).filter(s=>s.startsWith(location.origin))];(a=e.active)==null||a.postMessage({type:"precache",urls:t})}).catch(()=>{})});
