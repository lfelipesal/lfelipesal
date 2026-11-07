/* Lê do site da SAL.TECH os sóis, os projetos, o desenho de cada planeta, as prévias de tela e os símbolos
   reutilizáveis (globo, brilho, estrela...). Assim, um projeto novo no site entra no perfil ao gerar de novo. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function lerSite(pasta) {
  const orbit = fs.readFileSync(path.join(pasta, 'orbit.js'), 'utf8');
  const html = fs.readFileSync(path.join(pasta, 'index.html'), 'utf8');
  const a = orbit.indexOf('var SISTEMAS = [');
  const b = orbit.indexOf('\n  ];', orbit.indexOf('var PROJETOS = [')) + 5;
  const c = orbit.indexOf('var PLANETAS = {');
  const d = orbit.indexOf('var IONS = {');
  if (a < 0 || b < 5 || c < 0 || d < 0) throw new Error('O orbit.js mudou: não achei SISTEMAS, PROJETOS, PLANETAS ou PREVIAS.');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(orbit.slice(a, b) + '\n' + orbit.slice(c, d) +
    '\nthis.SISTEMAS = SISTEMAS; this.PROJETOS = PROJETOS; this.PLANETAS = PLANETAS; this.PREVIAS = PREVIAS; this.LARANJA = LARANJA;' +
    '\nthis.tinta = function (ink, checker) { INK = ink; CHECKER = checker; };', ctx);

  const sprite = html.match(/<svg class="sprite"[\s\S]*?<\/svg>/)[0];
  const pecas = {};
  const re = /<(symbol|pattern|clipPath|linearGradient|radialGradient)\b[^>]*\bid="([^"]+)"[^>]*>[\s\S]*?<\/\1>/g;
  let m;
  while ((m = re.exec(sprite))) pecas[m[2]] = m[0];

  // devolve as definições do sprite que o trecho usa, com as dependências delas
  function definicoes(trecho, ja) {
    ja = ja || new Set();
    let out = '';
    const refs = trecho.match(/(?:url\(#|href="#)([\w-]+)/g) || [];
    refs.forEach(function (r) {
      const id = r.replace(/^(url\(#|href="#)/, '');
      if (ja.has(id) || !pecas[id]) return;
      ja.add(id);
      out += definicoes(pecas[id], ja) + pecas[id];
    });
    return out;
  }

  const projetosDe = (i) => ctx.PROJETOS.map((p, k) => k).filter((k) => ctx.PROJETOS[k].sistema === ctx.SISTEMAS[i].id);
  const quente = (p) => !!ctx.LARANJA[p.planeta];
  function previa(p) {
    ctx.tinta(quente(p) ? '#FF5A36' : '#1E3BD8', quente(p) ? 'pt-checker-warm' : 'pt-checker');
    return (ctx.PREVIAS[p.previa] || ctx.PREVIAS.web)();
  }
  // um SVG da pasta img do site como <symbol>, para usar com <use>
  function simbolo(arq, id) {
    const s = fs.readFileSync(path.join(pasta, 'img', arq), 'utf8');
    const vb = s.match(/viewBox="([^"]+)"/)[1];
    return '<symbol id="' + id + '" viewBox="' + vb + '">' + s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '') + '</symbol>';
  }
  return {
    simbolo: simbolo,
    SISTEMAS: ctx.SISTEMAS,
    PROJETOS: ctx.PROJETOS,
    PLANETAS: ctx.PLANETAS,
    projetosDe: projetosDe,
    quente: quente,
    previa: previa,
    definicoes: definicoes,
    peca: (id) => pecas[id]
  };
}

module.exports = { lerSite };
