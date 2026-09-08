(() => {
  const CONFIG = window.APP_CONFIG || {};
  const markets = {
    "OTC MARKETS": [
      "EUR/USD (OTC)","GBP/USD (OTC)","USD/JPY (OTC)","AUD/USD (OTC)","USD/CAD (OTC)",
      "USD/CHF (OTC)","NZD/USD (OTC)","EUR/GBP (OTC)","EUR/JPY (OTC)","GBP/JPY (OTC)",
      "AUD/JPY (OTC)","EUR/AUD (OTC)","GBP/AUD (OTC)","USD/TRY (OTC)","USD/BRL (OTC)"
    ],
    "FOREX / REAL": [
      "EUR/USD","GBP/USD","USD/JPY","USD/CHF","AUD/USD","USD/CAD","NZD/USD",
      "EUR/GBP","EUR/JPY","GBP/JPY","AUD/JPY","EUR/CHF","GBP/CHF","AUD/CAD","EUR/AUD"
    ],
    "CRYPTO": ["BTC/USD","ETH/USD","LTC/USD","XRP/USD"],
    "COMMODITIES": ["GOLD","SILVER","BRENT OIL","WTI OIL"],
    "INDICES": ["US 500","US TECH 100","DOW JONES","DAX","FTSE 100"]
  };

  const state = {
    market: "EUR/USD (OTC)",
    tf: 1,
    price: 1.08420,
    signal: null,
    sound: true,
    deferredPrompt: null,
    candles: []
  };

  const $ = id => document.getElementById(id);
  const chart = $("chart"), ctx = chart.getContext("2d");

  function pad(n){return String(n).padStart(2,"0")}
  function now(){return new Date()}
  function tfSeconds(){return state.tf * 60}
  function candleStart(d=now()){
    const ms = Math.floor(d.getTime()/1000);
    return new Date((ms - (ms % tfSeconds())) * 1000);
  }
  function countdownSeconds(){
    const start = candleStart();
    return tfSeconds() - Math.floor((now()-start)/1000);
  }
  function formatCountdown(s){
    s=Math.max(0,s); return `${pad(Math.floor(s/60))}:${pad(s%60)}`;
  }
  function nextCandle(){
    return new Date(candleStart().getTime()+tfSeconds()*1000);
  }
  function timeOnly(d){return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`}
  function shortTime(d){return `${pad(d.getHours())}:${pad(d.getMinutes())}`}

  function buildMarketMenu(filter=""){
    const holder=$("marketGroups"); holder.innerHTML="";
    const f=filter.trim().toLowerCase();
    for(const [group, list] of Object.entries(markets)){
      const filtered=list.filter(x=>x.toLowerCase().includes(f));
      if(!filtered.length) continue;
      const sec=document.createElement("div"); sec.className="market-group";
      sec.innerHTML=`<h3>${group}</h3>`;
      filtered.forEach(name=>{
        const b=document.createElement("button");
        b.className="market-item"+(name===state.market?" selected":"");
        b.innerHTML=`<span>${name}</span><small>${name.includes("(OTC)")?"OTC":"LIVE"}</small>`;
        b.onclick=()=>selectMarket(name);
        sec.appendChild(b);
      });
      holder.appendChild(sec);
    }
  }
  function selectMarket(name){
    state.market=name;
    $("selectedMarket").textContent=name;
    $("marketButtonText").textContent=name;
    $("sideMarket").textContent=name;
    $("marketMenu").classList.add("hidden");
    $("assistantStatus").textContent=`Watching ${name}.`;
    resetDemoPrice();
    speak(`Selected ${name}.`);
  }
  function resetDemoPrice(){
    const base = state.market.includes("JPY") ? 157.2 :
      state.market.includes("GOLD") ? 2500 :
      state.market.includes("BTC") ? 110000 :
      state.market.includes("ETH") ? 4200 : 1.0842;
    state.price=base;
    seedCandles();
  }

  function seedCandles(){
    state.candles=[];
    let p=state.price;
    for(let i=0;i<70;i++){
      const o=p;
      const move=(Math.random()-.5)*(p>100?2.2:p>1000?8:p>10?.08:.0012);
      const c=o+move, h=Math.max(o,c)+Math.abs(move)*(.3+Math.random()), l=Math.min(o,c)-Math.abs(move)*(.3+Math.random());
      state.candles.push({o,c,h,l});
      p=c;
    }
  }

  function updateClock(){
    const d=now(), remain=countdownSeconds(), next=nextCandle();
    $("liveClock").textContent=timeOnly(d);
    $("countdown").textContent=formatCountdown(remain);
    $("sideCountdown").textContent=formatCountdown(remain);
    $("nextCandleTime").textContent=timeOnly(next);
    $("sideNext").textContent=timeOnly(next);
    $("signalEntryTime").textContent=shortTime(next);
    $("candleLabel").textContent=`${state.tf} minute candle`;
    $("nextCandleMeta").textContent=`Entry starts ${timeOnly(next)} • target: next candle`;
    $("sideTimeframe").textContent=`${state.tf} minute`;

    // Advance a demo candle exactly when a candle closes.
    const key=candleStart().getTime();
    if(updateClock.lastKey && updateClock.lastKey!==key){
      const last=state.candles[state.candles.length-1];
      const o=last?.c || state.price;
      const move=(Math.random()-.5)*(o>100?2:o>1000?8:o>10?.08:.0012);
      const c=o+move;
      state.candles.push({o,c,h:Math.max(o,c)+Math.abs(move)*Math.random(),l:Math.min(o,c)-Math.abs(move)*Math.random()});
      state.candles.shift();
      state.price=c;
      if(state.signal) {
        addChat("bot", `New candle opened at ${timeOnly(next)}. Previous signal window ended.`);
      }
    }
    updateClock.lastKey=key;
    $("price").textContent=displayPrice(state.price);
    drawChart();
  }

  function displayPrice(p){
    if(p>=10000) return p.toFixed(2);
    if(p>=1000) return p.toFixed(2);
    if(p>=100) return p.toFixed(3);
    if(p>=10) return p.toFixed(4);
    return p.toFixed(5);
  }

  function drawChart(){
    const rect=chart.getBoundingClientRect(), dpr=devicePixelRatio||1;
    if(!rect.width) return;
    chart.width=rect.width*dpr; chart.height=rect.height*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const W=rect.width,H=rect.height;
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle="rgba(130,160,180,.10)";ctx.lineWidth=1;
    for(let i=1;i<6;i++){let y=i*H/6;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
    for(let i=1;i<9;i++){let x=i*W/9;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
    const cs=state.candles.slice(-42);
    const vals=cs.flatMap(c=>[c.h,c.l]); let min=Math.min(...vals),max=Math.max(...vals);
    const padV=(max-min)*.12||1;min-=padV;max+=padV;
    const y=v=>H-(v-min)/(max-min)*H;
    const step=W/cs.length, body=Math.max(4,step*.46);
    cs.forEach((c,i)=>{
      const x=i*step+step/2, yo=y(c.o), yc=y(c.c), yh=y(c.h), yl=y(c.l);
      const up=c.c>=c.o;
      ctx.strokeStyle=up?"#16e39a":"#ff3f57";ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(x,yh);ctx.lineTo(x,yl);ctx.stroke();
      ctx.fillStyle=up?"#16e39a":"#ff3f57";
      ctx.fillRect(x-body/2,Math.min(yo,yc),body,Math.max(2,Math.abs(yc-yo)));
    });
    // Current price line
    ctx.setLineDash([5,5]);ctx.strokeStyle="rgba(54,167,255,.7)";
    ctx.beginPath();ctx.moveTo(0,y(state.price));ctx.lineTo(W,y(state.price));ctx.stroke();ctx.setLineDash([]);
  }

  function analyzeNextCandle(){
    // Demo-only deterministic-ish heuristic. It deliberately excludes the running candle.
    const completed=state.candles.slice(0,-1).slice(-8);
    let score=0;
    completed.forEach(c=>score += c.c>=c.o ? 1 : -1);
    const last=completed[completed.length-1];
    const body=Math.abs(last.c-last.o);
    const range=Math.max(.0000001,last.h-last.l);
    score += last.c>last.o && body/range>.55 ? 1 : last.c<last.o && body/range>.55 ? -1 : 0;
    const direction=score>=0 ? "UP" : "DOWN";
    state.signal={direction, entry:nextCandle(), created:now()};
    $("signalCard").className="signal-card "+(direction==="UP"?"up-card":"down-card");
    $("signalDirection").textContent=direction==="UP"?"▲ UP":"▼ DOWN";
    $("signalText").textContent=`Demo analysis targets the next ${state.tf}-minute candle. Running candle is excluded.`;
    $("signalEntryTime").textContent=shortTime(state.signal.entry);
    $("assistantStatus").textContent=`Next-candle ${direction} analysis is active.`;
    addChat("bot", `${direction} signal for the next ${state.tf}-minute candle, entry ${timeOnly(state.signal.entry)}. Running candle was not used as the entry candle.`);
    speak(`${direction} signal. Next candle starts at ${timeOnly(state.signal.entry)}.`);
    showToast(`${direction} signal generated for next candle`);
  }

  async function sendChat(){
    const input=$("chatInput"), text=input.value.trim();
    if(!text) return;
    input.value=""; addChat("user",text);
    const localReply = localAssistant(text);
    if(CONFIG.OPENAI_PROXY_URL){
      try{
        const r=await fetch(CONFIG.OPENAI_PROXY_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
          message:text, context:{market:state.market,timeframe:state.tf,countdown:formatCountdown(countdownSeconds()),nextCandle:timeOnly(nextCandle())}
        })});
        if(!r.ok) throw new Error("proxy error");
        const data=await r.json();
        addChat("bot",data.reply||localReply); speak(data.reply||localReply); return;
      }catch(e){}
    }
    addChat("bot",localReply); speak(localReply);
  }
  function localAssistant(text){
    const t=text.toLowerCase();
    if(t.includes("signal")||t.includes("up")||t.includes("down"))
      return `The demo signal button analyzes completed candles only and targets the next ${state.tf}-minute candle. Current candle remaining: ${formatCountdown(countdownSeconds())}.`;
    if(t.includes("time")||t.includes("minute"))
      return `${state.market} is on ${state.tf}-minute timeframe. The current candle ends in ${formatCountdown(countdownSeconds())}; next candle starts at ${timeOnly(nextCandle())}.`;
    return `I’m watching ${state.market}. Current price ${displayPrice(state.price)}. Choose a timeframe or press SIGNAL ACTIVE for the demo next-candle analysis.`;
  }
  function addChat(who,text){
    const el=document.createElement("div");el.className=`chat-msg ${who}`;el.textContent=text;
    $("chat").appendChild(el);$("chat").scrollTop=$("chat").scrollHeight;
  }
  function speak(text){
    if(!state.sound || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text);u.rate=.95;u.pitch=1;u.lang=CONFIG.DEFAULT_LANGUAGE||"en-US";speechSynthesis.speak(u);
  }
  function showToast(text){const t=$("toast");t.textContent=text;t.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.classList.remove("show"),2200)}

  $("marketButton").onclick=()=>{$("marketMenu").classList.toggle("hidden");buildMarketMenu($("marketSearch").value)};
  $("marketSearch").oninput=e=>buildMarketMenu(e.target.value);
  $("signalBtn").onclick=analyzeNextCandle;
  $("sendBtn").onclick=sendChat;
  $("chatInput").addEventListener("keydown",e=>{if(e.key==="Enter")sendChat()});
  $("speakBtn").onclick=()=>speak(localAssistant("tell me the current time"));
  $("soundBtn").onclick=()=>{state.sound=!state.sound;$("soundBtn").textContent=state.sound?"🔊":"🔇";showToast(state.sound?"Voice on":"Voice off")};
  document.addEventListener("click",e=>{if(!$("marketMenu").contains(e.target)&&e.target!==$("marketButton")&&!$("marketMenu").classList.contains("hidden"))$("marketMenu").classList.add("hidden")});
  document.querySelectorAll(".tf").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".tf").forEach(x=>x.classList.remove("active"));btn.classList.add("active");state.tf=Number(btn.dataset.tf);state.signal=null;$("signalCard").className="signal-card idle";$("signalDirection").textContent="READY";$("signalText").textContent="Press SIGNAL ACTIVE to analyze the next candle.";});

  // PWA install
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();state.deferredPrompt=e;$("installBtn").hidden=false});
  $("installBtn").onclick=async()=>{if(!state.deferredPrompt){showToast("Open this site in Chrome and use Add to Home screen.");return}state.deferredPrompt.prompt();await state.deferredPrompt.userChoice;state.deferredPrompt=null;$("installBtn").hidden=true};
  window.addEventListener("appinstalled",()=>{showToast("App installed successfully");$("installBtn").hidden=true});
  if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));

  buildMarketMenu();resetDemoPrice();setInterval(updateClock,250);updateClock();
  window.addEventListener("resize",drawChart);
})();
