// Game portal component — loaded before engine.js boots.
// DCLogic and React are injected by the dc-runtime when it evaluates the
// inline <script data-dc-script>, so we expose a factory instead of
// extending DCLogic directly at parse time.
window.PortalComponent = function(DCLogic, React) {

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { active: null, seed: 1, scale: 1, cscale: 1, inserted: null, closing: false, seated: false, playZoom: false, dpadX: 0, dpadY: 0, dpadDir: null };
    this.fit = () => {
      const s = Math.min(window.innerWidth / 1600, window.innerHeight / 1000);
      const cs = Math.min((window.innerWidth * 0.94) / 760, (window.innerHeight * 0.92) / 1040);
      this.setState({ scale: s, cscale: cs });
    };
    this.onCardClick = (id) => {
      if (this.state.inserted != null) return;
      try { if (!this.ac) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ac = new AC(); } if (this.ac && this.ac.state === "suspended") this.ac.resume(); } catch (e) {}
      this.setState({ inserted: id, closing: false, seated: false });
      clearTimeout(this._seat); this._seat = setTimeout(() => { if (this.state.inserted === id) this.setState({ seated: true }); }, 820);
      clearTimeout(this._snd); this._snd = setTimeout(() => this.playInsert(), 1060);
    };
    this.onClose = () => {
      if (this.state.inserted == null || this.state.closing) return;
      clearTimeout(this._snd); clearTimeout(this._seat); clearTimeout(this._playT);
      this.setState({ closing: true, seated: false, playZoom: false });
      clearTimeout(this._closeT); this._closeT = setTimeout(() => this.setState({ inserted: null, closing: false, seated: false }), 440);
    };
    this.onKey = (e) => { if (e.key === "Escape") this.onClose(); };
    this.onDpadMove = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const ax = Math.max(-1, Math.min(1, py * 2)) * 11;
      const ay = Math.max(-1, Math.min(1, -px * 2)) * 11;
      const dir = Math.abs(px) > Math.abs(py) ? (px > 0 ? "right" : "left") : (py > 0 ? "down" : "up");
      this.setState({ dpadX: +ax.toFixed(2), dpadY: +ay.toFixed(2), dpadDir: dir });
    };
    this.onDpadLeave = () => this.setState({ dpadX: 0, dpadY: 0, dpadDir: null });
    this.dpadRef = React.createRef();
    this.onConsoleMove = (e) => {
      const el = this.dpadRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < 6) { this.setState({ dpadX: 0, dpadY: 0, dpadDir: null }); return; }
      let idx = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
      if (idx < 0) idx += 8;
      const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
      const u = dirs[idx], len = Math.hypot(u[0], u[1]) || 1, M = 12;
      const ax = (u[1] / len) * M;
      const ay = -(u[0] / len) * M;
      this.setState({ dpadX: +ax.toFixed(2), dpadY: +ay.toFixed(2), dpadDir: idx });
    };
    this.stop = (e) => { if (e) e.stopPropagation(); };
    this.GAME_ROUTES = { "FLAPPY BIRD": "games/flappy-bird/index.html", "GOD HANDS": "games/god-hands/index.html" };
    this.onPlay = () => {
      const id = this.state.inserted;
      if (id == null || this.state.playZoom) return;
      this.setState({ playZoom: true });
      try { this._startupSound.currentTime = 0.023; this._startupSound.play().catch(() => {}); } catch(e) {}
      const card = this.ensure(this.state.seed).cards.find(c => c.id === id);
      const title = card ? card.title : "";
      const url = this.GAME_ROUTES[title] || "games/flappy-bird/index.html";
      clearTimeout(this._playT);
      this._playT = setTimeout(() => { window.location.href = url; }, 960);
    };
    this.YEARS = [2006,2007,2008,2009,2010,2011,2012,2013,2015,2016,2017,2019,2021,2022,2023,2024,2025,2026];
    this.NAMES = ["FLAPPY BIRD","GOD HANDS","STAR HAULER","PIXEL KNIGHT","MEGA RALLY","VOID RUNNER","SLIME KINGDOM","GHOST CIRCUIT","IRON COMET","LASER MONKS","DUNE PILOT","BYTE BRAWL","HEX WITCH","TURBO GECKO","MOON DICE","GLITCH GARDEN","ZEPHYR ACE","ROGUE TOASTER","CANDY VOID","STATIC SAINTS","ORBIT FOX","PUNK FROGS","DELTA DIVERS","NOVA NOMAD","CHROME PONY","GRAVITY JAM","ASH & EMBER","SOLAR SHARK","MAGNET MAZE","BLITZ BAKERY","ECHO VALLEY","KAIJU CAFE","VHS PHANTOM"];
    const matteBlack = { bgA:"#26262b", bgB:"#161619", bgC:"#0c0c0e", wellA:"#141416", wellB:"#08080a", hole:"#050506", tabA:"#ded5c1", tabB:"#b6ac96", tabHi:"rgba(255,255,255,0.55)", tabSh:"rgba(0,0,0,0.25)", scrA:"#2c2c30", scrB:"#0a0a0c", scrSlot:"rgba(0,0,0,0.85)", triFace:"#141416", grooveBg:"#050506", swNub:"#3a3a3f", ridgeLo:"rgba(0,0,0,0.6)", emb:"rgba(0,0,0,0.55)", lip:"rgba(255,255,255,0.06)", sh:"rgba(0,0,0,0.85)", mLo:"rgba(0,0,0,0.45)", mHi:"rgba(255,255,255,0.05)", sheen:"rgba(255,255,255,0.10)", nOp:"0.55", wearOp:"0.6", beamColor:"#34343a", beamShadow:"0 -1px 0 rgba(255,255,255,0.13), 0 2px 2px rgba(0,0,0,0.9)" };
    const retroGrey = { bgA:"#d4d1c9", bgB:"#b6b3ab", bgC:"#928f88", wellA:"#a8a59d", wellB:"#8a877f", hole:"#1e1d1a", tabA:"#56544e", tabB:"#3a3933", tabHi:"rgba(255,255,255,0.2)", tabSh:"rgba(0,0,0,0.35)", scrA:"#9a978f", scrB:"#5d5b54", scrSlot:"rgba(0,0,0,0.5)", triFace:"#b2afa7", grooveBg:"#7c7971", swNub:"#76736c", ridgeLo:"rgba(0,0,0,0.3)", emb:"rgba(0,0,0,0.28)", lip:"rgba(255,255,255,0.55)", sh:"rgba(60,54,44,0.4)", mLo:"rgba(40,36,30,0.28)", mHi:"rgba(255,255,255,0.3)", sheen:"rgba(255,255,255,0.22)", nOp:"0.4", wearOp:"0.5", beamColor:"#cfccc3", beamShadow:"0 -1px 0 rgba(255,255,255,0.65), 0 2px 2px rgba(40,34,24,0.4)" };
    const smoke = { bgA:"#30303a", bgB:"#1f1f27", bgC:"#141418", wellA:"#101015", wellB:"#0a0a0e", hole:"#06060a", tabA:"#4a4a52", tabB:"#313137", tabHi:"rgba(255,255,255,0.25)", tabSh:"rgba(0,0,0,0.4)", scrA:"#34343c", scrB:"#101015", scrSlot:"rgba(0,0,0,0.85)", triFace:"#1a1a20", grooveBg:"#060608", swNub:"#44444c", ridgeLo:"rgba(0,0,0,0.55)", emb:"rgba(0,0,0,0.5)", lip:"rgba(255,255,255,0.1)", sh:"rgba(0,0,0,0.8)", mLo:"rgba(0,0,0,0.4)", mHi:"rgba(190,155,90,0.07)", sheen:"rgba(255,255,255,0.13)", nOp:"0.45", wearOp:"0.65", beamColor:"#3b3b46", beamShadow:"0 -1px 0 rgba(255,255,255,0.14), 0 2px 2px rgba(0,0,0,0.85)" };
    const slate = { bgA:"#47505d", bgB:"#333a45", bgC:"#242831", wellA:"#2a2f38", wellB:"#1d2128", hole:"#13161b", tabA:"#ded5c1", tabB:"#b6ac96", tabHi:"rgba(255,255,255,0.55)", tabSh:"rgba(0,0,0,0.25)", scrA:"#4b525e", scrB:"#1b1f26", scrSlot:"rgba(0,0,0,0.7)", triFace:"#303641", grooveBg:"#0f1218", swNub:"#515a68", ridgeLo:"rgba(0,0,0,0.45)", emb:"rgba(0,0,0,0.42)", lip:"rgba(255,255,255,0.1)", sh:"rgba(0,0,0,0.7)", mLo:"rgba(0,0,0,0.38)", mHi:"rgba(255,255,255,0.08)", sheen:"rgba(255,255,255,0.12)", nOp:"0.48", wearOp:"0.6", beamColor:"#59626f", beamShadow:"0 -1px 0 rgba(255,255,255,0.16), 0 2px 2px rgba(0,0,0,0.75)" };
    const olive = { bgA:"#65674f", bgB:"#4b4d3a", bgC:"#373925", wellA:"#3f4133", wellB:"#2c2e22", hole:"#1c1e14", tabA:"#26262a", tabB:"#121214", tabHi:"rgba(255,255,255,0.15)", tabSh:"rgba(0,0,0,0.5)", scrA:"#5c5e4b", scrB:"#23251a", scrSlot:"rgba(0,0,0,0.65)", triFace:"#454736", grooveBg:"#171910", swNub:"#6b6d59", ridgeLo:"rgba(0,0,0,0.4)", emb:"rgba(0,0,0,0.4)", lip:"rgba(255,255,255,0.13)", sh:"rgba(0,0,0,0.65)", mLo:"rgba(0,0,0,0.36)", mHi:"rgba(255,255,255,0.09)", sheen:"rgba(255,255,255,0.1)", nOp:"0.48", wearOp:"0.55", beamColor:"#6e7059", beamShadow:"0 -1px 0 rgba(255,255,255,0.16), 0 2px 2px rgba(0,0,0,0.7)" };
    const bone = { bgA:"#e8e2d1", bgB:"#d2cbb8", bgC:"#b7af9b", wellA:"#cac3b0", wellB:"#b3ac98", hole:"#2a2620", tabA:"#26262a", tabB:"#121214", tabHi:"rgba(255,255,255,0.15)", tabSh:"rgba(0,0,0,0.5)", scrA:"#a89f8a", scrB:"#6b6453", scrSlot:"rgba(50,42,26,0.6)", triFace:"#cfc8b5", grooveBg:"#8c8470", swNub:"#9a927e", ridgeLo:"rgba(70,58,36,0.3)", emb:"rgba(70,58,36,0.3)", lip:"rgba(255,255,255,0.65)", sh:"rgba(90,78,54,0.4)", mLo:"rgba(80,66,42,0.25)", mHi:"rgba(255,255,255,0.35)", sheen:"rgba(255,255,255,0.28)", nOp:"0.36", wearOp:"0.5", beamColor:"#3a342a", beamShadow:"0 -1px 0 rgba(255,255,255,0.55), 0 1px 2px rgba(70,58,36,0.4)" };
    this.PALS = [matteBlack, smoke, slate, olive, retroGrey, matteBlack, bone, smoke];
  }

  componentDidMount() {
    window.addEventListener("resize", this.fit);
    window.addEventListener("keydown", this.onKey);
    this.fit();
    try {
      this._insertAudio = new Audio("sounds/cartridge-insert.mp3");
      this._insertAudio.volume = 0.85;
      this._insertAudio.load();
    } catch(e) {}
    try {
      this._startupSound = new Audio("sounds/game-startup.mp3");
      this._startupSound.volume = 0.8;
      this._startupSound.load();
    } catch(e) {}
    const el = document.getElementById("boot-typed");
    const screen = document.getElementById("boot-screen");
    if (el && screen) {
      const msg = "Hang in there, we will starting in...";
      let ci = 0;
      const type = () => {
        if (ci <= msg.length) {
          el.textContent = msg.slice(0, ci);
          ci++;
          setTimeout(type, 36 + Math.random() * 44);
        } else {
          let count = 2;
          const tick = () => {
            el.textContent = msg + " " + count;
            if (count === 0) {
              screen.style.transition = "opacity 0.9s ease";
              screen.style.opacity = "0";
              setTimeout(function(){ if (screen.parentNode) screen.parentNode.removeChild(screen); }, 950);
            } else {
              count--;
              setTimeout(tick, 1000);
            }
          };
          tick();
        }
      };
      setTimeout(type, 200);
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.fit);
    window.removeEventListener("keydown", this.onKey);
    clearTimeout(this._snd); clearTimeout(this._closeT);
  }

  playInsert() {
    try {
      if (!this._insertAudio) {
        this._insertAudio = new Audio("sounds/cartridge-insert.mp3");
        this._insertAudio.volume = 0.85;
      }
      this._insertAudio.currentTime = 0;
      this._insertAudio.play().catch(() => this._playInsertSynth());
      return;
    } catch(e) {}
    this._playInsertSynth();
  }

  _playInsertSynth() {
    const ac = this.ac; if (!ac) return;
    const t = ac.currentTime;
    const dur = 0.1, sr = ac.sampleRate;
    const buf = ac.createBuffer(1, Math.floor(sr * dur), sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const src = ac.createBufferSource(); src.buffer = buf;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400;
    const ng = ac.createGain(); ng.gain.setValueAtTime(0.5, t); ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(lp); lp.connect(ng); ng.connect(ac.destination); src.start(t);
    const o = ac.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(175, t); o.frequency.exponentialRampToValueAtTime(58, t + 0.17);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.012); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.22);
    [[523.25, 0.16], [783.99, 0.29]].forEach(function (p) {
      const oo = ac.createOscillator(); oo.type = "square"; oo.frequency.value = p[0];
      const gg = ac.createGain(); gg.gain.setValueAtTime(0.0001, t + p[1]); gg.gain.linearRampToValueAtTime(0.12, t + p[1] + 0.01); gg.gain.exponentialRampToValueAtTime(0.001, t + p[1] + 0.14);
      oo.connect(gg); gg.connect(ac.destination); oo.start(t + p[1]); oo.stop(t + p[1] + 0.16);
    });
  }

  rng(seed) {
    let s = (seed * 2654435761) >>> 0;
    return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  wear(seed) {
    this._wc = this._wc || {};
    if (this._wc[seed]) return this._wc[seed];
    const rnd = this.rng(seed * 911 + 7);
    const R = (a, b) => a + (b - a) * rnd();
    let g = "";
    for (let i = 0; i < 6; i++) {
      const cx = R(20, 440), cy = R(20, 376), rx = R(16, 50), ry = R(9, 26), rot = R(0, 180);
      const col = rnd() > 0.5 ? "255,255,255" : "0,0,0", op = R(0.03, 0.08).toFixed(3);
      g += "<ellipse cx='" + cx.toFixed(1) + "' cy='" + cy.toFixed(1) + "' rx='" + rx.toFixed(1) + "' ry='" + ry.toFixed(1) + "' transform='rotate(" + rot.toFixed(1) + " " + cx.toFixed(1) + " " + cy.toFixed(1) + ")' fill='rgba(" + col + "," + op + ")' filter='url(#bl)'/>";
    }
    for (let i = 0; i < 22; i++) {
      const x1 = R(10, 450), y1 = R(10, 386), len = R(12, 76);
      const ang = rnd() > 0.5 ? R(-0.5, 0.5) : Math.PI / 2 + R(-0.5, 0.5);
      const x2 = x1 + Math.cos(ang) * len, y2 = y1 + Math.sin(ang) * len;
      const col = rnd() > 0.45 ? "255,255,255" : "0,0,0";
      const op = R(0.22, 0.6).toFixed(2), w = R(0.4, 0.9).toFixed(2);
      g += "<line x1='" + x1.toFixed(1) + "' y1='" + y1.toFixed(1) + "' x2='" + x2.toFixed(1) + "' y2='" + y2.toFixed(1) + "' stroke='rgba(" + col + "," + op + ")' stroke-width='" + w + "'/>";
    }
    for (let i = 0; i < 16; i++) {
      const cx = R(8, 452), cy = R(8, 388), r = R(0.4, 1.4);
      const col = rnd() > 0.5 ? "255,255,255" : "0,0,0", op = R(0.18, 0.5).toFixed(2);
      g += "<circle cx='" + cx.toFixed(1) + "' cy='" + cy.toFixed(1) + "' r='" + r.toFixed(2) + "' fill='rgba(" + col + "," + op + ")'/>";
    }
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='460' height='396'><defs><filter id='bl'><feGaussianBlur stdDeviation='3'/></filter></defs><g stroke-linecap='round'>" + g + "</g></svg>";
    const url = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
    this._wc[seed] = url;
    return url;
  }

  godHandsScene() {
    const D = (style, kids) => React.createElement("div", { style }, ...(kids || []));
    const abs = { position: "absolute" };
    const full = { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 };
    const stars = [[6,5],[14,12],[22,8],[32,18],[44,6],[56,14],[66,10],[78,7],[88,15],[12,22],[38,3],[52,20],[72,9],[84,17]].map(([l,t]) =>
      D({ ...abs, left: l + "%", top: t + "%", width: "2px", height: "2px", borderRadius: "50%", background: "#fff", opacity: "0.65", boxShadow: "0 0 3px rgba(255,255,255,0.6)" })
    );
    const handSvg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 76"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffeebb"/><stop offset="100%" stop-color="#d4a020"/></linearGradient></defs><rect x="26" y="0" width="10" height="34" rx="5" fill="url(%23g)" stroke="%23a07010" stroke-width="1.5"/><rect x="14" y="7" width="10" height="32" rx="5" fill="url(%23g)" stroke="%23a07010" stroke-width="1.5"/><rect x="38" y="5" width="10" height="32" rx="5" fill="url(%23g)" stroke="%23a07010" stroke-width="1.5"/><rect x="50" y="10" width="9" height="27" rx="4.5" fill="url(%23g)" stroke="%23a07010" stroke-width="1.5"/><rect x="9" y="32" width="46" height="24" rx="8" fill="url(%23g)" stroke="%23a07010" stroke-width="1.5"/><rect x="2" y="36" width="12" height="22" rx="6" fill="url(%23g)" stroke="%23a07010" stroke-width="1.5"/></svg>');
    return D({ ...full, overflow: "hidden" }, [
      D({ ...full, background: "linear-gradient(180deg, #0b0720 0%, #1c1045 50%, #3a1858 100%)" }),
      ...stars,
      D({ ...abs, left: "50%", top: "5%", width: "150px", height: "100px", transform: "translateX(-50%)", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(180,120,255,0.22), transparent 70%)", pointerEvents: "none" }),
      D({ ...abs, left: "50%", top: "2%", width: "64px", height: "76px", transform: "translateX(-50%)", backgroundImage: `url("data:image/svg+xml,${handSvg}")`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center", filter: "drop-shadow(0 0 10px rgba(200,160,255,0.85))" }),
      D({ ...abs, left: "-40%", right: "-40%", bottom: 0, height: "44%", transform: "perspective(140px) rotateX(58deg)", transformOrigin: "center top", background: "repeating-linear-gradient(90deg, transparent 0 32px, rgba(100,180,80,0.55) 32px 34px), repeating-linear-gradient(0deg, transparent 0 22px, rgba(80,160,60,0.45) 22px 24px), #3d6e2a" }),
      D({ ...abs, left: 0, right: 0, bottom: "43%", height: "2px", background: "linear-gradient(90deg, transparent 0%, rgba(140,220,100,0.7) 30%, rgba(140,220,100,0.7) 70%, transparent 100%)" }),
      D({ ...abs, left: "18%", bottom: "27%", width: "16px", height: "11px", background: "#7a4a28", boxShadow: "inset 0 3px 0 #9a6a42" }),
      D({ ...abs, left: "18%", bottom: "37%", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "9px solid #c03828" }),
      D({ ...abs, left: "46%", bottom: "25%", width: "18px", height: "13px", background: "#8a5430", boxShadow: "inset 0 3px 0 #aa7452" }),
      D({ ...abs, left: "46%", bottom: "37%", width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderBottom: "10px solid #b83020" }),
      D({ ...abs, right: "18%", bottom: "22%", width: "14px", height: "10px", background: "#6a4022", boxShadow: "inset 0 3px 0 #8a6040" }),
      D({ ...abs, right: "18%", bottom: "31%", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: "8px solid #b82820" }),
      D({ ...abs, left: "50%", bottom: "4%", transform: "translateX(-50%)", fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: "900", fontSize: "21px", color: "#e8ccff", textShadow: "0 0 16px rgba(200,140,255,0.9), 0 2px 0 rgba(0,0,0,0.9)", letterSpacing: "3px", whiteSpace: "nowrap" }, ["GOD HANDS"])
    ]);
  }

  flappyBirdScene() {
    const D = (style, kids) => React.createElement("div", { style }, ...(kids || []));
    const abs = { position: "absolute" };
    return D(
      { position: "absolute", inset: 0, background: "linear-gradient(180deg, #4ec0ca 0%, #a8e6c8 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
      [
        D({
          ...abs, left: "50%", top: "20%", width: "80px", height: "80px", transform: "translateX(-50%)",
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='32' cy='34' rx='22' ry='18' fill='%23fcd72b' stroke='%233a2210' stroke-width='3'/%3E%3Cellipse cx='42' cy='28' rx='7' ry='7' fill='%23fff' stroke='%233a2210' stroke-width='2.5'/%3E%3Ccircle cx='44' cy='28' r='3' fill='%233a2210'/%3E%3Cpolygon points='48,34 62,32 48,40' fill='%23ff8a1e' stroke='%233a2210' stroke-width='2.5'/%3E%3Cellipse cx='24' cy='40' rx='10' ry='6' fill='%23ffba32' stroke='%233a2210' stroke-width='2.5'/%3E%3C/svg%3E")`,
          backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center"
        }),
        D({
          ...abs, left: "50%", top: "55%", transform: "translateX(-50%)", textAlign: "center",
          fontFamily: "'Press Start 2P', sans-serif", fontSize: "28px", fontWeight: "900",
          color: "#ffe14a", textShadow: "-2px 0 0 #4a2f12, 2px 0 0 #4a2f12, 0 -2px 0 #4a2f12, 0 2px 0 #4a2f12, 0 4px 0 rgba(0,0,0,0.3)",
          letterSpacing: "1px", lineHeight: "1.1"
        }, ["FLAPPY", D({ style: { display: "block" } }, ["BIRD"])])
      ]
    );
  }

  scene(type, seed) {
    const r = this.rng(seed);
    const D = (style, kids) => React.createElement("div", { style }, ...(kids || []));
    const abs = { position: "absolute" };
    const full = { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 };
    let L = [];
    const pick = (arr) => arr[Math.floor(r() * arr.length)];

    if (type === 0) {
      const sk = pick([["#2a1a4f","#7a2b86","#e0467f"],["#0e2350","#2f5fb0","#ff7a4d"],["#241048","#5a2bb0","#ff4d8d"]]);
      L = [
        D({ ...full, background:`linear-gradient(180deg, ${sk[0]} 0%, ${sk[1]} 56%, ${sk[2]} 100%)` }),
        D({ ...abs, left:"50%", top:"22%", width:"48%", height:"48%", transform:"translate(-50%,-26%)", borderRadius:"50%", background:"radial-gradient(circle at 50% 42%, #ffe26b, #ff6a5f 62%, transparent 73%)" }),
        D({ ...abs, left:"50%", top:"22%", width:"48%", height:"48%", transform:"translate(-50%,-26%)", borderRadius:"50%", background:"repeating-linear-gradient(180deg, transparent 0 6px, rgba(20,5,30,0.9) 6px 9px)" }),
        D({ ...abs, left:"-22%", right:"-22%", bottom:0, height:"46%", transform:"perspective(90px) rotateX(62deg)", transformOrigin:"center bottom", background:"linear-gradient(180deg, rgba(255,90,170,0), rgba(120,40,160,0.25)), repeating-linear-gradient(90deg, rgba(120,255,220,0.5) 0 1px, transparent 1px 15px), repeating-linear-gradient(0deg, rgba(120,255,220,0.5) 0 1px, transparent 1px 13px)" })
      ];
    } else if (type === 1) {
      const pl = pick([["#9bd0ff","#3a78c8","#173a72"],["#ffd0a0","#d8743a","#7a3416"],["#c9b6ff","#7a52c8","#3a2272"]]);
      const stars = [];
      for (let i = 0; i < 16; i++) stars.push(D({ ...abs, left:(r()*96+2).toFixed(1)+"%", top:(r()*88+2).toFixed(1)+"%", width:"1.6px", height:"1.6px", borderRadius:"50%", background:"#fff", opacity:(0.4+r()*0.6).toFixed(2) }));
      L = [
        D({ ...full, background:"radial-gradient(circle at 60% 26%, #1c2747 0%, #0a0e1c 70%)" }),
        ...stars,
        D({ ...abs, right:"14%", top:"16%", width:"42%", height:"42%", borderRadius:"50%", background:`radial-gradient(circle at 36% 32%, ${pl[0]}, ${pl[1]} 56%, ${pl[2]} 100%)`, boxShadow:"inset -6px -6px 12px rgba(0,0,0,0.5)" }),
        D({ ...abs, right:"1%", top:"28%", width:"64%", height:"22%", border:"2px solid rgba(180,200,255,0.4)", borderRadius:"50%", transform:"rotate(-18deg)" })
      ];
    } else if (type === 2) {
      L = [
        D({ ...full, background:"#3a2a28" }),
        D({ ...full, background:"repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0 2px, transparent 2px 20px), repeating-linear-gradient(90deg, rgba(0,0,0,0.5) 0 2px, transparent 2px 28px)", opacity:0.9 }),
        D({ ...abs, left:"50%", bottom:0, width:"36%", height:"60%", transform:"translateX(-50%)", background:"#0a0608", borderRadius:"50% 50% 0 0" }),
        D({ ...abs, left:"15%", top:"24%", width:"36%", height:"42%", background:"radial-gradient(circle, rgba(255,150,40,0.7), transparent 65%)" }),
        D({ ...abs, right:"14%", top:"30%", width:"32%", height:"36%", background:"radial-gradient(circle, rgba(255,120,30,0.5), transparent 65%)" })
      ];
    } else if (type === 3) {
      L = [
        D({ ...full, background:"linear-gradient(180deg,#1a2b5c,#3f6bbf 55%,#bcd6ef 70%,#2b2f3a 70%)" }),
        D({ ...abs, left:"50%", top:"30%", width:"30%", height:"30%", transform:"translate(-50%,-50%)", borderRadius:"50%", background:"radial-gradient(circle,#fff1b0,#ffb24d 70%, transparent)" }),
        D({ ...abs, left:"50%", bottom:0, width:"82%", height:"40%", transform:"translateX(-50%)", clipPath:"polygon(38% 0, 62% 0, 100% 100%, 0 100%)", background:"linear-gradient(180deg,#3a3f48,#23272e)" }),
        D({ ...abs, left:"50%", bottom:0, width:"4%", height:"40%", transform:"translateX(-50%)", background:"repeating-linear-gradient(180deg, #f4e27a 0 8px, transparent 8px 18px)" })
      ];
    } else if (type === 4) {
      L = [
        D({ ...full, background:"linear-gradient(180deg,#6cc6e8,#bfe9f5 70%,#4a8f3a 70%)" }),
        D({ ...abs, left:"14%", top:"18%", width:"26%", height:"11%", background:"#fff", borderRadius:"20px", opacity:0.85 }),
        D({ ...abs, left:0, right:0, bottom:0, height:"24%", background:"repeating-linear-gradient(90deg, rgba(0,0,0,0.25) 0 1px, transparent 1px 16px), #7a4a22" }),
        D({ ...abs, left:"30%", top:"42%", width:"12%", height:"12%", borderRadius:"50%", background:"radial-gradient(circle,#ffe98a,#e0a52a)" }),
        D({ ...abs, right:"24%", bottom:"24%", width:"14%", height:"18%", background:"#d83a3a", borderRadius:"3px" })
      ];
    } else if (type === 5) {
      L = [
        D({ ...full, background:"linear-gradient(180deg,#2a2350,#6b4a7a 60%,#caa07a)" }),
        D({ ...abs, right:"18%", top:"16%", width:"22%", height:"22%", borderRadius:"50%", background:"radial-gradient(circle at 40% 38%, #fdf6e3, #d9c9a0)" }),
        D({ ...abs, left:"-10%", bottom:0, width:"70%", height:"40%", borderRadius:"50% 50% 0 0", background:"#3a4d3a" }),
        D({ ...abs, right:"-10%", bottom:0, width:"80%", height:"34%", borderRadius:"50% 50% 0 0", background:"#2c3b2e" }),
        D({ ...abs, left:"20%", bottom:0, width:"60%", height:"26%", borderRadius:"50% 50% 0 0", background:"#202b22" })
      ];
    } else if (type === 6) {
      const bc = pick(["#7a2bd0","#c8324a","#2b9f7a","#d06a1f"]);
      const gl = pick(["#7bf0ff","#ffe14d","#ff6ad0"]);
      L = [
        D({ ...full, background:"radial-gradient(circle at 50% 40%, #2a0e22, #0a0410 70%)" }),
        D({ ...abs, left:"50%", top:"54%", width:"72%", height:"72%", transform:"translate(-50%,-50%)", borderRadius:"46% 46% 40% 40%", background:bc }),
        D({ ...abs, left:"29%", top:"40%", width:"15%", height:"17%", borderRadius:"50%", background:"#fff", boxShadow:`0 0 8px ${gl}` }),
        D({ ...abs, right:"29%", top:"40%", width:"15%", height:"17%", borderRadius:"50%", background:"#fff", boxShadow:`0 0 8px ${gl}` }),
        D({ ...abs, left:"33%", top:"46%", width:"6%", height:"8%", borderRadius:"50%", background:"#111" }),
        D({ ...abs, right:"33%", top:"46%", width:"6%", height:"8%", borderRadius:"50%", background:"#111" }),
        D({ ...abs, left:"50%", top:"67%", width:"34%", height:"8%", transform:"translateX(-50%)", background:"#1a0a14", borderRadius:"0 0 8px 8px" })
      ];
    } else {
      L = [
        D({ ...full, background:"repeating-linear-gradient(90deg, #ff3b6b 0 12.5%, #ff9f1c 0 25%, #ffe600 0 37.5%, #2ecc71 0 50%, #2aa9ff 0 62.5%, #6a5cff 0 75%, #c64bff 0 87.5%, #ff3b6b 0 100%)" }),
        D({ ...abs, left:0, right:0, top:"40%", height:"6%", background:"rgba(0,0,0,0.6)" }),
        D({ ...abs, left:0, right:0, top:"62%", height:"3%", background:"rgba(255,255,255,0.5)" })
      ];
    }
    return D({ ...full }, L);
  }

  ensure(seed) {
    this._cache = this._cache || {};
    if (!this._cache[seed]) this._cache[seed] = this.make(seed);
    return this._cache[seed];
  }

  make(seed) {
    const r = this.rng(seed * 7 + 13);
    const N = 25;
    const cx = 650, cy = 460, RX = 476, RY = 366;
    const raw = [];
    const pts = [];
    for (let i = 0; i < N; i++) {
      const ang = i * 2.399963229728653;
      const rad = Math.sqrt((i + 0.62) / N);
      const px = cx + Math.cos(ang) * rad * RX + (r() - 0.5) * 22;
      const py = cy + Math.sin(ang) * rad * RY + (r() - 0.5) * 18;
      const depthT = r();
      const w = Math.round(110 + depthT * 100);
      const h = Math.round(w * 0.861);
      pts.push({ px, py, w, h });
    }
    const GAP = 18;
    const BX = 1300, BY = 920;
    for (let iter = 0; iter < 260; iter++) {
      let moved = false;
      for (let a = 0; a < N; a++) {
        for (let b = a + 1; b < N; b++) {
          const A = pts[a], B = pts[b];
          let dx = B.px - A.px, dy = B.py - A.py;
          const ox = (A.w + B.w) / 2 + GAP - Math.abs(dx);
          const oy = (A.h + B.h) / 2 + GAP - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            moved = true;
            if (dx === 0 && dy === 0) { dx = (r() - 0.5); dy = (r() - 0.5); }
            if (ox < oy) {
              const push = (ox / 2) * (dx < 0 ? -1 : 1);
              A.px -= push; B.px += push;
            } else {
              const push = (oy / 2) * (dy < 0 ? -1 : 1);
              A.py -= push; B.py += push;
            }
          }
        }
      }
      for (let a = 0; a < N; a++) {
        pts[a].px += (cx - pts[a].px) * 0.004;
        pts[a].py += (cy - pts[a].py) * 0.004;
      }
      if (!moved) break;
    }
    for (let i = 0; i < N; i++) {
      const p = pts[i];
      p.px = Math.max(p.w / 2 + 4, Math.min(BX - p.w / 2 - 4, p.px));
      p.py = Math.max(p.h / 2 + 4, Math.min(BY - p.h / 2 - 4, p.py));
    }
    for (let i = 0; i < N; i++) {
      const { px, py, w, h } = pts[i];
      const rot = 0;
      const pal = this.PALS[i % this.PALS.length];
      const title = this.NAMES[i];
      let sceneType, sceneEl;
      const sceneSeed = seed * 131 + i * 17 + 5;
      if (title === "FLAPPY BIRD") {
        sceneEl = this.flappyBirdScene(); sceneType = -1;
      } else if (title === "GOD HANDS") {
        sceneEl = this.godHandsScene(); sceneType = -2;
      } else {
        sceneType = Math.floor(r() * 8);
        sceneEl = this.scene(sceneType, sceneSeed);
      }
      raw.push({
        id: i, title: title, year: this.YEARS[i % this.YEARS.length],
        x: Math.round(px - w / 2), y: Math.round(py - h / 2), w, h,
        baseScale: (w / 460).toFixed(4), ringRadius: (14 * (w / 460) + 5).toFixed(1), rot, pal, sceneEl, sceneType, sceneSeed, wearUrl: this.wear((i % 6) + 1),
        drift: "drift" + (i % 6), dur: (7 + (i % 5) * 1.8).toFixed(1), delay: (-(i * 0.63)).toFixed(2)
      });
    }
    const order = raw.slice().sort((a, b) => a.w - b.w);
    order.forEach((c, idx) => { c.baseZ = idx + 1; });
    const titles = raw.map(c => ({ id: c.id, title: c.title })).sort((a, b) => a.title.localeCompare(b.title));
    return { cards: raw, titles };
  }

  renderVals() {
    const base = this.ensure(this.state.seed);
    const active = this.state.active;
    const setCard = (id) => () => this.setState({ active: { type: "card", id } });
    const onLeave = () => this.setState({ active: null });

    const cards = base.cards.map(c => {
      const hot = !!active && ((active.type === "card" && active.id === c.id) || (active.type === "year" && active.value === c.year));
      const dim = !!active && !hot;
      return Object.assign({}, c, {
        filter: hot ? "brightness(1.12) saturate(1.12)" : "none",
        opacity: dim ? 0.18 : 1,
        driftPlay: hot ? "paused" : "running",
        scale: hot ? 1.5 : 1,
        lift: hot ? -12 : 0,
        z: hot ? 700 : c.baseZ,
        frameOp: hot ? 1 : 0,
        onEnter: setCard(c.id),
        onClick: () => this.onCardClick(c.id)
      });
    });

    const years = this.YEARS.map(y => {
      const a = !!active && active.type === "year" && active.value === y;
      return { year: y, col: a ? "#f3f1ec" : "#6f6c64", dx: a ? 4 : 0, onEnter: () => this.setState({ active: { type: "year", value: y } }) };
    });

    const titles = base.titles.map(t => {
      const a = !!active && active.type === "card" && active.id === t.id;
      return { id: t.id, title: t.title, col: a ? "#f3f1ec" : "#8a877f", dx: a ? -7 : 0, onEnter: setCard(t.id), onClick: () => this.onCardClick(t.id) };
    });

    const inserted = this.state.inserted, closing = this.state.closing, seated = this.state.seated;
    const ins = inserted != null ? base.cards.find(c => c.id === inserted) : null;
    const insScreen = ins ? this.scene(ins.sceneType, ins.sceneSeed + 777) : null;
    return {
      cards, years, titles, onLeave,
      stageScale: this.state.scale,
      cscale: this.state.cscale,
      showConsole: inserted != null,
      ins: ins || {},
      insScreen,
      ovAnim: closing ? "ovFadeOut 360ms ease forwards" : "ovFade 300ms ease forwards",
      consoleAnim: closing ? "consoleUp 420ms cubic-bezier(.5,0,.75,.4) forwards" : "consoleDrop 800ms cubic-bezier(.16,.84,.3,1) forwards",
      cartTransform: seated ? "translateY(0px) scale(1)" : "translateY(-188px) scale(0.98)",
      cartOpacity: (seated || !closing) ? "1" : "0",
      cartTransition: closing ? "transform 380ms cubic-bezier(.5,0,.75,.4), opacity 300ms ease" : "transform 700ms cubic-bezier(.34,1.16,.36,1.02), opacity 220ms ease",
      screenOpacity: seated ? "1" : "0",
      screenFilter: seated ? "brightness(1) saturate(1)" : "brightness(0) saturate(0.4)",
      screenTransition: "opacity 620ms ease 140ms, filter 760ms ease 140ms",
      onClose: this.onClose,
      onPlay: this.onPlay,
      playZoom: this.state.playZoom,
      stop: this.stop,
      onRandom: () => this.setState(s => ({ seed: s.seed + 1, active: null })),
      onNew: () => this.setState({ active: { type: "year", value: 2026 } }),
      onDpadMove: this.onDpadMove,
      onDpadLeave: this.onDpadLeave,
      onConsoleMove: this.onConsoleMove,
      dpadRef: this.dpadRef,
      dpadTransform: "rotateX(" + this.state.dpadX + "deg) rotateY(" + this.state.dpadY + "deg)",
      dpadUp:    (this.state.dpadDir === 6 || this.state.dpadDir === 5 || this.state.dpadDir === 7) ? "1" : "0",
      dpadDown:  (this.state.dpadDir === 2 || this.state.dpadDir === 1 || this.state.dpadDir === 3) ? "1" : "0",
      dpadLeft:  (this.state.dpadDir === 4 || this.state.dpadDir === 5 || this.state.dpadDir === 3) ? "1" : "0",
      dpadRight: (this.state.dpadDir === 0 || this.state.dpadDir === 7 || this.state.dpadDir === 1) ? "1" : "0"
    };
  }
}

return Component;
};
