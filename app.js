(() => {
  const $ = id => document.getElementById(id);
  const sampleText = "Schnelligkeit entsteht durch Übung und Konzentration. Tippe ruhig, bleibe aufmerksam und versuche jeden Satz fehlerfrei zu schreiben. Wer am Ende die meisten Wörter pro Minute erreicht, gewinnt das Rennen!";
  let client = null, channel = null, roomCode = null, isHost = false, myId = crypto.randomUUID();
  let myName = "", raceStartedAt = null, timerHandle = null, raceText = sampleText, finished = false;
  let players = {};

  function setStatus(message, good=false) {
    $("connectionNote").textContent = (good ? "🟢 " : "⚪ ") + message;
  }
  function connect(url, key) {
    if (!window.supabase) throw new Error("Die Supabase-Bibliothek konnte nicht geladen werden. Prüfe deine Internetverbindung.");
    client = window.supabase.createClient(url.trim(), key.trim());
    localStorage.setItem("st_url", url.trim());
    localStorage.setItem("st_key", key.trim());
    setStatus("Supabase-Verbindung eingerichtet. Du kannst einen Raum erstellen oder beitreten.", true);
  }
  const savedUrl = localStorage.getItem("st_url"), savedKey = localStorage.getItem("st_key");
  if (savedUrl && savedKey) {
    try { connect(savedUrl, savedKey); } catch(e) { setStatus(e.message); }
  }

  $("settingsBtn").onclick = () => {
    $("supabaseUrl").value = localStorage.getItem("st_url") || "";
    $("supabaseKey").value = localStorage.getItem("st_key") || "";
    $("settingsDialog").showModal();
  };
  $("settingsForm").addEventListener("submit", e => {
    if (e.submitter && e.submitter.value === "cancel") return;
    e.preventDefault();
    try {
      const url = $("supabaseUrl").value, key = $("supabaseKey").value;
      if (!url.startsWith("https://") || !key.trim()) throw new Error("Bitte Project URL und Publishable-/anon-Key eintragen.");
      connect(url, key);
      $("settingsStatus").textContent = "Verbunden! Du kannst das Fenster schließen.";
      $("settingsStatus").style.color = "#5df0b1";
      setTimeout(() => $("settingsDialog").close(), 800);
    } catch(err) {
      $("settingsStatus").textContent = err.message;
      $("settingsStatus").style.color = "#ff8ba1";
    }
  });

  function needConnection() {
    if (!client) {
      $("settingsBtn").click();
      throw new Error("Bitte zuerst die Online-Verbindung einrichten.");
    }
  }
  function makeCode() { return String(Math.floor(100000 + Math.random()*900000)); }
  function showRoom() {
    $("homePanel").classList.add("hidden");
    $("racePanel").classList.add("hidden");
    $("roomPanel").classList.remove("hidden");
    $("shownCode").textContent = roomCode;
    $("hostControls").classList.toggle("hidden", !isHost);
    $("guestWaiting").classList.toggle("hidden", isHost);
  }
  function renderPlayers() {
    const list = Object.values(players);
    $("playerCount").textContent = list.length;
    $("playersList").innerHTML = list.map(p => `<div class="player"><span class="player-name">👤 ${escapeHtml(p.name)}${p.id===myId?" (Du)":""}</span><span class="player-stat">${p.done?"FERTIG": "BEREIT"}</span></div>`).join("");
    $("racePlayers").innerHTML = list.sort((a,b)=>(b.progress||0)-(a.progress||0)).map(p => `<div class="player"><span class="player-name">${escapeHtml(p.name)}${p.id===myId?" (Du)":""}</span><span class="player-stat">${p.wpm||0} WPM · ${p.progress||0}%</span></div>`).join("");
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  async function enterRoom(code, host) {
    needConnection();
    roomCode = code; isHost = host;
    players = {};
    channel = client.channel("speed-typer-" + code, { config: { presence: { key: myId }, broadcast: { self: true } } });
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      Object.values(state).flat().forEach(p => { players[p.id] = {...players[p.id], ...p}; });
      renderPlayers();
    });
    channel.on("broadcast", { event: "player" }, ({payload}) => {
      if (payload && payload.id) { players[payload.id] = payload; renderPlayers(); }
    });
    channel.on("broadcast", { event: "start" }, ({payload}) => {
      if (payload && payload.text) beginRace(payload.text, payload.startedAt);
    });
    channel.on("broadcast", { event: "progress" }, ({payload}) => {
      if (payload && payload.id) { players[payload.id] = {...players[payload.id], ...payload}; renderPlayers(); }
    });
    channel.on("broadcast", { event: "finish" }, ({payload}) => {
      if (payload && payload.id && players[payload.id]) players[payload.id].done = true;
      renderPlayers();
    });
    const status = await new Promise(resolve => {
      channel.subscribe(async s => {
        if (s === "SUBSCRIBED") {
          await channel.track({id:myId,name:myName,progress:0,wpm:0,done:false});
          resolve("ok");
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") resolve(s);
      });
    });
    if (status !== "ok") throw new Error("Raum konnte nicht verbunden werden. Prüfe Supabase Realtime und deine Zugangsdaten.");
    players[myId] = {id:myId,name:myName,progress:0,wpm:0,done:false};
    await channel.send({type:"broadcast",event:"player",payload:players[myId]});
    showRoom(); renderPlayers();
  }
  $("createBtn").onclick = async () => {
    myName = $("hostName").value.trim() || "Spieler";
    try {
      needConnection();
      let code = makeCode();
      await enterRoom(code, true);
    } catch(e) { alert(e.message); }
  };
  $("joinBtn").onclick = async () => {
    myName = $("joinName").value.trim() || "Spieler";
    const code = $("roomCode").value.trim();
    if (!/^\d{6}$/.test(code)) { alert("Bitte einen gültigen 6-stelligen Spielcode eingeben."); return; }
    try { await enterRoom(code, false); } catch(e) { alert(e.message); }
  };
  $("roomCode").addEventListener("input", e => e.target.value=e.target.value.replace(/\D/g,"").slice(0,6));
  $("copyCodeBtn").onclick = async () => {
    try { await navigator.clipboard.writeText(roomCode); $("copyCodeBtn").textContent="✓ Kopiert"; }
    catch { alert("Dein Spielcode ist: " + roomCode); }
  };
  $("startBtn").onclick = async () => {
    if (!channel) return;
    const startedAt = Date.now()+2500;
    await channel.send({type:"broadcast",event:"start",payload:{text:sampleText,startedAt}});
    beginRace(sampleText, startedAt);
  };
  function beginRace(text, startedAt) {
    raceText=text; raceStartedAt=startedAt; finished=false;
    $("roomPanel").classList.add("hidden"); $("homePanel").classList.add("hidden"); $("racePanel").classList.remove("hidden");
    $("typingInput").value=""; $("typingInput").disabled=true; $("finishMessage").classList.add("hidden");
    renderText(); renderPlayers();
    clearInterval(timerHandle);
    timerHandle=setInterval(() => {
      const elapsed=Math.max(0,Math.floor((Date.now()-raceStartedAt)/1000));
      $("timer").textContent=elapsed;
      if (Date.now()>=raceStartedAt) $("typingInput").disabled=finished;
    },250);
    setTimeout(()=>{ if(!finished) $("typingInput").focus(); },2600);
  }
  function renderText() {
    const typed=$("typingInput").value;
    let html="";
    for(let i=0;i<raceText.length;i++){
      let cls=i<typed.length?(typed[i]===raceText[i]?"correct":"wrong"):(i===typed.length?"current":"");
      html+=`<span class="${cls}">${escapeHtml(raceText[i])}</span>`;
    }
    $("raceText").innerHTML=html;
  }
  $("typingInput").addEventListener("input", async () => {
    if (finished || Date.now()<raceStartedAt) return;
    const typed=$("typingInput").value.slice(0,raceText.length);
    if (typed!==$("typingInput").value) $("typingInput").value=typed;
    renderText();
    const elapsed=Math.max(1,(Date.now()-raceStartedAt)/60000);
    let correct=0; for(let i=0;i<typed.length;i++) if(typed[i]===raceText[i]) correct++;
    const progress=Math.floor(typed.length/raceText.length*100);
    const wpm=Math.round((typed.trim()?typed.trim().split(/\s+/).length:0)/elapsed);
    const accuracy=typed.length?Math.round(correct/typed.length*100):100;
    $("wpm").textContent=wpm; $("accuracy").textContent=accuracy+"%"; $("progress").textContent=progress+"%";
    const update={id:myId,name:myName,progress,wpm,done:false};
    players[myId]={...players[myId],...update}; renderPlayers();
    if(channel) await channel.send({type:"broadcast",event:"progress",payload:update});
    if(typed===raceText) {
      finished=true; $("typingInput").disabled=true;
      $("finishMessage").textContent=`🏁 Geschafft! Du hast ${wpm} Wörter pro Minute erreicht.`;
      $("finishMessage").classList.remove("hidden");
      players[myId].done=true; renderPlayers();
      if(channel) await channel.send({type:"broadcast",event:"finish",payload:{id:myId}});
    }
  });
  $("leaveBtn").onclick = leaveRoom;
  $("backToRoomBtn").onclick = () => { clearInterval(timerHandle); $("racePanel").classList.add("hidden"); showRoom(); };
  async function leaveRoom() {
    clearInterval(timerHandle);
    if(channel){ await channel.untrack(); await client.removeChannel(channel); }
    channel=null; roomCode=null; players={};
    $("roomPanel").classList.add("hidden"); $("racePanel").classList.add("hidden"); $("homePanel").classList.remove("hidden");
  }
})();