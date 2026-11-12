/* ==========================================================================
   CBHTO – montagem das páginas
   Dados: dados.js (comitês, contatos, textos), noticias.js, documentos.js,
   documentos-gerais.js, galerias.js, conteudo.js, mapa.js
   ========================================================================== */
(function () {
  'use strict';
  const C = window.CONFIG || {}, COMITES = window.COMITES || [];
  const NOTICIAS = window.NOTICIAS || [], DOCS = window.DOCUMENTOS || [], GERAIS = window.DOCS_GERAIS || [];
  const GALERIAS = window.GALERIAS || [], CONT = window.CONTEUDO || {};
  const porId = {}; COMITES.forEach(c => porId[c.id] = c);
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const param = k => new URLSearchParams(location.search).get(k);
  const dataBR = d => d ? d.split('-').reverse().join('/') : '';
  const LOGO_BRANCO = 'assets/img/antigo/cbhto.png';

  /* ---------- ícones ---------- */
  const I = {
    seta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    esq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    dir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    cima: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    pasta: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/></svg>',
    baixar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
    foto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
    play: '<svg viewBox="0 0 68 48"><path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#e00"/><path d="M45 24 27 14v20z" fill="#fff"/></svg>',
    insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    face: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3c-2.8 0-4 1.7-4 4.4V11H7v4h3v9h4v-9h3l1-4h-4V8.6c0-.4.3-.6.6-.6z"/></svg>',
    yt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.8 3z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5v-.5c-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zM12 0a12 12 0 0 0-10.4 18L0 24l6.2-1.6A12 12 0 1 0 12 0z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
    fone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    local: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
  };

  /* ---------- categorias de documentos ---------- */
  const CATS_GERAIS = [
    ['atas', 'Atas', ['Atas', 'Atas de reuniões']],
    ['resolucoes', 'Resoluções e deliberações', ['Resoluções e deliberações']],
    ['legislacao', 'Legislação', ['Legislação']],
    ['camaras', 'Câmaras técnicas', ['Câmaras técnicas']],
    ['membros', 'Listas de membros', ['Listas de membros', 'Lista de membros']],
    ['planos', 'Planos de bacia', ['Planos de bacia']],
    ['publicacoes', 'Publicações', ['Publicações', 'Estudos e publicações']],
    ['acervo', 'Acervo Ci Lago (2022–2025)', []]
  ];
  const CATS_COMITE = ['Atas de reuniões', 'Resoluções e deliberações', 'Legislação', 'Câmaras técnicas', 'Listas de membros', 'Planos de bacia', 'Estudos e publicações', 'Diversos', 'Outros arquivos'];
  const docsGerais = () => GERAIS.map(d => Object.assign({ comite: 'cbhto' }, d)).concat(DOCS.filter(d => d.comite === 'cbhto'));
  const docsComite = id => DOCS.filter(d => d.comite === id);
  const anoDoc = d => d.ano && /\d{4}/.test(d.ano) ? d.ano.match(/\d{4}/)[0] : ((d.titulo + ' ' + d.arquivo).match(/(?:19|20)\d{2}/) || [''])[0];
  function tipoArq(u) {
    const e = (u.split('?')[0].match(/\.(\w+)$/) || ['', ''])[1].toLowerCase();
    if (!/^midia\//.test(u) && !e.match(/pdf|docx?|xlsx?/)) return ['link', 'LINK'];
    if (e === 'pdf') return ['', 'PDF'];
    if (/docx?|odt/.test(e)) return ['word', e.toUpperCase()];
    if (/xlsx?|ods|csv/.test(e)) return ['planilha', e.toUpperCase()];
    return ['outro', (e || 'ARQ').toUpperCase()];
  }

  /* ---------- peças reutilizáveis ---------- */
  const chip = id => { const c = porId[id]; return c ? `<a class="chip" style="--c:${c.cor}" href="comite.html?c=${c.id}">${c.sigla}</a>` : ''; };
  const fotoNoticia = n => n.imagem ? `<img src="${esc(n.imagem)}" alt="" loading="lazy">` : `<div class="foto-vazia"><img src="assets/img/antigo/cbhto-low.png" alt=""></div>`;
  function cardNoticia(n) {
    const url = 'noticia.html?id=' + n.id;
    return `<article class="card-nt"><a class="foto" href="${url}" tabindex="-1" aria-hidden="true">${fotoNoticia(n)}</a>
      <div class="corpo"><div class="meta"><span class="data">${I.cal}${dataBR(n.data)}</span>${(n.comites || []).map(chip).join('')}</div>
      <h3><a href="${url}">${esc(n.titulo)}</a></h3><p>${esc(n.resumo)}</p>
      <a class="btn btn-azul btn-sm" href="${url}">Ler mais ${I.ext}</a></div></article>`;
  }
  function cardAlbum(g) {
    return `<a class="card-album" href="galeria.html?id=${g.id}"><img src="${esc(g.fotos[0])}" alt="" loading="lazy">${chip(g.comite) ? `<span class="chip" style="--c:${(porId[g.comite] || {}).cor}">${(porId[g.comite] || {}).sigla}</span>` : ''}
      <span class="leg"><b>${esc(g.titulo)}</b><small>${I.foto.replace('<svg', '<svg width="14" height="14"')} ${g.fotos.length} fotos</small></span></a>`;
  }
  function itemDoc(d, mostrarComite) {
    const [cls, rot] = tipoArq(d.arquivo || '');
    const info = [d.descricao, mostrarComite && porId[d.comite] ? porId[d.comite].sigla : ''].filter(Boolean).join(' · ');
    return `<a class="doc" href="${esc(d.arquivo)}" target="_blank" rel="noopener"><span class="tipo ${cls}">${rot}</span>
      <span class="txt"><b>${esc(d.titulo || 'Documento')}</b>${info ? `<small>${esc(info)}</small>` : ''}</span><span class="baixar">${cls === 'link' ? I.ext : I.baixar}</span></a>`;
  }
  function listaPorAno(docs, mostrarComite) {
    if (!docs.length) return '<div class="vazio">Ainda não há documentos nesta pasta.</div>';
    const grupos = {};
    docs.forEach(d => { const a = anoDoc(d) || 'Sem data'; (grupos[a] = grupos[a] || []).push(d); });
    return Object.keys(grupos).sort((a, b) => (b === 'Sem data' ? -1 : a === 'Sem data' ? 1 : b.localeCompare(a))).map(a =>
      `<div class="ano-bloco"><h3>${I.pasta}${a} <small>(${grupos[a].length} documento${grupos[a].length > 1 ? 's' : ''})</small></h3>${grupos[a].map(d => itemDoc(d, mostrarComite)).join('')}</div>`).join('');
  }
  /* Pastas por categoria + busca + lista por ano */
  function pastas(alvo, grupos, ativo, extra) {
    // grupos: [{id, nome, docs}]
    let atual = ativo && grupos.find(g => g.id === ativo) ? ativo : (grupos.find(g => g.docs.length) || grupos[0] || {}).id;
    function desenha() {
      const g = grupos.find(x => x.id === atual);
      alvo.innerHTML = `<div class="pastas">${grupos.map(x => `<button class="pasta${x.id === atual ? ' ativa' : ''}${x.docs.length ? '' : ' vazia'}" data-p="${x.id}">${I.pasta}<span><b>${esc(x.nome)}</b><small>${x.docs.length} documento${x.docs.length === 1 ? '' : 's'}</small></span></button>`).join('')}</div>
        <div class="filtros"><input type="search" placeholder="Buscar em ${esc(g ? g.nome : 'documentos')}…" aria-label="Buscar documentos"></div><div class="lista-docs"></div>${extra ? extra(atual) : ''}`;
      const lista = $('.lista-docs', alvo), busca = $('input', alvo);
      const filtra = () => { const t = busca.value.toLowerCase(); lista.innerHTML = listaPorAno((g ? g.docs : []).filter(d => !t || (d.titulo + ' ' + (d.descricao || '')).toLowerCase().includes(t)), g && g.mostrarComite); };
      busca.addEventListener('input', filtra); filtra();
      $$('.pasta', alvo).forEach(b => b.addEventListener('click', () => { atual = b.dataset.p; desenha(); const u = new URL(location); u.searchParams.set('cat', atual); history.replaceState(null, '', u); }));
    }
    desenha();
  }
  function paginar(alvo, itens, porPag, render, classeGrade) {
    let pag = 1; const tot = Math.max(1, Math.ceil(itens.length / porPag));
    function d() {
      alvo.innerHTML = itens.length ? `<div class="grade ${classeGrade}">${itens.slice((pag - 1) * porPag, pag * porPag).map(render).join('')}</div>` + (tot > 1 ? `<nav class="paginacao" aria-label="Páginas"><button data-p="${pag - 1}" ${pag === 1 ? 'disabled' : ''} aria-label="Anterior">${I.esq.replace('<svg', '<svg width="16" height="16"')}</button>${Array.from({ length: tot }, (_, i) => i + 1).filter(p => p === 1 || p === tot || Math.abs(p - pag) <= 2).map((p, i, arr) => (i && p - arr[i - 1] > 1 ? '<button disabled>…</button>' : '') + `<button data-p="${p}" class="${p === pag ? 'ativo' : ''}">${p}</button>`).join('')}<button data-p="${pag + 1}" ${pag === tot ? 'disabled' : ''} aria-label="Próxima">${I.dir.replace('<svg', '<svg width="16" height="16"')}</button></nav>` : '') : '<div class="vazio">Nenhum item encontrado.</div>';
      $$('.paginacao button[data-p]', alvo).forEach(b => b.addEventListener('click', () => { pag = +b.dataset.p; d(); alvo.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    }
    d();
  }
  function faixa(titulo, sub, trilha) {
    return `<section class="faixa"><div class="wrap"><div class="trilha"><a href="index.html">Início</a>${(trilha || []).map(t => ` › ${t[1] ? `<a href="${t[1]}">${esc(t[0])}</a>` : esc(t[0])}`).join('')}</div><h1>${esc(titulo)}</h1>${sub ? `<p>${sub}</p>` : ''}</div></section>`;
  }
  function textoRico(el) {
    $$('a[href^="http"]', el).forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
    $$('a[href^="midia/"]', el).forEach(a => { a.target = '_blank'; });
    $$('img', el).forEach(i => { i.loading = 'lazy'; i.alt = i.alt || ''; });
    $$('iframe', el).forEach(f => { f.setAttribute('allowfullscreen', ''); f.loading = 'lazy'; });
  }

  /* ---------- lightbox ---------- */
  let lb, lbFotos = [], lbI = 0;
  function abreFoto(lista, i) {
    if (!lb) {
      lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
      lb.innerHTML = `<img alt=""><button class="lb-fechar" aria-label="Fechar">${I.fechar}</button><button class="lb-ant" aria-label="Anterior">${I.esq}</button><button class="lb-prox" aria-label="Próxima">${I.dir}</button><span class="lb-cont"></span>`;
      document.body.appendChild(lb);
      const mostra = () => { $('img', lb).src = lbFotos[lbI]; $('.lb-cont', lb).textContent = (lbI + 1) + ' / ' + lbFotos.length; };
      lb.mostra = mostra;
      $('.lb-fechar', lb).onclick = () => lb.classList.remove('aberto');
      $('.lb-ant', lb).onclick = () => { lbI = (lbI - 1 + lbFotos.length) % lbFotos.length; mostra(); };
      $('.lb-prox', lb).onclick = () => { lbI = (lbI + 1) % lbFotos.length; mostra(); };
      lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('aberto'); });
      document.addEventListener('keydown', e => {
        if (!lb.classList.contains('aberto')) return;
        if (e.key === 'Escape') lb.classList.remove('aberto');
        if (e.key === 'ArrowLeft') $('.lb-ant', lb).click();
        if (e.key === 'ArrowRight') $('.lb-prox', lb).click();
      });
    }
    lbFotos = lista; lbI = i; lb.mostra(); lb.classList.add('aberto'); $('.lb-fechar', lb).focus();
  }

  /* ---------- cabeçalho e rodapé ---------- */
  function redes() {
    return [C.instagram && `<a href="${C.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${I.insta}</a>`,
      C.facebook && `<a href="${C.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${I.face}</a>`,
      C.youtube && `<a href="${C.youtube}" target="_blank" rel="noopener" aria-label="YouTube">${I.yt}</a>`,
      C.email && `<a href="mailto:${C.email}" aria-label="E-mail">${I.mail}</a>`].filter(Boolean).join('');
  }
  function cabecalho() {
    const pag = document.body.dataset.pagina;
    const sub = (id, rot, html, cls) => `<div class="sub${pag === id ? ' ativo' : ''}"><button type="button" aria-expanded="false">${rot}${I.seta}</button><div class="painel ${cls || ''}">${html}</div></div>`;
    const t = document.getElementById('topo');
    if (!t) return;
    t.outerHTML = `<header class="topo"><div class="wrap">
      <a class="marca" href="index.html"><img src="${LOGO_BRANCO}" alt="CBHTO – Comitês de Bacias Hidrográficas do Tocantins" width="160" height="44"></a>
      <button class="abre-menu" aria-label="Abrir menu" aria-expanded="false">${I.menu}</button>
      <nav class="menu" aria-label="Menu principal">
        ${sub('cbhto', 'CBHTO', `<a href="cbhto.html">Sobre o CBHTO</a><a href="cbhto.html#comite">O que é um comitê de bacia</a><a href="cbhto.html#duvidas">Dúvidas frequentes</a><a href="cbhto.html#apoio">Apoio técnico aos comitês</a>`)}
        ${sub('comite', 'Comitês', COMITES.map(c => `<a href="comite.html?c=${c.id}"><span class="bolinha" style="background:${c.cor}"></span><span class="sigla">${c.sigla}</span>${esc(c.curto)}</a>`).join(''), 'painel-comites')}
        ${sub('documentos', 'Documentos', CATS_GERAIS.map(k => `<a href="documentos.html?cat=${k[0]}">${k[1]}</a>`).join(''))}
        <a href="noticias.html" class="${pag === 'noticias' || pag === 'noticia' ? 'ativo' : ''}">Notícias</a>
        <a href="galeria.html" class="${pag === 'galeria' ? 'ativo' : ''}">Galeria</a>
        <a href="contato.html" class="${pag === 'contato' ? 'ativo' : ''}">Fale conosco</a>
      </nav>
      <div class="redes">${redes()}</div></div></header>`;
    const menu = $('.menu'), bt = $('.abre-menu');
    bt.addEventListener('click', () => { const a = menu.classList.toggle('aberto'); bt.setAttribute('aria-expanded', a); bt.innerHTML = a ? I.fechar : I.menu; });
    $$('.menu .sub>button').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); const s = b.parentElement, ab = !s.classList.contains('aberto');
      $$('.menu .sub').forEach(x => { x.classList.remove('aberto'); $('button', x).setAttribute('aria-expanded', 'false'); });
      if (ab) { s.classList.add('aberto'); b.setAttribute('aria-expanded', 'true'); }
    }));
    document.addEventListener('click', e => { if (!e.target.closest('.menu .sub')) $$('.menu .sub').forEach(x => x.classList.remove('aberto')); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.menu .sub').forEach(x => x.classList.remove('aberto')); });
  }
  function rodape() {
    const r = document.getElementById('rodape');
    if (!r) return;
    r.outerHTML = `<footer class="rodape"><div class="wrap"><div class="colunas">
      <div class="logo-rod"><img src="${LOGO_BRANCO}" alt="CBHTO" width="200" height="56"><p>Portal dos Comitês de Bacias Hidrográficas do Estado do Tocantins: gestão participativa das águas com poder público, usuários e sociedade civil.</p>
        <div class="redes">${redes()}</div><a class="btn btn-claro btn-sm" href="contato.html">Fale conosco</a></div>
      <div><h4>CBHTO</h4><ul><li><a href="cbhto.html">Sobre o CBHTO</a></li><li><a href="cbhto.html#comite">O que é um comitê</a></li><li><a href="cbhto.html#duvidas">Dúvidas frequentes</a></li><li><a href="cbhto.html#apoio">Apoio técnico</a></li></ul></div>
      <div><h4>Comitês</h4><ul>${COMITES.map(c => `<li><a href="comite.html?c=${c.id}">${c.sigla} – ${esc(c.curto)}</a></li>`).join('')}</ul></div>
      <div><h4>Documentos</h4><ul>${CATS_GERAIS.map(k => `<li><a href="documentos.html?cat=${k[0]}">${k[1]}</a></li>`).join('')}</ul></div>
      <div><h4>Publicações</h4><ul><li><a href="noticias.html">Notícias</a></li><li><a href="galeria.html">Galeria de fotos</a></li><li><a href="contato.html">Fale conosco</a></li></ul></div>
    </div>
    <div class="apoio"><span>Apoio</span><img src="assets/img/logos/semarh_governo_to_negativo.svg" alt="SEMARH – Governo do Tocantins"><a href="cbhto.html#apoio"><img src="assets/img/logos/procomites_negativo.svg" alt="Procomitês Tocantins"></a></div></div>
    <div class="copy"><div class="wrap"><span>© ${new Date().getFullYear()} Procomitês e Comitês de Bacias Hidrográficas do Tocantins</span><span>Todos os direitos reservados · <a href="creditos.html">Créditos das imagens</a></span></div></div></footer>
    <button class="subir" aria-label="Voltar ao topo">${I.cima}</button>`;
    const s = $('.subir');
    s.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
    addEventListener('scroll', () => s.classList.toggle('ver', scrollY > 600), { passive: true });
  }

  /* ======================= PÁGINAS ======================= */
  const P = {};

  P.inicio = function () {
    // carrossel
    const car = $('#carrossel');
    if (car) {
      const slides = [`<a class="slide" href="cbhto.html"><img src="assets/img/banners/banner-cbhto-7-comites.jpg" alt="Comitês de Bacias Hidrográficas do Tocantins – 7 comitês"></a>`]
        .concat(COMITES.map(c => c.banner
          ? `<a class="slide" href="comite.html?c=${c.id}"><img src="${c.banner}" alt="${esc(c.nome)}"></a>`
          : `<a class="slide slide-gerado" href="comite.html?c=${c.id}" style="background:linear-gradient(115deg,var(--marinho) 0%,${c.cor} 130%)"><div class="wrap"><span class="selo"><img src="${c.logo}" alt=""></span><div>${c.novo ? '<span class="tag-novo">Novo comitê</span>' : ''}<h2>${esc(c.nome)}</h2><p>${esc(c.resumo)}</p></div></div></a>`));
      car.innerHTML = `<div class="slides">${slides.join('')}</div><button class="car-seta ant" aria-label="Anterior">${I.esq}</button><button class="car-seta prox" aria-label="Próximo">${I.dir}</button><div class="car-pontos">${slides.map((_, i) => `<button aria-label="Slide ${i + 1}"></button>`).join('')}</div>`;
      let i = 0, t; const n = slides.length, trilho = $('.slides', car), pts = $$('.car-pontos button', car);
      const vai = k => { i = (k + n) % n; trilho.style.transform = `translateX(-${i * 100}%)`; pts.forEach((p, j) => p.classList.toggle('ativo', j === i)); };
      const auto = () => { clearInterval(t); t = setInterval(() => vai(i + 1), 6500); };
      $('.ant', car).onclick = () => { vai(i - 1); auto(); }; $('.prox', car).onclick = () => { vai(i + 1); auto(); };
      pts.forEach((p, j) => p.onclick = () => { vai(j); auto(); });
      car.addEventListener('mouseenter', () => clearInterval(t)); car.addEventListener('mouseleave', auto);
      let x0 = null; car.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
      car.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { vai(i + (dx < 0 ? 1 : -1)); auto(); } x0 = null; });
      vai(0); auto();
    }
    // logos
    const lg = $('#logos');
    if (lg) lg.innerHTML = COMITES.map(c => `<a class="logo-comite" style="--c:${c.cor}" href="comite.html?c=${c.id}">${c.novo ? '<span class="tag-novo-mini">NOVO</span>' : ''}<span class="img"><img src="${c.logo}" alt="" loading="lazy"></span><b>${c.sigla}</b><small>${esc(c.curto)}</small></a>`).join('');
    // mapa
    const mp = $('#mapa');
    if (mp && window.MAPA_SVG) {
      mp.innerHTML = `<div class="mapa"><img src="assets/img/antigo/mapa-cbhto.png" alt="Mapa do Tocantins com as bacias dos comitês" width="746" height="1223">${window.MAPA_SVG}</div>`;
      const lista = $('#lista-mapa');
      lista.innerHTML = COMITES.map(c => `<a href="comite.html?c=${c.id}" data-c="${c.id}" style="--c:${c.cor}"><span class="cor"></span><span><b>${c.sigla}${c.novo ? ' · novo' : ''}</b><small>${esc(c.curto)} · sede em ${esc(c.sede)}</small></span></a>`).join('');
      const foco = (id, on) => { $$(`[data-c="${id}"]`).forEach(e => e.classList.toggle('foco', on)); };
      $$('[data-c]').forEach(e => { e.addEventListener('mouseenter', () => foco(e.dataset.c, true)); e.addEventListener('mouseleave', () => foco(e.dataset.c, false)); });
      $$('#mapa svg a').forEach(a => { const c = porId[a.dataset.c]; if (c) { const tt = document.createElementNS('http://www.w3.org/2000/svg', 'title'); tt.textContent = c.sigla + ' – ' + c.nome; a.prepend(tt); } });
    }
    // notícias
    const ul = $('#ultimas');
    if (ul) {
      const [d, ...resto] = NOTICIAS.filter(n => n.imagem).slice(0, 1).concat(NOTICIAS.filter((n, i) => true));
      const outros = NOTICIAS.filter(n => n !== d).slice(0, 6);
      ul.innerHTML = (d ? `<article class="destaque"><a class="foto" href="noticia.html?id=${d.id}">${fotoNoticia(d)}</a><div class="corpo"><div class="meta"><span class="data">${I.cal}${dataBR(d.data)}</span>${(d.comites || []).map(chip).join('')}</div><h3><a href="noticia.html?id=${d.id}">${esc(d.titulo)}</a></h3><p>${esc(d.resumo)}</p><a class="btn btn-azul" href="noticia.html?id=${d.id}">Ler notícia ${I.ext}</a></div></article>` : '')
        + `<div class="grade g3">${outros.map(cardNoticia).join('')}</div>`;
    }
    const nm = $('#n-municipios');
    if (nm) { const s = new Set(); COMITES.forEach(c => (c.municipios || []).forEach(m => s.add(m))); nm.textContent = s.size; }
    const gal = $('#galeria-inicio');
    if (gal) gal.innerHTML = GALERIAS.slice(0, 8).map(cardAlbum).join('');
  };

  P.cbhto = function () {
    const lg = $('#logos'); if (lg) P.inicio.call(null);
    const fq = $('#faq'); if (fq) fq.innerHTML = (window.FAQ || []).map(f => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('');
    const nm = $('#n-municipios'); if (nm) { const s = new Set(); COMITES.forEach(c => (c.municipios || []).forEach(m => s.add(m))); nm.textContent = s.size; }
  };

  P.comite = function () {
    const c = porId[param('c')] || COMITES[0];
    const x = CONT[c.id] || {};
    const nts = NOTICIAS.filter(n => (n.comites || []).includes(c.id));
    const gal = GALERIAS.filter(g => g.comite === c.id);
    const docs = docsComite(c.id);
    const membrosDocs = docs.filter(d => /membros/i.test(d.categoria));
    const K = (window.COMPOSICAO || {})[c.id] || {};
    const dirAtual = (K.diretoria && K.diretoria.length) ? K.diretoria : (c.diretoria || []);
    const secoes = [
      ['comite', 'O Comitê', true],
      ['diretoria', 'Diretoria', !!(x.diretoria || dirAtual.length)],
      ['membros', 'Membros', !!((K.membros && K.membros.length) || (c.composicao && c.composicao.length) || membrosDocs.length)],
      ['camaras', 'Câmaras técnicas', !!(x.camaras && x.camaras.length)],
      ['documentos', 'Documentos', docs.length > 0],
      ['noticias', 'Notícias', nts.length > 0],
      ['fotos', 'Fotos', gal.length > 0],
      ['videos', 'Vídeos', !!(x.videos && x.videos.length)]
    ].filter(s => s[2]);
    let s = param('s'); if (!secoes.find(q => q[0] === s)) s = 'comite';
    document.title = `${c.sigla} – ${c.nome} | CBHTO`;
    $('#conteudo').innerHTML = `
      <section class="cab-comite" style="--c:${c.cor}">${c.banner ? `<img class="banner" src="${c.banner}" alt="">` : ''}
        <div class="info"><div class="wrap"><span class="selo"><img src="${c.logo}" alt="${c.sigla}"></span><div>
          <div class="trilha"><a href="index.html">Início</a> › <a href="cbhto.html">Comitês</a> › ${c.sigla}</div>
          <h1>${esc(c.nome)}</h1><p class="resumo">${c.novo ? '<span class="tag-novo" style="margin:0 8px 0 0">Novo</span>' : ''}${esc(c.resumo)}</p></div></div></div></section>
      <nav class="abas-comite" style="--c:${c.cor}" aria-label="Seções do comitê"><div class="wrap">${secoes.map(q => `<a href="comite.html?c=${c.id}&s=${q[0]}" class="${q[0] === s ? 'ativo' : ''}">${q[1]}</a>`).join('')}</div></nav>
      <section class="secao"><div class="wrap" id="sec"></div></section>`;
    const sec = $('#sec');
    const titulo = t => `<div class="cab-secao"><h2>${t}</h2></div>`;
    if (s === 'comite') {
      const hist = x.historia || (c.texto || []).map(p => `<p>${esc(p)}</p>`).join('');
      const temImg = /<img/.test(hist);
      sec.innerHTML = `<div class="com-lateral"><div class="texto-rico">${hist}</div>
        <aside class="ficha"><h3>Ficha do comitê</h3><dl>
          <div><dt>Sigla</dt><dd>${c.sigla}</dd></div>
          ${c.sede ? `<div><dt>Sede</dt><dd>${esc(c.sede)}</dd></div>` : ''}
          ${c.regiao ? `<div><dt>Região</dt><dd>${esc(c.regiao)}</dd></div>` : ''}
          ${c.area ? `<div><dt>Área da bacia</dt><dd>${esc(c.area)}</dd></div>` : ''}
          ${c.criacao ? `<div><dt>Criação</dt><dd>${esc(c.criacao)}</dd></div>` : ''}
          ${dirAtual[0] ? `<div><dt>${esc(dirAtual[0].cargo || 'Presidente')}</dt><dd>${esc(dirAtual[0].nome)}</dd></div>` : ''}
          ${K.email ? `<div><dt>E-mail</dt><dd><a href="mailto:${esc(K.email)}">${esc(K.email)}</a></dd></div>` : ''}
          ${K.totais && K.totais.total ? `<div><dt>Membros${K.mandato ? ' (' + esc(K.mandato) + ')' : ''}</dt><dd>${K.totais.total} cadeiras</dd></div>` : ''}
          ${(c.municipios || []).length ? `<div><dt>Municípios (${c.municipios.length})</dt><dd class="mun">${c.municipios.map(m => `<span>${esc(m)}</span>`).join('')}</dd></div>` : ''}
        </dl>${c.mapa && !temImg ? `<img class="mapa-bacia" src="${c.mapa}" alt="Mapa da bacia">` : ''}</aside></div>`;
    } else if (s === 'diretoria') {
      const tab = dirAtual.length ? `<div class="tabela-rolagem"><table class="membros"><tr><th>Cargo</th><th>Nome</th><th>Instituição</th></tr>${dirAtual.map(m => `<tr><td><b>${esc(m.cargo || '')}</b></td><td>${esc(m.nome)}</td><td>${esc(m.instituicao || '')}</td></tr>`).join('')}</table></div>` : '';
      const contato = K.email ? `<p class="nota-tabela">Contato do comitê: <a href="mailto:${esc(K.email)}">${esc(K.email)}</a>${K.mandato ? ' · Mandato ' + esc(K.mandato) : ''}</p>` : '';
      const antigo = x.diretoria ? (tab ? `<details class="camara"><summary>Diretorias anteriores</summary><div class="texto-rico">${x.diretoria}</div></details>` : `<div class="texto-rico">${x.diretoria}</div>`) : '';
      sec.innerHTML = titulo('Diretoria') + tab + contato + antigo;
    } else if (s === 'membros') {
      let html = '';
      if ((K.membros || []).length) {
        const t = K.totais || {};
        html += `<div class="resumo-membros">${t.total ? `<span><b>${t.total}</b> cadeiras${K.mandato ? ' · mandato ' + esc(K.mandato) : ''}</span>` : ''}${t.poder ? `<span><b>${t.poder}</b> poder público</span>` : ''}${t.sociedade ? `<span><b>${t.sociedade}</b> sociedade civil</span>` : ''}${t.usuarios ? `<span><b>${t.usuarios}</b> usuários de água</span>` : ''}</div>`;
        const segs = [...new Set(K.membros.map(m => m.segmento).filter(Boolean))];
        let ultimoSeg = '';
        const linhas = K.membros.map(m => {
          const seg = m.segmento || ultimoSeg; ultimoSeg = seg;
          return { ...m, seg };
        });
        html += segs.map(sg => `<h3 class="seg-membros">${esc(sg)}</h3><div class="tabela-rolagem"><table class="membros"><tr><th>Cadeira</th><th>Vaga</th><th>Instituição</th><th>Representante</th></tr>${linhas.filter(m => m.seg === sg).map(m => m.instituicao ? `<tr><td>${esc(m.cadeira)}</td><td>${esc(m.vaga)}</td><td>${esc(m.instituicao)}</td><td>${esc(m.representante || '—')}</td></tr>` : `<tr class="vaga-aberta"><td>${esc(m.cadeira)}</td><td>${esc(m.vaga)}</td><td colspan="2"><i>Vaga em aberto</i></td></tr>`).join('')}</table></div>`).join('');
        html += `<p class="nota-tabela">Composição informada pela SEMARH/Procomitês. Correções: ${K.email ? `<a href="mailto:${esc(K.email)}">${esc(K.email)}</a>` : 'Fale conosco'}.</p>`;
      } else if ((c.composicao || []).length) {
        html += `<table class="membros"><tr><th>Nome</th><th>Segmento</th><th>Instituição</th></tr>${c.composicao.map(m => `<tr><td>${esc(m.nome)}</td><td>${esc(m.segmento || '')}</td><td>${esc(m.instituicao || m.cargo || '')}</td></tr>`).join('')}</table><br>`;
      }
      if (membrosDocs.length) html += `<h3 class="seg-membros">Listas de membros publicadas</h3>` + listaPorAno(membrosDocs);
      sec.innerHTML = titulo('Membros') + html;
    } else if (s === 'camaras') {
      sec.innerHTML = titulo('Câmaras técnicas') + x.camaras.map(k => `<details class="camara"><summary><span class="ic">${I.doc}</span>${esc(k.titulo)}<span class="seta">${I.seta}</span></summary><div class="conteudo texto-rico">${k.html || ''}${k.arquivo ? `<p><a class="btn btn-azul btn-sm" href="${esc(k.arquivo)}" target="_blank" rel="noopener">${I.baixar} Baixar documento</a></p>` : ''}</div></details>`).join('');
    } else if (s === 'documentos') {
      sec.innerHTML = titulo('Documentos') + '<div id="pastas"></div>';
      const grupos = CATS_COMITE.map(k => ({ id: k, nome: k, docs: docs.filter(d => d.categoria === k) })).filter(g => g.docs.length);
      pastas($('#pastas'), grupos, param('cat'));
    } else if (s === 'noticias') {
      sec.innerHTML = titulo(`Notícias do ${c.sigla}`) + '<div id="lista"></div>';
      paginar($('#lista'), nts, 9, cardNoticia, 'g3');
    } else if (s === 'fotos') {
      sec.innerHTML = titulo('Galeria de fotos') + '<div id="lista"></div>';
      paginar($('#lista'), gal, 12, cardAlbum, 'g4');
    } else if (s === 'videos') {
      sec.innerHTML = titulo('Vídeos') + `<div class="videos">${x.videos.map(v => `<div class="video"><button class="tela" data-v="${esc(v.id)}" aria-label="Assistir ${esc(v.titulo || 'vídeo')}"><img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy"><span>${I.play}</span></button>${v.titulo ? `<h3>${esc(v.titulo)}</h3>` : ''}</div>`).join('')}</div>`;
      $$('.tela', sec).forEach(b => b.onclick = () => { b.outerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${b.dataset.v}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Vídeo"></iframe>`; });
    }
    $$('.texto-rico', sec).forEach(textoRico);
  };

  P.documentos = function () {
    const ger = docsGerais(), acervo = DOCS.filter(d => d.comite === 'acervo');
    const grupos = CATS_GERAIS.map(k => ({ id: k[0], nome: k[1], docs: k[0] === 'acervo' ? acervo : ger.filter(d => k[2].includes(d.categoria)) }));
    const extra = atual => {
      const k = CATS_GERAIS.find(q => q[0] === atual);
      if (!k || atual === 'acervo' || atual === 'publicacoes') return atual === 'acervo' ? '<p class="aviso" style="margin-top:20px">Documentos do período em que o Consórcio Ci Lago foi a entidade delegatária dos comitês (2022–2025), mantidos como acervo histórico.</p>' : '';
      const doCom = DOCS.filter(d => porId[d.comite] && k[2].includes(d.categoria));
      if (!doCom.length) return '';
      return `<details class="ver-tambem"><summary>Ver também: ${k[1].toLowerCase()} publicados pelos comitês (${doCom.length})</summary>${COMITES.filter(c => doCom.some(d => d.comite === c.id)).map(c => `<div class="ano-bloco"><h3><span class="chip" style="--c:${c.cor}">${c.sigla}</span> ${esc(c.curto)}</h3>${doCom.filter(d => d.comite === c.id).map(d => itemDoc(d)).join('')}</div>`).join('')}</details>`;
    };
    pastas($('#pastas'), grupos, param('cat'), extra);
    const lc = $('#docs-comites');
    if (lc) lc.innerHTML = COMITES.map(c => `<a class="logo-comite" style="--c:${c.cor}" href="comite.html?c=${c.id}&s=documentos"><span class="img"><img src="${c.logo}" alt="" loading="lazy"></span><b>${c.sigla}</b><small>${docsComite(c.id).length} documentos</small></a>`).join('');
  };

  P.noticias = function () {
    const sel = $('#f-comite'), ano = $('#f-ano'), busca = $('#f-busca');
    sel.innerHTML = '<option value="">Todos os comitês</option>' + COMITES.map(c => `<option value="${c.id}">${c.sigla} – ${esc(c.curto)}</option>`).join('');
    const anos = [...new Set(NOTICIAS.map(n => (n.data || '').slice(0, 4)).filter(Boolean))].sort().reverse();
    ano.innerHTML = '<option value="">Todos os anos</option>' + anos.map(a => `<option>${a}</option>`).join('');
    if (param('c')) sel.value = param('c');
    if (param('q')) busca.value = param('q');
    const filtra = () => {
      const t = busca.value.toLowerCase().trim();
      const r = NOTICIAS.filter(n => (!sel.value || (n.comites || []).includes(sel.value)) && (!ano.value || (n.data || '').startsWith(ano.value)) && (!t || (n.titulo + ' ' + n.resumo).toLowerCase().includes(t)));
      $('#total').textContent = r.length + (r.length === 1 ? ' notícia' : ' notícias');
      paginar($('#lista'), r, 12, cardNoticia, 'g3');
    };
    [sel, ano].forEach(e => e.addEventListener('change', filtra)); busca.addEventListener('input', filtra); filtra();
  };

  P.noticia = function () {
    const n = NOTICIAS.find(x => String(x.id) === param('id'));
    const alvo = $('#conteudo');
    if (!n) { alvo.innerHTML = faixa('Notícia não encontrada', '', [['Notícias', 'noticias.html']]) + '<section class="secao"><div class="wrap"><div class="vazio">Esta notícia não está disponível. <a href="noticias.html">Ver todas as notícias</a></div></div></section>'; return; }
    document.title = n.titulo + ' | CBHTO';
    const repetida = n.imagem && n.html.includes(n.imagem);
    const rel = NOTICIAS.filter(x => x !== n && (x.comites || []).some(c => (n.comites || []).includes(c))).slice(0, 3);
    const url = encodeURIComponent(location.href), tit = encodeURIComponent(n.titulo);
    alvo.innerHTML = faixa(n.titulo, '', [['Notícias', 'noticias.html']]) + `<section class="secao"><div class="wrap"><article class="artigo">
      <div class="meta"><span class="data">${I.cal}${dataBR(n.data)}</span>${(n.comites || []).map(chip).join('')}</div>
      ${n.imagem && !repetida ? `<img class="capa" src="${esc(n.imagem)}" alt="">` : ''}
      <div class="texto-rico">${n.html}</div>
      <div class="compartilhar">Compartilhar: <a href="https://wa.me/?text=${tit}%20${url}" target="_blank" rel="noopener" aria-label="WhatsApp">${I.zap}</a><a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" rel="noopener" aria-label="Facebook">${I.face}</a><button type="button" id="copiar" aria-label="Copiar link">${I.link}</button></div>
    </article></div></section>` + (rel.length ? `<section class="secao cinza"><div class="wrap"><div class="cab-secao"><h2>Leia também</h2><a class="btn btn-linha btn-sm" href="noticias.html">Todas as notícias</a></div><div class="grade g3">${rel.map(cardNoticia).join('')}</div></div></section>` : '');
    textoRico($('.texto-rico'));
    const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9à-ú]/g, '');
    const prim = $('.texto-rico').firstElementChild;
    if (prim && /^(H\d|P|STRONG|B)$/.test(prim.tagName) && norm(prim.textContent) === norm(n.titulo)) prim.remove();
    $$('.texto-rico img').forEach((im, i, arr) => { im.style.cursor = 'zoom-in'; im.onclick = () => abreFoto(arr.map(x => x.src), i); });
    $('#copiar').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(location.href); $('#copiar').innerHTML = '✓'; };
  };

  P.galeria = function () {
    const id = param('id'), alvo = $('#conteudo');
    if (id) {
      const g = GALERIAS.find(x => String(x.id) === id);
      if (!g) { alvo.innerHTML = faixa('Álbum não encontrado', '', [['Galeria', 'galeria.html']]); return; }
      const c = porId[g.comite];
      document.title = g.titulo + ' | Galeria CBHTO';
      alvo.innerHTML = faixa(g.titulo, `${g.fotos.length} fotos${c ? ' · ' + c.sigla : ''}`, [['Galeria', 'galeria.html']].concat(c ? [[c.sigla, `comite.html?c=${c.id}&s=fotos`]] : [])) +
        `<section class="secao"><div class="wrap"><div class="fotos">${g.fotos.map((f, i) => `<button data-i="${i}" aria-label="Ampliar foto ${i + 1}"><img src="${esc(f)}" alt="" loading="lazy"></button>`).join('')}</div>
        <p style="margin-top:30px"><a class="btn btn-linha" href="galeria.html">${I.esq.replace('<svg', '<svg width="16" height="16"')} Voltar à galeria</a></p></div></section>`;
      $$('.fotos button').forEach(b => b.onclick = () => abreFoto(g.fotos, +b.dataset.i));
      return;
    }
    alvo.innerHTML = faixa('Galeria de fotos', 'Registros das reuniões, capacitações e ações dos comitês.') + `<section class="secao"><div class="wrap"><div class="filtros"><select id="f-comite" aria-label="Filtrar por comitê"></select><input id="f-busca" type="search" placeholder="Buscar álbum…" aria-label="Buscar álbum"></div><div id="lista"></div></div></section>`;
    const sel = $('#f-comite'), busca = $('#f-busca');
    sel.innerHTML = '<option value="">Todos os comitês</option>' + COMITES.filter(c => GALERIAS.some(g => g.comite === c.id)).map(c => `<option value="${c.id}">${c.sigla} – ${esc(c.curto)}</option>`).join('');
    if (param('c')) sel.value = param('c');
    const filtra = () => { const t = busca.value.toLowerCase(); paginar($('#lista'), GALERIAS.filter(g => g.comite !== 'acervo' && (!sel.value || g.comite === sel.value) && (!t || g.titulo.toLowerCase().includes(t))), 16, cardAlbum, 'g4'); };
    sel.onchange = filtra; busca.oninput = filtra; filtra();
  };

  P.contato = function () {
    const card = $('#dados-contato');
    card.innerHTML = [C.email && `<p>${I.mail}<span><b>E-mail</b><br><a href="mailto:${C.email}">${C.email}</a></span></p>`,
      C.telefone && `<p>${I.fone}<span><b>Telefone</b><br>${esc(C.telefone)}</span></p>`,
      C.whatsapp && `<p>${I.zap}<span><b>WhatsApp</b><br><a href="https://wa.me/${C.whatsapp}" target="_blank" rel="noopener">Enviar mensagem</a></span></p>`,
      C.endereco && `<p>${I.local}<span><b>Endereço</b><br>${esc(C.endereco)}</span></p>`].filter(Boolean).join('') || '<p>Os contatos oficiais serão publicados em breve. Enquanto isso, fale com o CBHTO pelas redes sociais.</p>';
    card.innerHTML += `<div class="redes" style="margin-top:12px">${redes().replace(/border:[^;]+;/g, '')}</div>`;
    $$('#dados-contato .redes a').forEach(a => { a.style.borderColor = 'var(--azul)'; a.style.color = 'var(--azul)'; });
    const sel = $('#assunto');
    sel.innerHTML = '<option value="CBHTO">CBHTO (geral)</option>' + COMITES.map(c => `<option value="${c.sigla}">${c.sigla} – ${esc(c.curto)}</option>`).join('');
    if (param('c') && porId[param('c')]) sel.value = porId[param('c')].sigla;
    const f = $('#form-contato');
    if (C.formularioAction) { f.action = C.formularioAction; f.method = 'POST'; return; }
    f.addEventListener('submit', e => {
      e.preventDefault();
      if (!C.email) { alert('O formulário ainda não está configurado. Use as redes sociais do CBHTO.'); return; }
      const d = new FormData(f);
      location.href = `mailto:${C.email}?subject=${encodeURIComponent('[Site] ' + d.get('assunto') + ' – ' + d.get('nome'))}&body=${encodeURIComponent(d.get('mensagem') + '\n\n' + d.get('nome') + ' – ' + d.get('email'))}`;
    });
  };

  /* ---------- início ---------- */
  cabecalho(); rodape();
  const pg = document.body.dataset.pagina;
  if (P[pg]) P[pg]();
})();
