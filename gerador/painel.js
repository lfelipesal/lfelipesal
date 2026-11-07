/* O painel ao lado do palco, como o do site: o mapa da galáxia e, para cada projeto, categoria, número, nome,
   cliente, prévia da tela, resumo e o que foi criado. Cada estado é um grupo; o passeio decide quando aparece. */
'use strict';
const { FONTE, num, medir, quebrar, altCaixa } = require('./texto');

const AZUL = '#1E3BD8';
const LARANJA = '#FF5A36';
const CREME = '#F4ECD6';
const PAPEL2 = '#EDE3C6';
const SUAVE = '#3A4CA8';

const PW = 520;
const PAD_X = 24;
const PAD_Y = 22;
const CW = PW - 2 * PAD_X;

// caixa com texto mono centrado (pílula, chips, etiquetas)
function etiqueta(G, f, txt, x, y, tam, esp, padX, padY, borda, cor, fundo, corTexto) {
  const tw = medir(f, txt, tam, esp) + esp * tam;
  const w = tw + 2 * padX + 2 * borda;
  const h = tam * 1.5 + 2 * padY + 2 * borda;
  const s = '<rect x="' + num(x + borda / 2) + '" y="' + num(y + borda / 2) + '" width="' + num(w - borda) + '" height="' + num(h - borda) + '" fill="' + (fundo || 'none') + '" stroke="' + cor + '" stroke-width="' + borda + '"/>' +
    G.texto(f, txt, x + borda + padX, y + h / 2 + altCaixa(f, tam) / 2, tam, esp, 'fill="' + (corTexto || cor) + '"');
  return { s: s, w: w, h: h };
}
// chips em linhas, como o flex-wrap do site
function chips(G, lista, x, y, larg, cor) {
  let cx = x;
  let cy = y;
  let s = '';
  let h = 0;
  lista.forEach(function (c) {
    const t = c.toUpperCase();
    const tam = 11.5;
    const w = medir(FONTE.mono, t, tam, 0.05) + 0.05 * tam + 2 * 9 + 3;
    if (cx > x && cx + w > x + larg) { cx = x; cy += h + 6; }
    const e = etiqueta(G, FONTE.mono, t, cx, cy, tam, 0.05, 9, 3, 1.5, cor);
    s += e.s;
    h = e.h;
    cx += e.w + 6;
  });
  return { s: s, fim: cy + h };
}
// título que encolhe até caber; se nem assim couber, quebra em duas linhas
function titulo(G, txt, x, y, larg, tam, cor) {
  const t = txt.toUpperCase();
  let k = tam;
  while (k > 22 && medir(FONTE.titulo, t, k, -0.01) > larg) k -= 0.5;
  const linhas = medir(FONTE.titulo, t, k, -0.01) > larg ? quebrar(FONTE.titulo, t, k, larg, -0.01) : [t];
  let s = '';
  linhas.forEach(function (l, i) { s += G.texto(FONTE.titulo, l, x, y + 0.885 * k + i * k * 1.08, k, -0.01, 'fill="' + cor + '"'); });
  return { s: s, fim: y + linhas.length * k * 1.08 };
}

function moldura(h, cor) {
  return '<rect x="8" y="8" width="' + PW + '" height="' + num(h) + '" fill="' + cor + '"/>' +
    '<rect x="1" y="1" width="' + (PW - 2) + '" height="' + num(h - 2) + '" fill="' + PAPEL2 + '" stroke="' + cor + '" stroke-width="2"/>';
}

// estado de um projeto
function painelProjeto(G, site, k, total, altura) {
  const p = site.PROJETOS[k];
  const cor = site.quente(p) ? LARANJA : AZUL;
  const suave = site.quente(p) ? LARANJA : SUAVE;
  let s = '';
  let y = PAD_Y;
  const pill = etiqueta(G, FONTE.mono, p.categoria.toUpperCase(), PAD_X, y, 12, 0.12, 18, 6, 2, cor);
  s += pill.s;
  const n = (v) => (v < 9 ? '0' : '') + (v + 1);
  const cont = n(k) + ' / ' + n(total - 1);
  s += G.texto(FONTE.titulo, cont, PW - PAD_X - medir(FONTE.titulo, cont, 17), y + pill.h / 2 + altCaixa(FONTE.titulo, 17) / 2, 17, 0, 'fill="' + cor + '"');
  y += pill.h + 14;
  const tt = titulo(G, p.nome, PAD_X, y, CW, 30, cor);
  s += tt.s;
  y = tt.fim + 6;
  quebrar(FONTE.mono, (p.cliente + ' · ' + p.ano).toUpperCase(), 12.5, CW, 0.06).forEach(function (l) {
    s += G.texto(FONTE.mono, l, PAD_X, y + 12.5, 12.5, 0.06, 'fill="' + suave + '"');
    y += 12.5 * 1.45;
  });
  y += 12;
  // prévia de tela e resumo lado a lado
  const mw = 214;
  const mh = (mw * 216) / 330;
  s += '<rect x="' + num(PAD_X + 1) + '" y="' + num(y + 1) + '" width="' + (mw - 2) + '" height="' + num(mh - 2) + '" fill="' + CREME + '" stroke="' + cor + '" stroke-width="2"/>' +
    '<svg x="' + num(PAD_X + 2) + '" y="' + num(y + 2) + '" width="' + (mw - 4) + '" height="' + num(mh - 4) + '" viewBox="0 0 330 216">' + site.previa(p) + '</svg>';
  const rx = PAD_X + mw + 18;
  const rw = PW - PAD_X - rx;
  let rt = 14.5;
  let linhas = quebrar(FONTE.corpo, p.resumo, rt, rw);
  while (linhas.length * rt * 1.42 > 250 && rt > 12.5) { rt -= 0.5; linhas = quebrar(FONTE.corpo, p.resumo, rt, rw); }
  linhas.forEach(function (l, i) { s += G.texto(FONTE.corpo, l, rx, y + rt * 1.05 + i * rt * 1.42, rt, 0, 'fill="' + suave + '"'); });
  y = Math.max(y + mh, y + linhas.length * rt * 1.42) + 16;
  s += G.texto(FONTE.mono, 'O QUE FOI CRIADO', PAD_X, y + 12, 12, 0.12, 'fill="' + cor + '"');
  y += 12 + 9;
  const ch = chips(G, p.criado, PAD_X, y, CW, cor);
  s += ch.s;
  y = ch.fim + PAD_Y;
  return { s: s, h: Math.max(y, altura || 0), cor: cor };
}

// estado da galáxia: o mapa com os sistemas e os projetos de cada um
function painelMapa(G, site, altura) {
  let s = '';
  let y = PAD_Y;
  const sistemas = site.SISTEMAS.map((x, i) => i).filter((i) => site.projetosDe(i).length);
  const pill = etiqueta(G, FONTE.mono, 'MAPA DA GALÁXIA', PAD_X, y, 12, 0.12, 18, 6, 2, AZUL);
  s += pill.s;
  const cont = sistemas.length + ' sistemas';
  s += G.texto(FONTE.titulo, cont, PW - PAD_X - medir(FONTE.titulo, cont, 17), y + pill.h / 2 + altCaixa(FONTE.titulo, 17) / 2, 17, 0, 'fill="' + AZUL + '"');
  y += pill.h + 14;
  const tt = titulo(G, site.PROJETOS.length + ' projetos em órbita', PAD_X, y, CW, 30, AZUL);
  s += tt.s;
  y = tt.fim + 10;
  quebrar(FONTE.corpo, 'Cada sol reúne um tipo de trabalho e cada planeta é um projeto. A nave passa por todos e o painel mostra o que foi criado em cada um.', 15, CW).forEach(function (l) {
    s += G.texto(FONTE.corpo, l, PAD_X, y + 15, 15, 0, 'fill="' + SUAVE + '"');
    y += 15 * 1.45;
  });
  y += 12;
  sistemas.forEach(function (i) {
    const cor = site.SISTEMAS[i].braco ? LARANJA : AZUL;
    const nomes = site.projetosDe(i).map((k) => site.PROJETOS[k].nome).join(' · ');
    const h = 58;
    s += '<rect x="' + (PAD_X + 1) + '" y="' + num(y + 1) + '" width="' + (CW - 2) + '" height="' + (h - 2) + '" fill="' + CREME + '" stroke="' + cor + '" stroke-width="2"/>';
    s += G.texto(FONTE.titulo, site.SISTEMAS[i].nome, PAD_X + 16, y + 26, 16, 0, 'fill="' + cor + '"');
    s += G.texto(FONTE.mono, nomes, PAD_X + 16, y + 45, 12, 0.04, 'fill="' + cor + '"');
    y += h + 8;
  });
  y += 8;
  const fim = Math.max(y + 60, (altura || 0) - PAD_Y - 40);
  s += '<path d="M' + PAD_X + ' ' + num(fim) + 'H' + (PW - PAD_X) + '" stroke="' + AZUL + '" stroke-width="1.5" stroke-dasharray="4 4"/>';
  // só um aviso em texto, sem cara de botão: numa imagem nada é clicável
  const txt = 'A NAVE JÁ VAI SAIR';
  const tw = medir(FONTE.mono, txt, 12, 0.12);
  const by = fim + 14;
  s += G.texto(FONTE.mono, txt, PW - PAD_X - tw, by + 20, 12, 0.12, 'fill="' + AZUL + '"') +
    '<path fill="' + LARANJA + '" transform="translate(' + num(PW - PAD_X - tw - 22) + ' ' + num(by + 8) + ') scale(.8)" d="M7.5 0 9 6 15 7.5 9 9 7.5 15 6 9 0 7.5 6 6Z"/>';
  return { s: s, h: Math.max(by + 32 + PAD_Y, altura || 0), cor: AZUL };
}

module.exports = { painelProjeto, painelMapa, moldura, etiqueta, PW };
