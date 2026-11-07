/* Texto em desenho: uma imagem no GitHub não carrega fontes, então cada letra vira um contorno.
   Cada letra é desenhada uma vez só, no <defs>, e reaproveitada com <use>, o que deixa o arquivo pequeno. */
'use strict';
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const FONTES = path.join(__dirname, 'fontes');
const ARQUIVOS = ['Unbounded-900.ttf', 'SpaceMono-400.ttf', 'SpaceMono-700.ttf', 'SpaceGrotesk-500.ttf'];

// baixa as fontes do site (TTF estático de cada peso) na primeira vez
(function garantirFontes() {
  if (ARQUIVOS.every((a) => fs.existsSync(path.join(FONTES, a)))) return;
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

function carregar(arq) {
  const b = fs.readFileSync(path.join(FONTES, arq));
  const f = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  f.nomeCurto = arq.replace('.ttf', '');
  return f;
}
const FONTE = {
  titulo: carregar('Unbounded-900.ttf'),
  mono: carregar('SpaceMono-400.ttf'),
  monoN: carregar('SpaceMono-700.ttf'),
  corpo: carregar('SpaceGrotesk-500.ttf')
};

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

// largura do texto; esp é o espaçamento entre letras em em, como o letter-spacing do CSS (sem contar depois da última)
function medir(f, str, tam, esp) {
  let w = 0;
  let ant = null;
  for (const ch of str) {
    const g = f.charToGlyph(ch);
    if (ant) w += (f.getKerningValue(ant, g) * tam) / f.unitsPerEm;
    w += (g.advanceWidth * tam) / f.unitsPerEm + (esp || 0) * tam;
    ant = g;
  }
  return w - (esp || 0) * tam;
}

// quebra em linhas que cabem na largura
function quebrar(f, str, tam, larg, esp) {
  const linhas = [];
  let l = '';
  for (const p of str.split(/\s+/)) {
    const t = l ? l + ' ' + p : p;
    if (l && medir(f, t, tam, esp) > larg) {
      linhas.push(l);
      l = p;
    } else l = t;
  }
  if (l) linhas.push(l);
  return linhas;
}

// Um documento SVG: o texto é <text> de verdade, com as fontes do site embutidas no próprio arquivo, só com as
// letras que aparecem nele. Desenhar cada letra como contorno deixava a imagem pesada para animar: o navegador
// redesenha a imagem inteira a cada quadro, e cada letra virava um elemento. A fonte embutida aparece no GitHub
// (testado com o mesmo cabeçalho de segurança que ele usa nas imagens dos repositórios).
const FAMILIA = { 'Unbounded-900': 'U', 'SpaceMono-400': 'M', 'SpaceMono-700': 'MN', 'SpaceGrotesk-500': 'G' };
const RESERVA = { 'Unbounded-900': 'sans-serif', 'SpaceMono-400': 'monospace', 'SpaceMono-700': 'monospace', 'SpaceGrotesk-500': 'sans-serif' };
const escapar = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// recorta a fonte só com as letras usadas e devolve o WOFF em base64 (precisa do fontTools do Python)
function subconjunto(nome, letras) {
  const os = require('os');
  const { execFileSync } = require('child_process');
  const saida = path.join(os.tmpdir(), 'perfil-' + nome + '-' + process.pid + '.woff');
  const codigos = [...letras].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(',');
  const args = ['-m', 'fontTools.subset', path.join(FONTES, nome + '.ttf'), '--unicodes=' + codigos, '--flavor=woff', '--output-file=' + saida, '--layout-features=kern', '--no-hinting', '--drop-tables+=DSIG'];
  let ok = false;
  for (const py of ['python', 'python3', 'py']) {
    try { execFileSync(py, args, { stdio: 'pipe' }); ok = true; break; } catch (e) { /* tenta o próximo */ }
  }
  if (!ok) throw new Error('Para embutir as fontes, instale o fontTools: python -m pip install fonttools');
  const b64 = fs.readFileSync(saida).toString('base64');
  fs.unlinkSync(saida);
  return b64;
}

class Glifos {
  constructor() {
    this.usados = new Map();
  }
  // texto com a linha de base em y; atributos extras vão no <text> (fill, opacity...)
  texto(f, str, x, y, tam, esp, extra) {
    const set = this.usados.get(f.nomeCurto) || new Set();
    for (const ch of str) set.add(ch);
    this.usados.set(f.nomeCurto, set);
    return '<text x="' + num(x) + '" y="' + num(y) + '" font-family="' + FAMILIA[f.nomeCurto] + ',' + RESERVA[f.nomeCurto] + '" font-size="' + num(tam, 2) + '"' +
      (esp ? ' letter-spacing="' + num(esp * tam, 2) + '"' : '') + (extra ? ' ' + extra : '') + '>' + escapar(str) + '</text>';
  }
  // texto centrado em cx
  centro(f, str, cx, y, tam, esp, extra) {
    return this.texto(f, str, cx - medir(f, str, tam, esp) / 2, y, tam, esp, extra);
  }
  defs() {
    let css = '';
    for (const [nome, letras] of this.usados) {
      letras.add(' ');
      css += '@font-face{font-family:' + FAMILIA[nome] + ';src:url(data:font/woff;base64,' + subconjunto(nome, letras) + ') format("woff")}';
    }
    return '<style>' + css + '</style>';
  }
}

// altura das maiúsculas, para centrar o texto numa caixa
function altCaixa(f, tam) {
  return ((f.tables.os2.sCapHeight || f.unitsPerEm * 0.7) / f.unitsPerEm) * tam;
}

module.exports = { FONTE, num, medir, quebrar, Glifos, altCaixa };
