import ICONS from "./icones.js?v=3";
import { createGlassFolder } from "./glass-folder.js";
document.documentElement.classList.add("js");

// ───────── Símbolos das ferramentas e plataformas ─────────
const TOOL_SLUG = { "ClickUp": "clickup", "Trello": "trello", "Asana": "asana", "Notion": "notion", "Google Analytics 4": "googleanalytics", "Search Console": "googlesearchconsole", "Looker Studio": "looker", "Google Sheets": "googlesheets", "Meta Ads": "meta", "Google Ads": "googleads", "RD Station": "rdstation", "Manychat": "manychat", "WhatsApp": "whatsapp", "Claude": "claude", "Zapier": "zapier", "ChatGPT": "openai", "Photoshop": "adobephotoshop", "CapCut": "capcut", "Instagram": "instagram", "LinkedIn": "linkedin", "YouTube": "youtube", "TikTok": "tiktok", "Canva": "canva", "Illustrator": "adobeillustrator", "Loja Integrada": "lojaintegrada", "Meta Business Suite": "meta" };
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const icon = (slug, light) => {
  const i = ICONS[slug];
  if (!i) return "";
  if (i.img) return `<img class="ico ico-img" src="${i.img}" alt="" aria-hidden="true">`;
  let c = i.c;
  if (!light && lum(c) < 0.3) c = "#F2EEE8";
  if (light && lum(c) > 0.85) c = "#0E0C13";
  return `<svg class="ico" viewBox="${i.vb || "0 0 24 24"}" aria-hidden="true"><path fill="${c}" d="${i.d}"/></svg>`;
};
// O símbolo só entra onde a ferramenta ganha destaque: nos chips (círculos) e nos bullet points. No texto corrido, não.
const decorateTools = (root = document) => root.querySelectorAll("[data-tool]").forEach((el) => {
  if (el.dataset.deco) return;
  const chip = el.matches(".chips li");
  const bullet = el.closest("li") && !el.closest("p, h2, h3");
  if (!chip && !bullet) return;
  el.dataset.deco = "1";
  el.insertAdjacentHTML("afterbegin", icon(el.dataset.tool, !!el.closest(".claro")));
});
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(hover: none) and (pointer: coarse)").matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const pad = (n) => String(n).padStart(2, "0");

// ───────── O ticker: um loop de rAF, assinantes com taxa própria ─────────
const subs = new Set();
let rafId = 0;
const loop = (t) => { rafId = requestAnimationFrame(loop); for (const s of [...subs]) if (t - s.last > s.fr()) { s.last = t; s.cb(t); } };
const subscribe = (cb, fr = () => 0) => { const s = { cb, fr, last: 0 }; subs.add(s); if (!rafId) rafId = requestAnimationFrame(loop); return () => subs.delete(s); };

let lenis = null;
if (!reduced) {
  try {
    const { default: Lenis } = await Promise.race([import("https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.mjs"), new Promise((_, no) => setTimeout(() => no(new Error("timeout")), 3000))]);
    lenis = new Lenis({ smoothWheel: true });
    subscribe((t) => lenis.raf(t));
  } catch (e) { console.warn("Lenis indisponível, rolagem nativa.", e); }
}
const scrollTo = (target) => {
  if (lenis) lenis.scrollTo(target);
  else if (typeof target === "number") window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
  else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
};
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href");
  if (id.length < 2) return;
  const el = $(id);
  if (!el) return;
  e.preventDefault();
  scrollTo(id === "#inicio" ? 0 : el);
});

// ───────── A mola (tension, friction, massa 1, passos de 1 ms) ─────────
const springs = new Set();
class Spring {
  constructor(value, cfg, onUpdate) { this.v = value; this.vel = 0; this.target = value; this.k = cfg.tension; this.c = cfg.friction; this.prec = cfg.prec ?? 0.001; this.onUpdate = onUpdate; this.timer = 0; }
  to(target, delay = 0) {
    clearTimeout(this.timer);
    const go = () => { this.target = target; if (reduced) { this.v = target; this.vel = 0; this.onUpdate?.(this.v); return; } springs.add(this); };
    delay > 0 ? (this.timer = setTimeout(go, delay)) : go();
    return this;
  }
  step(ms) {
    const n = Math.min(64, Math.round(ms));
    for (let i = 0; i < n; i++) { const f = -this.k * (this.v - this.target) - this.c * this.vel; this.vel += f * 0.001; this.v += this.vel * 0.001; }
    const rest = Math.abs(this.vel) < this.prec * 10 && Math.abs(this.target - this.v) < this.prec;
    if (rest) { this.v = this.target; this.vel = 0; }
    this.onUpdate?.(this.v);
    return !rest;
  }
}
let springLast = 0;
subscribe((t) => { const dt = springLast ? Math.min(64, t - springLast) : 16; springLast = t; for (const s of [...springs]) if (!s.step(dt)) springs.delete(s); });
const REVEAL = { tension: 90, friction: 26 };

// ───────── Revelações de texto ─────────
const splitEl = (el) => {
  const plain = el.textContent.trim().replace(/\s+/g, " ");
  const wrap = document.createElement("span"); wrap.className = "split"; wrap.setAttribute("aria-hidden", "true");
  const units = [];
  const addWord = (word, cloneOf) => {
    const u = document.createElement("span"); u.className = "u"; u.textContent = word;
    if (cloneOf) { const c = cloneOf.cloneNode(false); c.textContent = word; u.textContent = ""; u.appendChild(c); }
    if (units.length) wrap.append(" ");
    wrap.appendChild(u); units.push(u);
  };
  for (const node of [...el.childNodes]) {
    if (node.nodeType === 3) node.textContent.split(/\s+/).filter(Boolean).forEach((w) => addWord(w));
    else if (node.nodeType === 1) {
      if (node.classList.contains("ponto") && units.length) { const p = document.createElement("span"); p.className = "ponto"; p.textContent = node.textContent; units[units.length - 1].appendChild(p); continue; }
      node.textContent.split(/\s+/).filter(Boolean).forEach((w) => addWord(w, node));
    }
  }
  const sr = document.createElement("span"); sr.className = "sr"; sr.textContent = plain;
  el.textContent = ""; el.append(sr, wrap);
  return units;
};
const groups = { hero: [], "hero-fim": [] };
const play = (el) => {
  if (el._played) return; el._played = true;
  const delay = +(el.dataset.delay || 0);
  if (el._units) {
    const stagger = +(el.dataset.stagger || 30);
    el._units.forEach((u, i) => new Spring(0, REVEAL, (v) => { u.style.opacity = v; u.style.transform = `translateY(${(1 - v) * 0.35}em)`; }).to(1, delay + i * stagger));
  } else if (el.hasAttribute("data-rise")) {
    new Spring(0, REVEAL, (v) => { el.style.opacity = v; el.style.transform = v >= 1 ? "" : `translateY(${(1 - v) * 0.75}rem)`; }).to(1, delay);
  } else new Spring(0, REVEAL, (v) => { el.style.opacity = v; }).to(1, delay);
};
const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { play(e.target); io.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
const initReveals = () => {
  $$("[data-split]").forEach((el) => { el._units = splitEl(el); el._units.forEach((u) => { u.style.opacity = 0; u.style.transform = "translateY(.35em)"; }); });
  $$("[data-split], [data-rise], [data-fade]").forEach((el) => { const g = el.dataset.group; if (g && groups[g]) groups[g].push(el); else io.observe(el); });
};

// ───────── Pilha: o hero fica preso e recua quando o Sobre passa por cima ─────────
const initStack = () => {
  const layer = $(".stack > .layer"), inner = $(".layer-inner", layer), shade = $(".shade", layer), next = $(".layer-last");
  const pinned = matchMedia("(min-width: 1024px) and (min-height: 701px)");
  let queued = false;
  const apply = () => {
    queued = false;
    if (!pinned.matches || reduced) { inner.style.transform = ""; shade.style.opacity = "0"; return; }
    const p = clamp01(1 - next.getBoundingClientRect().top / (innerHeight || 1));
    inner.style.transform = p > 0 ? `scale(${1 - 0.1 * p})` : "";
    shade.style.opacity = `${0.55 * p}`;
    inner.style.visibility = p >= 1 ? "hidden" : "visible";
  };
  const q = () => { if (!queued) { queued = true; requestAnimationFrame(apply); } };
  addEventListener("scroll", q, { passive: true }); addEventListener("resize", q); apply();
};

// ───────── Costura em pixel entre o bloco escuro e o claro ─────────
const initSeams = () => {
  const SOLID_UNTIL = 0.16, LIFT = 2, ACCENT = 0.06, CELL = 22;
  const noise = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  $$("[data-seam]").forEach((canvas) => {
    const ctx = canvas.getContext("2d"), surface = canvas.dataset.seam;
    let last = -1, w = 0, h = 0, ratio = 1;
    const size = () => { ratio = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio); last = -1; };
    const render = (progress) => {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / CELL), rows = Math.ceil(h / CELL), lift = progress * LIFT;
      for (let y = 0; y < rows; y++) {
        const depth = y / Math.max(1, rows - 1) + lift; if (depth > 1) break;
        const solid = depth <= SOLID_UNTIL, fade = clamp01(1 - (depth - SOLID_UNTIL) / (1 - SOLID_UNTIL));
        if (!solid && fade <= 0) break;
        for (let x = 0; x < cols; x++) {
          if (!solid) { if ((x + y) % 2 !== 0) continue; if (noise(x, y) > fade) continue; }
          ctx.fillStyle = !solid && noise(x + 101, y + 57) < ACCENT ? "#FF7A1A" : surface;
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    };
    // No celular, a barra do navegador dispara "resize" ao rolar; só redimensiona se o tamanho mudou de fato
    // (redimensionar apaga o canvas, e era isso que fazia a costura piscar).
    size(); addEventListener("resize", () => { if (canvas.clientWidth === w && canvas.clientHeight === h) return; size(); });
    subscribe(() => {
      const r = canvas.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) return;
      const k = reduced ? 1 : Math.round(clamp01(1 - r.top / innerHeight) * 200) / 200;
      if (k !== last) { last = k; render(k); }
    }, () => 10);
  });
};

// ───────── 1 · Hero: o vídeo toca uma vez; no fim, só os gradientes seguem se movendo ─────────
const initHero = () => {
  const hero = $("#inicio"), video = $(".hero-video", hero), veil = $(".veil"), meter = $(".veil i");
  const glows = $$(".glow", hero), logo = $(".hero-logo", hero);
  let started = false, ended = false, glowAt = 0, t0 = performance.now(); let glowSprings = [];
  const progress = new Spring(0, { tension: 10, friction: 30 }, (v) => (meter.style.transform = `scaleX(${v})`));
  progress.to(0.7);

  // O vídeo é 16:9. Na paisagem, cobre a tela. No retrato, o enquadramento acompanha a assinatura.
  const layout = () => {
    const W = hero.clientWidth, H = hero.clientHeight;
    let w, h, x, y;
    if (W / H >= 1.15) { w = Math.max(W, H * 16 / 9); h = w * 9 / 16; x = (W - w) / 2; y = (H - h) / 2; video.classList.remove("retrato"); }
    // a assinatura ocupa ~52% da largura do vídeo, centrada: aqui ela passa a ocupar ~86% da tela
    else { w = W / 0.6; h = w * 9 / 16; x = (W - w) / 2; y = H * 0.46 - h / 2; video.classList.add("retrato"); }
    Object.assign(video.style, { width: `${w}px`, height: `${h}px`, left: `${x}px`, top: `${y}px` });
  };
  layout(); addEventListener("resize", layout);

  const lift = () => {
    if (started) return; started = true;
    progress.k = 170; progress.c = 26; progress.to(1);
    new Spring(1, { tension: 70, friction: 24 }, (v) => (veil.style.opacity = v)).to(0, 200);
    setTimeout(() => veil.remove(), 1600);
    groups.hero.forEach(play);
    if (reduced) { showEnd(true); return; }
    video.play().catch(() => { showEnd(true); retryOnTouch(); });
  };
  // Alguns celulares (iPhone em economia de energia, por exemplo) barram o vídeo automático.
  // Nesse caso a marca fica parada e o vídeo toca no primeiro toque ou clique na página.
  const retryOnTouch = () => {
    const evs = ["touchstart", "pointerdown", "keydown"];
    const go = () => {
      evs.forEach((e) => removeEventListener(e, go, true));
      video.currentTime = 0;
      video.play().then(() => {
        ended = false; hero.classList.remove("sem-video");
        glowSprings.forEach((s) => s && s.to(0)); glowSprings = [];
      }).catch(() => {});
    };
    evs.forEach((e) => addEventListener(e, go, { capture: true, passive: true }));
  };
  // Fim do vídeo: o último quadro fica; por cima, luzes do gradiente passam a se mover devagar.
  const showEnd = (semVideo) => {
    if (ended) return; ended = true; glowAt = performance.now();
    if (semVideo) hero.classList.add("sem-video");
    groups["hero-fim"].forEach(play);
    glowSprings.forEach((s) => s.to(0)); glowSprings = glows.map((g, i) => new Spring(0, { tension: 20, friction: 20 }, (v) => (g.style.opacity = v * (semVideo ? 1 : 0.75))).to(1, i * 250) || null);
  };
  video.addEventListener("ended", () => showEnd(false));
  video.addEventListener("timeupdate", () => { if (video.duration && video.currentTime > video.duration - 1.6) groups["hero-fim"].forEach(play); });
  // Alguns servidores não entregam vídeo em partes; nesse caso, baixa inteiro e tenta de novo.
  let retried = false;
  video.addEventListener("error", async () => {
    if (retried) return showEnd(true); retried = true;
    try { const blob = await (await fetch(video.getAttribute("src"))).blob(); video.src = URL.createObjectURL(blob); video.load(); if (started) video.play().catch(() => showEnd(true)); }
    catch { showEnd(true); }
  });
  if (video.readyState >= 3) lift(); else video.addEventListener("canplay", lift, { once: true });
  setTimeout(lift, 3500);

  const W = () => hero.clientWidth, H = () => hero.clientHeight;
  let gpu = false;
  const camada = (on) => { if (on !== gpu) { gpu = on; glows.forEach((g) => (g.style.willChange = on ? "transform, opacity" : "auto")); } };
  subscribe((now) => {
    if (!ended || document.hidden || scrollY > innerHeight * 1.2) return camada(false);
    camada(true);
    const t = (now - t0) / 1000;
    const w = W(), h = H(), m = Math.max(w, h);
    // frio no alto à esquerda, luz embaixo à direita, como no último quadro da assinatura
    const p = [
      [-0.32 * m + Math.sin(t * 0.13) * 0.06 * w, -0.36 * m + Math.cos(t * 0.11) * 0.05 * h],
      [w - 0.46 * m + Math.sin(t * 0.09 + 1) * 0.08 * w, h - 0.4 * m + Math.cos(t * 0.12) * 0.06 * h],
      [w * 0.35 + Math.sin(t * 0.07 + 2) * 0.18 * w - 0.25 * m, h * 0.55 + Math.cos(t * 0.1 + 1) * 0.12 * h - 0.25 * m],
    ];
    glows.forEach((g, i) => (g.style.transform = `translate3d(${p[i][0]}px, ${p[i][1]}px, 0)`));
  }, () => (coarse ? 1000 / 30 : 1000 / 60 - 2));
};

// ───────── Carrossel simples (Sobre, cases, certificados, lâminas) ─────────
const makeSlider = (root) => {
  const view = $(".slider-view", root), track = $(".slider-track", root);
  const leg = $(".slide-leg", root), dotsBox = $(".dots", root), cont = $(".slide-n", root);
  let n = 0, idx = 0, drag = null;
  const pos = new Spring(0, { tension: 190, friction: 28 }, (v) => (track.style.transform = `translate3d(${-v * 100}%, 0, 0)`));
  const update = () => {
    const slides = $$(".slide", track); n = slides.length;
    if (dotsBox) dotsBox.innerHTML = slides.map((_, i) => `<button aria-label="Ir para ${i + 1}" ${i === idx ? 'aria-current="true"' : ""}></button>`).join("");
    if (leg) { const img = $("img", slides[idx]); leg.textContent = img?.dataset.leg || ""; }
    if (cont) cont.textContent = `${pad(idx + 1)} / ${pad(n)}`;
    slides.forEach((s, i) => s.setAttribute("aria-hidden", i !== idx));
  };
  const go = (k) => { idx = (k + n) % n; pos.to(idx); update(); root.dispatchEvent(new CustomEvent("slide", { detail: idx })); };
  $(".prev", root)?.addEventListener("click", () => go(idx - 1));
  $(".next", root)?.addEventListener("click", () => go(idx + 1));
  dotsBox?.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) go([...dotsBox.children].indexOf(b)); });
  view.tabIndex = 0;
  view.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); } });
  view.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, dx: 0 }; view.setPointerCapture(e.pointerId); });
  view.addEventListener("pointermove", (e) => { if (!drag) return; drag.dx = e.clientX - drag.x; pos.v = idx - drag.dx / view.clientWidth; pos.target = pos.v; track.style.transform = `translate3d(${-pos.v * 100}%, 0, 0)`; });
  const end = () => { if (!drag) return; const th = view.clientWidth * 0.15, dx = drag.dx; drag = null; if (dx < -th) go(idx + 1); else if (dx > th) go(idx - 1); else pos.to(idx); };
  view.addEventListener("pointerup", end); view.addEventListener("pointercancel", end);
  update();
  return { reset() { idx = 0; pos.v = 0; pos.target = 0; track.style.transform = "translate3d(0, 0, 0)"; update(); }, go };
};

// ───────── 3 · Trajetória vertical ─────────
const TRAJ = [
  { ano: "2017\u00a0–\u00a02019", onde: "EEEP Leonel de Moura Brizola", papel: "Comunicação, Imagem e Styling", txt: "Onde comecei a produzir conteúdo: cena, luz, foto e narrativa. É a base visual que levo até hoje para campanhas." },
  { ano: "2020\u00a0–\u00a02021", onde: "AGP Marketing", papel: "Social media", txt: "Meu primeiro trabalho no digital: conteúdo para marcas de moda infantil, moda casual, moda praia e acessórios." },
  { ano: "2021", onde: "Fargo\u00a0· Bolsas e sapatos", papel: "Assistente de Marketing e E\u2060-\u2060commerce", txt: "Campanhas de social media e e\u2060-\u2060commerce com foco em conversão, copy, peças e vídeos, ações com influenciadores e lançamento de coleção com catálogos temáticos. Em paralelo, atendi como freelancer marcas como UAU Conceito, La Reine e Theresa Montenegro." },
  { ano: "2022", onde: "Freelancer", papel: "Marketing digital", txt: "" }, // PENDENTE: descrição curta do que fiz nos freelas
  { ano: "2023 – 2025", onde: "Desenrolado · Enem Action (YDUQS)", papel: "Analista de Marketing Digital", txt: "Inbound, CRO, conteúdo e monitoramento de patrocinados para o Enem Action." },
  { ano: "2025 – hoje", onde: "Cineteatro São Luiz", papel: "Gestão de Comunicação Digital", txt: "Equipamento da Secult CE gerido pelo Instituto Dragão do Mar. Planejamento digital, linha editorial, dados para a curadoria e orientação da equipe de criação de conteúdo." },
];
const initTimeline = () => {
  const list = $(".tl"), section = $("#trajetoria"), float = $(".tl-float");
  list.insertAdjacentHTML("beforeend", TRAJ.map((t, i) => `
    <li class="tl-item" data-i="${i}">
      <div class="tl-head" tabindex="0" aria-describedby="tl-t${i}">
        <i class="tl-dot" aria-hidden="true"></i>
        <span class="tl-ano">${t.ano}</span><b>${t.onde}</b><span>${t.papel}</span>
        <div class="tl-texto" id="tl-t${i}"><p>${t.txt}</p></div>
      </div>
    </li>`).join(""));
  const items = $$(".tl-item", list);
  items.forEach((it, i) => it.querySelector(".tl-head").setAttribute("data-rise", "") || it.querySelector(".tl-head").setAttribute("data-delay", "0"));

  // O pop-up flutuante segue o cursor, com um pouco de atraso.
  const fx = new Spring(0, { tension: 220, friction: 26 }, () => {}), fy = new Spring(0, { tension: 220, friction: 26 }, () => {});
  const fo = new Spring(0, { tension: 260, friction: 26 }, (v) => { float.style.opacity = v; });
  let ativo = -1;
  const place = () => { float.style.transform = `translate3d(${fx.v}px, ${fy.v}px, 0)`; };
  fx.onUpdate = place; fy.onUpdate = place;
  // o texto abre do outro lado da linha, onde a coluna está vazia, centrado na altura do item
  const alvo = (i) => {
    const head = $(".tl-head", items[i]), r = head.getBoundingClientRect(), rail = list.getBoundingClientRect();
    const meio = rail.left + rail.width / 2, w = float.offsetWidth, h = float.offsetHeight;
    const x = r.left < meio ? meio + 48 : meio - 48 - w;
    const y = Math.min(innerHeight - h - 16, Math.max(16, r.top + r.height / 2 - h / 2));
    return [x, y];
  };
  const show = (i) => {
    if (!TRAJ[i].txt) return; // item ainda sem descrição: só período e título
    if (ativo !== i) { ativo = i; $(".rotulo", float).textContent = `${TRAJ[i].ano}\u00a0· ${TRAJ[i].onde}`; $("p", float).textContent = TRAJ[i].txt; }
    const [x, y] = alvo(i);
    if (fo.target < 1) { fx.v = fx.target = x; fy.v = fy.target = y; place(); }
    fx.to(x); fy.to(y); fo.to(1);
  };
  const hide = () => { fo.to(0); ativo = -1; };
  subscribe(() => { if (ativo < 0) return; const [x, y] = alvo(ativo); fx.to(x); fy.to(y); }, () => 50);
  items.forEach((it, i) => {
    const head = $(".tl-head", it);
    head.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") show(i); });
    head.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hide(); });
    head.addEventListener("focus", () => show(i));
    head.addEventListener("blur", hide);
    head.addEventListener("click", () => { if (innerWidth <= 720 && TRAJ[i].txt) it.classList.toggle("open"); });
    head.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && innerWidth <= 720 && TRAJ[i].txt) { e.preventDefault(); it.classList.toggle("open"); } });
  });
  addEventListener("scroll", () => { if (fo.target > 0) hide(); }, { passive: true });

  // O trilho: fio que desce com a rolagem e uma brasa na ponta (o símbolo nunca gira).
  const rail = $(".tl-rail svg");
  const runS = new Spring(0, { tension: 140, friction: 30 }, () => {});
  let lastRun = -1;
  subscribe(() => {
    const r = list.getBoundingClientRect();
    if (r.bottom < -100 || r.top > innerHeight + 100) return;
    const H = r.height;
    const p = clamp01((innerHeight * 0.6 - r.top) / (H || 1));
    runS.to(p);
    const run = runS.v * H;
    if (Math.abs(run - lastRun) > 0.3) {
      lastRun = run;
      rail.setAttribute("viewBox", `0 0 24 ${H}`);
      rail.innerHTML = `<line x1="12" y1="0" x2="12" y2="${H}" stroke="rgba(242,238,232,.14)" stroke-dasharray="4 6"/>
        <rect x="11.5" y="0" width="1" height="${run}" fill="#F2EEE8" opacity=".8"/>
        <circle cx="12" cy="${run}" r="14" fill="url(#bg1)"/><circle cx="12" cy="${run}" r="4.5" fill="#FF7A1A"/>
        <defs><radialGradient id="bg1"><stop offset="0" stop-color="#FFB547" stop-opacity=".9"/><stop offset=".4" stop-color="#FF7A1A" stop-opacity=".4"/><stop offset="1" stop-color="#FF7A1A" stop-opacity="0"/></radialGradient></defs>`;
      items.forEach((it) => { const ir = it.getBoundingClientRect(); it.classList.toggle("passou", ir.top + ir.height / 2 - r.top <= run + 2); });
    }
  });
};

// ───────── 4 · O que eu faço: a volta com quatro paradas ─────────
const FRENTES = [
  { n: "01", frente: "Planejamento e operação de comunicação digital", onde: "Cineteatro São Luiz", num: "4x", metrica: "mais engajamento no Instagram", base: "Em média, 36% das pessoas alcançadas interagem por mês desde ago/25. No ano anterior, eram 8% a 9%.", caso: "case-csl" },
  { n: "02", frente: "Inbound e conversão em matrícula", onde: "Enem Action · YDUQS", num: "44,5%", metrica: "dos leads Enem Action em 2024 vieram das campanhas em que atuei", base: "o maior percentual entre as marcas do grupo", caso: "case-ea" },
  { n: "03", frente: "Campanhas de captação", onde: "Simuladão do Enem", num: "+12,9%", metrica: "de aumento relativo na taxa de conversão", base: "de 2023 para 2024", caso: "case-ea" },
];
const PATH = [[0.60, 0.88], [0.46, 0.82], [0.38, 0.60], [0.43, 0.36], [0.57, 0.19], [0.73, 0.14], [0.87, 0.21], [0.94, 0.36], [0.90, 0.54], [0.76, 0.58], [0.68, 0.70], [0.72, 0.86]];
const STOP_IDX = [2, 4, 7];
const initFaz = () => {
  const section = $("#o-que-faco"), canvas = $(".faz-canvas"), ctx = canvas.getContext("2d");
  const stopsBox = $(".faz-stops"), tabs = $(".tabs", section), body = $(".plate-body", section);
  let sel = 0;
  const render = (i, anim) => {
    const r = FRENTES[i];
    body.innerHTML = `<p class="plate-frente">${r.frente}</p><p class="plate-onde">${r.onde}</p>
      <div class="plate-num"><b>${r.num}</b><span>${r.metrica}</span></div><p class="plate-base">${r.base}</p>
      <a class="plate-link" href="#${r.caso}">Ver o case <span aria-hidden="true">→</span></a>`;
    if (anim) { body.classList.remove("troca"); void body.offsetWidth; body.classList.add("troca"); }
    $$("button", tabs).forEach((b, k) => b.setAttribute("aria-selected", k === i));
    $$(".stop", stopsBox).forEach((b, k) => b.classList.toggle("ativo", k === i));
  };
  const select = (i) => { if (i === sel) return; sel = i; render(i, true); };
  FRENTES.forEach((r, i) => {
    const t = document.createElement("button"); t.setAttribute("role", "tab"); t.textContent = r.n; t.setAttribute("aria-label", r.frente); t.addEventListener("click", () => select(i)); tabs.appendChild(t);
    const s = document.createElement("button"); s.className = "stop"; s.innerHTML = `<span>${r.n}</span>`; s.setAttribute("aria-label", r.frente);
    s.addEventListener("click", () => select(i)); s.addEventListener("mouseenter", () => select(i)); stopsBox.appendChild(s);
  });
  render(0, false);

  let W = 1, H = 1, ratio = 1, pts = [], cum = [], total = 1, stopDist = [], baked = null;
  const PITCH = 13;
  const build = () => {
    W = section.clientWidth; H = section.clientHeight; ratio = Math.min(devicePixelRatio || 1, coarse ? 1 : 2);
    canvas.width = Math.round(W * ratio); canvas.height = Math.round(H * ratio);
    const P = PATH.map(([x, y]) => [x * W, y * H]), N = P.length;
    pts = []; stopDist = [];
    for (let i = 0; i < N; i++) {
      const p0 = P[(i - 1 + N) % N], p1 = P[i], p2 = P[(i + 1) % N], p3 = P[(i + 2) % N];
      const n = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 3));
      if (STOP_IDX.includes(i)) stopDist.push(pts.length);
      for (let s = 0; s < n; s++) {
        const t = s / n, t2 = t * t, t3 = t2 * t;
        pts.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                  0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    pts.push(P[0]);
    cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    total = cum[cum.length - 1];
    const stopIdx = stopDist.slice();
    stopDist = stopIdx.map((k) => cum[k]);
    $$(".stop", stopsBox).forEach((b, k) => { const p = pts[stopIdx[k]]; b.style.left = `${p[0]}px`; b.style.top = `${p[1]}px`; b._p = p; });
    parado = false;
    baked = document.createElement("canvas"); baked.width = canvas.width; baked.height = canvas.height;
    const b = baked.getContext("2d"); b.setTransform(ratio, 0, 0, ratio, 0, 0); b.fillStyle = "rgba(242,238,232,.12)"; b.beginPath();
    for (let y = PITCH / 2; y < H; y += PITCH) for (let x = PITCH / 2; x < W; x += PITCH) { b.moveTo(x + 1.2, y); b.arc(x, y, 1.2, 0, 6.2832); }
    b.fill();
  };
  let lap = 0, heat = 1, armed = false, lapStart = 0, coolStart = 0, last = 0, parado = false;
  const pointer = { x: 0, y: 0, on: false }, light = { x: 0, y: 0, heat: 0, spread: 0 };
  const ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  const trailTo = (dist) => { const out = []; for (let i = 0; i < pts.length; i++) { if (cum[i] <= dist) { out.push(pts[i]); continue; } const a = pts[i - 1], b = pts[i], r = (dist - cum[i - 1]) / (cum[i] - cum[i - 1] || 1); out.push([a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r]); break; } return out; };
  const stroke = (points, from = 0) => { ctx.beginPath(); ctx.moveTo(points[from][0], points[from][1]); for (let i = from + 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]); ctx.stroke(); };
  const frame = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(baked, 0, 0); ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (armed && light.heat > 0.01) {
      const ci = Math.round((light.x - PITCH / 2) / PITCH), cj = Math.round((light.y - PITCH / 2) / PITCH), reach = 320 * light.spread;
      const sq = (i, j, v) => { if (v < 0.3 || (i + j) & 1) return; const x = PITCH / 2 + i * PITCH, y = PITCH / 2 + j * PITCH, s = PITCH * (0.7 + 0.3 * Math.min(1, (v - 0.3) / 0.7)); ctx.fillStyle = v > 0.8 ? "#FFE3B8" : v > 0.5 ? "#FFB547" : "#FF7A1A"; ctx.fillRect(x - s / 2, y - s / 2, s, s); };
      const span = Math.ceil(reach / PITCH);
      for (let k = -span; k <= span; k++) { const v = (1 - Math.abs(k * PITCH) / Math.max(reach, 1)) * 0.82 * light.heat; sq(ci + k, cj, v); sq(ci, cj + k, v); }
      for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { const d = Math.hypot(i, j) * PITCH / 54; if (d < 1) sq(ci + i, cj + j, (1 - d) * (1 - d) * 0.95 * light.heat); }
    }
    if (W < 1024) return;
    const dist = total * ease(lap), points = lap >= 1 ? pts : trailTo(dist);
    if (points.length < 2) return;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255,122,26,.07)"; ctx.lineWidth = 16; stroke(points);
    ctx.strokeStyle = "rgba(255,122,26,.12)"; ctx.lineWidth = 7; stroke(points); ctx.restore();
    ctx.strokeStyle = "rgba(255,122,26,.85)"; ctx.lineWidth = 2.2; stroke(points);
    if (heat > 0.01) {
      const from = Math.max(0, points.length - 70), tip = points[points.length - 1];
      const g = ctx.createLinearGradient(points[from][0], points[from][1], tip[0], tip[1]); g.addColorStop(0, "rgba(255,181,71,0)"); g.addColorStop(1, `rgba(255,181,71,${heat})`);
      ctx.strokeStyle = g; ctx.lineWidth = 3.2; stroke(points, from);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const sp = ctx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 18); sp.addColorStop(0, `rgba(255,248,236,${0.85 * heat})`); sp.addColorStop(.4, `rgba(255,181,71,${0.4 * heat})`); sp.addColorStop(1, "rgba(255,122,26,0)");
      ctx.fillStyle = sp; ctx.beginPath(); ctx.arc(tip[0], tip[1], 18, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    $$(".stop", stopsBox).forEach((stop, k) => {
      if (dist < stopDist[k] && lap < 1) return;
      stop.classList.add("lit");
      const age = Math.min(1, (dist - stopDist[k]) / 120);
      if (age < 1 && lap < 1 && stop._p) { ctx.strokeStyle = `rgba(255,181,71,${(1 - age) * 0.6})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(stop._p[0], stop._p[1], 14 + age * 26, 0, 6.2832); ctx.stroke(); }
    });
  };
  build(); addEventListener("resize", build);
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !lapStart) lapStart = performance.now(); }, { threshold: 0.35 }).observe(section);
  if (!reduced && !coarse) {
    addEventListener("pointermove", (e) => { const r = section.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.on = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= r.width && pointer.y <= r.height && !e.target.closest(".plate"); }, { passive: true });
    document.addEventListener("pointerleave", () => (pointer.on = false));
  }
  subscribe((now) => {
    const r = section.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
    if (lapStart) { lap = reduced ? 1 : Math.min(1, (now - lapStart) / 6000); if (lap >= 1) { if (!coolStart) coolStart = now; heat = reduced ? 0 : Math.max(0, 1 - (now - coolStart) / 800); if (heat <= 0) armed = true; } }
    const want = pointer.on ? 0.95 : 0;
    if (light.heat <= 0.001 && want > 0) { light.x = pointer.x; light.y = pointer.y; }
    else if (dt) {
      const px = light.x, py = light.y, k = 1 - Math.exp(-dt / 0.07);
      light.x += (pointer.x - light.x) * k; light.y += (pointer.y - light.y) * k;
      const ws = Math.max(0, 1 - Math.hypot(light.x - px, light.y - py) / dt / 900);
      light.spread += (ws - light.spread) * (1 - Math.exp(-dt / (ws > light.spread ? 0.38 : 0.09)));
    }
    light.heat += (want - light.heat) * (1 - Math.exp(-dt / (want > light.heat ? 0.14 : 0.3)));
    if (armed && pointer.on) $$(".stop", stopsBox).forEach((s, k) => { if (s._p && Math.hypot(s._p[0] - pointer.x, s._p[1] - pointer.y) < 40) select(k); });
    const ocioso = (!lapStart || (lap >= 1 && heat <= 0)) && light.heat < 0.001 && !pointer.on;
    if (ocioso && parado) return;
    frame(); parado = ocioso;
  }, () => (coarse ? 1000 / 30 : 0));
};

// ───────── 6 · Carrosséis: anel giratório de pastas de vidro ─────────
const CARR = [
  { t: "O declínio da atenção", l: "Por que assistir filmes lentos se tornou um desafio?", n: 5 },
  { t: "Filmes não lineares", l: "Nem toda história precisa ser contada do começo ao fim.", n: 6 },
  { t: "Cinema mudo", l: "E se você assistisse a um filme sem trilha sonora?", n: 9 },
  { t: "Existe verdade na ficção?", l: "A linha entre o real e o inventado é mais tênue do que parece.", n: 8 },
  { t: "Série Cênica", l: "Quais histórias moldam o começo do mundo?", n: 5 },
  { t: "Petrouchka", l: "O modernismo que revolucionou a música chega ao São Luiz.", n: 6 },
  { t: "Placar, a revista militante", l: "O futebol nunca foi só futebol.", n: 5 },
];
const initCarousels = () => {
  const ring = $(".anel"), N = CARR.length, nLabel = $(".anel-n");
  const visor = $(".visor"), viewer = $('[data-slider="carrossel"]'), track = $(".slider-track", viewer);
  // a arte do painel de trás: a receita "marble" do original, com as cores da paleta Vinni
  const recipe = { style: "marble", colors: ["#0E0C13", "#2E3566", "#6A4C9C", "#1a1220", "#D9472B", "#FF7A1A", "#FFB547"], scale: 0.7, warp: 3.4, angle: -0.5, gloss: 0.5, veins: 0.45 };
  const fw = matchMedia("(max-width: 720px)").matches ? 230 : 300;
  let cur = 0, shown = -1, slider = null;
  const mini = $(".visor-mini", visor);
  const marca = (k) => $$("button", mini).forEach((b, i) => b.setAttribute("aria-current", i === k));
  mini.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) slider.go($$("button", mini).indexOf(b)); });
  viewer.addEventListener("slide", (e) => marca(e.detail));
  const showCarousel = (i) => {
    if (i === shown) return; shown = i;
    const c = CARR[i];
    track.innerHTML = Array.from({ length: c.n }, (_, k) => `<div class="slide"><img src="assets/carrosseis/c${i + 1}-${pad(k + 1)}.webp" alt="${c.t}, lâmina ${k + 1} de ${c.n}" ${k > 1 ? 'loading="lazy"' : ""} draggable="false"></div>`).join("");
    $(".visor-n", visor).textContent = `Carrossel ${pad(i + 1)}\u00a0· ${c.n} lâminas`;
    $("h3", visor).textContent = c.t;
    $(".visor-linha", visor).textContent = c.l;
    mini.innerHTML = Array.from({ length: c.n }, (_, k) => `<button type="button" aria-label="Lâmina ${k + 1}" ${k === 0 ? 'aria-current="true"' : ""}><img src="assets/carrosseis/mini/c${i + 1}-${pad(k + 1)}.webp" alt="" loading="lazy" decoding="async" draggable="false"></button>`).join("");
    if (!slider) slider = makeSlider(viewer); else slider.reset();
    new Spring(0, { tension: 170, friction: 24 }, (v) => { visor.style.opacity = v; }).to(1);
  };
  const items = CARR.map((c, i) => {
    const holder = document.createElement("div");
    holder.className = "anel-item";
    holder.style.marginLeft = `${-fw / 2}px`;
    // as lâminas entram ao contrário para a capa ficar na frente da pilha, mais perto do vidro
    const files = Array.from({ length: Math.min(4, c.n) }, (_, k) => ({ name: `Lâmina ${k + 1}`, meta: `${pad(k + 1)}/${pad(c.n)}`, image: `assets/carrosseis/mini/c${i + 1}-${pad(k + 1)}.webp`, k })).reverse();
    const folder = createGlassFolder({
      label: c.t, meta: `${pad(i + 1)}\u00a0· ${c.n} lâminas`, tone: "dark", art: recipe, seed: i * 7 + 3,
      labelPlacement: "top-left", width: fw, appearDelay: i * 120, files,
      onHit: () => { if (i === cur) folder.setOpen(!folder.open); else go(i); },
      onFileSelect: (file) => {
        showCarousel(i); slider.go(file.k);
        const r = visor.getBoundingClientRect();
        if (r.top > innerHeight * 0.7 || r.bottom < 0) scrollTo(visor);
      },
    });
    holder.appendChild(folder.el); ring.appendChild(holder);
    return { holder, folder };
  });
  let girando = false;
  const rot = new Spring(0, { tension: 120, friction: 22 }, (v) => {
    layout(v);
    const move = rot.vel !== 0 || v !== rot.target;
    if (move !== girando) { girando = move; items.forEach(({ holder }) => (holder.style.willChange = move ? "transform, opacity" : "auto")); }
  });
  function layout(v) {
    const R = Math.min(ring.clientWidth * 0.4, 440);
    items.forEach(({ holder }, i) => {
      const a = ((i - v) / N) * Math.PI * 2;
      const depth = (Math.cos(a) + 1) / 2;
      holder.style.transform = `translate3d(${Math.sin(a) * R}px, ${(1 - depth) * -40}px, 0) scale(${0.56 + 0.44 * depth})`;
      holder.style.zIndex = String(Math.round(depth * 100));
      holder.style.opacity = String(0.18 + 0.82 * depth);
      holder.style.pointerEvents = depth < 0.25 ? "none" : "";
      holder.toggleAttribute("inert", depth < 0.25);
    });
  }
  const settle = (k) => {
    cur = ((k % N) + N) % N;
    items.forEach(({ folder }, i) => { if (i !== cur) folder.setOpen(false); });
    nLabel.textContent = `${pad(cur + 1)} / ${pad(N)}`;
    showCarousel(cur);
  };
  function go(target) {
    // gira pelo caminho mais curto
    let d = ((target - cur) % N + N) % N; if (d > N / 2) d -= N;
    rot.to(rot.target + d);
    settle(target);
  }
  $$("[data-anel]").forEach((b) => b.addEventListener("click", () => go(cur + +b.dataset.anel)));
  ring.addEventListener("keydown", (e) => {
    if (e.target.closest(".gf-files")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); items[cur].folder.focus(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); items[cur].folder.focus(); }
  });
  // arrastar para girar
  let drag = null, dragEnd = 0;
  ring.addEventListener("pointerdown", (e) => { if (!e.target.closest(".gf-sheet")) drag = { x: e.clientX, v: rot.v, moved: false }; });
  addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 6) drag.moved = true;
    if (drag.moved) { rot.v = rot.target = drag.v - dx / 200; layout(rot.v); }
  });
  addEventListener("pointerup", () => {
    if (!drag) return;
    const moved = drag.moved; drag = null;
    if (!moved) return;
    dragEnd = performance.now();
    const k = Math.round(rot.v); rot.to(k); settle(k);
  });
  ring.addEventListener("click", (e) => { if (performance.now() - dragEnd < 80) e.stopPropagation(); }, true);
  addEventListener("resize", () => layout(rot.v));
  layout(0); settle(0);
};

// ───────── Contato, gaveta e menu ─────────
// ───────── Materiais dos cases: o texto acompanha a imagem do carrossel ─────────
const ISCA_OQUE = ["Pesquisa de pautas e temas sociais em alta entre os estudantes", "Briefing da isca digital: público, tema e objetivo", "Diretrizes de redação e de design para a equipe de criação", "Plano de divulgação inbound: redes, landing page, e\u2060-\u2060mail e WhatsApp", "Meta de geração de leads e acompanhamento dos resultados por campanha"];
const ISCA_COMO = "Defini o tema a partir da pesquisa de pauta, escrevi o briefing, orientei a redação e a direção de arte e acompanhei os leads gerados pela landing page e pelas campanhas.";
const ISCA_HAB = ["Inbound marketing", "Pesquisa de pauta", "Briefing", "Nutrição de leads"];
const ISCA_FERR = ["RD Station", "Meta Ads", "Google Analytics 4", "WhatsApp"];
const FAZSOL = { r: "Fargo · campanha de verão", b: "Entender a campanha",
  oque: ["Concepção conceitual: o verão como estado de espírito da persona da marca, com a luz do sol que faz dentro dela", "Planejamento de cenários para uma diária inteira: piquenique, casa com piscina, grutas e praia", "Produção executiva do ensaio, da equipe às locações", "Casting e styling dos looks com as bolsas e os sapatos da coleção", "Pós-produção e tratamento das imagens no Photoshop"],
  porque: "A coleção de verão pedia uma narrativa maior que o produto: o amor pelo verão, a leveza e a doçura da persona da marca na estação mais colorida da Fargo.",
  como: "A produção levou o dia inteiro e rodou por diferentes cenários. Dividi o styling e a produção com Lívia Costa, e a pós-produção exigiu trabalho no Photoshop.",
  hab: ["Concepção criativa", "Planejamento de cenário", "Produção executiva", "Casting", "Styling"], ferr: ["Photoshop"] };
const OASIS = { r: "Vila Sol · moda praia", b: "Entender a campanha",
  oque: ["Concepção criativa a partir de uma pergunta: qual a sensação de um dia no paraíso?", "Planejamento e composição de cenário entre grutas, rochas, coqueiros e praia", "Produção do ensaio e styling dos looks da coleção", "Direção de acting das modelos durante as fotos", "Pós-produção das imagens no Photoshop"],
  porque: "A coleção precisava vender uma sensação, a de passar um dia no paraíso, para a cliente se imaginar ali com as peças.",
  como: "Atuei na concepção criativa, na produção e no styling, ajudando no acting das modelos e na composição de cenário, em dupla com Marianny Silva. Na pós-produção, também usei o Photoshop.",
  hab: ["Concepção criativa", "Produção", "Styling", "Direção de modelos", "Composição de cenário"], ferr: ["Photoshop"] };
const MATERIAIS = {
  moda: [
    { ...FAZSOL, t: "Campanha Faz Sol Dentro de Mim", l: "Narra o amor pelo verão e a leveza e a doçura da persona da Fargo, com a luz do sol que faz dentro dela." },
    { ...FAZSOL, t: "Faz Sol Dentro de Mim · ensaio", l: "Uma diária inteira entre piquenique, casa com piscina, grutas e praia, com as bolsas e os sapatos da coleção." },
    { ...OASIS, t: "Campanha Oásis", l: "Qual a sensação de um dia no paraíso? Essa era a pergunta da campanha da coleção Oásis, da Vila Sol." },
    { ...OASIS, t: "Oásis · ensaio", l: "Concepção, produção e styling, com direção de acting das modelos e composição de cenário entre rochas e praia." },
  ],
  csl: [
    { t: "Plano de Comunicação Digital\u00a0· documento", l: "A versão completa do plano: do diagnóstico à execução, com cada estratégia apoiada em dados.", b: "Entender o plano",
      ctx: "Quando cheguei, quase toda a aquisição e o relacionamento passavam pelo Instagram, e o conteúdo se resumia a cards de agenda. Os dados estavam nos painéis, mas não circulavam como rotina de decisão, e a página de vendas, onde a compra acontece, recebia pouca atenção.",
      oque: ["Diagnóstico com dados dos canais (GA4, Search Console e redes), entrevistas com a equipe e escuta com espectadores antes das sessões", "Três gargalos: dependência de um único canal, perda de público entre o interesse e a compra e nenhuma trilha de retorno para quem já foi", "6 objetivos e 17 resultados-chave em quatro anos, do alcance à conversão na Sympla, com canais próprios (WhatsApp, e-mail e site) e busca orgânica", "16 sprints trimestrais, cada um fechando com a revisão do que entrou, do que os números mostram e do que muda. O plano foi aprovado pela gestão"],
      porque: "A comunicação digital precisava de uma direção para quatro anos que reduzisse a dependência de um único canal e desse à curadoria dados para decidir.",
      como: "Cruzei dados dos canais, do site e da bilheteria com pesquisas de mercado e com a escuta do público, e transformei o diagnóstico em objetivos mensuráveis.",
      hab: ["Pesquisa de mercado", "Análise de dados", "Planejamento estratégico", "OKRs", "Escrita estratégica"], ferr: ["Google Analytics 4", "Search Console", "Looker Studio", "Google Sheets"] },
    { t: "Plano de Comunicação Digital\u00a0· apresentação", l: "A versão em slides, feita para apresentar a estratégia aos gestores. O plano foi aprovado pela diretoria.", b: "Entender o plano",
      oque: ["Síntese da pesquisa e da análise do ambiente de marketing", "Objetivos e metas do ciclo em formato de leitura rápida", "Estratégias de canais e de conteúdos, com os dados que as sustentam", "Narrativa em três partes: diagnóstico, decisão e execução"],
      porque: "O documento é a referência completa, mas os gestores precisavam ver a tese, os dados e as decisões em poucos minutos para aprovar o plano. A apresentação foi aprovada pela diretoria.",
      como: "Condensei os 14 capítulos do documento numa narrativa visual, priorizando os dados que justificam cada decisão.",
      hab: ["Storytelling com dados", "Comunicação executiva", "Síntese", "Visualização de dados"], ferr: ["Canva"] },
    { t: "Dashboard · Curva ABC de bilheteria", l: "Classifica os eventos por arrecadação e por público e acompanha o funil de cada um. Os números estão borrados por confidencialidade.", b: "Entender o dashboard",
      oque: ["Classificação dos eventos em classes A, B e C, por arrecadação e por público", "Funil de cada evento: views da campanha, cliques, sessões na página de venda, ingressos e comparecimento", "Diagnóstico automático que aponta onde a venda travou (alcance, conversão ou comparecimento) e sugere onde agir"],
      porque: "Para colocar dados de canal e de bilheteria na mesma mesa nas reuniões de resultado. Essa leitura já apoiou decisões de programação.",
      como: "Montei a curva ABC e o dashboard em Looker Studio a partir dos dados de bilheteria e dos canais, adotados para apoiar o processo curatorial.",
      hab: ["Análise de dados", "Curva ABC", "Funil de conversão", "Visualização de dados"], ferr: ["Looker Studio", "Google Sheets"] },
    { t: "Dashboard · OKRs 2027⁠–⁠2030", l: "Acompanha os 17 resultados-chave do plano contra os marcos de cada ano. Os números estão borrados por confidencialidade.", b: "Entender o dashboard",
      oque: ["Visão geral dos 6 objetivos e dos 17 resultados-chave", "Atingimento de cada resultado-chave em relação ao marco do ano, com três níveis de meta: regular, boa e ótima", "Uma página por objetivo, com linha de base, realizado e o que falta para o marco"],
      porque: "Para o plano virar rotina de decisão: cada sprint trimestral fecha com uma revisão do que entrou, do que os números mostram e do que muda.",
      como: "O dashboard parte do dashboard de KPIs dos canais, que reúne Instagram, YouTube, TikTok, LinkedIn, site e base própria numa série mensal desde 2024, com dicionário de métricas, validação dos dados e um registro do que explica cada pico.",
      hab: ["OKRs", "Análise de dados", "Visualização de dados"], ferr: ["Google Sheets"] },
    { t: "Linha Editorial para os canais digitais", l: "O guia do que publicar, em que proporção e com que frequência. 40% da pauta passou a ser conteúdo de repertório.", b: "Entender o documento",
      oque: ["Estudo do histórico e dos resultados dos conteúdos anteriores", "Estudo do comportamento, dos desejos e das dúvidas da audiência", "Seis editorias, por objetivo e por resultado: Programação, Educativo, Curatorial, Interativo, Institucional e Informativo", "Calibragem do peso de cada editoria na pauta", "Frequência de publicações ao longo do mês"],
      porque: "Para a pauta deixar de depender só da agenda e cada publicação ter um objetivo e um sinal de sucesso claro, como salvamentos, compartilhamentos ou cliques até a página de venda.",
      como: "Categorizei o histórico de publicações, comparei o desempenho de cada tipo de conteúdo e cruzei com o que a audiência pergunta e procura. Escrevo parte das publicações e faço o briefing das demais.",
      hab: ["Planejamento editorial", "Análise de conteúdo", "Pesquisa de audiência"], ferr: ["Instagram", "Google Sheets", "ClickUp"] },
  ],
  ea: [
    { t: "E\u2060-\u2060book Estudos sobre Cinema", l: "Isca digital da campanha Férias com Conteúdo, para atrair estudantes interessados em cinema.", b: "Entender o material",
      oque: ISCA_OQUE, porque: "Julho tem menos conversões. Um conteúdo útil e temático mantém a plataforma relevante nas férias e traz novos leads qualificados para o funil.",
      como: ISCA_COMO, hab: ISCA_HAB, ferr: ISCA_FERR },
    { t: "E\u2060-\u2060book História da Moda", l: "Isca digital da campanha Férias com Conteúdo, sobre o que a moda e a indumentária dizem da cultura e da história de um povo.", b: "Entender o material",
      oque: ISCA_OQUE, porque: "Um tema de repertório cultural, útil para a redação e para as questões de humanas, atrai um público interessado e mantém a base ativa no período de menos conversões.",
      como: ISCA_COMO, hab: ISCA_HAB, ferr: ISCA_FERR },
    { t: "Planner 30 dias de Redação", l: "Isca digital para o estudante organizar 30 dias de prática de redação antes do Enem.", b: "Entender o material",
      oque: ISCA_OQUE, porque: "A redação é uma das etapas que mais preocupam o estudante. Um planner prático gera leads e mantém a base engajada até a prova.",
      como: ISCA_COMO, hab: ISCA_HAB, ferr: ISCA_FERR },
    { t: "Relatório anual de desempenho das redes", l: "Leitura anual das redes do Enem Action para orientar as decisões do ano seguinte.", b: "Entender o material",
      oque: ["Diretrizes de análise: métricas definidas por rede e comparação com o ano anterior", "Dados analisados: alcance, impressões, interações, seguidores e visualizações", "Leitura do contexto que explica picos e quedas: campanhas, orçamento e mudanças de estratégia", "Recomendações para o ano seguinte"],
      porque: "Mostra o que funcionou, onde investir conteúdo e verba e como as redes contribuem para a captação de leads, que é o objetivo de negócio da marca.",
      como: "Consolidei os dados das redes, comparei os períodos e transformei os números numa narrativa com recomendações para a gestão.",
      hab: ["Análise de dados", "Storytelling com dados", "Apresentação de resultados"], ferr: ["Instagram", "TikTok"] },
  ],
  eventos: [
    { d: "Set 2026\u00a0· Feira das Profissões\u00a0· Colégio César Cals, Fortaleza", t: "Roda de conversa: O mercado e o profissional de comunicação", l: "Participei da roda de conversa O mercado e o profissional de comunicação, na programação da Feira das Profissões do Colégio César Cals, conversando com estudantes do ensino médio sobre carreira e o dia a dia da área." },
    { d: "13 nov 2025\u00a0· Universidade Federal do Ceará", t: "Workshop Estratégias Digitais", l: "Conduzi o workshop Estratégias Digitais para alunos de Publicidade e Jornalismo da UFC. Trabalhamos segmentação, proposta de valor e como transformar dados em decisões de comunicação." },
  ],
};
const initMateriais = () => {
  const dlg = $("#material");
  const atual = {};
  const preencher = (caso, i) => {
    const box = $(`[data-material-box="${caso}"]`), m = MATERIAIS[caso][i];
    if (!box || !m) return;
    atual[caso] = i;
    $(".material-t", box).textContent = m.t;
    $(".material-l", box).textContent = m.l;
    const n = $(".material-n", box); if (n) n.textContent = `${pad(i + 1)} / ${pad(MATERIAIS[caso].length)}`;
    const d = $(".evento-d", box); if (d) d.textContent = m.d;
    const b = $(".material-b", box); if (b) b.textContent = m.b;
    new Spring(0, { tension: 170, friction: 24 }, (v) => { box.style.opacity = v; box.style.transform = v >= 1 ? "" : `translate3d(0, ${(1 - v) * 8}px, 0)`; }).to(1);
  };
  Object.keys(MATERIAIS).forEach((caso) => {
    preencher(caso, 0);
    $(`[data-case="${caso}"]`)?.addEventListener("slide", (e) => preencher(caso, e.detail));
  });
  $$("[data-material]").forEach((btn) => btn.addEventListener("click", () => {
    const caso = btn.dataset.material, m = MATERIAIS[caso][atual[caso] || 0];
    $(".mat-rotulo", dlg).textContent = m.r || (caso === "csl" ? "Cineteatro São Luiz" : "Enem Action\u00a0· YDUQS");
    $("#material-titulo").textContent = m.t;
    $(".mat-lead", dlg).textContent = m.l;
    $(".mat-ctx", dlg).textContent = m.ctx || ""; $(".mat-ctx", dlg).hidden = !m.ctx;
    $(".mat-oque", dlg).innerHTML = m.oque.map((x) => `<li>${x}</li>`).join("");
    $(".mat-porque", dlg).textContent = m.porque;
    $(".mat-como", dlg).textContent = m.como;
    $(".mat-hab", dlg).innerHTML = m.hab.map((x) => `<li>${x}</li>`).join("");
    $(".mat-ferr", dlg).innerHTML = m.ferr.map((x) => `<li data-tool="${TOOL_SLUG[x] || ""}">${x}</li>`).join("");
    $(".mat-ferr-t", dlg).hidden = !m.ferr.length;
    decorateTools(dlg);
    // no desktop, cada coluna ganha largura proporcional ao texto que leva, para as alturas ficarem parecidas
    const peso = partes.map((p) => Math.max(400, p.textContent.trim().length + $$(".chips li", p).length * 22));
    $(".mat-blocos", dlg).style.setProperty("--colunas", peso.map((w) => `minmax(0, ${w}fr)`).join(" "));
    abas[0].hidden = !m.ctx;
    aba(m.ctx ? 0 : 1);
    dlg.showModal(); lenis?.stop();
  }));
  // no celular, as abas mostram uma parte por vez para o texto caber sem rolagem
  const abas = $$(".mat-abas button", dlg), partes = $$(".mat-blocos .passo", dlg);
  // cada aba aponta para uma parte (data-parte) e para o trecho dela que aparece (data-sub): Contexto e O quê dividem a primeira, Como e Recursos a terceira
  const aba = (k) => {
    abas.forEach((b, i) => b.setAttribute("aria-selected", i === k));
    partes.forEach((p, i) => p.classList.toggle("ativo", i === +abas[k].dataset.parte));
    dlg.dataset.sub = abas[k].dataset.sub;
  };
  abas.forEach((b, i) => b.addEventListener("click", () => aba(i)));
  $(".fechar", dlg).addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", () => lenis?.start());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
};

// ───────── Links protegidos contra robôs: endereços invertidos em base64, montados só na interação ─────────
const CONTATOS = {
  mail: "bW9jLmxpYW1nQGFyaWV4aWV0c3VpY2luaXYudGttOm90bGlhbQ==",
  email: "bW9jLmxpYW1nQGFyaWV4aWV0c3VpY2luaXYudGtt",
  tel: "MjI5MjIyNTg5NTg1NSs6bGV0",
  fone: "MjI5Mi0yMjU4OSApNTgo",
  wa: "MjI5MjIyNTg5NTg1NS9lbS5hdy8vOnNwdHRo",
  in: "dGttLXN1aWNpbml2L25pL21vYy5uaWRla25pbC53d3cvLzpzcHR0aA==",
  cv: "ZmRwLmFyaWV4aWV0LXN1aWNpbml2LW9sdWNpcnJ1Yy9zdGVzc2E=",
};
const revela = (k) => [...atob(CONTATOS[k])].reverse().join("");
const initLinks = () => {
  $$("[data-t]").forEach((el) => { el.textContent = revela(el.dataset.t); });
  $$("[data-k]").forEach((a) => {
    const arma = () => { if (!a.dataset.ok) { a.href = revela(a.dataset.k); a.dataset.ok = "1"; } };
    ["pointerenter", "focus", "touchstart", "click"].forEach((ev) => a.addEventListener(ev, arma, { passive: true }));
  });
};

// ───────── Esquema das automações: fios em SVG, pulsos que correm por eles e uma saída destacada por vez ─────────
const initFluxo = () => {
  const box = $(".fluxo");
  if (!box) return;
  const svg = $(".fluxo-svg", box), NS = "http://www.w3.org/2000/svg";
  $$("[data-icos]", box).forEach((s) => { s.innerHTML = s.dataset.icos.split(" ").map((k) => icon(k)).join(""); });
  const no = (k) => $(`[data-no="${k}"]`, box);
  const saidas = [0, 1, 2, 3].map((i) => no(`s${i}`));
  const ligacoes = [["origem", "hub"], ...saidas.map((_, i) => ["hub", `s${i}`])];
  // fio entre dois blocos: na horizontal quando estão lado a lado, na vertical quando um está abaixo do outro
  const fio = (a, b) => {
    const base = box.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    // celular: da central, um trilho desce pela esquerda e entra em cada saída
    const estreito = getComputedStyle(box).gridTemplateColumns.trim().split(/\s+/).length === 1; // o CSS empilhou os blocos
    if (estreito && b.closest(".fluxo-saidas")) {
      const x = ra.left + 12 - base.left, y1 = ra.bottom - base.top, y2 = rb.top + rb.height / 2 - base.top, x2 = rb.left - base.left;
      return `M${x},${y1} L${x},${y2 - 10} Q${x},${y2} ${x + 10},${y2} L${x2},${y2}`;
    }
    if (estreito) {
      const x1 = ra.left + ra.width / 2 - base.left, y1 = ra.bottom - base.top, x2 = rb.left + rb.width / 2 - base.left, y2 = rb.top - base.top, m = (y2 - y1) / 2;
      return `M${x1},${y1} C${x1},${y1 + m} ${x2},${y2 - m} ${x2},${y2}`;
    }
    const x1 = ra.right - base.left, y1 = ra.top + ra.height / 2 - base.top, x2 = rb.left - base.left, y2 = rb.top + rb.height / 2 - base.top, m = (x2 - x1) / 2;
    return `M${x1},${y1} C${x1 + m},${y1} ${x2 - m},${y2} ${x2},${y2}`;
  };
  let paths = [], halo = null, ponto = null;
  const desenha = () => {
    svg.innerHTML = "";
    paths = ligacoes.map(([a, b]) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", fio(no(a), no(b))); p.setAttribute("class", "fio");
      svg.appendChild(p);
      return p;
    });
    if (reduced) return;
    [halo, ponto] = [["pulso-halo", 7], ["pulso", 3]].map(([cls, r]) => {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("r", r); c.setAttribute("class", cls); c.style.opacity = "0";
      svg.appendChild(c);
      return c;
    });
  };
  // um pulso sai do ClickUp, chega à central e segue por um dos quatro fios, um de cada vez;
  // a saída que recebe o pulso acende junto com o fio, e ao passar o mouse a escolhida fica acesa
  const PASSO = 1.2, CICLO = PASSO * (1 + saidas.length);
  const ease = (u) => (u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
  let fixo = -1, atual = -2, t0 = performance.now();
  const acende = (k) => {
    if (k === atual) return; atual = k;
    saidas.forEach((s, i) => s.classList.toggle("ativo", i === k));
    paths.forEach((p, i) => p.classList.toggle("ativo", i === 0 ? k >= 0 : i - 1 === k));
  };
  saidas.forEach((s, i) => {
    s.addEventListener("pointerenter", () => { fixo = i; });
    s.addEventListener("pointerleave", () => { fixo = -1; });
  });
  subscribe((now) => {
    const r = box.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    if (reduced) return acende(fixo);
    const t = ((now - t0) / 1000) % CICLO, seg = Math.floor(t / PASSO), u = (t - seg * PASSO) / PASSO;
    const p = paths[seg];
    if (p && ponto) {
      const pt = p.getPointAtLength(ease(u) * p.getTotalLength());
      const op = String(Math.min(1, u * 8, (1 - u) * 6));
      for (const c of [halo, ponto]) { c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y); c.style.opacity = op; }
    }
    acende(fixo >= 0 ? fixo : seg === 0 ? (atual >= 0 ? atual : -1) : seg - 1);
    const hub = no("hub"), ig = seg === 0 ? Math.max(0, (u - .7) / .3) : Math.max(0, 1 - u * 2.2);
    hub.style.setProperty("--ig", ig.toFixed(3));
  });
  desenha();
  new ResizeObserver(() => { desenha(); atual = -2; }).observe(box);
};

const initMisc = () => {
  $$("[data-curriculo]").forEach((a) => a.addEventListener("click", (e) => { if (a.getAttribute("href") === "#") { e.preventDefault(); scrollTo($("#contato")); } }));
  const move = $(".contato-foto-move"), sec = $("#contato");
  subscribe(() => { const r = sec.getBoundingClientRect(); if (r.top > innerHeight || r.bottom < 0) return; const p = clamp01((innerHeight - r.top) / (r.height || 1)); move.style.transform = `translate3d(0, ${(1 - p) * 60}px, 0)`; }, () => 10);
  const sheet = $(".sheet"), close = $(".sheet-close"), items = $$("li", sheet);
  const open = () => { sheet.classList.add("open"); lenis?.stop(); document.documentElement.style.overflow = "hidden"; close.focus(); items.forEach((li, i) => new Spring(0, { tension: 170, friction: 24 }, (v) => { li.style.opacity = v; li.style.transform = `translateY(${(1 - v) * 0.75}rem)`; }).to(1, 120 + i * 55)); };
  const shut = () => { sheet.classList.remove("open"); lenis?.start(); document.documentElement.style.overflow = ""; };
  $(".burger").addEventListener("click", open); close.addEventListener("click", shut);
  $$("[data-fecha]", sheet).forEach((a) => a.addEventListener("click", shut));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && sheet.classList.contains("open")) shut(); });
};

// ───────── Rodapé em pontos (Halftone Wordmark Footer, porte fiel) ─────────
function hwfHex(hex) { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim()); if (!m) return null; const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]; return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function hwfRadius(coverage, gap) { const c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage; return Math.sqrt(c) * gap * 0.56; }
function hwfStep(x, y, vx, vy, hx, hy, px, py, r) { const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy; if (r > 0 && d2 < r * r) { const d = Math.sqrt(d2) + 0.001; const f = (1 - d / r) * 2.6; vx += (dx / d) * f; vy += (dy / d) * f; } vx = (vx + (hx - x) * 0.05) * 0.84; vy = (vy + (hy - y) * 0.05) * 0.84; return [x + vx, y + vy, vx, vy]; }
function hwfWarmth(x, y, hx, hy, span) { const d = Math.hypot(x - hx, y - hy); return span > 0 ? Math.min(1, d / span) : 0; }
const initFooter = () => {
  const root = $(".hwf-root"), canvas = $("canvas", root), ctx = canvas.getContext("2d");
  const o = { background: "#0E0C13", dotGap: 6, radius: 80, crop: 0.2, grain: 0.5 };
  const ink = hwfHex("#F2EEE8"), amber = hwfHex("#FFB547"), warm = hwfHex("#FF7A1A");
  let w = 0, h = 0, dpr = 1, px = -1e5, py = -1e5, raf = 0, visible = true, awake = true;
  let ring = { x: 0, y: 0, t: -1 }, dots = new Float32Array(0), count = 0, grainTile = null, logoBox = null;
  const logo = new Image(), grainImg = new Image();
  grainImg.src = "assets/marca/grao_tile_256.png"; grainImg.onload = () => { grainTile = grainImg; wake(); };
  const measureLogo = () => {
    const c = document.createElement("canvas"); c.width = 1124; c.height = Math.round(1124 * logo.naturalHeight / logo.naturalWidth);
    const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(logo, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    logoBox = { sx: x0 / c.width, sy: y0 / c.height, sw: (x1 - x0 + 1) / c.width, sh: (y1 - y0 + 1) / c.height };
  };
  const layout = () => {
    w = Math.max(1, root.clientWidth); h = Math.max(1, root.clientHeight); dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    if (!logoBox) { dots = new Float32Array(0); count = 0; return; }
    const mask = document.createElement("canvas"); mask.width = w; mask.height = h;
    const m = mask.getContext("2d", { willReadFrequently: true });
    const drawW = (w * 1.02) / logoBox.sw, drawH = drawW * logo.naturalHeight / logo.naturalWidth, capH = logoBox.sh * drawH;
    m.drawImage(logo, (w - w * 1.02) / 2 - logoBox.sx * drawW, h + capH * o.crop - (logoBox.sy * drawH + capH), drawW, drawH);
    const img = m.getImageData(0, 0, w, h).data, gap = o.dotGap, cols = Math.ceil(w / gap), rows = Math.ceil(h / gap), tmp = [];
    for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
      let sum = 0;
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) { const X = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3)), Y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3)); sum += img[(Y * w + X) * 4 + 3]; }
      const cov = sum / (9 * 255); if (cov < 0.06) continue;
      const hx = gx * gap + gap / 2, hy = gy * gap + gap / 2; tmp.push(hx, hy, 0, 0, hx, hy, hwfRadius(cov, gap));
    }
    dots = new Float32Array(tmp); count = tmp.length / 7; awake = true;
  };
  const draw = (now) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = o.background; ctx.fillRect(0, 0, w, h);
    const r = !reduced ? o.radius : 0, ringAge = ring.t < 0 ? 1e9 : now - ring.t, ringR = ringAge * 0.9; let moving = false;
    for (let i = 0; i < count; i++) {
      const j = i * 7; let x = dots[j], y = dots[j + 1], vx = dots[j + 2], vy = dots[j + 3]; const hx = dots[j + 4], hy = dots[j + 5];
      if (!reduced) {
        if (ringAge < 900) { const dx = hx - ring.x, dy = hy - ring.y, d = Math.sqrt(dx * dx + dy * dy) + 0.001, band = 1 - Math.min(1, Math.abs(d - ringR) / 26); if (band > 0) { const f = band * 3.2 * (1 - ringAge / 900); vx += (dx / d) * f; vy += (dy / d) * f; } }
        const s = hwfStep(x, y, vx, vy, hx, hy, px, py, r); x = s[0]; y = s[1]; vx = s[2]; vy = s[3];
        if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) moving = true; else { x = hx; y = hy; vx = 0; vy = 0; }
        dots[j] = x; dots[j + 1] = y; dots[j + 2] = vx; dots[j + 3] = vy;
      }
      const k = hwfWarmth(x, y, hx, hy, 28);
      if (k > 0.02) { const a = k < 0.5 ? ink : amber, b = k < 0.5 ? amber : warm, t = k < 0.5 ? k * 2 : (k - 0.5) * 2; ctx.fillStyle = `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`; }
      else ctx.fillStyle = "#F2EEE8";
      ctx.beginPath(); ctx.arc(x, y, dots[j + 6], 0, 6.2832); ctx.fill();
    }
    if (grainTile) { ctx.globalAlpha = o.grain * 0.18; ctx.globalCompositeOperation = "overlay"; const pattern = ctx.createPattern(grainTile, "repeat"); if (pattern) { ctx.fillStyle = pattern; ctx.fillRect(0, 0, w, h); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; }
    awake = moving || ringAge < 900 || px > -1e4;
  };
  const tick = (now) => { raf = 0; if (!visible) return; draw(now); if (awake) raf = requestAnimationFrame(tick); };
  const wake = () => { awake = true; if (!raf && visible) raf = requestAnimationFrame(tick); };
  const toLocal = (e) => { const b = canvas.getBoundingClientRect(); return [((e.clientX - b.left) * w) / (b.width || w), ((e.clientY - b.top) * h) / (b.height || h)]; };
  root.addEventListener("pointermove", (e) => { const p = toLocal(e); px = p[0]; py = p[1]; wake(); });
  root.addEventListener("pointerleave", () => { px = -1e5; py = -1e5; wake(); });
  root.addEventListener("pointerdown", (e) => { if (reduced || e.target.closest("a,button")) return; const p = toLocal(e); ring = { x: p[0], y: p[1], t: performance.now() }; wake(); });
  $(".hwf-up", root).addEventListener("click", () => scrollTo(0));
  new ResizeObserver(() => { layout(); wake(); }).observe(root);
  new IntersectionObserver(([e]) => { visible = e ? e.isIntersecting : true; if (visible) wake(); }).observe(root);
  logo.onload = () => { measureLogo(); layout(); wake(); };
  logo.onerror = () => banner("assets/marca/logotipo_nevoa.svg");
  logo.src = "assets/marca/logotipo_nevoa.svg";
};

function banner(url) {
  const b = document.createElement("div"); b.setAttribute("role", "alert");
  b.style.cssText = "position:fixed;left:16px;right:16px;bottom:16px;z-index:70;padding:12px 16px;border-radius:12px;background:#D9472B;color:#F2EEE8;font:500 13px Manrope,sans-serif";
  b.textContent = `Não foi possível carregar: ${url}`; document.body.appendChild(b);
}
$$("img").forEach((img) => img.addEventListener("error", () => banner(img.getAttribute("src")), { once: true }));

decorateTools();
initTimeline();
initReveals();
initStack();
initSeams();
$$("[data-slider]:not([data-slider='carrossel'])").forEach(makeSlider);
initCarousels();
initFaz();
initMateriais();
initLinks();
initFluxo();
initMisc();
initFooter();
initHero();
