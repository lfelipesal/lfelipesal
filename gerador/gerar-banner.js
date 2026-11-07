/* Gera o banner animado do perfil do GitHub (saltech-galaxia.svg) com a galáxia do site da SAL.TECH.
   O GitHub não roda JavaScript nas imagens, então o movimento que o orbit.js do site faz quadro a quadro
   vira animação SVG (SMIL) gravada no arquivo: mesmas pinceladas, mesma semente e mesmo ciclo de cor.
   Os textos viram contorno, porque uma imagem no GitHub não carrega fontes.
   Uso, dentro desta pasta: npm i  e depois  node gerar-banner.js [pasta-de-saida] [pasta-do-site]
   Sem argumentos, grava na pasta de cima e lê as logos dos sóis em ../../saltech/img.
   As fontes (Unbounded, Space Mono, Space Grotesk) são baixadas do Google Fonts para ./fontes na primeira vez. */
'use strict';
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const OUT = process.argv[2] || path.join(__dirname, '..');
const SITE = process.argv[3] || path.join(__dirname, '..', '..', 'saltech');
const FONTES = path.join(__dirname, 'fontes');

// baixa as fontes do site (TTF estático de cada peso) se ainda não estiverem aqui
(function garantirFontes() {
  const arqs = ['Unbounded-900.ttf', 'SpaceMono-400.ttf', 'SpaceMono-700.ttf', 'SpaceGrotesk-500.ttf'];
  if (arqs.every((a) => fs.existsSync(path.join(FONTES, a)))) return;
  fs.mkdirSync(FONTES, { recursive: true });
  const baixar = `
    const fs = require('fs'), path = require('path'), dir = process.argv[1];
    (async () => {
      const css = await (await fetch('https://fonts.googleapis.com/css2?family=Unbounded:wght@900&family=Space+Mono:wght@400;700&family=Space+Grotesk:wght@500', { headers: { 'User-Agent': 'Wget/1.0' } })).text();
      const re = /font-family: '([^']+)';[\\s\\S]*?font-weight: (\\d+);[\\s\\S]*?src: url\\(([^)]+)\\)/g;
      let m;
      while ((m = re.exec(css))) fs.writeFileSync(path.join(dir, m[1].replace(/ /g, '') + '-' + m[2] + '.ttf'), Buffer.from(await (await fetch(m[3])).arrayBuffer()));
    })();`;
  require('child_process').execFileSync(process.execPath, ['-e', baixar, FONTES], { stdio: 'inherit' });
})();

// ---------------------------------------------------------------- cores do site
const AZUL = '#1E3BD8';
const FUNDO = '#142A9E';
const LARANJA = '#FF5A36';
const CREME = '#F4ECD6';
const TINTA_SUAVE = '#3A4CA8';

// ---------------------------------------------------------------- texto em contorno (imagens no GitHub não carregam fontes)
function fonte(arq) {
  const b = fs.readFileSync(path.join(FONTES, arq));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
const UNBOUNDED = fonte('Unbounded-900.ttf');
const MONO = fonte('SpaceMono-400.ttf');
const MONO_B = fonte('SpaceMono-700.ttf');
const GROTESK = fonte('SpaceGrotesk-500.ttf');

function medir(f, str, tam, esp) {
  let w = 0;
  let ant = null;
  for (const ch of str) {
    const g = f.charToGlyph(ch);
    if (ant) w += f.getKerningValue(ant, g) * tam / f.unitsPerEm;
    w += g.advanceWidth * tam / f.unitsPerEm + (esp || 0) * tam;
    ant = g;
  }
  return w - (esp || 0) * tam;
}
const num = (v, c) => {
  const s = (+v).toFixed(c === undefined ? 1 : c);
  const r = s.indexOf('.') >= 0 ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  return r === '-0' ? '0' : r;
};
// o toPathData do opentype.js 2.0 às vezes escreve NaN ao arredondar; o contorno sai direto dos comandos
function contorno(p) {
  return p.commands.map(function (c) {
    if (c.type === 'Z') return 'Z';
    if (c.type === 'Q') return 'Q' + num(c.x1) + ' ' + num(c.y1) + ' ' + num(c.x) + ' ' + num(c.y);
    if (c.type === 'C') return 'C' + num(c.x1) + ' ' + num(c.y1) + ' ' + num(c.x2) + ' ' + num(c.y2) + ' ' + num(c.x) + ' ' + num(c.y);
    return c.type + num(c.x) + ' ' + num(c.y);
  }).join('');
}
// devolve o contorno do texto com a linha de base em y
function texto(f, str, x, y, tam, esp) {
  let d = '';
  let cx = x;
  let ant = null;
  for (const ch of str) {
    const g = f.charToGlyph(ch);
    if (ant) cx += f.getKerningValue(ant, g) * tam / f.unitsPerEm;
    d += contorno(g.getPath(cx, y, tam));
    cx += g.advanceWidth * tam / f.unitsPerEm + (esp || 0) * tam;
    ant = g;
  }
  return d;
}

// ---------------------------------------------------------------- galáxia: o mesmo código do orbit.js
const W = 600;
const H = 400;
const CX = 300;
const CY = 200;
const TILT = (-14 * Math.PI) / 180;
const ARMA_R0 = 78;
const ARMA_R1 = 278;
const ARMA_VOLTA = Math.PI * 2.2;
const GAL_ACHATE = 0.58;
function noBraco(u, lado) { return { r: ARMA_R0 + (ARMA_R1 - ARMA_R0) * u, a: lado * Math.PI - ARMA_VOLTA * u }; }
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
const COR_GRADIENTES = [];
COR_PINCEIS.forEach(function (p, tipo) {
  for (let k = 0; k < p.grupos; k++) {
    COR_GRADIENTES.push({
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
function desenharBuraco(acaso) {
  const R = 108;
  const entre = function (a, b) { return a + (b - a) * acaso(); };
  function fechado(pts) {
    const meio = function (a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
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
    const g = COR_GRADIENTES.filter(function (x) { return x.id === id; })[0];
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
    const contorno = fora.concat(dentro.reverse());
    const raios = contorno.map(function (q) { return Math.hypot(q[0], q[1]); });
    return '<path fill="' + tintaDe(tipo, Math.min.apply(null, raios), Math.max.apply(null, raios)) + '" d="' + fechado(contorno) + '"/>';
  }
  function varias(quantas, r0, r1, giro, larg, tipos) {
    let o = '';
    for (let i = 0; i < quantas; i++) {
      o += pincel((i + acaso() * 0.6) / quantas * Math.PI * 2, entre(giro[0], giro[1]), R * entre(r0[0], r0[1]), R * entre(r1[0], r1[1]), entre(larg[0], larg[1]), tipos[i % tipos.length]);
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
  const fora = varias(16, [1.1, 1.32], [0.78, 0.95], [1.3, 2.2], [2.2, 4.2], [0]) +
    varias(26, [0.8, 1], [0.42, 0.68], [1.5, 2.6], [2, 4.4], [0]) +
    pontos(24, 0.95, 1.5, [0]);
  const meio = varias(22, [0.62, 0.9], [0.3, 0.52], [1.5, 2.8], [1.8, 3.6], [1, 0]) +
    pontos(22, 0.3, 0.95, [1, 0]);
  const perto = varias(18, [0.46, 0.64], [0.22, 0.3], [1.6, 3], [1.4, 3], [1, 1, 2]);
  return [fora, meio, perto];
}
const acaso = (function (s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(4127);
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
const camadasBuraco = desenharBuraco(acaso);

// ---------------------------------------------------------------- o ciclo de cor, como função do tempo
const faixa = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));
const suave = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const frenteDaOnda = (p) => (p < 0.5 ? 0.5 * Math.pow(2 * p, 0.6) : 1 - 0.5 * Math.pow(2 - 2 * p, 0.6));
function canais(h) { return [0, 1, 2].map((i) => parseInt(h.substr(1 + i * 2, 2), 16)); }
function misturar(a, b, k) { const A = canais(a); const B = canais(b); return A.map((v, i) => v + (B[i] - v) * k); }
function estadoCentro(t) {
  const volta = COR_D + COR_CENTRO;
  if (t < COR_D) {
    const chega = suave(faixa(t, COR_INICIO, COR_A));
    return { m: t, anel: misturar(CREME, LARANJA, chega), buraco: misturar(AZUL, FUNDO, chega), miolo: canais(LARANJA), escala: 0 };
  }
  if (t < volta) {
    const l = suave((t - COR_D) / COR_CENTRO);
    return { m: COR_D, anel: misturar(LARANJA, CREME, l), buraco: canais(FUNDO), miolo: canais(LARANJA), escala: l };
  }
  if (t < volta + COR_D) return { m: volta + COR_D - t, anel: canais(CREME), buraco: canais(LARANJA), miolo: canais(LARANJA), escala: 0 };
  return { m: 0, anel: canais(CREME), buraco: canais(LARANJA), miolo: canais(AZUL), escala: suave((t - volta - COR_D) / COR_CENTRO) };
}
function ondaDe(g, m) {
  let i = 0;
  for (let k = 1; k < g.ondas.length; k++) if (m >= g.ondas[k].ini) i = k;
  return i;
}
function raioDe(g, m) {
  const o = g.ondas[ondaDe(g, m)];
  return g.min + (g.max / COR_FRENTE - g.min) * frenteDaOnda(faixa(m, o.ini, o.fim));
}
const forca = (m) => 1 + 1.4 * Math.sin(Math.PI * faixa(m, COR_INICIO, COR_D));

// ---------------------------------------------------------------- quadros-chave enxutos
// tira os quadros que a interpolação linear refaz sem erro visível
function enxugar(kf, tol) {
  const out = [kf[0]];
  let a = 0;
  for (let j = 2; j < kf.length; j++) {
    let ok = true;
    for (let k = a + 1; k < j && ok; k++) {
      const f = (kf[k].t - kf[a].t) / (kf[j].t - kf[a].t);
      for (let c = 0; c < kf[k].v.length; c++) {
        if (Math.abs(kf[a].v[c] + (kf[j].v[c] - kf[a].v[c]) * f - kf[k].v[c]) > tol) { ok = false; break; }
      }
    }
    if (!ok) { out.push(kf[j - 1]); a = j - 1; }
  }
  out.push(kf[kf.length - 1]);
  return out;
}
const tempos = (kf, dur) => kf.map((k) => num(k.t / dur, 5)).join(';');
const hex = (v) => '#' + v.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase();

const PASSO = 20; // ms entre amostras
const EPS = 6; // ms: um salto acontece dentro deste intervalo

// raio e cores de cada gradiente ao longo de um ciclo de cor
function animarGradiente(g) {
  const kf = [];
  const trocas = [];
  let ondaAnt = -1;
  for (let t = 0; t <= COR_CICLO; t += PASSO) {
    const m = estadoCentro(t).m;
    const i = ondaDe(g, m);
    if (i !== ondaAnt) {
      if (ondaAnt >= 0) kf.push({ t: t - EPS, v: [raioDe(g, estadoCentro(t - PASSO).m)] });
      trocas.push({ t: ondaAnt >= 0 ? t - EPS / 2 : 0, i: i });
      ondaAnt = i;
    }
    kf.push({ t: t, v: [raioDe(g, m)] });
  }
  const r = enxugar(kf, 0.15);
  return {
    r: '<animate attributeName="r" dur="' + COR_CICLO / 1000 + 's" repeatCount="indefinite" keyTimes="' + tempos(r, COR_CICLO) + '" values="' + r.map((k) => num(k.v[0])).join(';') + '"/>',
    trocas: trocas.length > 1 ? trocas : null
  };
}

// ---------------------------------------------------------------- monta a galáxia
let defs = '';
COR_GRADIENTES.forEach(function (g) {
  const a = animarGradiente(g);
  const dur = COR_CICLO / 1000 + 's';
  const stop = (offset, cor, chave) => {
    if (!a.trocas || !chave) return '<stop offset="' + offset + '" stop-color="' + cor + '"/>';
    const kt = a.trocas.map((x) => num(x.t / COR_CICLO, 5)).join(';');
    const vs = a.trocas.map((x) => g.ondas[x.i][chave]).join(';');
    return '<stop offset="' + offset + '" stop-color="' + cor + '"><animate attributeName="stop-color" dur="' + dur + '" repeatCount="indefinite" calcMode="discrete" keyTimes="' + kt + '" values="' + vs + '"/></stop>';
  };
  defs += '<radialGradient id="' + g.id + '" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="' + num(g.min) + '">' +
    stop(COR_FRENTE, g.ondas[0].para, 'para') + stop((1 + COR_FRENTE) / 2, CREME) + stop(1, g.ondas[0].de, 'de') + a.r + '</radialGradient>';
});

// o redemoinho gira mais rápido no meio da troca de cor; em dois ciclos cada camada fecha voltas inteiras,
// então a animação recomeça sem salto
const DUAS = 2 * COR_CICLO;
function giroDaCamada(i) {
  const bruto = [];
  let ang = 0;
  for (let t = 0; t <= DUAS; t += PASSO) {
    bruto.push({ t: t, v: [ang] });
    ang += 360 * PASSO * forca(estadoCentro(t % COR_CICLO).m) / COR_VOLTAS[i];
  }
  const total = bruto[bruto.length - 1].v[0];
  const voltas = Math.max(1, Math.round(total / 360));
  const k = (voltas * 360) / total;
  const kf = enxugar(bruto.map((q) => ({ t: q.t, v: [q.v[0] * k] })), 0.08);
  console.log('camada', i, 'voltas em 2 ciclos:', (total / 360).toFixed(2), '->', voltas, '(velocidade x' + k.toFixed(3) + ')', kf.length, 'quadros');
  return '<animateTransform attributeName="transform" type="rotate" dur="' + DUAS / 1000 + 's" repeatCount="indefinite" keyTimes="' + tempos(kf, DUAS) + '" values="' + kf.map((q) => num(q.v[0], 2)).join(';') + '"/>';
}

// o centro: anel, fundo do buraco e o miolo que cresce quando a cor assenta
function animarCentro() {
  // na virada para a volta, o miolo laranja some e o fundo do buraco vira laranja de uma vez: o salto fica no tempo exato
  const volta = COR_D + COR_CENTRO;
  const ts = [];
  for (let t = 0; t < COR_CICLO; t += PASSO) ts.push(t);
  ts.push(volta - EPS, volta, COR_CICLO);
  ts.sort((a, b) => a - b);
  const kf = [];
  ts.forEach(function (t, i) {
    if (i && t === ts[i - 1]) return;
    const e = estadoCentro(t >= COR_CICLO ? COR_CICLO - 0.001 : t === volta - EPS ? volta - 0.001 : t);
    kf.push({ t: t, v: [].concat(e.anel, e.buraco, e.miolo, [e.escala * 100]) });
  });
  const ex = enxugar(kf, 1);
  const dur = COR_CICLO / 1000 + 's';
  const cor = (ini) => ex.map((q) => hex(q.v.slice(ini, ini + 3))).join(';');
  const kt = tempos(ex, COR_CICLO);
  const a = (attr, ini) => '<animate attributeName="' + attr + '" dur="' + dur + '" repeatCount="indefinite" keyTimes="' + kt + '" values="' + cor(ini) + '"/>';
  return {
    anel: a('fill', 0),
    buraco: a('fill', 3),
    miolo: '<animate attributeName="fill" dur="' + dur + '" repeatCount="indefinite" calcMode="discrete" keyTimes="0;' + num((COR_D + COR_CENTRO) / COR_CICLO, 5) + '" values="' + LARANJA + ';' + AZUL + '"/>',
    escala: '<animateTransform attributeName="transform" type="scale" dur="' + dur + '" repeatCount="indefinite" keyTimes="' + kt + '" values="' + ex.map((q) => num(q.v[9] / 100, 3)).join(';') + '"/>'
  };
}
const centro = animarCentro();
const graus = num((TILT * 180) / Math.PI, 2);
const buracoSVG = '<g transform="translate(' + CX + ' ' + CY + ') rotate(' + graus + ') scale(1 ' + GAL_ACHATE + ')">' +
  camadasBuraco.map((c, i) => '<g>' + giroDaCamada(i) + c + '</g>').join('') + '</g>' +
  '<g transform="translate(' + CX + ' ' + CY + ') rotate(' + graus + ')">' +
  '<ellipse rx="27" ry="22" fill="' + CREME + '">' + centro.anel + '</ellipse>' +
  '<ellipse rx="24" ry="19" fill="' + AZUL + '">' + centro.buraco + '</ellipse>' +
  '<ellipse rx="24" ry="19" fill="' + LARANJA + '" transform="scale(0)">' + centro.miolo + centro.escala + '</ellipse></g>';

// os braços giram devagar com a galáxia: 0,00009 rad por ms, a partir de 0,6 rad
const GIRO_INI = 0.6;
const GIRO_VEL = 0.00009;
const GIRO_DUR = (2 * Math.PI) / GIRO_VEL;
const giroIni = num((GIRO_INI * 180) / Math.PI, 2);
const bracosSVG = '<g transform="translate(' + CX + ' ' + CY + ') rotate(' + graus + ') scale(1 ' + GAL_ACHATE + ')"><g>' +
  '<animateTransform attributeName="transform" type="rotate" from="' + giroIni + '" to="' + num(+giroIni + 360, 2) + '" dur="' + num(GIRO_DUR / 1000, 3) + 's" repeatCount="indefinite"/>' +
  bracos + '</g></g>';

// ---------------------------------------------------------------- sóis
const SISTEMAS = [
  { nome: 'Sites e apps', braco: 0, u: 0.75 },
  { nome: 'Sistemas e automação', braco: 1, u: 0.8 },
  { nome: 'Universidade', braco: 0, u: 1 }
];
const SOL = 39; // 6,5% da largura da cena
const TAG_TAM = 13;
const TAG_ESP = 0.06;
function solNoPlano(pos, giro) {
  const x = pos.r * Math.cos(pos.a + giro);
  const y = pos.r * GAL_ACHATE * Math.sin(pos.a + giro);
  return [CX + x * Math.cos(TILT) - y * Math.sin(TILT), CY + x * Math.sin(TILT) + y * Math.cos(TILT)];
}
function simbolo(arq, id) {
  const s = fs.readFileSync(path.join(SITE, 'img', arq), 'utf8');
  const vb = s.match(/viewBox="([^"]+)"/)[1];
  return '<symbol id="' + id + '" viewBox="' + vb + '">' + s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '') + '</symbol>';
}
defs += simbolo('planeta-st.svg', 'st-azul') + simbolo('planeta-st-laranja.svg', 'st-laranja');
defs += '<symbol id="raios" viewBox="0 0 100 100"><polygon fill="currentColor" points="50.0,1.0 54.7,26.5 68.8,4.7 63.3,30.0 84.6,15.4 70.0,36.7 95.3,31.2 73.5,45.3 99.0,50.0 73.5,54.7 95.3,68.8 70.0,63.3 84.6,84.6 63.3,70.0 68.8,95.3 54.7,73.5 50.0,99.0 45.3,73.5 31.2,95.3 36.7,70.0 15.4,84.6 30.0,63.3 4.7,68.8 26.5,54.7 1.0,50.0 26.5,45.3 4.7,31.2 30.0,36.7 15.4,15.4 36.7,30.0 31.2,4.7 45.3,26.5"/><circle cx="50" cy="50" r="17" fill="' + CREME + '" stroke="currentColor" stroke-width="3"/></symbol>';

const PASSOS_SOL = 120;
let soisSVG = '';
SISTEMAS.forEach(function (s, i) {
  const pos = noBraco(s.u, s.braco);
  const cor = s.braco ? LARANJA : AZUL;
  const rotulo = s.nome.toUpperCase();
  const tw = medir(MONO_B, rotulo, TAG_TAM, TAG_ESP) + TAG_TAM * TAG_ESP;
  const bw = tw + 2 * 9.5 + 2 * 1.8;
  const bh = TAG_TAM * 1.5 + 2 * 2.4 + 2 * 1.8;
  const meia = bw / 2;
  const caminho = [];
  const caminhoTag = [];
  for (let k = 0; k <= PASSOS_SOL; k++) {
    const q = solNoPlano(pos, GIRO_INI + (2 * Math.PI * k) / PASSOS_SOL);
    caminho.push(num(q[0]) + ' ' + num(q[1]));
    // o rótulo não sai do quadro quando o sol passa na beirada
    const dx = Math.max(0, meia + 4 - q[0]) - Math.max(0, q[0] + meia + 4 - W);
    caminhoTag.push(num(q[0] + dx) + ' ' + num(q[1]));
  }
  const mover = (vals) => '<animateTransform attributeName="transform" type="translate" dur="' + num(GIRO_DUR / 1000, 3) + 's" repeatCount="indefinite" values="' + vals.join(';') + '"/>';
  const rr = SOL * 1.1; // raios: 220% do sol
  const topoTag = -SOL / 2 + SOL * 1.6 + 3.6;
  const capH = (MONO_B.tables.os2.sCapHeight / MONO_B.unitsPerEm) * TAG_TAM;
  soisSVG += '<g>' + mover(caminho) +
    '<g color="' + cor + '"><g>' +
    '<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="40s" repeatCount="indefinite"/>' +
    '<use href="#raios" x="' + num(-rr) + '" y="' + num(-rr) + '" width="' + num(2 * rr) + '" height="' + num(2 * rr) + '"/></g>' +
    '<use href="#' + (s.braco ? 'st-laranja' : 'st-azul') + '" x="' + num(-SOL / 2) + '" y="' + num(-SOL / 2) + '" width="' + SOL + '" height="' + SOL + '"/></g></g>';
  soisSVG += '<g>' + mover(caminhoTag) +
    '<rect x="' + num(-meia + 0.9) + '" y="' + num(topoTag + 0.9) + '" width="' + num(bw - 1.8) + '" height="' + num(bh - 1.8) + '" fill="' + CREME + '" stroke="' + cor + '" stroke-width="1.8"/>' +
    '<path fill="' + cor + '" d="' + texto(MONO_B, rotulo, -tw / 2, topoTag + bh / 2 + capH / 2, TAG_TAM, TAG_ESP) + '"/></g>';
});

const galaxia = '<defs><radialGradient id="gal-fade" cx=".5" cy=".5" r=".5"><stop offset=".82" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
  '<mask id="gal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + H + '" fill="url(#gal-fade)"/></mask></defs>' +
  '<g mask="url(#gal-mask)">' + bracosSVG + buracoSVG + '</g>' + soisSVG;

// ---------------------------------------------------------------- o banner
const BW = 1280;
const BH = 540;
const M = 14; // moldura
const GX = 650;
const GY = 58;
let corpo = '';
// moldura de pôster com a etiqueta no topo
corpo += '<rect width="' + BW + '" height="' + BH + '" rx="18" fill="' + CREME + '"/>';
corpo += '<rect x="' + M + '" y="' + M + '" width="' + (BW - 2 * M) + '" height="' + (BH - 2 * M) + '" fill="none" stroke="' + AZUL + '" stroke-width="2"/>';
{
  const t = 'ESTÚDIO DIGITAL DE TECNOLOGIA';
  const tam = 13;
  const esp = 0.14;
  const tw = medir(MONO, t, tam, esp);
  const bw = tw + 2 * 24;
  const x = BW / 2 - bw / 2;
  const h = 36;
  corpo += '<path d="M' + num(x) + ' ' + M + 'V' + (M + h) + 'H' + num(x + bw) + 'V' + M + '" fill="' + CREME + '" stroke="' + AZUL + '" stroke-width="2"/>';
  corpo += '<path fill="' + AZUL + '" d="' + texto(MONO, t, BW / 2 - tw / 2, M + h / 2 + 4.6, tam, esp) + '"/>';
}

// coluna da esquerda
const X0 = 70;
// logo da navegação: cometa e SAL.TECH com o ponto laranja
{
  const k = 0.62;
  const ty = 70;
  const nat = medir(UNBOUNDED, 'SAL.TECH', 54);
  const sx = 300 / nat;
  let d = '';
  let cx = 0;
  let ant = null;
  let ponto = '';
  for (const ch of 'SAL.TECH') {
    const g = UNBOUNDED.charToGlyph(ch);
    if (ant) cx += UNBOUNDED.getKerningValue(ant, g) * 54 / 1000;
    const p = contorno(g.getPath(0, 0, 54));
    const peca = '<path transform="translate(' + num(20 + cx * sx, 2) + ' 80) scale(' + num(sx, 4) + ' 1)" d="' + p + '"/>';
    if (ch === '.') ponto = peca; else d += peca;
    cx += (g.advanceWidth * 54) / 1000;
    ant = g;
  }
  corpo += '<g transform="translate(' + (X0 - 12 * k) + ' ' + ty + ') scale(' + k + ')">' +
    '<defs><linearGradient id="nt" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="352" y2="0"><stop offset="0" stop-color="' + AZUL + '" stop-opacity="0"/><stop offset=".45" stop-color="' + AZUL + '" stop-opacity=".85"/><stop offset="1" stop-color="' + AZUL + '"/></linearGradient>' +
    '<radialGradient id="nh"><stop offset="0" stop-color="' + AZUL + '" stop-opacity=".45"/><stop offset="1" stop-color="' + AZUL + '" stop-opacity="0"/></radialGradient></defs>' +
    '<path d="M10 98 C90 114 260 112 338 66 C358 54 362 34 350 26" fill="none" stroke="url(#nt)" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M30 104 C110 118 270 114 344 70" fill="none" stroke="url(#nt)" stroke-width="2" stroke-linecap="round" opacity=".6"/>' +
    '<circle cx="350" cy="26" r="16" fill="url(#nh)"><animate attributeName="r" values="13;19;13" dur="2.8s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/></circle>' +
    '<circle cx="350" cy="26" r="6" fill="' + AZUL + '"/>' +
    '<g fill="' + AZUL + '">' + d + '</g><g fill="' + LARANJA + '">' + ponto + '</g></g>';
}

// título do herói: LANCE SUA / IDEIA NA / [ÓRBITA DIGITAL].
{
  const tam = 50;
  const esp = -0.01;
  const lh = tam * 1.02;
  const topo = 168;
  const base = (i) => topo + i * lh + 0.885 * tam;
  corpo += '<path fill="' + AZUL + '" d="' + texto(UNBOUNDED, 'LANCE SUA', X0, base(0), tam, esp) + texto(UNBOUNDED, 'IDEIA NA', X0, base(1), tam, esp) + '"/>';
  const caixa = 'ÓRBITA DIGITAL';
  const cw = medir(UNBOUNDED, caixa, tam, esp) + esp * tam;
  const pad = 0.18 * tam;
  const bx = X0;
  const by = topo + 2 * lh;
  const bw = cw + 2 * pad;
  const bh = lh + 0.04 * tam;
  const cxBox = bx + bw / 2;
  const cyBox = by + bh / 2;
  corpo += '<g transform="rotate(-2 ' + num(cxBox) + ' ' + num(cyBox) + ')"><rect x="' + num(bx) + '" y="' + num(by) + '" width="' + num(bw) + '" height="' + num(bh) + '" fill="' + AZUL + '"/>' +
    '<path fill="' + CREME + '" d="' + texto(UNBOUNDED, caixa, bx + pad, base(2), tam, esp) + '"/></g>';
  // o ponto laranja do título, fora da caixa e sem a inclinação dela
  corpo += '<path fill="' + LARANJA + '" d="' + texto(UNBOUNDED, '.', bx + bw, base(2), tam) + '"/>';
}

// texto de apoio
{
  const tam = 19;
  const linhas = ['Criamos o sistema que o seu negócio precisa, soltamos', 'anúncios com a nossa própria plataforma e deixamos', 'o atendimento no automático.'];
  const y0 = 370;
  corpo += '<path fill="' + TINTA_SUAVE + '" d="' + linhas.map((l, i) => texto(GROTESK, l, X0, y0 + i * tam * 1.5, tam)).join('') + '"/>';
  linhas.forEach((l) => { const w = medir(GROTESK, l, tam); if (X0 + w > GX + 20) console.log('AVISO: linha longa', Math.round(w), l); });
}

// etiquetas do que a SAL.TECH faz
{
  const tam = 13;
  const esp = 0.1;
  let x = X0;
  const y = 462;
  const h = 30;
  const capH = (MONO.tables.os2.sCapHeight / MONO.unitsPerEm) * tam;
  let s = '';
  ['DESKTOP', 'WEB', 'MOBILE', 'CHATBOTS', 'ANÚNCIOS'].forEach(function (t) {
    const tw = medir(MONO, t, tam, esp) + esp * tam;
    const w = tw + 2 * 14;
    s += '<rect x="' + num(x + 0.75) + '" y="' + num(y + 0.75) + '" width="' + num(w - 1.5) + '" height="' + (h - 1.5) + '" fill="none" stroke="' + AZUL + '" stroke-width="1.5"/>';
    s += '<path fill="' + AZUL + '" d="' + texto(MONO, t, x + 14, y + h / 2 + capH / 2, tam, esp) + '"/>';
    x += w + 10;
  });
  corpo += s;
}

// brilhos do herói: piscam como no site (2,8 s, de 70% a 100% e girando 45°)
function brilho(cx, cy, tam, cor, atraso) {
  const d = 'M50 0C54 38 62 46 100 50C62 54 54 62 50 100C46 62 38 54 0 50C38 46 46 38 50 0Z';
  const sp = '.45 0 .55 1;.45 0 .55 1';
  return '<g transform="translate(' + cx + ' ' + cy + ')"><g>' +
    '<animateTransform attributeName="transform" type="scale" values=".7;1;.7" dur="2.8s" begin="' + atraso + 's" repeatCount="indefinite" calcMode="spline" keySplines="' + sp + '"/>' +
    '<g><animateTransform attributeName="transform" type="rotate" values="0;45;0" dur="2.8s" begin="' + atraso + 's" repeatCount="indefinite" calcMode="spline" keySplines="' + sp + '"/>' +
    '<path fill="' + cor + '" transform="scale(' + tam / 100 + ') translate(-50 -50)" d="' + d + '"/></g></g></g>';
}
corpo += brilho(596, 132, 56, AZUL, 0) + brilho(628, 178, 26, LARANJA, -1.2);

corpo += '<g transform="translate(' + GX + ' ' + GY + ')">' + galaxia + '</g>';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + BW + ' ' + BH + '" width="' + BW + '" height="' + BH + '" role="img" aria-labelledby="titulo">' +
  '<title id="titulo">SAL.TECH: lance sua ideia na órbita digital</title>' +
  '<defs>' + defs + '</defs>' + corpo + '</svg>';

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'saltech-galaxia.svg'), svg);
console.log('saltech-galaxia.svg', (svg.length / 1024).toFixed(1) + ' KB');
