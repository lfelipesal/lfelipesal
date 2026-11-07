/* Gera o perfil do GitHub a partir do site da SAL.TECH (orbit.js e index.html):
     img/apresentacao.svg  quem eu sou, no estilo da abertura do site
     img/passeio.svg       a galáxia de projetos com o passeio da nave e o painel de cada projeto
     img/trajetoria.svg    estudos e carreira, ferramentas e certificações
     README.md             as três imagens, os links dos projetos, os testes automatizados e os contatos
   Uso, dentro desta pasta: npm i  e depois  node gerar.js [pasta-do-perfil] [pasta-do-site]
   Sem argumentos, grava na pasta de cima e lê o site em ../../saltech.
   Precisa do Python com fontTools (python -m pip install fonttools) para embutir as fontes nas imagens. */
'use strict';
const fs = require('fs');
const path = require('path');
const { FONTE, num, medir, quebrar, Glifos, altCaixa } = require('./texto');
const { lerSite } = require('./site');
const { montarPasseio } = require('./passeio');

const PERFIL_DIR = process.argv[2] || path.join(__dirname, '..');
const SITE = process.argv[3] || path.join(__dirname, '..', '..', 'saltech');
const site = lerSite(SITE);

// ------------------------------------------------------------------ quem eu sou (do painel "quem pilota" do site)
const PERFIL = {
  nome: ['Luiz Felipe', 'Alves'],
  funcao: 'Analista de testes e desenvolvedor · Engenharia de Sistemas na UFMG',
  bio: 'Há quase quatro anos testo e automatizo sistemas web e APIs. Hoje uso esse olhar pra construir: cada sistema já nasce pensado pra não quebrar.',
  temas: ['Qualidade de software', 'Testes automatizados', 'Sistemas web', 'Apps', 'Automações'],
  trajetoria: [
    { ano: '2017', tipo: 'estudos', titulo: 'Técnico em Eletrônica', onde: 'CEFET-MG' },
    { ano: '2021', tipo: 'estudos', titulo: 'Engenharia de Sistemas', onde: 'UFMG' },
    { ano: '2022', tipo: 'carreira', titulo: 'Quality Engineer', onde: 'Sinqia' },
    { ano: '2025', tipo: 'carreira', titulo: 'Analista de Qualidade', onde: 'TOTVS' },
    { ano: '2025', tipo: 'carreira', titulo: 'Analista de Teste Pleno', onde: 'Base2, até hoje' },
    { ano: 'Hoje', tipo: 'carreira', titulo: 'Fundador', onde: 'SAL.TECH', hoje: true }
  ],
  ferramentas: ['JavaScript', 'TypeScript', 'C/C++', 'Python', 'Cypress', 'Selenium', 'Git', 'Figma', 'SQL', 'Scrum'],
  certificacoes: ['ISTQB CTFL', 'Web Full Stack · curso.dev'],
  // repositórios públicos de cada projeto do site (o que não está aqui aponta para a galáxia do site)
  codigo: { 'R-Type': 'https://github.com/lfelipesal/R-type', 'Gestão de portfólios': 'https://github.com/lfelipesal/Pesquisa_Operacional_UFMG' },
  testes: [
    ['TesteAPI_JavaRestAssured', 'testes da API Petstore com Java, RestAssured e JUnit'],
    ['testAut-Cypress', 'teste de interface com Cypress numa loja online, do carrinho até antes de fechar a compra'],
    ['Teste_Wisely', 'testes automatizados do projeto Wisely, em Java']
  ],
  contatos: [['LinkedIn', 'https://www.linkedin.com/in/lfelipesal'], ['salltech.com.br', 'https://www.salltech.com.br']]
};

const AZUL = '#1E3BD8';
const LARANJA = '#FF5A36';
const CREME = '#F4ECD6';
const SUAVE = '#3A4CA8';
const BW = 1280;
const M = 14;
const BRILHO = 'M50 0C54 38 62 46 100 50C62 54 54 62 50 100C46 62 38 54 0 50C38 46 46 38 50 0Z';

function documento(G, h, titulo, defs, corpo) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + BW + ' ' + num(h) + '" width="' + BW + '" height="' + num(h) + '" role="img" aria-labelledby="t">' +
    '<title id="t">' + titulo + '</title><defs>' + G.defs() + defs + '</defs>' + corpo + '</svg>';
}
// moldura de pôster com a etiqueta no topo, como a página do site
function moldura(G, h, etiqueta) {
  const tam = 13;
  const esp = 0.14;
  const tw = medir(FONTE.mono, etiqueta, tam, esp);
  const bw = tw + 48;
  const x = BW / 2 - bw / 2;
  return '<rect width="' + BW + '" height="' + num(h) + '" rx="18" fill="' + CREME + '"/>' +
    '<rect x="' + M + '" y="' + M + '" width="' + (BW - 2 * M) + '" height="' + num(h - 2 * M) + '" fill="none" stroke="' + AZUL + '" stroke-width="2"/>' +
    '<path d="M' + num(x) + ' ' + M + 'V' + (M + 36) + 'H' + num(x + bw) + 'V' + M + '" fill="' + CREME + '" stroke="' + AZUL + '" stroke-width="2"/>' +
    G.texto(FONTE.mono, etiqueta, BW / 2 - tw / 2, M + 18 + 4.6, tam, esp, 'fill="' + AZUL + '"');
}
function sobrancelha(G, txt, x, y) {
  return '<path fill="' + AZUL + '" transform="translate(' + x + ' ' + (y - 13) + ') scale(.16)" d="' + BRILHO + '"/>' +
    G.texto(FONTE.mono, txt, x + 26, y, 13, 0.14, 'fill="' + AZUL + '"');
}
function titulo2(G, txt, x, y, tam) {
  return G.texto(FONTE.titulo, txt.toUpperCase(), x, y, tam, -0.01, 'fill="' + AZUL + '"');
}
// etiquetas em linha (como as do site), centradas em cx ou começando em x
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
    s += '<rect x="' + num(cx + 0.75) + '" y="' + num(y + 0.75) + '" width="' + num(larg[i] - 1.5) + '" height="' + num(h - 1.5) + '" fill="' + (o.fundo || 'none') + '" stroke="' + (o.cor || AZUL) + '" stroke-width="1.5"/>' +
      G.texto(FONTE.mono, t.toUpperCase(), cx + padX, y + h / 2 + altCaixa(FONTE.mono, tam) / 2, tam, 0.1, 'fill="' + (o.cor || AZUL) + '"');
    cx += larg[i] + gap;
  });
  return { s: s, fim: cx - gap, h: h };
}
// brilho que pisca como o .twinkle do site (2,8 s, de 70% a 100%, girando 45°)
function brilho(cx, cy, tam, cor, atraso) {
  const sp = '.42 0 .58 1;.42 0 .58 1';
  return '<g transform="translate(' + cx + ' ' + cy + ')"><g>' +
    '<animateTransform attributeName="transform" type="scale" values=".7;1;.7" dur="2.8s" begin="' + atraso + 's" repeatCount="indefinite" calcMode="spline" keySplines="' + sp + '"/>' +
    '<animateTransform attributeName="transform" type="rotate" values="0;45;0" dur="2.8s" begin="' + atraso + 's" repeatCount="indefinite" calcMode="spline" keySplines="' + sp + '" additive="sum"/>' +
    '<path fill="' + cor + '" transform="scale(' + tam / 100 + ') translate(-50 -50)" d="' + BRILHO + '"/></g></g>';
}

// ------------------------------------------------------------------ apresentação: a abertura do site, com o meu nome
function svgApresentacao() {
  const G = new Glifos();
  const H = 560;
  const CXB = BW / 2;
  let c = moldura(G, H, 'PORTFÓLIO');
  // enfeites da abertura do site: globo e estrela girando devagar, átomo, brilhos e a órbita com dois pontos
  const girar = (seg, rev) => '<animateTransform attributeName="transform" type="rotate" from="0" to="' + (rev ? -360 : 360) + '" dur="' + seg + 's" repeatCount="indefinite"/>';
  c += '<g transform="translate(130 160)" color="' + AZUL + '"><g>' + girar(40) + '<use href="#i-globe" x="-66" y="-66" width="132" height="132"/></g></g>';
  c += '<g transform="translate(1136 352)" color="' + AZUL + '"><g>' + girar(40, true) + '<use href="#i-burst" x="-48" y="-48" width="96" height="96"/></g></g>';
  c += '<g color="' + AZUL + '"><use href="#i-atom" x="104" y="392" width="96" height="96"/></g>';
  c += brilho(1140, 112, 62, AZUL, 0) + brilho(1188, 182, 30, LARANJA, -1.2);
  c += '<g transform="translate(1072 456)"><g transform="rotate(-8 80 35)"><path id="orbita-heroi" d="M4 35a76 28 0 1 0 152 0a76 28 0 1 0 -152 0" fill="none" stroke="' + AZUL + '" stroke-width="1.6"/>' +
    '<circle r="4.5" fill="' + AZUL + '"><animateMotion dur="14s" repeatCount="indefinite"><mpath href="#orbita-heroi"/></animateMotion></circle>' +
    '<circle r="4.5" fill="' + LARANJA + '"><animateMotion dur="14s" begin="-7s" repeatCount="indefinite"><mpath href="#orbita-heroi"/></animateMotion></circle></g></g>';
  // "Oi, eu sou o" entre dois brilhos
  const oi = 'OI, EU SOU O';
  const wOi = medir(FONTE.mono, oi, 15, 0.22);
  c += G.centro(FONTE.mono, oi, CXB, 116, 15, 0.22, 'fill="' + AZUL + '"');
  c += '<path fill="' + AZUL + '" transform="translate(' + num(CXB - wOi / 2 - 30) + ' 102) scale(.17)" d="' + BRILHO + '"/>';
  c += '<path fill="' + LARANJA + '" transform="translate(' + num(CXB + wOi / 2 + 13) + ' 102) scale(.17)" d="' + BRILHO + '"/>';
  // nome em duas linhas, a segunda na caixa azul inclinada, com o ponto laranja
  const T = 86;
  const topo = 136;
  const b1 = topo + 0.885 * T;
  c += G.centro(FONTE.titulo, PERFIL.nome[0].toUpperCase(), CXB, b1, T, -0.01, 'fill="' + AZUL + '"');
  const n2 = PERFIL.nome[1].toUpperCase();
  const w2 = medir(FONTE.titulo, n2, T, -0.01);
  const pad = 0.18 * T;
  const wPonto = medir(FONTE.titulo, '.', T);
  const bw = w2 + 2 * pad;
  const bx = CXB - (bw + wPonto) / 2;
  const by = topo + 1.02 * T;
  const bh = 1.06 * T;
  const b2 = by + 0.885 * T;
  c += '<g transform="rotate(-2 ' + num(bx + bw / 2) + ' ' + num(by + bh / 2) + ')"><rect x="' + num(bx) + '" y="' + num(by) + '" width="' + num(bw) + '" height="' + num(bh) + '" fill="' + AZUL + '"/>' +
    G.texto(FONTE.titulo, n2, bx + pad, b2, T, -0.01, 'fill="' + CREME + '"') + '</g>';
  c += G.texto(FONTE.titulo, '.', bx + bw + 2, b2, T, 0, 'fill="' + LARANJA + '"');
  // função, bio e temas
  c += G.centro(FONTE.corpo, PERFIL.funcao, CXB, 384, 24, 0, 'fill="' + AZUL + '"');
  quebrar(FONTE.corpo, PERFIL.bio, 19, 760).forEach((l, i) => { c += G.centro(FONTE.corpo, l, CXB, 422 + i * 29, 19, 0, 'fill="' + SUAVE + '"'); });
  c += etiquetas(G, PERFIL.temas, CXB, 478, 13, { centro: true }).s;
  const defs = site.definicoes('href="#i-globe" href="#i-burst" href="#i-atom"');
  return documento(G, H, PERFIL.nome.join(' ') + ': ' + PERFIL.funcao + '. ' + PERFIL.bio, defs, c);
}

// ------------------------------------------------------------------ a galáxia de projetos com o passeio da nave
function svgPasseio() {
  const G = new Glifos();
  const X = 44;
  const TOPO = 236;
  const K = 640 / 600;
  const P = montarPasseio(G, site, { topoTam: 12.5, painelAlt: 470 });
  let corpo = '';
  corpo += sobrancelha(G, 'TRABALHOS', X, 86);
  corpo += titulo2(G, 'A galáxia de projetos', X, 140, 40);
  corpo += G.texto(FONTE.corpo, 'Cada sol é um tipo de trabalho e cada planeta, um projeto em órbita. A nave passa por todos.', X, 176, 18, 0, 'fill="' + SUAVE + '"');
  const topoH = 12.5 * 1.5 + 13;
  corpo += '<g transform="translate(' + X + ' ' + num(TOPO - 8 - topoH) + ')">' + P.topo + '</g>';
  corpo += '<g transform="translate(' + X + ' ' + TOPO + ') scale(' + num(K, 5) + ')">' + P.palco + '</g>';
  const PX = X + 640 + 32;
  corpo += '<g transform="translate(' + PX + ' ' + TOPO + ')">' + P.painel + '</g>';
  const h = Math.max(TOPO + 400 * K + 60, TOPO + P.painelAlt) + 34;
  const nomes = site.PROJETOS.map((p) => p.nome).join(', ');
  return documento(G, h, 'Galáxia de projetos: uma nave passa por ' + nomes + ', e o painel mostra o que foi criado em cada um', P.defs, moldura(G, h, 'PROJETOS EM ÓRBITA') + corpo);
}

// ------------------------------------------------------------------ trajetória: estudos em cima, carreira embaixo
function svgTrajetoria() {
  const G = new Glifos();
  const X = 44;
  let c = '';
  c += sobrancelha(G, 'SOBRE MIM', X, 86);
  c += titulo2(G, 'Do teste ao código', X, 140, 40);
  c += G.texto(FONTE.corpo, 'Comecei testando os sistemas dos outros. Hoje construo os meus, com o mesmo cuidado para não quebrar.', X, 176, 18, 0, 'fill="' + SUAVE + '"');
  const itens = PERFIL.trajetoria;
  const X0 = 230;
  const X1 = 1150;
  const passo = (X1 - X0) / (itens.length - 1);
  const YE = 292;
  const YC = 336;
  const pts = itens.map((it, i) => [X0 + i * passo, it.tipo === 'estudos' ? YE : YC]);
  c += G.texto(FONTE.mono, 'ESTUDOS', X, YE - 54, 12, 0.14, 'fill="' + AZUL + '"');
  c += G.texto(FONTE.mono, 'CARREIRA', X, YC + 50, 12, 0.14, 'fill="' + AZUL + '"');
  // caminho tracejado suave passando por todos os pontos, do começo ao fim da tela
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
  // a nave percorre a trajetória com o rastro laranja, aparecendo no começo e sumindo no fim
  const DUR = 16;
  const op = 'values="0;1;1;0" keyTimes="0;.06;.92;1" dur="' + DUR + 's" repeatCount="indefinite"';
  c += '<use href="#caminho" fill="none" stroke="' + LARANJA + '" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="90 4000" opacity="0">' +
    '<animate attributeName="stroke-dashoffset" values="90;-1300" dur="' + DUR + 's" repeatCount="indefinite"/><animate attributeName="opacity" ' + op + '/></use>';
  itens.forEach(function (it, i) {
    const [x, y] = pts[i];
    const cima = it.tipo === 'estudos';
    const cor = it.hoje ? LARANJA : AZUL;
    c += '<circle cx="' + num(x) + '" cy="' + y + '" r="7" fill="' + CREME + '" stroke="' + cor + '" stroke-width="2.4"/><circle cx="' + num(x) + '" cy="' + y + '" r="3" fill="' + cor + '"/>';
    const linhas = quebrar(FONTE.corpo, it.titulo, 16, passo - 16);
    const ano = it.ano.toUpperCase();
    const blocos = [];
    blocos.push({ f: FONTE.titulo, t: ano, tam: 19, esp: -0.01, cor: cor, h: 24, caixa: it.hoje });
    linhas.forEach((l) => blocos.push({ f: FONTE.corpo, t: l, tam: 16, esp: 0, cor: AZUL, h: 20 }));
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
  const CORPO = 'M9 5h4l4-5h4l-2 6h9c6 0 11 3 14 6-3 3-8 6-14 6h-9l2 6h-4l-4-5H9z';
  c += '<g opacity="0"><animateMotion dur="' + DUR + 's" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#caminho"/></animateMotion><animate attributeName="opacity" ' + op + '/>' +
    '<g transform="scale(.95) translate(-22 -12)"><g transform="translate(9 0)"><g><animateTransform attributeName="transform" type="scale" values="1 1;.55 1" dur=".14s" calcMode="discrete" repeatCount="indefinite"/><path d="M0 8-9 12l9 4z" fill="' + LARANJA + '"/></g></g>' +
    '<path d="' + CORPO + '" fill="' + AZUL + '"/><circle cx="31" cy="12" r="3.2" fill="' + CREME + '"/><path d="M15 9h8v6h-8z" fill="' + LARANJA + '"/></g></g>';
  // ferramentas e certificações
  let y = 480;
  c += G.texto(FONTE.mono, 'FERRAMENTAS', X, y + 20, 12, 0.14, 'fill="' + AZUL + '"');
  const f = etiquetas(G, PERFIL.ferramentas, X + 150, y, 12.5, { padX: 12, gap: 8 });
  c += f.s;
  y += f.h + 16;
  c += G.texto(FONTE.mono, 'CERTIFICAÇÕES', X, y + 20, 12, 0.14, 'fill="' + LARANJA + '"');
  c += etiquetas(G, PERFIL.certificacoes, X + 150, y, 12.5, { padX: 12, gap: 8, cor: LARANJA }).s;
  const H = y + f.h + 44;
  const desc = PERFIL.trajetoria.map((it) => it.ano + ': ' + it.titulo + ', ' + it.onde).join('; ');
  return documento(G, H, 'Trajetória: ' + desc + '. Ferramentas: ' + PERFIL.ferramentas.join(', ') + '. Certificações: ' + PERFIL.certificacoes.join(', '), '', moldura(G, H, 'TRAJETÓRIA') + c);
}

// ------------------------------------------------------------------ README
function readme() {
  const linha = (cel) => '| ' + cel.join(' | ') + ' |';
  const projetos = [linha(['Projeto', 'O que é', 'Onde ver']), linha(['---', '---', '---'])];
  site.SISTEMAS.forEach(function (s, i) {
    site.projetosDe(i).forEach(function (k) {
      const p = site.PROJETOS[k];
      const ver = p.site ? '[' + p.site.replace(/^https?:\/\//, '') + '](' + p.site + ')' :
        PERFIL.codigo[p.nome] ? '[código](' + PERFIL.codigo[p.nome] + ')' : '[na galáxia do site](https://www.salltech.com.br/#trabalhos)';
      projetos.push(linha(['**' + p.nome + '**', p.categoria + ' · ' + p.cliente + ' · ' + p.ano, ver]));
    });
  });
  const alt = (t) => t.replace(/"/g, '&quot;');
  return [
    '<img src="img/apresentacao.svg" width="100%" alt="' + alt(PERFIL.nome.join(' ') + ': ' + PERFIL.funcao + '. ' + PERFIL.bio) + '">',
    '',
    '<img src="img/passeio.svg" width="100%" alt="' + alt('Galáxia de projetos: uma nave passa por ' + site.PROJETOS.map((p) => p.nome).join(', ') + ', e o painel mostra o que foi criado em cada um.') + '">',
    '',
    '### Projetos',
    '',
    projetos.join('\n'),
    '',
    '### Testes automatizados',
    '',
    PERFIL.testes.map((t) => '- [' + t[0] + '](https://github.com/lfelipesal/' + t[0] + '): ' + t[1]).join('\n'),
    '',
    '<img src="img/trajetoria.svg" width="100%" alt="' + alt('Trajetória: ' + PERFIL.trajetoria.map((it) => it.ano + ', ' + it.titulo + ', ' + it.onde).join('; ') + '.') + '">',
    '',
    '### Contato',
    '',
    PERFIL.contatos.map((c) => '[' + c[0] + '](' + c[1] + ')').join(' · '),
    ''
  ].join('\n');
}

const IMG = path.join(PERFIL_DIR, 'img');
fs.mkdirSync(IMG, { recursive: true });
const so = (process.env.SO || '').split(',').filter(Boolean);
const gerar = (nome, f) => {
  if (so.length && !so.includes(nome)) return;
  const s = f();
  fs.writeFileSync(path.join(IMG, nome + '.svg'), s);
  console.log('img/' + nome + '.svg', (s.length / 1024).toFixed(1) + ' KB');
};
gerar('apresentacao', svgApresentacao);
gerar('passeio', svgPasseio);
gerar('trajetoria', svgTrajetoria);
if (!so.length) {
  fs.writeFileSync(path.join(PERFIL_DIR, 'README.md'), readme());
  console.log('README.md');
}
