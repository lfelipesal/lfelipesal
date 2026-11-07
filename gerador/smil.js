/* Ajudantes para gravar movimento como animação SVG (SMIL): quadros-chave enxutos e as tags <animate>. */
'use strict';
const { num } = require('./texto');

// tira os quadros que a interpolação linear refaz sem erro visível (tol na unidade de cada valor)
function enxugar(kf, tol) {
  if (kf.length <= 2) return kf.slice();
  const out = [kf[0]];
  let a = 0;
  for (let j = 2; j < kf.length; j++) {
    let ok = true;
    for (let k = a + 1; k < j && ok; k++) {
      const span = kf[j].t - kf[a].t;
      const f = span ? (kf[k].t - kf[a].t) / span : 0;
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
const constante = (kf) => kf.every((k) => k.v.every((v, i) => v === kf[0].v[i]));

// <animate> linear de um atributo numérico ou de cor; fmt transforma o vetor em texto
function animar(attr, kf, dur, fmt, tol, extra) {
  const k = enxugar(kf, tol === undefined ? 0.05 : tol);
  return '<animate attributeName="' + attr + '" dur="' + num(dur / 1000, 3) + 's" repeatCount="indefinite" keyTimes="' + tempos(k, dur) + '" values="' + k.map((q) => fmt(q.v)).join(';') + '"' + (extra ? ' ' + extra : '') + '/>';
}
function transformar(tipo, kf, dur, fmt, tol, extra) {
  const k = enxugar(kf, tol === undefined ? 0.05 : tol);
  return '<animateTransform attributeName="transform" type="' + tipo + '" dur="' + num(dur / 1000, 3) + 's" repeatCount="indefinite" keyTimes="' + tempos(k, dur) + '" values="' + k.map((q) => fmt(q.v)).join(';') + '"' + (extra ? ' ' + extra : '') + '/>';
}
// troca de valor de uma vez: mud é [{t, v}] em ordem, começando em t = 0
function discreto(attr, mud, dur) {
  const m = [];
  mud.forEach((x) => { if (!m.length || m[m.length - 1].v !== x.v) m.push(x); });
  if (m.length === 1) return '<set attributeName="' + attr + '" to="' + m[0].v + '"/>';
  return '<animate attributeName="' + attr + '" dur="' + num(dur / 1000, 3) + 's" repeatCount="indefinite" calcMode="discrete" keyTimes="' + m.map((x) => num(x.t / dur, 5)).join(';') + '" values="' + m.map((x) => x.v).join(';') + '"/>';
}

module.exports = { enxugar, animar, transformar, discreto, constante };
