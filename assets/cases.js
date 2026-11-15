// ───────── Cases · inventário: um RPG de equipamentos para os projetos ─────────
// Depende de: window.gsap (carregado antes), <model-viewer> (módulo do CDN), window.VINNI (exposto por app.js:
// MATERIAIS com os textos de cada material, TOOL_SLUG e abrirMaterial, que abre o pop-up de detalhes).
import { PROJECTS as BASE, FILTROS } from "./cases-data.js?v=7";
import ICONS from "./icones.js?v=3";

const section = document.querySelector("#cases");
// O GSAP vem do CDN e o VINNI é criado pelo app.js: se algum ainda não chegou, espera (até 10 s) antes de iniciar
const pronto = () => !!(window.gsap && window.VINNI);
let tentativas = 0;
const esperar = () => { if (pronto()) iniciar(); else if (++tentativas < 200) setTimeout(esperar, 50); else console.warn("cases: GSAP ou VINNI não carregaram"); };
if (section && !section.dataset.iniciado) esperar();

function iniciar() {
  if (section.dataset.iniciado) return;
  section.dataset.iniciado = "1";
  const { MATERIAIS, TOOL_SLUG, abrirMaterial } = window.VINNI;
  const SIMBOLO = "assets/marca/simbolo_cor_negativo.svg";
  const LOOT_PADRAO = "assets/modelos/loot-gema.glb";

  // Junta os campos do inventário com os textos do material (fonte única: MATERIAIS, em app.js)
  const PROJECTS = BASE.map((p) => {
    const m = MATERIAIS[p.caso]?.[p.idx] || {};
    return { ...p, titulo: m.t || "", entregas: m.oque || [], missao: m.porque || "", habilidades: m.hab || [], ferramentas: (m.ferr || []).map((nome) => ({ nome, slug: TOOL_SLUG[nome] })) };
  });
  const ROTULO_CASO = { csl: "Cineteatro São Luiz", ea: "Enem Action · YDUQS", moda: "Moda" };

  const $ = (s) => section.querySelector(s);
  const $$ = (s) => [...section.querySelectorAll(s)];
  const $f = (k) => $(`[data-f="${k}"]`);
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  const icone = (slug) => {
    const i = ICONS[slug]; if (!i) return "";
    if (i.img) return `<img src="${i.img}" alt="">`;
    const c = lum(i.c) < 0.3 ? "#F2EEE8" : i.c;
    return `<svg viewBox="${i.vb || "0 0 24 24"}" aria-hidden="true"><path fill="${c}" d="${i.d}"/></svg>`;
  };

  const modelViewer = $("#case-model"), stage = $(".cases-stage"), lootFG = $(".loot-fg"), lootBG = $(".loot-bg");
  const bokehLayer = $(".bokeh-layer"), bokehs = $$(".bokeh"), luz = $(".luz-layer"), ignicao = $(".ignicao");
  const allLoot = $$(".loot"), grid = $(".inv-grid"), cursor = $(".inv-cursor"), fagulhas = $(".fagulhas");
  const mv = () => modelViewer && "cameraOrbit" in modelViewer; // o elemento já foi definido pelo model-viewer?

  let current = 0, isSwitching = false, switchSpin = 0, raioAtual = "380%", ultimaOrbita = "", centros = [];
  let inView = false, revelado = false, rafId = null, filtro = "todos";

  /* ---------- Abas e inventário ---------- */
  const abasBox = $(".abas");
  abasBox.innerHTML = FILTROS.map((f, i) => `<button class="aba${i ? "" : " is-active"}" data-filtro="${f.id}" role="tab" aria-selected="${!i}">${f.nome}</button>`).join("");

  function renderInventario() {
    const total = Math.max(9, Math.ceil(PROJECTS.length / 3) * 3);
    for (let i = 0; i < total; i++) {
      const p = PROJECTS[i];
      const el = document.createElement(p ? "button" : "div");
      el.className = "slot" + (p ? "" : " is-locked");
      el.innerHTML = `<span class="slot-num">${pad(i + 1)}</span>`;
      if (p) {
        el.type = "button"; el.dataset.index = i;
        el.setAttribute("role", "option"); el.setAttribute("aria-label", `${pad(i + 1)} · ${p.titulo}`);
        // miniatura leve (320 px) no slot; o arquivo grande só é usado na lupa e no visualizador. "loading" vem antes de "src" para valer.
        const addImg = (src, cls) => { const img = document.createElement("img"); img.loading = "lazy"; img.decoding = "async"; img.alt = ""; img.src = src.replace(/\/(capas|moda)\//, "/$1/mini/"); if (cls) img.className = cls; el.appendChild(img); };
        if (p.thumb2) { el.classList.add("par"); addImg(p.thumb2, "ensaio"); addImg(p.thumb, "campanha"); } else addImg(p.thumb);
        el.addEventListener("click", () => selectCase(i));
      } else { el.setAttribute("aria-hidden", "true"); el.insertAdjacentHTML("beforeend", "—"); }
      grid.insertBefore(el, cursor);
    }
    $f("total").textContent = `${pad(PROJECTS.length)} itens`;
  }
  const visiveis = () => PROJECTS.map((p, i) => i).filter((i) => filtro === "todos" || PROJECTS[i].caso === filtro);

  function atualizarInventario() {
    grid.querySelectorAll(".slot[data-index]").forEach((s) => {
      const ativo = +s.dataset.index === current;
      s.classList.toggle("is-active", ativo); s.setAttribute("aria-selected", ativo);
    });
    const v = visiveis(), pos = v.indexOf(current) + 1;
    $f("pagina").textContent = $f("contador").textContent = `${pad(pos)} / ${pad(v.length)}`;
    $f("progresso").innerHTML = v.map((i) => `<i class="${i === current ? "on" : ""}"></i>`).join("");
    moverCursor();
  }
  function moverCursor() {
    const slot = grid.querySelector(`.slot[data-index="${current}"]`);
    if (!slot) return;
    gsap.to(cursor, { x: slot.offsetLeft - 8, y: slot.offsetTop - 10, duration: .35, ease: "power3.out" });
    if (innerWidth <= 1200) grid.scrollTo({ left: slot.offsetLeft - grid.clientWidth / 2 + slot.offsetWidth / 2, behavior: "smooth" });
    // desktop em tela baixa: a grade rola na vertical; mantém o item atual visível
    else if (slot.offsetTop < grid.scrollTop || slot.offsetTop + slot.offsetHeight > grid.scrollTop + grid.clientHeight)
      grid.scrollTo({ top: slot.offsetTop - grid.clientHeight / 2 + slot.offsetHeight / 2, behavior: "smooth" });
  }
  function aplicarFiltro(id) {
    filtro = FILTROS.some((f) => f.id === id) ? id : "todos";
    $$(".aba").forEach((a) => { const on = a.dataset.filtro === filtro; a.classList.toggle("is-active", on); a.setAttribute("aria-selected", on); });
    grid.querySelectorAll(".slot[data-index]").forEach((s) => s.classList.toggle("is-filtered", !visiveis().includes(+s.dataset.index)));
    visiveis().includes(current) ? atualizarInventario() : selectCase(visiveis()[0]);
  }
  $$(".aba").forEach((aba) => aba.addEventListener("click", () => aplicarFiltro(aba.dataset.filtro)));
  function passo(dir) {
    const v = visiveis(); if (!v.length) return;
    selectCase(v[(v.indexOf(current) + dir + v.length) % v.length]);
  }
  $$(".nav-seta").forEach((b) => b.addEventListener("click", () => passo(+b.dataset.dir)));
  // Os links "Ver o case" da seção de resultados chegam aqui com o filtro do case
  const onLinkFiltro = (e) => {
    const a = e.target.closest("[data-cases-filtro]"); if (!a) return;
    aplicarFiltro(a.dataset.casesFiltro);
    const first = visiveis()[0]; if (first !== undefined && first !== current) selectCase(first);
  };
  document.addEventListener("click", onLinkFiltro);

  /* ---------- Ficha e equipamentos ---------- */
  function renderFicha(p) {
    $f("numero").textContent = pad(PROJECTS.indexOf(p) + 1);
    $f("categoria").textContent = p.tipo;
    $f("meta").innerHTML = [p.tipo, ...p.meta.split(" · ")].map((t, n) => `<span class="meta-item${n ? "" : " meta-tipo"}">${esc(t)}</span>`).join("");
    $f("titulo").textContent = p.titulo;
    $f("data").textContent = p.data || ""; $f("data").hidden = !p.data;
    $f("nivel").innerHTML = Array.from({ length: 6 }, (_, n) => `<i class="${n < p.nivel ? "on" : ""}"></i>`).join("");
    $f("nivel").setAttribute("aria-label", `Impacto ${p.nivel} de 6`);
    $f("atributos").innerHTML = p.atributos.map(([nome, val]) =>
      `<div class="attr"><span class="attr-nome">${esc(nome)}</span><span class="attr-valor">${val}</span><div class="barra"><span data-valor="${val}"></span></div></div>`).join("");
    const temDados = p.resultados && p.resultados.length;
    $('[data-bloco="resultados"]').hidden = !temDados;
    $f("resultados").innerHTML = temDados ? p.resultados.map((r) =>
      `<div class="kpi"><span class="rotulo">${esc(r.label)}</span><strong class="kpi-valor" data-valor="${esc(r.valor)}">${esc(r.valor)}</strong><span class="kpi-fonte">${esc(r.fonte)}</span></div>`).join("") : "";
    $f("missao").textContent = p.missao;
    $f("habilidades").innerHTML = p.habilidades.map((h) => `<li>${esc(h)}</li>`).join("");
    $f("entregas").innerHTML = p.entregas.slice(0, 3).map((e) => `<li>${esc(e)}</li>`).join("");
    $f("mais").textContent = p.entregas.length > 3 ? `+${p.entregas.length - 3} no case completo` : "";
    $f("link").dataset.caso = p.caso; $f("link").dataset.idx = p.idx;
  }
  function renderEquip(p) {
    $(".equip-row").innerHTML = p.ferramentas.map((f) =>
      `<div class="equip" role="listitem" tabindex="0" aria-label="${esc(f.nome)}">${icone(f.slug) || esc(f.nome.slice(0, 4))}<small aria-hidden="true">${esc(f.nome)}</small></div>`).join("");
  }
  const sairFicha = () => gsap.to([...$$(".ficha [data-anim]"), ...$$(".equip")], { y: 10, opacity: 0, duration: .25, stagger: .02, ease: "power2.in" });
  function entrarFicha() {
    gsap.fromTo($$(".ficha [data-anim]"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .05, ease: "power3.out" });
    gsap.fromTo($$(".equip"), { scale: .6, opacity: 0, y: 0 }, { scale: 1, opacity: 1, duration: .6, stagger: .06, ease: "back.out(1.7)" });
    gsap.fromTo($$(".barra span"), { width: "0%" }, { width: (i, el) => el.dataset.valor + "%", duration: .9, stagger: .08, ease: "power2.out", delay: .15 });
    $$(".kpi-valor").forEach((el) => {
      const m = el.dataset.valor.match(/^(\D*)([\d.,]+)(.*)$/); if (!m) return;
      const [, pre, num, suf] = m, casas = (num.split(",")[1] || "").length, alvo = parseFloat(num.replace(/\./g, "").replace(",", "."));
      const o = { v: 0 };
      gsap.to(o, { v: alvo, duration: 1.1, delay: .2, ease: "power2.out", onUpdate: () => (el.textContent = pre + o.v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }) + suf) });
    });
  }
  $f("link").addEventListener("click", (e) => { e.preventDefault(); const b = e.currentTarget; abrirMaterial(b.dataset.caso, +b.dataset.idx); });

  /* ---------- Modelo 3D ---------- */
  async function aplicarModelo(p) {
    if (!modelViewer) return;
    if (modelViewer.getAttribute("src") !== p.model) {
      await new Promise((res) => {
        const done = () => { modelViewer.removeEventListener("load", done); res(); };
        modelViewer.addEventListener("load", done);
        modelViewer.setAttribute("src", p.model);
        setTimeout(done, 1500); // nunca trava a transição
      });
    }
    raioAtual = raioPara(p);
    modelViewer.setAttribute("field-of-view", p.orbita.fov);
    modelViewer.style.setProperty("--inclinacao", p.orbita.inclinacao);
  }
  // Celular: itens horizontais ganham ~28% de tamanho; os em pé já ocupam bem a altura do palco
  const raioPara = (p) => (innerWidth <= 640 && !p.vertical ? `${parseFloat(p.orbita.raio) * 0.78}%` : p.orbita.raio);
  const flashIgnicao = () => gsap.timeline()
    .fromTo(ignicao, { scale: .05, opacity: 0 }, { scale: .35, opacity: 1, duration: .18, ease: "power2.out" })
    .to(ignicao, { scale: 1.4, opacity: 0, duration: .7, ease: "power2.out" });
  const aplicarGiro = (s) => { switchSpin = s.val; modelViewer.style.filter = `blur(${s.blur}px)`; };

  /* ---------- Transição ---------- */
  async function selectCase(next) {
    if (isSwitching || next === current || !PROJECTS[next]) return;
    isSwitching = true;
    const p = PROJECTS[next];
    current = next;
    atualizarInventario();
    $f("anuncio").textContent = `Projeto ${pad(next + 1)}: ${p.titulo}`;
    const lista = p.loot?.length ? p.loot : [LOOT_PADRAO];

    if (reduceMotion) {
      await gsap.to(modelViewer, { opacity: 0, duration: .2 });
      await aplicarModelo(p);
      renderFicha(p); renderEquip(p);
      allLoot.forEach((l, i) => l.setAttribute("src", lista[i % lista.length]));
      gsap.to(modelViewer, { opacity: 1, duration: .3 });
      gsap.set($$(".barra span"), { width: (i, el) => el.dataset.valor + "%" });
      isSwitching = false; return;
    }
    // 1. A luz se põe e renasce (só move, escala e esmaece a imagem oficial)
    gsap.timeline()
      .to(luz, { yPercent: 14, scale: .96, opacity: .45, duration: .6, ease: "power2.in" })
      .to(luz, { yPercent: p.luz.y, scale: p.luz.escala, opacity: 1, duration: 1.5, ease: "power2.out" }, "+=0.3");
    // 2. Ficha e equipamentos saem e entram
    sairFicha().then(() => { renderFicha(p); renderEquip(p); entrarFicha(); });
    // 3. Giro do modelo: 0→360 com blur, troca sob o clarão, 360→720 assentando
    const spin = { val: 0, blur: 0 };
    const giro = (async () => {
      await gsap.to(spin, { val: 360, blur: 15, duration: .6, ease: "power2.in", onUpdate: () => aplicarGiro(spin) });
      flashIgnicao();
      await aplicarModelo(p);
      gsap.to(spin, { val: 720, blur: 0, duration: 1.5, ease: "back.out(0.7)", onUpdate: () => aplicarGiro(spin), onComplete: () => { switchSpin = 0; modelViewer.style.filter = "none"; } });
    })();
    // 4. Loot: implode para o centro do modelo, troca, explode para novas posições
    const mRect = modelViewer.getBoundingClientRect();
    const loot = Promise.all(allLoot.map((l, i) => new Promise((res) => {
      const bW = l.offsetWidth / 2, bH = l.offsetHeight / 2, cRect = l.parentElement.getBoundingClientRect();
      const centerX = (mRect.left + mRect.width / 2) - cRect.left - l.offsetLeft - bW;
      const centerY = (mRect.top + mRect.height / 2) - cRect.top - l.offsetTop - bH;
      const startAngle = parseFloat(l.dataset.angle) || 0;
      const nextBaseX = (Math.random() - .5) * 60, nextBaseY = (Math.random() - .5) * 60;
      gsap.set(l, { rotation: startAngle, x: parseFloat(l.dataset.baseX) || 0, y: parseFloat(l.dataset.baseY) || 0 });
      gsap.timeline()
        .to(l, { x: centerX, y: centerY, rotation: startAngle + 45, scale: .1, opacity: 0, duration: .5, ease: "power2.in",
          onComplete: () => { l.setAttribute("src", lista[i % lista.length]); } })
        .to(l, { duration: .3 })
        .to(l, { x: nextBaseX, y: nextBaseY, rotation: startAngle + 90, scale: 1, opacity: 1, duration: .9, ease: "back.out(1.5)",
          onComplete: () => { Object.assign(l.dataset, { angle: startAngle + 90, baseX: nextBaseX, baseY: nextBaseY, rx: 0, ry: 0 }); res(); } });
    })));
    await Promise.all([giro, loot]);
    isSwitching = false;
  }

  /* ---------- Loop: tilt, parallax, repulsão, flutuação ---------- */
  allLoot.forEach((l) => Object.assign(l.dataset, { rx: 0, ry: 0, angle: Math.random() * 360, baseX: 0, baseY: 0 }));
  const mouse = { x: 0, y: 0, px: -9999, py: -9999, ativo: false }, currentMouse = { x: 0, y: 0 };
  const onPointerMove = (e) => {
    if (e.pointerType !== "mouse") return;
    const r = section.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width - .5; mouse.y = (e.clientY - r.top) / r.height - .5;
    mouse.px = e.clientX - r.left; mouse.py = e.clientY - r.top; mouse.ativo = true;
  };
  const onPointerLeave = () => { mouse.x = 0; mouse.y = 0; mouse.ativo = false; };
  section.addEventListener("pointermove", onPointerMove);
  section.addEventListener("pointerleave", onPointerLeave);
  function animate() {
    const time = performance.now() * .001;
    currentMouse.x += (mouse.x - currentMouse.x) * .05; currentMouse.y += (mouse.y - currentMouse.y) * .05;
    const orbita = `${(currentMouse.x * 40 + switchSpin).toFixed(2)}deg ${(90 + currentMouse.y * 20).toFixed(2)}deg ${raioAtual}`;
    if (orbita !== ultimaOrbita && mv()) { modelViewer.cameraOrbit = orbita; ultimaOrbita = orbita; }
    const fgX = currentMouse.x * 60, fgY = currentMouse.y * 60, bgX = currentMouse.x * -30, bgY = currentMouse.y * -30;
    lootFG.style.transform = `translate3d(${fgX}px, ${fgY}px, 0)`;
    lootBG.style.transform = `translate3d(${bgX}px, ${bgY}px, 0)`;
    bokehLayer.style.transform = `translate3d(${currentMouse.x * -15}px, ${currentMouse.y * -15}px, 0)`;
    if (!isSwitching && !reduceMotion) {
      allLoot.forEach((l, i) => {
        const c = centros[i], noFundo = l.parentElement === lootBG;
        const cx = c.x + (noFundo ? bgX : fgX) + (+l.dataset.rx || 0) + (+l.dataset.baseX || 0);
        const cy = c.y + (noFundo ? bgY : fgY) + (+l.dataset.ry || 0) + (+l.dataset.baseY || 0);
        const diffX = mouse.px - cx, diffY = mouse.py - cy, distance = Math.hypot(diffX, diffY);
        let targetRx = 0, targetRy = 0, speedMult = 1;
        if (mouse.ativo && distance > 0 && distance < 400) {
          const force = (400 - distance) / 400;
          targetRx = (diffX / distance) * force * -80; targetRy = (diffY / distance) * force * -80; speedMult = 1 + force * 5;
        }
        let rx = +l.dataset.rx || 0, ry = +l.dataset.ry || 0, angle = +l.dataset.angle || 0;
        const baseX = +l.dataset.baseX || 0, baseY = +l.dataset.baseY || 0;
        rx += (targetRx - rx) * .1; ry += (targetRy - ry) * .1; angle += .2 * speedMult;
        Object.assign(l.dataset, { rx, ry, angle });
        const dur = [5, 7, 6, 8, 5.5, 6.5, 9, 11, 10][i % 9], phase = (time + i * .7) * (Math.PI * 2 / dur);
        l.style.transform = `translate3d(${rx + baseX}px, ${ry + baseY + Math.sin(phase) * 15}px, 0) rotate(${angle + Math.cos(phase) * 6}deg)`;
      });
      bokehs.forEach((b, i) => { const dur = 10 + i * 2, phase = (time + i * 1.2) * (Math.PI * 2 / dur); b.style.transform = `translate3d(${Math.cos(phase * .5) * 15}px, ${Math.sin(phase) * 20}px, 0)`; });
    }
    rafId = requestAnimationFrame(animate);
  }

  /* ---------- Fagulhas ---------- */
  function criarFagulha() {
    if (!inView || reduceMotion || document.hidden) return;
    const f = document.createElement("span"); f.className = "fagulha";
    const size = Math.random() * 4 + 2; f.style.width = f.style.height = size + "px";
    f.style.left = (35 + Math.pow(Math.random(), .6) * 65) + "%"; f.style.bottom = "-20px";
    f.style.setProperty("--op", Math.random() * .5 + .2); f.style.setProperty("--sobe", -(fagulhas.clientHeight + 60) + "px"); f.style.setProperty("--dx", (Math.random() - .3) * 60 + "px");
    const dur = Math.random() * 6 + 4;
    f.style.animation = `casesSubirFagulha ${dur}s linear forwards, casesPiscar ${.8 + Math.random() * 1.2}s ease-in-out infinite alternate`;
    fagulhas.appendChild(f); setTimeout(() => f.remove(), dur * 1000);
  }
  const fagulhaTimer = setInterval(criarFagulha, innerWidth <= 640 ? 800 : 400);

  /* ---------- Entrada (a ignição do manual) ---------- */
  function revelar() {
    if (revelado) return; revelado = true;
    stage.classList.add("is-on");
    if (reduceMotion) { entrarFicha(); return; }
    flashIgnicao();
    gsap.from($$(".cases-hud > *"), { y: 16, opacity: 0, duration: .6, stagger: .08, ease: "power3.out" });
    gsap.from($(".inventario"), { x: -24, opacity: 0, duration: .8, delay: .2, ease: "power3.out" });
    gsap.from($(".ficha"), { x: 24, opacity: 0, duration: .8, delay: .3, ease: "power3.out" });
    gsap.from($(".cases-rodape"), { y: 12, opacity: 0, duration: .6, delay: .45, ease: "power3.out" });
    entrarFicha();
    (window.requestIdleCallback || ((fn) => setTimeout(fn, 1500)))(prefetch);
  }
  const obsLoop = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView && !rafId) rafId = requestAnimationFrame(animate);
    if (!inView && rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }, { threshold: .1 });
  obsLoop.observe(section);
  // Observa o palco, não a seção: no celular a seção empilhada é mais alta que a tela e nunca chegaria a 35% visível
  const obsReveal = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) revelar(); }, { threshold: .25 });
  obsReveal.observe($(".cases-centro")); obsReveal.observe($(".ficha")); // quem chega direto na ficha também vê a entrada

  /* ---------- Teclado e swipe (só com a seção visível) ---------- */
  const onKey = (e) => {
    if (!inView || document.querySelector("dialog[open]") || e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); passo(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); passo(-1); }
    else if (/^[1-9]$/.test(e.key) && visiveis().includes(+e.key - 1)) selectCase(+e.key - 1);
    else if (e.key === "Enter" && !e.target.closest("button, a")) $f("link").click();
  };
  document.addEventListener("keydown", onKey);
  let toqueX = null;
  $(".cases-centro").addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") toqueX = e.clientX; });
  section.addEventListener("pointerup", (e) => {
    if (toqueX === null) return;
    const dx = e.clientX - toqueX; toqueX = null;
    if (Math.abs(dx) > 50) passo(dx < 0 ? 1 : -1);
  });

  /* ---------- Palco: ocupa só a área livre do centro, em qualquer largura ---------- */
  const area = $(".palco-area");
  function posicionarPalco() {
    const a = area.getBoundingClientRect(), s = section.getBoundingClientRect();
    const top = a.top - s.top, left = a.left - s.left;
    section.style.setProperty("--stage-top", top + "px");
    section.style.setProperty("--stage-left", left + "px");
    section.style.setProperty("--stage-w", a.width + "px");
    section.style.setProperty("--stage-h", a.height + "px");
    // centro de cada loot sem os transforms do loop, para a repulsão não precisar medir nada a cada quadro
    centros = allLoot.map((l) => ({ x: left + l.offsetLeft + l.offsetWidth / 2, y: top + l.offsetTop + l.offsetHeight / 2 }));
  }
  let filaPalco = 0;
  const onResize = () => { cancelAnimationFrame(filaPalco); filaPalco = requestAnimationFrame(() => { posicionarPalco(); moverCursor(); raioAtual = raioPara(PROJECTS[current]); }); };
  const ro = new ResizeObserver(onResize); ro.observe(section); ro.observe(area);
  addEventListener("resize", onResize);

/* ---------- Lupa (desktop) e imagem em tela cheia (toque) ---------- */
// O model-viewer devolve o ponto exato da imagem (UV) sob o cursor e o material atingido; com isso a lupa mostra
// o trecho certo do arquivo original mesmo com o card inclinado. Nas campanhas de moda, "ensaio" é a imagem de trás.
const mouseFino = matchMedia("(hover: hover) and (pointer: fine)");
const imagemDe = (p, material) => (material === "ensaio" && p.thumb2 ? p.thumb2 : p.thumb);
const tamanhos = new Map();
const medir = (src) => tamanhos.get(src) || (tamanhos.set(src, new Promise((res) => {
  const im = new Image(); im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => res(null); im.src = src;
})), tamanhos.get(src));
const lupa = document.createElement("div"); lupa.className = "lupa"; lupa.setAttribute("aria-hidden", "true"); section.appendChild(lupa);
const L = 240, ZOOM = 1.25; // lado da lupa e ampliação sobre o tamanho original do arquivo
let lupaFila = 0, ultimoEvento = null;
const esconderLupa = () => lupa.classList.remove("on");
const atualizarLupa = async () => {
  lupaFila = 0; const e = ultimoEvento;
  if (!e || isSwitching || !mv() || !modelViewer.loaded) return esconderLupa();
  const hit = modelViewer.positionAndNormalFromPoint(e.clientX, e.clientY);
  const mat = hit && modelViewer.materialFromPoint(e.clientX, e.clientY);
  if (!hit || !hit.uv || !mat || mat.name === "borda") return esconderLupa();
  const src = imagemDe(PROJECTS[current], mat.name), dim = await medir(src);
  if (!dim || e !== ultimoEvento) return;
  const u = hit.uv.u ?? hit.uv.x, v = hit.uv.v ?? hit.uv.y, w = dim.w * ZOOM, h = dim.h * ZOOM;
  lupa.style.backgroundImage = `url("${src}")`;
  lupa.style.backgroundSize = `${w}px ${h}px`;
  lupa.style.backgroundPosition = `${L / 2 - u * w}px ${L / 2 - v * h}px`;
  // a lupa fica acima e à direita do cursor, sem sair da seção
  const s = section.getBoundingClientRect();
  let x = e.clientX - s.left + 28, y = e.clientY - s.top - L - 28;
  if (x + L > s.width - 16) x = e.clientX - s.left - L - 28;
  if (y < 16) y = e.clientY - s.top + 28;
  lupa.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  lupa.classList.add("on");
};
area.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse" || !mouseFino.matches) return;
  ultimoEvento = e; if (!lupaFila) lupaFila = requestAnimationFrame(atualizarLupa);
});
area.addEventListener("pointerleave", () => { ultimoEvento = null; esconderLupa(); });

// Visualizador: abre as imagens do item em tela cheia (no celular ao tocar; no desktop ao clicar)
const visor = document.createElement("dialog");
visor.className = "cases-visor"; visor.setAttribute("aria-label", "Imagem do projeto"); visor.setAttribute("data-lenis-prevent", "");
visor.innerHTML = `<div class="cases-visor-topo"><p class="cases-visor-titulo"></p><button type="button" class="cases-visor-fechar" aria-label="Fechar">✕</button></div><div class="cases-visor-imagens"></div><p class="cases-visor-dica">${matchMedia("(hover: hover)").matches ? "Clique" : "Toque"} na imagem para ampliar ou reduzir.</p>`;
document.body.appendChild(visor);
const abrirVisor = () => {
  const p = PROJECTS[current]; if (!p) return;
  visor.querySelector(".cases-visor-titulo").textContent = p.titulo;
  visor.querySelector(".cases-visor-imagens").innerHTML = [p.thumb, p.thumb2].filter(Boolean)
    .map((src, i) => `<img src="${src}" alt="${esc(p.titulo)}${i ? " · ensaio" : ""}" decoding="async">`).join("");
  esconderLupa(); visor.showModal();
  const cx = visor.querySelector(".cases-visor-imagens"); cx.scrollTop = 0; cx.scrollLeft = 0;
};
visor.querySelector(".cases-visor-fechar").addEventListener("click", () => visor.close());
// Ampliar/reduzir: a imagem cresce 2,2× a partir do tamanho ajustado e a rolagem leva o ponto clicado ao centro
const caixaVisor = visor.querySelector(".cases-visor-imagens");
caixaVisor.addEventListener("click", (e) => {
  const img = e.target; if (img.tagName !== "IMG") return;
  const r0 = img.getBoundingClientRect(), fx = (e.clientX - r0.left) / r0.width, fy = (e.clientY - r0.top) / r0.height;
  if (img.classList.toggle("ampliada")) { img.style.width = `${r0.width * 2.2}px`; img.style.height = "auto"; }
  else { img.style.width = ""; img.style.height = ""; }
  const r = img.getBoundingClientRect(), b = caixaVisor.getBoundingClientRect();
  caixaVisor.scrollLeft += r.left - b.left + fx * r.width - b.width / 2;
  caixaVisor.scrollTop += r.top - b.top + fy * r.height - b.height / 2;
});
visor.addEventListener("click", (e) => { if (e.target === visor) visor.close(); });
area.addEventListener("click", abrirVisor);

  /* ---------- Init ---------- */
  renderInventario();
  const p0 = PROJECTS[0];
  renderFicha(p0); renderEquip(p0);
  gsap.set(luz, { yPercent: p0.luz.y, scale: p0.luz.escala });
  atualizarInventario(); posicionarPalco();
  // O model-viewer vem do CDN: espera o elemento ser definido e a seção chegar perto (1,5 tela) antes de baixar os modelos
  let modelosPedidos = false;
  const carregarModelos = () => {
    if (modelosPedidos) return; modelosPedidos = true;
    if (!customElements.get("model-viewer") && !document.querySelector("script[data-model-viewer]")) {
      const sc = document.createElement("script"); sc.type = "module"; sc.dataset.modelViewer = "";
      sc.src = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";
      document.head.appendChild(sc);
    }
    Promise.race([customElements.whenDefined("model-viewer"), new Promise((r) => setTimeout(r, 8000))]).then(() => {
      aplicarModelo(p0);
      const lista = p0.loot?.length ? p0.loot : [LOOT_PADRAO];
      allLoot.forEach((l, i) => l.setAttribute("src", lista[i % lista.length]));
    });
  };
  const obsPerto = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { carregarModelos(); obsPerto.disconnect(); } }, { rootMargin: "150% 0px" });
  obsPerto.observe(section);
  // Também começa em segundo plano depois que a página termina de carregar: quem pula direto para os cases pelo menu não espera
  const emSegundoPlano = () => (window.requestIdleCallback || ((fn) => setTimeout(fn, 2500)))(carregarModelos, { timeout: 4000 });
  if (document.readyState === "complete") emSegundoPlano(); else addEventListener("load", emSegundoPlano, { once: true });
  const prefetch = () => {
    const urls = new Set(PROJECTS.flatMap((p) => [p.model, ...(p.loot || [])]).filter(Boolean));
    urls.forEach((u) => { const l = document.createElement("link"); l.rel = "prefetch"; l.href = u; l.as = "fetch"; document.head.appendChild(l); });
  };

  section.destruirCases = () => {
    cancelAnimationFrame(rafId); rafId = null; clearInterval(fagulhaTimer);
    obsLoop.disconnect(); obsReveal.disconnect(); obsPerto.disconnect(); ro.disconnect();
    document.removeEventListener("keydown", onKey); document.removeEventListener("click", onLinkFiltro);
    removeEventListener("resize", onResize);
    section.removeEventListener("pointermove", onPointerMove); section.removeEventListener("pointerleave", onPointerLeave);
    delete section.dataset.iniciado;
  };
}
