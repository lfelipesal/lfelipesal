/* O passeio da nave do site (orbit.js), calculado de antemão e gravado como animação SVG:
   zoom da galáxia até o primeiro sol, voos de troca de órbita entre os planetas, buraco de minhoca até o sistema
   seguinte e zoom de volta à galáxia depois do último. Tudo em unidades do palco do site (600 x 400).
   A volta inteira tem a duração L: cada planeta e a galáxia fecham voltas inteiras em L, então ela recomeça sem salto. */
'use strict';
const { FONTE, num, medir, altCaixa } = require('./texto');
const { enxugar, animar, transformar, discreto } = require('./smil');
const GX = require('./galaxia');
const { painelProjeto, painelMapa, moldura, PW } = require('./painel');
const { W, H, CX, CY, TILT, AZUL, FUNDO, LARANJA, CREME, faixa, suave } = GX;

// medidas do site no computador (palco de 458,8 x 305,8 px), passadas para unidades do palco
const SW = 458.78;
const SH = 305.84;
const U = W / SW;
const NAVE = 32 * U;
const NAVE_MINHOCA = 42.5 * U;
const LARGURA_TUNEL = 42.5 * 1.6 * U;
const SOL_SIS = 0.23 * W;
const SOL_GAL = 0.065 * W;
const ZOOM = 23 / 6.5;
const VELOCIDADE = 0.13;
const MINHOCA_VEL = 0.2;
const MINHOCA_TUNEL = (0.85 * Math.PI * 2) / 1000;
const MINHOCA_SAIDA = 500;
const FOLGA_PX = Math.min(60, Math.round(SH * 0.2));
const RAIO = (SH / 2 + FOLGA_PX * 0.62) * U;
const RAIO_BOCA = Math.max(18, SH * 0.1) * U;
const TEMPO_MINHOCA = 3900;
const ENTRAR = 1700;
const SAIR = 1500;
const ESPERA = 6000; // parada em cada planeta, com o painel aberto (no site são 6,5 s)
const G_INI = 3500; // galáxia antes de a nave sair
const G_FIM = 3500; // e depois que ela volta, no mínimo
const DOIS_PI = Math.PI * 2;
const mod = (a, m) => ((a % m) + m) % m;
const cosT = Math.cos(TILT);
const sinT = Math.sin(TILT);
const graus = num((TILT * 180) / Math.PI, 2);

function noPlano(sx, a) {
  const x = sx * Math.cos(a);
  const y = sx * 0.5 * Math.sin(a);
  return [CX + x * cosT - y * sinT, CY + x * sinT + y * cosT];
}

// ------------------------------------------------------------------ o roteiro do passeio
function planejar(site, L) {
  const P = site.PROJETOS;
  const sisDe = (k) => site.SISTEMAS.findIndex((s) => s.id === P[k].sistema);
  const orb = P.map(function (p, k) {
    const irm = site.projetosDe(sisDe(k));
    const m = irm.length;
    const passo = Math.min(90, 175 / Math.max(1, m - 1));
    const rx = m > 1 ? 115 + (175 - (m - 1) * passo) / 2 + irm.indexOf(k) * passo : 190;
    const v0 = 0.00022 * Math.pow(115 / rx, 1.2);
    const voltas = Math.max(1, Math.round((v0 * L) / DOIS_PI));
    return { rx: rx, a0: (k * 2.399) % DOIS_PI, vel: (voltas * DOIS_PI) / L, voltas: voltas };
  });
  const ang = (k, t) => orb[k].a0 + orb[k].vel * t;
  const voltasGal = Math.max(1, Math.round((0.00009 * L) / DOIS_PI));
  const velGal = (voltasGal * DOIS_PI) / L;
  const giro = (t) => GX.GIRO_INI + velGal * t;
  const sistemas = site.SISTEMAS.map((s, i) => i).filter((i) => site.projetosDe(i).length);

  // voo comum: sai no sentido do giro e muda de órbita aos poucos até encontrar o planeta de destino
  function planoVoo(de, para, t0, sis) {
    const a0 = ang(de, t0);
    let volta = mod(ang(para, t0) - a0, DOIS_PI);
    if (volta < Math.PI * 0.5) volta += DOIS_PI;
    const raio = (orb[de].rx + orb[para].rx) / 2;
    const comp = raio * 0.78 * volta + Math.abs(orb[para].rx - orb[de].rx);
    return { tipo: 'voo', ini: t0, fim: t0 + comp / VELOCIDADE, dur: comp / VELOCIDADE, de: de, para: para, a0: a0, volta: volta, sis: sis };
  }
  // buraco de minhoca: a boca abre na órbita, à frente da nave, perto das pontas da elipse
  function planoMinhoca(de, para, t0, sisDe0, sisPara) {
    const rx = orb[de].rx;
    const aDe = ang(de, t0);
    let aBoca = aDe + MINHOCA_SAIDA / (rx * 0.79);
    const mm = mod(aBoca, Math.PI);
    if (mm > Math.PI / 4 && mm < (Math.PI * 3) / 4) aBoca += (Math.PI * 3) / 4 - mm;
    const N = 200;
    const pts = [];
    const dist = [0];
    for (let i = 0; i <= N; i++) {
      const a = aDe + ((aBoca - aDe) * i) / N;
      const p = noPlano(rx, a);
      pts.push([p[0], p[1], a]);
      if (i) dist.push(dist[i - 1] + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]));
    }
    const a = dist[N] / MINHOCA_VEL;
    const f = { a: a, b: a + 700, c: a + 2300, d: a + TEMPO_MINHOCA };
    const rapido = (ms) => suave(faixa(ms, 0, 700)) * (1 - suave(faixa(ms, 2300, 2900)));
    const NS = 120;
    const passoSoma = TEMPO_MINHOCA / NS;
    const soma = [0];
    for (let i = 1; i <= NS; i++) soma.push(soma[i - 1] + ((rapido((i - 1) * passoSoma) + rapido(i * passoSoma)) / 2) * passoSoma);
    const lento = MINHOCA_VEL / (orb[para].rx * 0.79);
    const falta = mod(ang(para, t0 + f.d) - aBoca, DOIS_PI);
    const desejado = lento * TEMPO_MINHOCA + (MINHOCA_TUNEL - lento) * soma[NS];
    const voltaB = falta + Math.round((desejado - falta) / DOIS_PI) * DOIS_PI;
    const forte = lento + (voltaB - lento * TEMPO_MINHOCA) / soma[NS];
    return {
      tipo: 'minhoca', ini: t0, fim: t0 + f.d, f: f, de: de, para: para, sis: sisDe0, sisPara: sisPara,
      pts: pts, dist: dist, aBoca: aBoca, boca: noPlano(rx, aBoca), soma: soma, passoSoma: passoSoma, lento: lento, forte: forte
    };
  }

  const segs = [{ tipo: 'galaxia', ini: 0, fim: G_INI }];
  const sel = [{ t: 0, k: -1 }];
  const sisVis = [];
  let t = G_INI;
  sistemas.forEach(function (s, si) {
    const ks = site.projetosDe(s);
    if (si === 0) {
      segs.push({ tipo: 'entrar', ini: t, fim: t + ENTRAR, sis: s });
      sel.push({ t: t, k: ks[0] });
      sisVis.push({ t: t, s: s });
      t += ENTRAR;
    }
    let cur = ks[0];
    for (let j = 1; j < ks.length; j++) {
      segs.push({ tipo: 'parado', ini: t, fim: t + ESPERA, sis: s });
      t += ESPERA;
      const v = planoVoo(cur, ks[j], t, s);
      segs.push(v);
      t = v.fim;
      sel.push({ t: t, k: ks[j] });
      cur = ks[j];
    }
    segs.push({ tipo: 'parado', ini: t, fim: t + ESPERA, sis: s });
    t += ESPERA;
    const prox = sistemas[si + 1];
    if (prox !== undefined) {
      const m = planoMinhoca(cur, site.projetosDe(prox)[0], t, s, prox);
      segs.push(m);
      sel.push({ t: t + m.f.b, k: m.para });
      sisVis.push({ t: t + m.f.b, s: prox });
      t = m.fim;
    } else {
      segs.push({ tipo: 'sair', ini: t, fim: t + SAIR, sis: s });
      sel.push({ t: t, k: -1 });
      t += SAIR;
    }
  });
  segs.push({ tipo: 'galaxia', ini: t, fim: L });
  return { L: L, orb: orb, ang: ang, giro: giro, segs: segs, sel: sel, sisVis: sisVis, fimPasseio: t, sistemas: sistemas, sisDe: sisDe };
}

// acha uma duração em que o passeio cabe com a galáxia no fim; as velocidades dependem dela, então repete até fechar
function roteiro(site) {
  let L = 60000;
  for (let i = 0; i < 60; i++) {
    const p = planejar(site, L);
    if (p.fimPasseio + G_FIM <= L) return p;
    L = Math.max(L + 1000, Math.ceil((p.fimPasseio + G_FIM) / 1000) * 1000);
  }
  throw new Error('O passeio não fechou numa duração inteira.');
}

// ------------------------------------------------------------------ o estado de cada coisa num instante
function estados(site, R) {
  const segEm = (t) => R.segs.find((s) => t >= s.ini && t < s.fim) || R.segs[R.segs.length - 1];
  const solPos = (s) => GX.noBraco(site.SISTEMAS[s].u, site.SISTEMAS[s].braco);

  function camera(seg, t) {
    if (seg.tipo !== 'entrar' && seg.tipo !== 'sair') return null;
    const u = Math.min(1, (t - seg.ini) / (seg.fim - seg.ini));
    const e = suave(seg.tipo === 'entrar' ? u : 1 - u);
    const q = GX.solNoPlano(solPos(seg.sis), R.giro(t));
    const fx = CX + (q[0] - CX) * e;
    const fy = CY + (q[1] - CY) * e;
    const Z = 1 + (ZOOM - 1) * e;
    return { e: e, tx: q[0], ty: q[1], fx: fx, fy: fy, Z: Z, sis: seg.sis };
  }
  function posVoo(v, t) {
    const u = Math.min(1, Math.max(0, (t - v.ini) / v.dur));
    const volta = v.volta + R.orb[v.para].vel * (t - v.ini);
    const a = v.a0 + u * volta;
    const m = u * u * (3 - 2 * u);
    const sx = R.orb[v.de].rx + (R.orb[v.para].rx - R.orb[v.de].rx) * m;
    return noPlano(sx, a);
  }
  function posRota(m, tt) {
    const andou = tt * MINHOCA_VEL;
    let i = 0;
    while (i < m.pts.length - 2 && m.dist[i + 1] < andou) i++;
    const tr = m.dist[i + 1] - m.dist[i];
    const fr = tr ? Math.min(1, (andou - m.dist[i]) / tr) : 0;
    const q0 = m.pts[i];
    const q1 = m.pts[i + 1];
    return [q0[0] + (q1[0] - q0[0]) * fr, q0[1] + (q1[1] - q0[1]) * fr];
  }
  function tunel(m, tt) {
    const f = m.f;
    const tau = tt - f.a;
    const idx = Math.max(0, Math.min(m.soma.length - 2, Math.floor(tau / m.passoSoma)));
    const somado = m.soma[idx] + (m.soma[idx + 1] - m.soma[idx]) * (tau / m.passoSoma - idx);
    const a = m.aBoca + m.lento * tau + (m.forte - m.lento) * somado;
    const abriu = suave(faixa(tt, f.a, f.b));
    const pousa = suave(faixa(tt, f.c, f.d));
    const engole = suave(faixa(tt, f.a - 120, f.b));
    const mx = m.boca[0] + (W / 2 - m.boca[0]) * engole;
    const my = m.boca[1] + (H / 2 - m.boca[1]) * engole;
    const tx = RAIO * 0.78 * abriu * Math.cos(a);
    const ty = RAIO * 0.62 * abriu * Math.sin(a);
    const p = noPlano(R.orb[m.para].rx, a);
    return {
      x: mx + (1 - pousa) * (tx * cosT - ty * sinT) + pousa * (p[0] - CX),
      y: my + (1 - pousa) * (tx * sinT + ty * cosT) + pousa * (p[1] - CY),
      tam: LARGURA_TUNEL * (1 + 0.2 * Math.sin(a) * abriu) * (0.81 + 0.19 * abriu) * (1 - 0.55 * faixa(tt, f.d - 300, f.d))
    };
  }
  function esfera(m, tt) {
    const f = m.f;
    const engole = suave(faixa(tt, f.a - 120, f.b));
    const pulso = 1 + 0.05 * Math.sin(tt / 130) * (1 - engole);
    const r = (RAIO_BOCA * suave(faixa(tt, 0, 500)) * pulso + (RAIO - RAIO_BOCA) * engole) * (1 - suave(faixa(tt, f.c, f.d)));
    return { r: r, x: m.boca[0] + (W / 2 - m.boca[0]) * engole, y: m.boca[1] + (H / 2 - m.boca[1]) * engole, fino: Math.max(0.45, Math.min(1, r / U / 150)) };
  }
  // transformação de um sistema: [ax, ay, giro, escala, ox, oy, opacidade, visível]
  function sistema(s, seg, t) {
    if (seg.tipo === 'entrar' || seg.tipo === 'sair') {
      if (seg.sis !== s) return null;
      const c = camera(seg, t);
      const S = c.Z / ZOOM;
      return [CX + (c.tx - c.fx) * c.Z - CX * S, CY + (c.ty - c.fy) * c.Z - CY * S, 0, S, 0, 0, faixa(c.e, 0.38, 0.86), 1];
    }
    if (seg.tipo === 'parado' || seg.tipo === 'voo') return seg.sis === s ? [0, 0, 0, 1, 0, 0, 1, 1] : null;
    if (seg.tipo === 'minhoca') {
      const tt = t - seg.ini;
      const f = seg.f;
      const trocou = tt >= f.b;
      if ((trocou ? seg.sisPara : seg.sis) !== s) return null;
      const engole = suave(faixa(tt, f.a - 120, f.b));
      const sai = suave(faixa(tt, f.c, f.d));
      if (engole <= 0) return [0, 0, 0, 1, 0, 0, 1, 1];
      const ox = trocou ? W / 2 : seg.boca[0] + (W / 2 - seg.boca[0]) * engole;
      const oy = trocou ? H / 2 : seg.boca[1] + (H / 2 - seg.boca[1]) * engole;
      const esc = trocou ? 0.2 + 0.8 * sai : 1 - 0.8 * engole;
      const giro = trocou ? (1 - sai) * -110 : engole * 110;
      return [ox, oy, giro, esc, ox, oy, trocou ? sai : 1 - faixa(tt, f.a, f.b - 60), 1];
    }
    return null;
  }
  // nave das órbitas: [x, y, largura, opacidade] ou null para parada e escondida
  function naveA(seg, t) {
    if (seg.tipo === 'voo') return [...posVoo(seg, t), NAVE, Math.min(1, (t - seg.ini) / 300)];
    if (seg.tipo === 'minhoca') {
      const tt = t - seg.ini;
      if (tt < seg.f.a) return [...posRota(seg, tt), NAVE_MINHOCA, Math.min(1, tt / 300)];
      if (tt < seg.f.a + 300) {
        // na boca: some em 0,3 s, ainda andando um pouco no mesmo rumo
        const q = posRota(seg, seg.f.a - 1);
        const p = posRota(seg, seg.f.a);
        const k = (tt - seg.f.a) * 0.01;
        return [p[0] + (p[0] - q[0]) * k, p[1] + (p[1] - q[1]) * k, NAVE_MINHOCA, 1 - (tt - seg.f.a) / 300];
      }
      return null;
    }
    // depois de pousar, some em 0,3 s junto do planeta
    const i = R.segs.indexOf(seg);
    const ant = R.segs[i - 1];
    if (ant && ant.tipo === 'voo' && t - ant.fim < 300) {
      const p = noPlano(R.orb[ant.para].rx, R.ang(ant.para, t));
      return [p[0], p[1], NAVE, 1 - (t - ant.fim) / 300];
    }
    return null;
  }
  function naveB(seg, t) {
    if (seg.tipo !== 'minhoca') return null;
    const tt = t - seg.ini;
    if (tt < seg.f.a || tt >= seg.f.d) return null;
    const p = tunel(seg, tt);
    return [p.x, p.y, p.tam, 1];
  }
  return { segEm, camera, sistema, naveA, naveB, esfera, tunel, posVoo, posRota };
}

// ------------------------------------------------------------------ monta o palco, o topo e o painel
function montarPasseio(G, site, layout) {
  const R = roteiro(site);
  const E = estados(site, R);
  const L = R.L;
  const durL = num(L / 1000, 3) + 's';
  console.log('passeio: ' + (L / 1000).toFixed(1) + ' s; planetas: ' + R.orb.map((o) => o.voltas).join(', ') + ' voltas; nave de volta à galáxia em ' + (R.fimPasseio / 1000).toFixed(1) + ' s');
  if (process.env.ROTEIRO) R.segs.forEach((s) => console.log('  ' + (s.ini / 1000).toFixed(2).padStart(6) + '–' + (s.fim / 1000).toFixed(2).padStart(6) + ' ' + s.tipo + (s.tipo === 'minhoca' ? ' a=' + ((s.ini + s.f.a) / 1000).toFixed(2) + ' b=' + ((s.ini + s.f.b) / 1000).toFixed(2) + ' c=' + ((s.ini + s.f.c) / 1000).toFixed(2) : '')));

  // instantes: 60 por segundo, mais as viradas de cada fase (e 1 ms antes), para os saltos ficarem no lugar certo
  const marcos = new Set();
  R.segs.forEach(function (s) {
    [s.ini, s.fim].forEach((x) => { marcos.add(x); marcos.add(x - 1); });
    if (s.tipo === 'minhoca') ['a', 'b', 'c', 'd'].forEach((k) => { marcos.add(s.ini + s.f[k]); marcos.add(s.ini + s.f[k] - 1); });
    if (s.tipo === 'voo') { marcos.add(s.fim + 300); marcos.add(s.fim + 299); }
  });
  for (let t = 0; t <= L; t += 1000 / 30) marcos.add(t);
  const T = [...marcos].filter((t) => t >= 0 && t <= L).sort((a, b) => a - b);
  const quadro = T.map((t) => ({ t: t, seg: E.segEm(Math.min(t, L - 0.001)) }));

  // série: aplica f a cada instante; null repete o último valor (coisa escondida, sem gastar quadros),
  // passando por esconder, que zera a opacidade do que sumiu
  function serie(f, padrao, esconder) {
    let ant = padrao;
    return quadro.map(function (q) {
      const v = f(q.seg, q.t);
      if (v) ant = v;
      else if (esconder && ant) ant = esconder(ant);
      return { t: q.t, v: ant };
    });
  }
  const V = (v) => v.map((x) => num(x, 1)).join(' ');
  // liga e desliga com display: o que está desligado não custa nada para desenhar (opacidade zero ainda custa)
  const ligado = (kf, f) => discreto('display', kf.map((q) => ({ t: q.t, v: f(q.v) ? 'inline' : 'none' })), L);

  let defs = '';
  // o sol de cada sistema: disco com as iniciais LF e o ponto, na cor do braço
  function logoSol(id, cor, ponto) {
    const tam = 40;
    const w = medir(FONTE.titulo, 'LF.', tam, -0.01);
    const x = 50 - w / 2;
    const y = 50 + altCaixa(FONTE.titulo, tam) / 2;
    const wLF = medir(FONTE.titulo, 'LF', tam, -0.01) - 0.01 * tam;
    return '<symbol id="' + id + '" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46.5" fill="' + CREME + '" stroke="' + cor + '" stroke-width="5"/>' +
      G.texto(FONTE.titulo, 'LF', x, y, tam, -0.01, 'fill="' + cor + '"') + G.texto(FONTE.titulo, '.', x + wLF, y, tam, 0, 'fill="' + ponto + '"') + '</symbol>';
  }
  defs += logoSol('lf-azul', AZUL, LARANJA) + logoSol('lf-laranja', LARANJA, AZUL);
  const jaTem = new Set();
  defs += site.definicoes('href="#i-burst" url(#pt-checker) url(#pt-checker-warm) url(#pt-stripes) url(#clip-planet) href="#i-globe" href="#i-sparkle"', jaTem);
  site.PROJETOS.forEach((p) => { defs += site.definicoes((site.PLANETAS[p.planeta] || '') + site.previa(p), jaTem); });

  // ---------- galáxia com a câmera do zoom
  const cam = serie(function (seg, t) {
    if (seg.tipo === 'galaxia') return { e: 0, fx: CX, fy: CY, Z: 1 };
    return E.camera(seg, t);
  }, { e: 0, fx: CX, fy: CY, Z: 1 });
  const vis = (seg) => seg.tipo === 'galaxia' || seg.tipo === 'entrar' || seg.tipo === 'sair';
  const camT = transformar('translate', cam.map((q) => ({ t: q.t, v: [CX - q.v.fx * q.v.Z, CY - q.v.fy * q.v.Z] })), L, V, 0.05);
  const camS = transformar('scale', cam.map((q) => ({ t: q.t, v: [q.v.Z] })), L, V, 0.0005);
  const solOpac = [];
  R.sistemas.forEach(function (s) {
    solOpac[s] = animar('opacity', cam.map((q) => ({ t: q.t, v: [q.v.sis === s ? 1 - faixa(q.v.e, 0.72, 0.98) : 1 - faixa(q.v.e, 0, 0.3)] })), L, V, 0.005);
  });
  const tagOpac = animar('opacity', cam.map((q) => ({ t: q.t, v: [1 - faixa(q.v.e, 0, 0.18)] })), L, V, 0.005);
  const gal = GX.galaxia(G, site, { periodo: L / Math.max(1, Math.round((0.00009 * L) / DOIS_PI)), cam: [camT, camS], solOpac: solOpac, tagOpac: tagOpac, logo: (s) => (s.braco ? 'lf-laranja' : 'lf-azul') });
  defs += gal.defs;
  const galOpac = animar('opacity', quadro.map((q, i) => ({ t: q.t, v: [vis(q.seg) ? 1 - faixa(cam[i].v.e, 0.62, 0.96) : 0] })), L, V, 0.005);
  const galVis = discreto('display', quadro.map((q) => ({ t: q.t, v: vis(q.seg) ? 'inline' : 'none' })), L);
  const camadaGal = '<g>' + galVis + galOpac + gal.corpo + '</g>';

  // ---------- nível de seleção de cada projeto (anel e escala sobem e descem em 0,2 s)
  const selEm = (t) => { let k = -1; R.sel.forEach((x) => { if (t >= x.t) k = x.k; }); return k; };
  function nivel(k, dur) {
    return quadro.map(function (q) {
      const t = q.t;
      // procura há quanto tempo o estado atual começou
      let ini = 0;
      let on = false;
      R.sel.forEach((x) => { if (t >= x.t) { const novo = x.k === k; if (novo !== on) { on = novo; ini = x.t; } } });
      const d = Math.min(1, (t - ini) / dur);
      return { t: t, v: [on ? (ini === 0 ? 1 : d) : (ini === 0 ? 0 : 1 - d)] };
    });
  }

  // ---------- sistemas: órbitas, rastros, planetas e o sol
  const trilhas = { porSis: {}, tunel: '' };
  function trilha(pontos, t0, t1, janelas, fade) {
    // pontos: [{t, x, y}] da nave; janelas: [[segundos para trás, largura, opacidade]]
    const comp = [0];
    for (let i = 1; i < pontos.length; i++) comp.push(comp[i - 1] + Math.hypot(pontos[i].x - pontos[i - 1].x, pontos[i].y - pontos[i - 1].y));
    const total = comp[comp.length - 1];
    const sEm = (t) => {
      if (t <= pontos[0].t) return 0;
      if (t >= pontos[pontos.length - 1].t) return total;
      let i = 1;
      while (pontos[i].t < t) i++;
      const f = (t - pontos[i - 1].t) / (pontos[i].t - pontos[i - 1].t);
      return comp[i - 1] + (comp[i] - comp[i - 1]) * f;
    };
    // o caminho fica uma vez só no <defs>; cada faixa do rastro é um <use> dele com a sua janela de traço
    const enxuto = enxugar(pontos.map((p) => ({ t: p.t, v: [p.x, p.y] })), 0.12);
    const id = 'rastro' + (contaRastro++);
    defsRastro += '<path id="' + id + '" d="M' + enxuto.map((p) => num(p.v[0]) + ' ' + num(p.v[1])).join('L') + '"/>';
    const grande = num(total + 300);
    // cada animação custa a cada quadro, mesmo escondida: o rastro inteiro acende e apaga num grupo só, e nos voos
    // de velocidade quase constante o comprimento da faixa é fixo (só o deslocamento do traço anda)
    const op = quadro.map((q) => ({ t: q.t, v: [q.t < t0 ? 0 : q.t <= t1 ? 1 : fade ? Math.max(0, 1 - (q.t - t1) / fade) : 0] }));
    const vel = total / Math.max(1, t1 - t0);
    let out = '<g opacity="0" display="none" fill="none" stroke="' + LARANJA + '" stroke-linecap="round" stroke-linejoin="round">' + ligado(op, (v) => v[0] > 0) + animar('opacity', op, L, (v) => num(v[0], 2), 0.01);
    janelas.forEach(function (j) {
      const kf = quadro.map(function (q) {
        const t = Math.min(Math.max(q.t, t0), t1);
        const s = sEm(t);
        const w = j[3] ? Math.max(0.01, s - sEm(t - j[0] * 1000)) : vel * j[0] * 1000;
        return { t: q.t, v: [w, w - s] };
      });
      out += '<use href="#' + id + '" stroke-width="' + j[1] + '" stroke-opacity="' + j[2] + '" stroke-dasharray="' + (j[3] ? '0.01' : num(vel * j[0] * 1000)) + ' ' + grande + '">' +
        (j[3] ? animar('stroke-dasharray', kf, L, (v) => num(v[0]) + ' ' + grande, 0.4) : '') +
        animar('stroke-dashoffset', kf.map((q) => ({ t: q.t, v: [q.v[1]] })), L, (v) => num(v[0]), 0.4) + '</use>';
    });
    return out + '</g>';
  }
  let defsRastro = '';
  let contaRastro = 0;
  // [segundos para trás, largura, opacidade, comprimento muda com a velocidade]
  const JANELA_VOO = [[0.9, 1.6, 0.45], [0.3, 3.8, 0.95]];
  const JANELA_TUNEL = [[0.5, 2, 0.5, true], [0.18, 5.5, 1, true]];
  R.segs.forEach(function (s) {
    if (s.tipo === 'voo') {
      const pts = [];
      for (let t = s.ini; t <= s.fim; t += 1000 / 30) { const p = E.posVoo(s, t); pts.push({ t: t, x: p[0], y: p[1] }); }
      trilhas.porSis[s.sis] = (trilhas.porSis[s.sis] || '') + trilha(pts, s.ini, s.fim, JANELA_VOO, 800);
    }
    if (s.tipo === 'minhoca') {
      const pts = [];
      for (let tt = 0; tt <= s.f.a; tt += 1000 / 30) { const p = E.posRota(s, tt); pts.push({ t: s.ini + tt, x: p[0], y: p[1] }); }
      trilhas.porSis[s.sis] = (trilhas.porSis[s.sis] || '') + trilha(pts, s.ini, s.ini + s.f.a, JANELA_VOO, 800);
      const pt = [];
      for (let tt = s.f.a; tt < s.f.d; tt += 1000 / 30) { const p = E.tunel(s, tt); pt.push({ t: s.ini + tt, x: p.x, y: p.y }); }
      trilhas.tunel += trilha(pt, s.ini + s.f.a, s.ini + s.f.d - 1, JANELA_TUNEL, 0);
    }
  });

  let camadaSis = '';
  let defsPlanetas = '';
  R.sistemas.forEach(function (s) {
    const tr = serie((seg, t) => E.sistema(s, seg, t), [0, 0, 0, 1, 0, 0, 0, 0], (a) => a.slice(0, 6).concat([0, 0]));
    const ks = site.projetosDe(s);
    const quenteSis = !!site.SISTEMAS[s].braco;
    let orbitas = '';
    let atras = '';
    let frente = '';
    ks.forEach(function (k) {
      const p = site.PROJETOS[k];
      const o = R.orb[k];
      const cor = site.quente(p) ? LARANJA : AZUL;
      const nv = nivel(k, 250);
      // órbita tracejada e, por cima, a linha cheia do projeto aberto, que acende quando ele é escolhido
      const elipse = '<ellipse cx="' + CX + '" cy="' + CY + '" rx="' + num(o.rx) + '" ry="' + num(o.rx * 0.5) + '" transform="rotate(' + graus + ' ' + CX + ' ' + CY + ')" fill="none" stroke="' + cor + '"';
      orbitas += elipse + ' stroke-width="1.4" stroke-dasharray="3 6" opacity=".7"/>' +
        elipse + ' stroke-width="2.4" opacity="0">' + animar('opacity', nv, L, (v) => num(v[0], 2), 0.01) + '</ellipse>';
      // o planeta anda na órbita; uma cópia passa atrás do sol (metade de cima) e outra na frente
      const per = L / o.voltas;
      const vals = [];
      const N = 120;
      for (let i = 0; i <= N; i++) { const q = noPlano(o.rx, o.a0 + (DOIS_PI * i) / N); vals.push(num(q[0]) + ' ' + num(q[1])); }
      const mover = '<animateTransform attributeName="transform" type="translate" dur="' + num(per / 1000, 3) + 's" repeatCount="indefinite" values="' + vals.join(';') + '"/>';
      const trocas = [];
      for (let j = Math.ceil(o.a0 / Math.PI) - 1; j < Math.ceil(o.a0 / Math.PI) + 3; j++) {
        const t = ((j * Math.PI - o.a0) / DOIS_PI) * per;
        if (t > 0 && t < per) trocas.push(t);
      }
      trocas.sort((a, b) => a - b);
      const naFrente = (t) => Math.sin(o.a0 + (DOIS_PI * t) / per) >= 0;
      const visCopia = (frenteCopia) => {
        const m = [{ t: 0, v: naFrente(0) === frenteCopia ? 'inline' : 'none' }];
        trocas.forEach((t) => m.push({ t: t, v: naFrente(t + 1) === frenteCopia ? 'inline' : 'none' }));
        return discreto('display', m, per);
      };
      const d = [41, 48, 54][k % 3] * U;
      const desenho = (site.PLANETAS[p.planeta] || site.PLANETAS.globe).replace('<svg viewBox="0 0 100 100">', '<svg x="' + num(-d / 2) + '" y="' + num(-d / 2) + '" width="' + num(d) + '" height="' + num(d) + '" viewBox="0 0 100 100" overflow="visible">');
      const escala = transformar('scale', nv.map((q) => ({ t: q.t, v: [1 + 0.18 * q.v[0]] })), L, V, 0.002);
      const anel = '<circle r="' + num(d / 2 + 7 * U) + '" fill="none" stroke="' + cor + '" stroke-width="' + num(2 * U) + '" opacity="0">' +
        animar('opacity', nv, L, (v) => num(v[0], 2), 0.01) + '</circle>';
      // o planeta (com o caminho e o destaque) fica uma vez só no <defs>; as duas cópias são <use> dele
      defsPlanetas += '<g id="planeta' + k + '">' + mover + '<g color="' + cor + '"><g>' + escala + desenho + anel + '</g></g></g>';
      atras += '<g display="none">' + visCopia(false) + '<use href="#planeta' + k + '"/></g>';
      frente += '<g display="none">' + visCopia(true) + '<use href="#planeta' + k + '"/></g>';
    });
    const sol = '<g transform="translate(' + CX + ' ' + CY + ')"><g><animateTransform attributeName="transform" type="rotate" values="-5;5;-5" dur="6s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1;.42 0 .58 1"/>' +
      '<use href="#' + (quenteSis ? 'lf-laranja' : 'lf-azul') + '" x="' + num(-SOL_SIS / 2) + '" y="' + num(-SOL_SIS / 2) + '" width="' + num(SOL_SIS) + '" height="' + num(SOL_SIS) + '"/></g></g>';
    camadaSis += '<g display="none">' + discreto('display', tr.map((q) => ({ t: q.t, v: q.v[7] ? 'inline' : 'none' })), L) +
      animar('opacity', tr.map((q) => ({ t: q.t, v: [q.v[6]] })), L, V, 0.005) +
      '<g>' + transformar('translate', tr.map((q) => ({ t: q.t, v: [q.v[0], q.v[1]] })), L, V, 0.05) +
      '<g>' + transformar('rotate', tr.map((q) => ({ t: q.t, v: [q.v[2]] })), L, V, 0.05) +
      '<g>' + transformar('scale', tr.map((q) => ({ t: q.t, v: [q.v[3]] })), L, V, 0.0005) +
      '<g>' + transformar('translate', tr.map((q) => ({ t: q.t, v: [-q.v[4], -q.v[5]] })), L, V, 0.05) +
      orbitas + (trilhas.porSis[s] || '') + atras + sol + frente + '</g></g></g></g></g>';
  });

  // ---------- as naves
  const CORPO = 'M9 5h4l4-5h4l-2 6h9c6 0 11 3 14 6-3 3-8 6-14 6h-9l2 6h-4l-4-5H9z';
  function nave(f, contornoClaro) {
    const s = serie(f, null, (a) => [a[0], a[1], a[2], 0]);
    const primeiro = s.find((q) => q.v);
    const base = primeiro ? [primeiro.v[0], primeiro.v[1], primeiro.v[2], 0] : [0, 0, NAVE, 0];
    const kf = s.map((q) => ({ t: q.t, v: q.v || base }));
    const mov = enxugar(kf.map((q) => ({ t: q.t, v: [q.v[0], q.v[1]] })), 0.25);
    return '<g opacity="0" display="none">' + ligado(kf, (v) => v[3] > 0) + '<animateMotion calcMode="linear" dur="' + durL + '" repeatCount="indefinite" rotate="auto" keyTimes="' + mov.map((q) => num(q.t / L, 5)).join(';') + '" values="' + mov.map((q) => num(q.v[0], 1) + "," + num(q.v[1], 1)).join(';') + '"/>' +
      animar('opacity', kf.map((q) => ({ t: q.t, v: [q.v[3]] })), L, (v) => num(v[0], 2), 0.01) +
      '<g>' + transformar('scale', kf.map((q) => ({ t: q.t, v: [q.v[2] / 44] })), L, (v) => num(v[0], 4), 0.002) +
      '<g transform="translate(-22 -12)">' +
      (contornoClaro ? '<path d="' + CORPO + '" fill="none" stroke="' + CREME + '" stroke-width="3" stroke-linejoin="round"/>' : '') +
      '<g transform="translate(9 0)"><g><animateTransform attributeName="transform" type="scale" values="1 1;.55 1" dur=".14s" calcMode="discrete" repeatCount="indefinite"/><path d="M0 8-9 12l9 4z" fill="' + LARANJA + '"/></g></g>' +
      '<path d="' + CORPO + '" fill="' + AZUL + '"/><circle cx="31" cy="12" r="3.2" fill="' + CREME + '"/><path d="M15 9h8v6h-8z" fill="' + LARANJA + '"/></g></g></g>';
  }
  const naveA = nave(E.naveA, false);
  const naveB = nave(E.naveB, true);

  // ---------- buraco de minhoca: esfera azul com anéis vindo na direção de quem olha e estrelas esticadas
  const esf = serie(function (seg, t) {
    if (seg.tipo !== 'minhoca') return [0, 0, 0, 1];
    const e = E.esfera(seg, t - seg.ini);
    return [e.x, e.y, Math.max(0, e.r), e.fino];
  }, [W / 2, H / 2, 0, 1]);
  const esfT = transformar('translate', esf.map((q) => ({ t: q.t, v: [q.v[0], q.v[1]] })), L, V, 0.05);
  const rR = animar('r', esf.map((q) => ({ t: q.t, v: [q.v[2]] })), L, V, 0.1);
  // por dentro: desenho para um raio de 100, que acompanha o raio da esfera
  const escTunel = transformar('scale', esf.map((q) => ({ t: q.t, v: [Math.max(0.0001, q.v[2] / 100)] })), L, (v) => num(v[0], 4), 0.001);
  // Anéis correndo na direção de quem olha (o raio cresce com z², como no site) e estrelas esticadas pelo salto.
  // Cada animação custa a cada quadro, então cada anel é um grupo que cresce e acende, e as estrelas andam em
  // três grupos defasados, em vez de uma animação por atributo de cada traço.
  const CICLO_ANEL = 1000 / 0.62;
  const N_ANEIS = 8;
  const zs = Array.from({ length: 11 }, (_, j) => j / 10);
  const cresce = (fim) => zs.map((z) => num(Math.max(0.001, fim * z * z), 3)).join(';');
  let aneis = '';
  for (let i = 0; i < N_ANEIS; i++) {
    const comeco = num((-i / N_ANEIS) * (CICLO_ANEL / 1000), 3) + 's';
    const a = (o) => o.replace('/>', ' dur="' + num(CICLO_ANEL / 1000, 3) + 's" begin="' + comeco + '" repeatCount="indefinite"/>');
    aneis += '<g>' + a('<animateTransform attributeName="transform" type="scale" values="' + cresce(1.25) + '"/>') +
      '<circle r="100" fill="none" stroke="' + (i % 4 ? CREME : LARANJA) + '" stroke-width="2.6" vector-effect="non-scaling-stroke" opacity=".25">' +
      a('<animate attributeName="opacity" values="' + zs.map((z) => num(0.25 + 0.75 * z, 2)).join(';') + '"/>') + '</circle></g>';
  }
  let fios = '';
  const CICLO_FIO = 1000 / 0.48;
  for (let g = 0; g < 3; g++) {
    const comeco = num((-g / 3) * (CICLO_FIO / 1000), 3) + 's';
    const a = (o) => o.replace('/>', ' dur="' + num(CICLO_FIO / 1000, 3) + 's" begin="' + comeco + '" repeatCount="indefinite"/>');
    let d = '';
    for (let i = 0; i < 12; i++) {
      const ang = ((g * 12 + i) * 2.399) % DOIS_PI;
      const r0 = 86 + ((g * 12 + i) * 37) % 14;
      d += 'M' + num(r0 * Math.cos(ang)) + ' ' + num(r0 * Math.sin(ang)) + 'L' + num((r0 + 13) * Math.cos(ang)) + ' ' + num((r0 + 13) * Math.sin(ang));
    }
    fios += '<g>' + a('<animateTransform attributeName="transform" type="scale" values="' + cresce(1.3) + '"/>') +
      '<path d="' + d + '" stroke="' + CREME + '" stroke-width="1.6" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity="0">' +
      a('<animate attributeName="opacity" values="' + zs.map((z) => num(z, 2)).join(';') + '"/>') + '</path></g>';
  }
  // o túnel faz curva: o miolo passeia devagar em volta do centro
  const curva = '<animateMotion dur="3.3s" repeatCount="indefinite" path="M12 0A12 9 0 1 1 -12 0A12 9 0 1 1 12 0"/>';
  aneis = '<g>' + curva + aneis + '</g>';
  // o círculo da esfera fica uma vez só: é o fundo, o corte do túnel e o contorno claro
  defs += '<circle id="esfera" r="0">' + rR + '</circle><clipPath id="esfera-corte"><use href="#esfera"/></clipPath>';
  const camadaMinhoca = '<g display="none">' + ligado(esf, (v) => v[2] > 0) + esfT +
    '<use href="#esfera" fill="' + FUNDO + '"/>' +
    '<g clip-path="url(#esfera-corte)"><g>' + escTunel + aneis + fios + '</g></g>' +
    '<use href="#esfera" fill="none" stroke="' + CREME + '" stroke-width="3">' + animar('stroke-width', esf.map((q) => ({ t: q.t, v: [3 * q.v[3] * U] })), L, V, 0.05) + '</use>' +
    '<circle r="0" fill="none" stroke="' + LARANJA + '" stroke-width="1.6">' + animar('r', esf.map((q) => ({ t: q.t, v: [q.v[2] > 0.5 ? q.v[2] + 5 * q.v[3] * U : 0] })), L, V, 0.1) + animar('stroke-width', esf.map((q) => ({ t: q.t, v: [1.6 * q.v[3] * U] })), L, V, 0.05) + '</circle></g>';

  // etiqueta "Indo para" no meio da esfera
  let destinos = '';
  R.segs.filter((s) => s.tipo === 'minhoca').forEach(function (m) {
    const s = site.SISTEMAS[m.sisPara];
    const cor = s.braco ? LARANJA : AZUL;
    const on0 = m.ini + m.f.a + 340;
    const on1 = m.ini + m.f.c + 450;
    const nv = quadro.map((q) => ({ t: q.t, v: [q.t < on0 ? 0 : q.t < on1 ? Math.min(1, (q.t - on0) / 180) : Math.max(0, 1 - (q.t - on1) / 180)] }));
    const nome = s.nome.toUpperCase();
    const tb = 13 * U;
    const ts = 10 * U;
    const wN = medir(FONTE.monoN, nome, tb, 0.06);
    const wS = medir(FONTE.mono, 'INDO PARA', ts, 0.1);
    const bw = Math.max(wN, wS) + 28 * U;
    const bh = (7 * 2 + 13 * 1.5 + 10 * 1.5 + 1) * U;
    destinos += '<g transform="translate(' + W / 2 + ' ' + H / 2 + ')"><g opacity="0" display="none">' + ligado(nv, (v) => v[0] > 0) + animar('opacity', nv, L, (v) => num(v[0], 2), 0.01) +
      transformar('scale', nv.map((q) => ({ t: q.t, v: [0.9 + 0.1 * q.v[0]] })), L, (v) => num(v[0], 3), 0.002) +
      '<rect x="' + num(-bw / 2 + 4 * U) + '" y="' + num(-bh / 2 + 4 * U) + '" width="' + num(bw) + '" height="' + num(bh) + '" fill="' + cor + '"/>' +
      '<rect x="' + num(-bw / 2) + '" y="' + num(-bh / 2) + '" width="' + num(bw) + '" height="' + num(bh) + '" fill="' + CREME + '" stroke="' + cor + '" stroke-width="' + num(2 * U) + '"/>' +
      G.centro(FONTE.mono, 'INDO PARA', 0, -bh / 2 + 7 * U + ts * 1.15, ts, 0.1, 'fill="' + cor + '"') +
      G.centro(FONTE.monoN, nome, 0, bh / 2 - 7 * U - tb * 0.35, tb, 0.06, 'fill="' + cor + '"') + '</g></g>';
  });


  const palco = camadaGal + camadaSis + naveA + camadaMinhoca + trilhas.tunel + naveB + destinos;

  // ---------- topo do sistema (← Galáxia | nome), visível só com o sistema na tela
  const modoSis = (seg) => seg.tipo === 'parado' || seg.tipo === 'voo';
  const topoOp = quadro.map(function (q) {
    const seg = q.seg;
    if (modoSis(seg)) return { t: q.t, v: [Math.min(1, (q.t - ultimoInicioSistema(seg)) / 200)] };
    if (seg.tipo === 'minhoca') return { t: q.t, v: [Math.max(0, 1 - (q.t - seg.ini) / 200)] };
    return { t: q.t, v: [0] };
  });
  function ultimoInicioSistema(seg) {
    // o topo só some no zoom e no buraco de minhoca; entre parado e voo ele continua aceso
    let i = R.segs.indexOf(seg);
    while (i > 0 && modoSis(R.segs[i - 1])) i--;
    return R.segs[i].ini;
  }
  const sisEm = (t) => { let s = -1; R.sisVis.forEach((x) => { if (t >= x.t) s = x.s; }); return s; };
  let topo = '<g opacity="0" display="none">' + ligado(topoOp, (v) => v[0] > 0) + animar('opacity', topoOp, L, (v) => num(v[0], 2), 0.01);
  const tv = layout.topoTam;
  const back = '← GALÁXIA';
  R.sistemas.forEach(function (s) {
    const cor = site.SISTEMAS[s].braco ? LARANJA : AZUL;
    const wb = medir(FONTE.monoN, back, tv, 0.06) + 2 * 10;
    const nome = site.SISTEMAS[s].nome.toUpperCase();
    const wn = medir(FONTE.monoN, nome, tv, 0.06) + 2 * 10;
    const h = tv * 1.5 + 10 + 3;
    const yb = h / 2 + altCaixa(FONTE.monoN, tv) / 2;
    topo += '<g display="none">' + discreto('display', quadro.map((q) => ({ t: q.t, v: sisEm(q.t) === s ? 'inline' : 'none' })), L) +
      '<rect x=".75" y=".75" width="' + num(wb - 1.5) + '" height="' + num(h - 1.5) + '" fill="' + CREME + '" stroke="' + cor + '" stroke-width="1.5"/>' +
      G.texto(FONTE.monoN, back, 10, yb, tv, 0.06, 'fill="' + cor + '"') +
      '<path d="M' + num(wb) + ' .75H' + num(wb + wn - 0.75) + 'V' + num(h - 0.75) + 'H' + num(wb) + '" fill="' + CREME + '" stroke="' + cor + '" stroke-width="1.5"/>' +
      G.texto(FONTE.monoN, nome, wb + 10, yb, tv, 0.06, 'fill="' + cor + '"') + '</g>';
  });
  topo += '</g>';

  // ---------- painel: o mapa na galáxia e cada projeto quando a nave pousa nele
  const estadosPainel = [{ id: -1, p: painelMapa(G, site, layout.painelAlt) }];
  site.PROJETOS.forEach((p, k) => estadosPainel.push({ id: k, p: painelProjeto(G, site, k, site.PROJETOS.length, layout.painelAlt) }));
  const alt = Math.max.apply(null, estadosPainel.map((e) => e.p.h));
  let painel = '';
  estadosPainel.forEach(function (e) {
    // aparece em 0,45 s subindo 10 px, como o .swap do site, e some de uma vez quando o painel troca
    const nv = quadro.map(function (q) {
      const t = q.t;
      let ini = -1;
      let on = false;
      R.sel.forEach((x) => { if (t >= x.t) { on = x.k === e.id; if (on && ini < 0) ini = x.t; if (!on) ini = -1; } });
      if (!on) return { t: t, v: [0, 10] };
      const u = ini === 0 ? 1 : Math.min(1, (t - ini) / 450);
      const k = 1 - Math.pow(1 - u, 3);
      return { t: t, v: [k, 10 * (1 - k)] };
    });
    // na volta do laço, o mapa já está aberto
    painel += '<g opacity="0" display="none">' + ligado(nv, (v) => v[0] > 0) + animar('opacity', nv.map((q) => ({ t: q.t, v: [q.v[0]] })), L, (v) => num(v[0], 2), 0.01) +
      '<g>' + transformar('translate', nv.map((q) => ({ t: q.t, v: [0, q.v[1]] })), L, V, 0.05) + moldura(alt, e.p.cor) + e.p.s + '</g></g>';
  });

  return { L: L, defs: defs + defsRastro + defsPlanetas, palco: palco, topo: topo, painel: painel, painelAlt: alt + 8, roteiro: R };
}

module.exports = { montarPasseio, RAIO };
