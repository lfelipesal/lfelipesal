/* Gera o perfil do GitHub como uma página contínua e animada (um "PDF animado"), com a cara do site:
     img/portfolio.svg   apresentação, qualidades, o que já fiz (galáxia com o passeio da nave),
                         trajetória e um rodapé discreto, separados pelas faixas líquidas do site
     README.md           a página (sem link) e, embaixo, os únicos links: o contato e o site dos serviços
   Os sóis, projetos, planetas, prévias de tela e enfeites vêm do site (orbit.js, index.html e img/).
   Uso, dentro desta pasta: npm i  e depois  node gerar.js [pasta-do-perfil] [pasta-do-site]
   Sem argumentos, grava na pasta de cima e lê o site em ../../saltech.
   Precisa do Python com fontTools (python -m pip install fonttools) para embutir as fontes na imagem. */
'use strict';
const fs = require('fs');
const path = require('path');
const { FONTE, num, medir, quebrar, Glifos, altCaixa } = require('./texto');
const { lerSite } = require('./site');
const { montarPasseio } = require('./passeio');

const PERFIL_DIR = process.argv[2] || path.join(__dirname, '..');
const SITE = process.argv[3] || path.join(__dirname, '..', '..', 'saltech');
const site = lerSite(SITE);

// ------------------------------------------------------------------ quem eu sou
const PERFIL = {
  nome: ['Luiz Felipe', 'Alves'],
  funcao: 'Analista de Teste · Engenharia de Sistemas na UFMG',
  bio: 'Há quase quatro anos testo e automatizo sistemas web e APIs. Também desenvolvo: do app ao sistema web, cada projeto já nasce pensado pra não quebrar.',
  temas: ['Qualidade de software', 'Testes automatizados', 'Sistemas web', 'Apps', 'Automações'],
  qualidades: [
    {
      icone: 'i-burst', rotulo: 'Qualidade', titulo: 'Olhar de quem testa',
      texto: 'Quase quatro anos testando sistemas web e APIs, na Sinqia, na TOTVS e hoje na Base2. Acho o problema antes de ele chegar em quem usa.',
      itens: ['Testes de sistemas web e de APIs', 'Quality Engineer, Analista de Qualidade e de Teste', 'Certificação ISTQB CTFL']
    },
    {
      icone: 'i-atom', rotulo: 'Automação', titulo: 'Teste que roda sozinho',
      texto: 'Transformo o que se repete em teste automatizado, pra cada entrega sair com mais confiança e menos retrabalho.',
      itens: ['Interface com Cypress e Selenium', 'API com RestAssured e JUnit', 'JavaScript, TypeScript, Java e Python']
    },
    {
      icone: 'i-globe', rotulo: 'Desenvolvimento', titulo: 'Do app ao sistema web',
      texto: 'Também construo: app mobile, sistema web, automação com IA e até jogo, sempre com o olhar de quem testa.',
      itens: ['React Native e Next.js', 'PostgreSQL e SQL', 'Web Full Stack pelo curso.dev']
    },
    {
      icone: 'i-orbit', rotulo: 'Engenharia', titulo: 'Base de engenharia',
      texto: 'Engenharia de Sistemas na UFMG e técnico em Eletrônica no CEFET-MG: lógica, modelagem e otimização no dia a dia.',
      itens: ['Otimização com Python e Gurobi', 'C/C++ e estruturas de dados', 'Eletrônica e sistemas digitais']
    }
  ],
  trajetoria: [
    { ano: '2017', tipo: 'estudos', titulo: 'Técnico em Eletrônica', onde: 'CEFET-MG' },
    { ano: '2021', tipo: 'estudos', titulo: 'Engenharia de Sistemas', onde: 'UFMG' },
    { ano: '2022', tipo: 'carreira', titulo: 'Quality Engineer', onde: 'Sinqia' },
    { ano: '2025', tipo: 'carreira', titulo: 'Analista de Qualidade', onde: 'TOTVS' },
    { ano: 'Hoje', tipo: 'carreira', titulo: 'Analista de Teste Pleno', onde: 'Base2', hoje: true }
  ],
  ferramentas: ['JavaScript', 'TypeScript', 'C/C++', 'Python', 'Java', 'Cypress', 'Selenium', 'Git', 'Figma', 'SQL', 'Scrum'],
  certificacoes: ['ISTQB CTFL', 'Web Full Stack · curso.dev'],
  contatos: [['LinkedIn', 'linkedin.com/in/lfelipesal', 'https://www.linkedin.com/in/lfelipesal'], ['GitHub', 'github.com/lfelipesal', 'https://github.com/lfelipesal']],
  servicos: { texto: 'Também faço sites, sistemas e automações sob medida', site: 'salltech.com.br', url: 'https://www.salltech.com.br' },
  // textos do site que falam do próprio site e não fazem sentido fora dele
  resumos: { 'R-Type': 'Jogo de nave inspirado no clássico de fliperama de 1987: rolagem lateral, inimigos, canhão que carrega a força e placar de recordes. Feito em C e refeito em JavaScript pra jogar no navegador.' }
};
site.PROJETOS.forEach((p) => { if (PERFIL.resumos[p.nome]) p.resumo = PERFIL.resumos[p.nome]; });

const AZUL = '#1E3BD8';
const FUNDO = '#142A9E';
const LARANJA = '#FF5A36';
const CREME = '#F4ECD6';
const PAPEL2 = '#EDE3C6';
const SUAVE = '#3A4CA8';
const BW = 1280;
const M = 14; // moldura da página
const X = 60; // margem do conteúdo
const LARG = BW - 2 * X;
const BRILHO = 'M50 0C54 38 62 46 100 50C62 54 54 62 50 100C46 62 38 54 0 50C38 46 46 38 50 0Z';
const ESTRELA4 = 'M7.5 0 9 6 15 7.5 9 9 7.5 15 6 9 0 7.5 6 6Z'; // o marcador dos itens das listas do site
const CORPO_NAVE = 'M9 5h4l4-5h4l-2 6h9c6 0 11 3 14 6-3 3-8 6-14 6h-9l2 6h-4l-4-5H9z';

function sobrancelha(G, txt, x, y, cor) {
  return '<path fill="' + (cor || AZUL) + '" transform="translate(' + x + ' ' + (y - 13) + ') scale(.16)" d="' + BRILHO + '"/>' +
    G.texto(FONTE.mono, txt, x + 26, y, 13, 0.14, 'fill="' + (cor || AZUL) + '"');
}
// cabeça de seção do site: sobrancelha, título e linha de apoio; devolve onde ela termina
function cabeca(G, y0, sobre, titulo, apoio) {
  let s = sobrancelha(G, sobre, X, y0 + 70);
  s += G.texto(FONTE.titulo, titulo.toUpperCase(), X, y0 + 126, 44, -0.01, 'fill="' + AZUL + '"');
  if (apoio) s += G.texto(FONTE.corpo, apoio, X, y0 + 164, 19, 0, 'fill="' + SUAVE + '"');
  return { s: s, fim: y0 + (apoio ? 190 : 150) };
}
function etiquetas(G, lista, x, y, tam, opcoes) {
  const o = opcoes || {};
  const padX = o.padX || 14;
  const gap = o.gap || 10;
  const h = tam * 1.5 + 8 + 3;
  const larg = lista.map((t) => medir(FONTE.mono, t.toUpperCase(), tam, 0.1) + 0.1 * tam + 2 * padX);
  const total = larg.reduce((a, b) => a + b, 0) + gap * (lista.length - 1);
  let cx = o.centro ? x - total / 2 : x;
  let s = '';
  lista.forEach(function (t, i) {
    s += '<rect x="' + num(cx + 0.75) + '" y="' + num(y + 0.75) + '" width="' + num(larg[i] - 1.5) + '" height="' + num(h - 1.5) + '" fill="none" stroke="' + (o.cor || AZUL) + '" stroke-width="1.5"/>' +
      G.texto(FONTE.mono, t.toUpperCase(), cx + padX, y + h / 2 + altCaixa(FONTE.mono, tam) / 2, tam, 0.1, 'fill="' + (o.cor || AZUL) + '"');
    cx += larg[i] + gap;
  });
  return { s: s, h: h };
}
// brilho que pisca como o .twinkle do site (2,8 s, de 70% a 100%, girando 45°)
function brilho(cx, cy, tam, cor, atraso) {
  const sp = '.42 0 .58 1;.42 0 .58 1';
  return '<g transform="translate(' + cx + ' ' + cy + ')"><g>' +
    '<animateTransform attributeName="transform" type="scale" values=".7;1;.7" dur="2.8s" begin="' + atraso + 's" repeatCount="indefinite" calcMode="spline" keySplines="' + sp + '"/>' +
    '<animateTransform attributeName="transform" type="rotate" values="0;45;0" dur="2.8s" begin="' + atraso + 's" repeatCount="indefinite" calcMode="spline" keySplines="' + sp + '" additive="sum"/>' +
    '<path fill="' + cor + '" transform="scale(' + tam / 100 + ') translate(-50 -50)" d="' + BRILHO + '"/></g></g>';
}
const girar = (seg, rev) => '<animateTransform attributeName="transform" type="rotate" from="0" to="' + (rev ? -360 : 360) + '" dur="' + seg + 's" repeatCount="indefinite"/>';
// órbita do herói do site: elipse inclinada com um ponto azul e um laranja
function orbitaEnfeite(id, x, y, k) {
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><g transform="rotate(-8 80 35)"><path id="' + id + '" d="M4 35a76 28 0 1 0 152 0a76 28 0 1 0 -152 0" fill="none" stroke="' + AZUL + '" stroke-width="' + num(1.6 / k, 2) + '"/>' +
    '<circle r="' + num(4.5 / k, 2) + '" fill="' + AZUL + '"><animateMotion dur="14s" repeatCount="indefinite"><mpath href="#' + id + '"/></animateMotion></circle>' +
    '<circle r="' + num(4.5 / k, 2) + '" fill="' + LARANJA + '"><animateMotion dur="14s" begin="-7s" repeatCount="indefinite"><mpath href="#' + id + '"/></animateMotion></circle></g></g>';
}
// faixa líquida do site entre as seções, de borda a borda da moldura
function faixa(n, y) {
  const arq = fs.readFileSync(path.join(SITE, 'img', 'faixa-' + n + '.svg'), 'utf8');
  const vb = arq.match(/viewBox="([^"]+)"/)[1];
  const par = (arq.match(/preserveAspectRatio="([^"]+)"/) || [0, 'xMidYMid slice'])[1];
  const miolo = arq.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const x0 = M + 1;
  const w = BW - 2 * M - 2;
  return '<svg x="' + x0 + '" y="' + y + '" width="' + w + '" height="120" viewBox="' + vb + '" preserveAspectRatio="' + par + '">' + miolo + '</svg>' +
    '<path d="M' + M + ' ' + (y + 1) + 'H' + (BW - M) + 'M' + M + ' ' + (y + 119) + 'H' + (BW - M) + '" stroke="' + AZUL + '" stroke-width="2"/>';
}

// ------------------------------------------------------------------ 1. apresentação: a abertura do site, com o meu nome
function apresentacao(G) {
  const CXB = BW / 2;
  let c = '';
  c += '<g transform="translate(130 160)" color="' + AZUL + '"><g>' + girar(40) + '<use href="#i-globe" x="-66" y="-66" width="132" height="132"/></g></g>';
  c += '<g transform="translate(1136 352)" color="' + AZUL + '"><g>' + girar(40, true) + '<use href="#i-burst" x="-48" y="-48" width="96" height="96"/></g></g>';
  c += '<g color="' + AZUL + '"><use href="#i-atom" x="104" y="392" width="96" height="96"/></g>';
  c += brilho(1140, 112, 62, AZUL, 0) + brilho(1188, 182, 30, LARANJA, -1.2);
  c += orbitaEnfeite('orbita-heroi', 1072, 456, 1);
  const oi = 'OI, EU SOU O';
  const wOi = medir(FONTE.mono, oi, 15, 0.22);
  c += G.centro(FONTE.mono, oi, CXB, 116, 15, 0.22, 'fill="' + AZUL + '"');
  c += '<path fill="' + AZUL + '" transform="translate(' + num(CXB - wOi / 2 - 30) + ' 102) scale(.17)" d="' + BRILHO + '"/>';
  c += '<path fill="' + LARANJA + '" transform="translate(' + num(CXB + wOi / 2 + 13) + ' 102) scale(.17)" d="' + BRILHO + '"/>';
  // nome em duas linhas, a segunda na caixa azul inclinada, com o ponto laranja
  const T = 86;
  const topo = 136;
  c += G.centro(FONTE.titulo, PERFIL.nome[0].toUpperCase(), CXB, topo + 0.885 * T, T, -0.01, 'fill="' + AZUL + '"');
  const n2 = PERFIL.nome[1].toUpperCase();
  const pad = 0.18 * T;
  const bw = medir(FONTE.titulo, n2, T, -0.01) + 2 * pad;
  const bx = CXB - (bw + medir(FONTE.titulo, '.', T)) / 2;
  const by = topo + 1.02 * T;
  const bh = 1.06 * T;
  const b2 = by + 0.885 * T;
  c += '<g transform="rotate(-2 ' + num(bx + bw / 2) + ' ' + num(by + bh / 2) + ')"><rect x="' + num(bx) + '" y="' + num(by) + '" width="' + num(bw) + '" height="' + num(bh) + '" fill="' + AZUL + '"/>' +
    G.texto(FONTE.titulo, n2, bx + pad, b2, T, -0.01, 'fill="' + CREME + '"') + '</g>';
  c += G.texto(FONTE.titulo, '.', bx + bw + 2, b2, T, 0, 'fill="' + LARANJA + '"');
  c += G.centro(FONTE.corpo, PERFIL.funcao, CXB, 384, 24, 0, 'fill="' + AZUL + '"');
  quebrar(FONTE.corpo, PERFIL.bio, 19, 780).forEach((l, i) => { c += G.centro(FONTE.corpo, l, CXB, 422 + i * 29, 19, 0, 'fill="' + SUAVE + '"'); });
  c += etiquetas(G, PERFIL.temas, CXB, 478, 13, { centro: true }).s;
  return { s: c, fim: 560 };
}

// ------------------------------------------------------------------ 2. qualidades: cartões como os de serviços do site
function qualidades(G, y0) {
  const cab = cabeca(G, y0, 'QUALIDADES', 'O que eu faço bem', 'Teste, automação e desenvolvimento, com base de engenharia.');
  let c = cab.s;
  const GAP = 40;
  const CW = (LARG - GAP) / 2;
  const PAD = 34;
  const TW = CW - 2 * PAD;
  // mede cada cartão para os dois de uma linha terem a mesma altura
  const montar = (q, i) => {
    const t = quebrar(FONTE.titulo, q.titulo.toUpperCase(), 24, TW, -0.01);
    const p = quebrar(FONTE.corpo, q.texto, 17, TW);
    const itens = q.itens.map((it) => quebrar(FONTE.corpo, it, 16.5, TW - 28));
    const h = PAD + 64 + 18 + t.length * 28 + 14 + p.length * 26 + 18 + 16 + itens.reduce((a, l) => a + l.length * 25 + 10, -10) + PAD;
    return { q: q, i: i, t: t, p: p, itens: itens, h: h };
  };
  const cards = PERFIL.qualidades.map(montar);
  let y = cab.fim + 20;
  for (let linha = 0; linha < cards.length; linha += 2) {
    const par = cards.slice(linha, linha + 2);
    const h = Math.max.apply(null, par.map((k) => k.h));
    par.forEach(function (k, j) {
      const x = X + j * (CW + GAP);
      c += '<rect x="' + num(x + 8) + '" y="' + num(y + 8) + '" width="' + num(CW) + '" height="' + num(h) + '" fill="' + AZUL + '"/>' +
        '<rect x="' + num(x + 1) + '" y="' + num(y + 1) + '" width="' + num(CW - 2) + '" height="' + num(h - 2) + '" fill="' + PAPEL2 + '" stroke="' + AZUL + '" stroke-width="2"/>';
      c += '<g color="' + AZUL + '"><use href="#' + k.q.icone + '" x="' + num(x + PAD) + '" y="' + num(y + PAD) + '" width="64" height="' + (k.q.icone === 'i-orbit' ? 28 : 64) + '"' + (k.q.icone === 'i-orbit' ? ' transform="translate(0 18)"' : '') + '/></g>';
      const rot = (k.i < 9 ? '0' : '') + (k.i + 1) + ' / ' + k.q.rotulo.toUpperCase();
      c += G.texto(FONTE.mono, rot, x + CW - PAD - medir(FONTE.mono, rot, 13, 0.08), y + PAD + 36, 13, 0.08, 'fill="' + AZUL + '"');
      let yy = y + PAD + 64 + 18;
      k.t.forEach((l) => { c += G.texto(FONTE.titulo, l, x + PAD, yy + 22, 24, -0.01, 'fill="' + AZUL + '"'); yy += 28; });
      yy += 14;
      k.p.forEach((l) => { c += G.texto(FONTE.corpo, l, x + PAD, yy + 18, 17, 0, 'fill="' + SUAVE + '"'); yy += 26; });
      yy += 18;
      c += '<path d="M' + num(x + PAD) + ' ' + num(yy) + 'H' + num(x + CW - PAD) + '" stroke="' + AZUL + '" stroke-width="1.5" stroke-dasharray="3 3"/>';
      yy += 16;
      k.itens.forEach(function (linhas) {
        c += '<path fill="' + AZUL + '" transform="translate(' + num(x + PAD) + ' ' + num(yy + 4) + ')" d="' + ESTRELA4 + '"/>';
        linhas.forEach((l) => { c += G.texto(FONTE.corpo, l, x + PAD + 28, yy + 16, 16.5, 0, 'fill="' + AZUL + '"'); yy += 25; });
        yy += 10;
      });
    });
    y += h + GAP;
  }
  return { s: c, fim: y + 20 };
}

// ------------------------------------------------------------------ 3. o que já fiz: a galáxia de projetos com o passeio da nave
function projetos(G, y0, jaTem) {
  const cab = cabeca(G, y0, 'O QUE JÁ FIZ', 'Projetos em órbita', 'Cada sol é um tipo de trabalho e cada planeta, um projeto. A nave passa por todos e o painel mostra o que foi criado.');
  const K = 1;
  const TOPO = cab.fim + 52;
  const P = montarPasseio(G, site, { topoTam: 12.5, painelAlt: 470, jaTem: jaTem });
  let c = cab.s;
  const topoH = 12.5 * 1.5 + 13;
  c += '<g transform="translate(' + X + ' ' + num(TOPO - 8 - topoH) + ')">' + P.topo + '</g>';
  c += '<g transform="translate(' + X + ' ' + num(TOPO) + ') scale(' + num(K, 5) + ')">' + P.palco + '</g>';
  c += '<g transform="translate(' + (BW - X - 528) + ' ' + num(TOPO) + ')">' + P.painel + '</g>';
  return { s: c, defs: P.defs, fim: Math.max(TOPO + 400 * K + 60, TOPO + P.painelAlt) + 40 };
}

// ------------------------------------------------------------------ 4. trajetória: estudos em cima, carreira embaixo
function trajetoria(G, y0) {
  const cab = cabeca(G, y0, 'TRAJETÓRIA', 'Da eletrônica ao teste', 'Estudos em cima, carreira embaixo. A nave percorre o caminho até hoje.');
  let c = cab.s;
  const itens = PERFIL.trajetoria;
  const X0 = 250;
  const X1 = 1130;
  const passo = (X1 - X0) / (itens.length - 1);
  const YE = cab.fim + 110;
  const YC = YE + 44;
  const pts = itens.map((it, i) => [X0 + i * passo, it.tipo === 'estudos' ? YE : YC]);
  c += G.texto(FONTE.mono, 'ESTUDOS', X, YE - 54, 12, 0.14, 'fill="' + AZUL + '"');
  c += G.texto(FONTE.mono, 'CARREIRA', X, YC + 50, 12, 0.14, 'fill="' + AZUL + '"');
  const todos = [[X, (YE + YC) / 2]].concat(pts, [[BW - X, (YE + YC) / 2 - 10]]);
  let d = 'M' + num(todos[0][0]) + ' ' + num(todos[0][1]);
  for (let i = 0; i < todos.length - 1; i++) {
    const p0 = todos[Math.max(0, i - 1)];
    const p1 = todos[i];
    const p2 = todos[i + 1];
    const p3 = todos[Math.min(todos.length - 1, i + 2)];
    d += 'C' + num(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + num(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + num(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + num(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + num(p2[0]) + ' ' + num(p2[1]);
  }
  c += '<path id="caminho" d="' + d + '" fill="none" stroke="' + AZUL + '" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>';
  const DUR = 16;
  const op = 'values="0;1;1;0" keyTimes="0;.06;.92;1" dur="' + DUR + 's" repeatCount="indefinite"';
  c += '<use href="#caminho" fill="none" stroke="' + LARANJA + '" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="90 4000" opacity="0">' +
    '<animate attributeName="stroke-dashoffset" values="90;-1300" dur="' + DUR + 's" repeatCount="indefinite"/><animate attributeName="opacity" ' + op + '/></use>';
  itens.forEach(function (it, i) {
    const [x, y] = pts[i];
    const cima = it.tipo === 'estudos';
    const cor = it.hoje ? LARANJA : AZUL;
    c += '<circle cx="' + num(x) + '" cy="' + y + '" r="7" fill="' + CREME + '" stroke="' + cor + '" stroke-width="2.4"/><circle cx="' + num(x) + '" cy="' + y + '" r="3" fill="' + cor + '"/>';
    const blocos = [{ f: FONTE.titulo, t: it.ano.toUpperCase(), tam: 19, esp: -0.01, cor: cor, h: 24, caixa: it.hoje }];
    quebrar(FONTE.corpo, it.titulo, 16, passo - 20).forEach((l) => blocos.push({ f: FONTE.corpo, t: l, tam: 16, esp: 0, cor: AZUL, h: 20 }));
    blocos.push({ f: FONTE.mono, t: it.onde.toUpperCase(), tam: 11.5, esp: 0.06, cor: SUAVE, h: 17 });
    const altura = blocos.reduce((a, b) => a + b.h, 0);
    let yy = cima ? y - 18 - altura : y + 22;
    blocos.forEach(function (b) {
      const base = yy + b.h - 5;
      if (b.caixa) {
        const w = medir(b.f, b.t, b.tam, b.esp) + 16;
        c += '<rect x="' + num(x - w / 2) + '" y="' + num(yy - 2) + '" width="' + num(w) + '" height="' + (b.h + 2) + '" fill="' + LARANJA + '" transform="rotate(-2 ' + num(x) + ' ' + num(yy + b.h / 2) + ')"/>';
        c += G.centro(b.f, b.t, x, base, b.tam, b.esp, 'fill="' + CREME + '"');
      } else c += G.centro(b.f, b.t, x, base, b.tam, b.esp, 'fill="' + b.cor + '"');
      yy += b.h;
    });
  });
  c += '<g opacity="0"><animateMotion dur="' + DUR + 's" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#caminho"/></animateMotion><animate attributeName="opacity" ' + op + '/>' +
    '<g transform="scale(.95) translate(-22 -12)"><g transform="translate(9 0)"><g><animateTransform attributeName="transform" type="scale" values="1 1;.55 1" dur=".14s" calcMode="discrete" repeatCount="indefinite"/><path d="M0 8-9 12l9 4z" fill="' + LARANJA + '"/></g></g>' +
    '<path d="' + CORPO_NAVE + '" fill="' + AZUL + '"/><circle cx="31" cy="12" r="3.2" fill="' + CREME + '"/><path d="M15 9h8v6h-8z" fill="' + LARANJA + '"/></g></g>';
  let y = YC + 130;
  c += G.texto(FONTE.mono, 'FERRAMENTAS', X, y + 20, 12, 0.14, 'fill="' + AZUL + '"');
  const f = etiquetas(G, PERFIL.ferramentas, X + 160, y, 12.5, { padX: 12, gap: 8 });
  c += f.s;
  y += f.h + 16;
  c += G.texto(FONTE.mono, 'CERTIFICAÇÕES', X, y + 20, 12, 0.14, 'fill="' + LARANJA + '"');
  c += etiquetas(G, PERFIL.certificacoes, X + 160, y, 12.5, { padX: 12, gap: 8, cor: LARANJA }).s;
  return { s: c, fim: y + f.h + 60 };
}

// ------------------------------------------------------------------ 5. rodapé: assinatura, o serviço bem discreto e a vaquinha
// (sem chamada de contato: o perfil mostra quem eu sou e o que já fiz, não é procura de emprego)
function rodape(G, y0) {
  let c = '';
  let yf = y0 + 76;
  const ass = 'LF';
  const tam = 40;
  const wa = medir(FONTE.titulo, ass, tam, -0.01);
  const ax = BW / 2 - (wa + medir(FONTE.titulo, '.', tam)) / 2;
  c += '<g transform="translate(' + num(ax - 26) + ' ' + num(yf - 30) + ')"><path d="M8 66C40 74 96 72 124 46C132 38 134 24 128 18" fill="none" stroke="' + AZUL + '" stroke-width="3" stroke-linecap="round" opacity=".75"/>' +
    '<circle cx="128" cy="18" r="9" fill="' + AZUL + '" opacity=".25"/><circle cx="128" cy="18" r="4" fill="' + AZUL + '"/></g>';
  c += G.texto(FONTE.titulo, ass, ax, yf + 22, tam, -0.01, 'fill="' + AZUL + '"') + G.texto(FONTE.titulo, '.', ax + wa, yf + 22, tam, 0, 'fill="' + LARANJA + '"');
  // o site dos serviços não entra aqui: dentro de uma imagem ele não seria clicável, então ele fica logo abaixo,
  // no README, como link de verdade
  yf += 58;
  c += G.centro(FONTE.mono, '© 2026 ' + PERFIL.nome.join(' ').toUpperCase(), BW / 2, yf, 12.5, 0.12, 'fill="' + AZUL + '"');
  const fim = yf + 52;
  // a vaquinha do rodapé do site, pastando em cima da moldura
  const k = 0.42;
  c += '<g transform="translate(1090 ' + num(fim - 92 * k + 1) + ') scale(' + k + ')"><use href="#grama" x="6" y="76" width="24" height="17.4"/>' +
    '<g transform="translate(83 90)"><g><animateTransform attributeName="transform" type="rotate" values="0;-3;0;0" keyTimes="0;.3;.6;1" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1;.42 0 .58 1;0 0 1 1"/>' +
    '<use href="#vaca" x="-61" y="-78" width="122" height="78"/></g></g></g>';
  return { s: c, fim: fim };
}

// ------------------------------------------------------------------ a página inteira
function pagina() {
  const G = new Glifos();
  const jaTem = new Set();
  let corpo = '';
  let defs = site.definicoes('href="#i-globe" href="#i-burst" href="#i-atom" href="#i-orbit" href="#grama"', jaTem) + site.simbolo('vaca.svg', 'vaca');
  const a = apresentacao(G);
  corpo += a.s;
  let y = a.fim;
  corpo += faixa(1, y);
  y += 120;
  const q = qualidades(G, y);
  corpo += q.s;
  y = q.fim;
  corpo += faixa(2, y);
  y += 120;
  const p = projetos(G, y, jaTem);
  corpo += p.s;
  defs += p.defs;
  y = p.fim;
  corpo += faixa(3, y);
  y += 120;
  const t = trajetoria(G, y);
  corpo += t.s;
  y = t.fim;
  corpo += faixa(4, y);
  y += 120;
  const c = rodape(G, y);
  corpo += c.s;
  const H = c.fim + M;
  // moldura de pôster da página inteira, com a etiqueta no topo
  const tam = 13;
  const esp = 0.14;
  const etq = 'PORTFÓLIO';
  const tw = medir(FONTE.mono, etq, tam, esp);
  const bw = tw + 48;
  const bx = BW / 2 - bw / 2;
  const moldura = '<rect width="' + BW + '" height="' + num(H) + '" rx="18" fill="' + CREME + '"/>' +
    '<rect x="' + M + '" y="' + M + '" width="' + (BW - 2 * M) + '" height="' + num(H - 2 * M) + '" fill="none" stroke="' + AZUL + '" stroke-width="2"/>' +
    '<path d="M' + num(bx) + ' ' + M + 'V' + (M + 36) + 'H' + num(bx + bw) + 'V' + M + '" fill="' + CREME + '" stroke="' + AZUL + '" stroke-width="2"/>' +
    G.texto(FONTE.mono, etq, BW / 2 - tw / 2, M + 18 + 4.6, tam, esp, 'fill="' + AZUL + '"');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + BW + ' ' + num(H) + '" width="' + BW + '" height="' + num(H) + '" role="img" aria-labelledby="t">' +
    '<title id="t">' + descricao().replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</title><defs>' + G.defs() + defs + '</defs>' + moldura + corpo + '</svg>';
}

function descricao() {
  return 'Portfólio de ' + PERFIL.nome.join(' ') + ', ' + PERFIL.funcao + '. ' + PERFIL.bio +
    ' Qualidades: ' + PERFIL.qualidades.map((q) => q.titulo).join('; ') + '.' +
    ' Projetos: ' + site.PROJETOS.map((p) => p.nome).join(', ') + ', numa galáxia que uma nave percorre.' +
    ' Trajetória: ' + PERFIL.trajetoria.map((it) => it.ano + ', ' + it.titulo + ', ' + it.onde).join('; ') + '.';
}

function readme() {
  const alt = descricao().replace(/"/g, '&quot;');
  const contatos = PERFIL.contatos.filter((c) => c[0] !== 'GitHub').map((c) => '<a href="' + c[2] + '">' + c[0] + '</a>').join(' · ');
  // dentro de <picture> o GitHub não põe o link automático que abriria o arquivo da imagem no repositório,
  // então a página animada não é clicável; os links de verdade ficam embaixo
  return '<picture><img src="img/portfolio.svg" width="100%" alt="' + alt + '"></picture>\n\n' +
    '<p align="center">' + contatos + '<br><sub>' + PERFIL.servicos.texto + ': <a href="' + PERFIL.servicos.url + '">' + PERFIL.servicos.site + '</a></sub></p>\n';
}

const IMG = path.join(PERFIL_DIR, 'img');
fs.mkdirSync(IMG, { recursive: true });
const svg = pagina();
fs.writeFileSync(path.join(IMG, 'portfolio.svg'), svg);
console.log('img/portfolio.svg', (svg.length / 1024).toFixed(1) + ' KB');
fs.writeFileSync(path.join(PERFIL_DIR, 'README.md'), readme());
console.log('README.md');
