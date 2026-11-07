/* A galáxia do site (orbit.js): buraco negro que troca de azul para laranja, dois braços em espiral e um sol para
   cada sistema. O desenho usa a mesma semente e as mesmas pinceladas do site; o que lá é feito quadro a quadro
   aqui vira animação SVG. Coordenadas do palco: 600 x 400, como no site. */
'use strict';
const { FONTE, num, medir, altCaixa } = require('./texto');
const { enxugar } = require('./smil');

const W = 600;
const H = 400;
const CX = 300;
const CY = 200;
const TILT = (-14 * Math.PI) / 180;
const AZUL = '#1E3BD8';
const FUNDO = '#142A9E';
const LARANJA = '#FF5A36';
const CREME = '#F4ECD6';

const ARMA_R0 = 78;
const ARMA_R1 = 278;
const ARMA_VOLTA = Math.PI * 2.2;
const GAL_ACHATE = 0.58;
const GIRO_INI = 0.6; // ângulo da galáxia no começo, como no site
function noBraco(u, lado) { return { r: ARMA_R0 + (ARMA_R1 - ARMA_R0) * u, a: lado * Math.PI - ARMA_VOLTA * u }; }
function solNoPlano(pos, giro) {
  const x = pos.r * Math.cos(pos.a + giro);
  const y = pos.r * GAL_ACHATE * Math.sin(pos.a + giro);
  return [CX + x * Math.cos(TILT) - y * Math.sin(TILT), CY + x * Math.sin(TILT) + y * Math.cos(TILT)];
}

// ciclo de cor do buraco negro (mesmos tempos do site)
const COR_INICIO = 150;
const COR_A = 3000;
const COR_B = 5400;
const COR_D = 9750;
const COR_CENTRO = 700;
const COR_CICLO = 2 * (COR_D + COR_CENTRO);
const COR_FRENTE = 0.72;
const COR_PINCEIS = [
  { grupos: 3, ondas: [[4200, COR_D, AZUL, LARANJA]] },
  { grupos: 3, ondas: [[COR_INICIO, 6000, AZUL, LARANJA]] },
  { grupos: 2, ondas: [[COR_INICIO, COR_A, AZUL, LARANJA], [COR_A, COR_B, LARANJA, CREME], [COR_B, 9000, CREME, LARANJA]] }
];
const COR_VOLTAS = [44000, 28000, 16000];

const faixa = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));
const suave = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const frenteDaOnda = (p) => (p < 0.5 ? 0.5 * Math.pow(2 * p, 0.6) : 1 - 0.5 * Math.pow(2 - 2 * p, 0.6));
const canais = (h) => [0, 1, 2].map((i) => parseInt(h.substr(1 + i * 2, 2), 16));
const misturar = (a, b, k) => { const A = canais(a); const B = canais(b); return A.map((v, i) => v + (B[i] - v) * k); };
const hex = (v) => '#' + v.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase();

function estadoCentro(t) {
  const volta = COR_D + COR_CENTRO;
  if (t < COR_D) {
    const chega = suave(faixa(t, COR_INICIO, COR_A));
    return { m: t, anel: misturar(CREME, LARANJA, chega), buraco: misturar(AZUL, FUNDO, chega), escala: 0 };
  }
  if (t < volta) {
    const l = suave((t - COR_D) / COR_CENTRO);
    return { m: COR_D, anel: misturar(LARANJA, CREME, l), buraco: canais(FUNDO), escala: l };
  }
  if (t < volta + COR_D) return { m: volta + COR_D - t, anel: canais(CREME), buraco: canais(LARANJA), escala: 0 };
  return { m: 0, anel: canais(CREME), buraco: canais(LARANJA), escala: suave((t - volta - COR_D) / COR_CENTRO) };
}
const forca = (m) => 1 + 1.4 * Math.sin(Math.PI * faixa(m, COR_INICIO, COR_D));

const PASSO = 20;
const EPS = 6;
const tempos = (kf, dur) => kf.map((k) => num(k.t / dur, 5)).join(';');

// desenha a galáxia. op: { periodo (ms de uma volta dos braços e dos sóis), cam: [animação do translate, do scale],
// solOpac: [animação por sol], tagOpac: animação dos rótulos }. Devolve defs e as duas camadas (céu e sóis).
function galaxia(G, site, op) {
  const gradientes = [];
  COR_PINCEIS.forEach(function (p, tipo) {
    for (let k = 0; k < p.grupos; k++) {
      gradientes.push({
        id: 'gal-cor-' + tipo + '-' + k,
        min: Infinity,
        max: 0,
        ondas: p.ondas.map(function (o) {
          const defasa = (o[1] - o[0]) * 0.12;
          return { ini: o[0] + defasa * k, fim: o[1] - defasa * (p.grupos - 1 - k), de: o[2], para: o[3] };
        })
      });
    }
  });
  const acaso = (function (s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(4127);

  // braços
  let bracos = '';
  [0, 1].forEach(function (lado) {
    const cor = lado ? LARANJA : AZUL;
    let d = '';
    for (let i = 0; i <= 70; i++) {
      const b = noBraco(i / 70, lado);
      d += (i ? 'L' : 'M') + num(b.r * Math.cos(b.a)) + ' ' + num(b.r * Math.sin(b.a));
    }
    bracos += '<path d="' + d + '" fill="none" stroke="' + cor + '" stroke-width="1.6" stroke-dasharray="2 5" vector-effect="non-scaling-stroke"/><g fill="' + cor + '" opacity=".55">';
    for (let k = 0; k < 80; k++) {
      const w = noBraco(acaso(), lado);
      const dr = (acaso() - 0.5) * 36;
      const da = (acaso() - 0.5) * 0.24;
      bracos += '<circle cx="' + num((w.r + dr) * Math.cos(w.a + da)) + '" cy="' + num((w.r + dr) * Math.sin(w.a + da)) + '" r="' + num(1 + acaso() * 1.6) + '"/>';
    }
    bracos += '</g>';
  });

  // redemoinho do buraco negro
  const R = 108;
  const entre = (a, b) => a + (b - a) * acaso();
  function fechado(pts) {
    const meio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const ini = meio(pts[pts.length - 1], pts[0]);
    let d = 'M' + num(ini[0]) + ' ' + num(ini[1]);
    for (let i = 0; i < pts.length; i++) {
      const q = meio(pts[i], pts[(i + 1) % pts.length]);
      d += 'Q' + num(pts[i][0]) + ' ' + num(pts[i][1]) + ' ' + num(q[0]) + ' ' + num(q[1]);
    }
    return d + 'Z';
  }
  const contagem = [0, 0, 0];
  function tintaDe(tipo, de, ate) {
    const id = 'gal-cor-' + tipo + '-' + (contagem[tipo]++ % COR_PINCEIS[tipo].grupos);
    const g = gradientes.filter((x) => x.id === id)[0];
    g.min = Math.min(g.min, de);
    g.max = Math.max(g.max, ate);
    return 'url(#' + id + ')';
  }
  function pincel(a0, giro, r0, r1, larg, tipo) {
    const N = 18;
    const fora = [];
    const dentro = [];
    const f1 = acaso() * 6.28;
    const f2 = acaso() * 6.28;
    const ex = entre(0.6, 1.1);
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = a0 + giro * t;
      const r = r0 + (r1 - r0) * t + Math.sin(t * 6 + f1) * larg * 0.5;
      const w = larg * Math.pow(Math.sin(Math.PI * Math.pow(t, ex)), 0.8) * (0.7 + 0.3 * Math.sin(t * 11 + f2));
      fora.push([(r + w) * Math.cos(a), (r + w) * Math.sin(a)]);
      dentro.push([(r - w) * Math.cos(a), (r - w) * Math.sin(a)]);
    }
    const c = fora.concat(dentro.reverse());
    const raios = c.map((q) => Math.hypot(q[0], q[1]));
    return '<path fill="' + tintaDe(tipo, Math.min.apply(null, raios), Math.max.apply(null, raios)) + '" d="' + fechado(c) + '"/>';
  }
  function varias(quantas, r0, r1, giro, larg, tipos) {
    let o = '';
    for (let i = 0; i < quantas; i++) {
      o += pincel(((i + acaso() * 0.6) / quantas) * Math.PI * 2, entre(giro[0], giro[1]), R * entre(r0[0], r0[1]), R * entre(r1[0], r1[1]), entre(larg[0], larg[1]), tipos[i % tipos.length]);
    }
    return o;
  }
  function pontos(quantos, ra, rb, tipos) {
    let o = '';
    for (let i = 0; i < quantos; i++) {
      const a = acaso() * 6.28;
      const r = R * entre(ra, rb);
      const raio = entre(0.7, 2);
      const tipo = tipos[i % tipos.length];
      o += '<circle cx="' + num(r * Math.cos(a)) + '" cy="' + num(r * Math.sin(a)) + '" r="' + num(raio) + '" fill="' + tintaDe(tipo, r - raio, r + raio) + '"/>';
    }
    return o;
  }
  const camadas = [
    varias(16, [1.1, 1.32], [0.78, 0.95], [1.3, 2.2], [2.2, 4.2], [0]) + varias(26, [0.8, 1], [0.42, 0.68], [1.5, 2.6], [2, 4.4], [0]) + pontos(24, 0.95, 1.5, [0]),
    varias(22, [0.62, 0.9], [0.3, 0.52], [1.5, 2.8], [1.8, 3.6], [1, 0]) + pontos(22, 0.3, 0.95, [1, 0]),
    varias(18, [0.46, 0.64], [0.22, 0.3], [1.6, 3], [1.4, 3], [1, 1, 2])
  ];

  // cor de cada gradiente ao longo do ciclo: o raio cresce e a tinta nova escorre de dentro para fora
  const ondaDe = (g, m) => { let i = 0; for (let k = 1; k < g.ondas.length; k++) if (m >= g.ondas[k].ini) i = k; return i; };
  const raioDe = (g, m) => { const o = g.ondas[ondaDe(g, m)]; return g.min + (g.max / COR_FRENTE - g.min) * frenteDaOnda(faixa(m, o.ini, o.fim)); };
  const dur = num(COR_CICLO / 1000, 3) + 's';
  let defs = '';
  gradientes.forEach(function (g) {
    const kf = [];
    const trocas = [];
    let ant = -1;
    for (let t = 0; t <= COR_CICLO; t += PASSO) {
      const m = estadoCentro(t).m;
      const i = ondaDe(g, m);
      if (i !== ant) {
        if (ant >= 0) kf.push({ t: t - EPS, v: [raioDe(g, estadoCentro(t - PASSO).m)] });
        trocas.push({ t: ant >= 0 ? t - EPS / 2 : 0, i: i });
        ant = i;
      }
      kf.push({ t: t, v: [raioDe(g, m)] });
    }
    const r = enxugar(kf, 0.15);
    const stop = (offset, cor, chave) => {
      if (trocas.length < 2 || !chave) return '<stop offset="' + offset + '" stop-color="' + cor + '"/>';
      return '<stop offset="' + offset + '" stop-color="' + cor + '"><animate attributeName="stop-color" dur="' + dur + '" repeatCount="indefinite" calcMode="discrete" keyTimes="' +
        trocas.map((x) => num(x.t / COR_CICLO, 5)).join(';') + '" values="' + trocas.map((x) => g.ondas[x.i][chave]).join(';') + '"/></stop>';
    };
    defs += '<radialGradient id="' + g.id + '" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="' + num(g.min) + '">' +
      stop(COR_FRENTE, g.ondas[0].para, 'para') + stop((1 + COR_FRENTE) / 2, CREME) + stop(1, g.ondas[0].de, 'de') +
      '<animate attributeName="r" dur="' + dur + '" repeatCount="indefinite" keyTimes="' + tempos(r, COR_CICLO) + '" values="' + r.map((k) => num(k.v[0])).join(';') + '"/></radialGradient>';
  });

  // o redemoinho gira mais rápido no meio da troca de cor; em dois ciclos cada camada fecha voltas inteiras
  const DUAS = 2 * COR_CICLO;
  function giroDaCamada(i) {
    const bruto = [];
    let ang = 0;
    for (let t = 0; t <= DUAS; t += PASSO) {
      bruto.push({ t: t, v: [ang] });
      ang += (360 * PASSO * forca(estadoCentro(t % COR_CICLO).m)) / COR_VOLTAS[i];
    }
    const total = bruto[bruto.length - 1].v[0];
    const k = (Math.max(1, Math.round(total / 360)) * 360) / total;
    const kf = enxugar(bruto.map((q) => ({ t: q.t, v: [q.v[0] * k] })), 0.08);
    return '<animateTransform attributeName="transform" type="rotate" dur="' + num(DUAS / 1000, 3) + 's" repeatCount="indefinite" keyTimes="' + tempos(kf, DUAS) + '" values="' + kf.map((q) => num(q.v[0], 2)).join(';') + '"/>';
  }

  // o centro: anel, fundo do buraco e o miolo que cresce quando a cor assenta
  const volta = COR_D + COR_CENTRO;
  const ts = [];
  for (let t = 0; t < COR_CICLO; t += PASSO) ts.push(t);
  ts.push(volta - EPS, volta, COR_CICLO);
  ts.sort((a, b) => a - b);
  const kfc = [];
  ts.forEach(function (t, i) {
    if (i && t === ts[i - 1]) return;
    const e = estadoCentro(t >= COR_CICLO ? COR_CICLO - 0.001 : t === volta - EPS ? volta - 0.001 : t);
    kfc.push({ t: t, v: [].concat(e.anel, e.buraco, [e.escala * 100]) });
  });
  const ex = enxugar(kfc, 1);
  const ktc = tempos(ex, COR_CICLO);
  const cores = (ini) => ex.map((q) => hex(q.v.slice(ini, ini + 3))).join(';');
  const graus = num((TILT * 180) / Math.PI, 2);
  const buraco = '<g transform="translate(' + CX + ' ' + CY + ') rotate(' + graus + ') scale(1 ' + GAL_ACHATE + ')">' +
    camadas.map((c, i) => '<g>' + giroDaCamada(i) + c + '</g>').join('') + '</g>' +
    '<g transform="translate(' + CX + ' ' + CY + ') rotate(' + graus + ')">' +
    '<ellipse rx="27" ry="22" fill="' + CREME + '"><animate attributeName="fill" dur="' + dur + '" repeatCount="indefinite" keyTimes="' + ktc + '" values="' + cores(0) + '"/></ellipse>' +
    '<ellipse rx="24" ry="19" fill="' + AZUL + '"><animate attributeName="fill" dur="' + dur + '" repeatCount="indefinite" keyTimes="' + ktc + '" values="' + cores(3) + '"/></ellipse>' +
    '<ellipse rx="24" ry="19" fill="' + LARANJA + '" transform="scale(0)"><animate attributeName="fill" dur="' + dur + '" repeatCount="indefinite" calcMode="discrete" keyTimes="0;' + num(volta / COR_CICLO, 5) + '" values="' + LARANJA + ';' + AZUL + '"/>' +
    '<animateTransform attributeName="transform" type="scale" dur="' + dur + '" repeatCount="indefinite" keyTimes="' + ktc + '" values="' + ex.map((q) => num(q.v[6] / 100, 3)).join(';') + '"/></ellipse></g>';

  // os braços giram devagar com a galáxia
  const giroIni = num((GIRO_INI * 180) / Math.PI, 2);
  const periodo = num(op.periodo / 1000, 3) + 's';
  const ceu = '<g transform="translate(' + CX + ' ' + CY + ') rotate(' + graus + ') scale(1 ' + GAL_ACHATE + ')"><g>' +
    '<animateTransform attributeName="transform" type="rotate" from="' + giroIni + '" to="' + num(+giroIni + 360, 2) + '" dur="' + periodo + '" repeatCount="indefinite"/>' +
    bracos + '</g></g>' + buraco;

  // sóis: os raios de estrela do site, na cor do braço, com o rótulo embaixo
  const SOL = 39;
  const TAG = 13;
  const TAG_ESP = 0.06;
  const PASSOS = 120;
  let sois = '';
  site.SISTEMAS.forEach(function (s, i) {
    if (!site.projetosDe(i).length) return;
    const pos = noBraco(s.u, s.braco);
    const cor = s.braco ? LARANJA : AZUL;
    const rotulo = s.nome.toUpperCase();
    const tw = medir(FONTE.monoN, rotulo, TAG, TAG_ESP) + TAG * TAG_ESP;
    const bw = tw + 2 * 9.5 + 2 * 1.8;
    const bh = TAG * 1.5 + 2 * 2.4 + 2 * 1.8;
    const meia = bw / 2;
    const cam = [];
    const camTag = [];
    for (let k = 0; k <= PASSOS; k++) {
      const q = solNoPlano(pos, GIRO_INI + (2 * Math.PI * k) / PASSOS);
      cam.push(num(q[0]) + ' ' + num(q[1]));
      const dx = Math.max(0, meia + 4 - q[0]) - Math.max(0, q[0] + meia + 4 - W);
      camTag.push(num(q[0] + dx) + ' ' + num(q[1]));
    }
    const mover = (v) => '<animateTransform attributeName="transform" type="translate" dur="' + periodo + '" repeatCount="indefinite" values="' + v.join(';') + '"/>';
    const rr = SOL * 1.1;
    const topo = -SOL / 2 + SOL * 1.6 + 3.6;
    sois += '<g>' + (op.solOpac ? op.solOpac[i] || '' : '') +
      '<g>' + mover(cam) + '<g color="' + cor + '"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="40s" repeatCount="indefinite"/>' +
      '<use href="#i-burst" x="' + num(-rr) + '" y="' + num(-rr) + '" width="' + num(2 * rr) + '" height="' + num(2 * rr) + '"/></g>' +
      (op.logo ? '<use href="#' + op.logo(s) + '" x="' + num(-SOL / 2) + '" y="' + num(-SOL / 2) + '" width="' + SOL + '" height="' + SOL + '"/>' : '') + '</g>' +
      '<g>' + mover(camTag) + '<g>' + (op.tagOpac || '') +
      '<rect x="' + num(-meia + 0.9) + '" y="' + num(topo + 0.9) + '" width="' + num(bw - 1.8) + '" height="' + num(bh - 1.8) + '" fill="' + CREME + '" stroke="' + cor + '" stroke-width="1.8"/>' +
      G.texto(FONTE.monoN, rotulo, -tw / 2, topo + bh / 2 + altCaixa(FONTE.monoN, TAG) / 2, TAG, TAG_ESP, 'fill="' + cor + '"') + '</g></g></g>';
  });

  defs += '<radialGradient id="gal-fade" cx=".5" cy=".5" r=".5"><stop offset=".82" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<mask id="gal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + H + '" fill="url(#gal-fade)"/></mask>';
  const cam = (miolo) => op.cam ? '<g>' + op.cam[0] + '<g>' + op.cam[1] + miolo + '</g></g>' : miolo;
  return {
    defs: defs,
    corpo: '<g mask="url(#gal-mask)">' + cam(ceu) + '</g>' + cam(sois)
  };
}

module.exports = { galaxia, solNoPlano, noBraco, GIRO_INI, W, H, CX, CY, TILT, AZUL, FUNDO, LARANJA, CREME, faixa, suave };
