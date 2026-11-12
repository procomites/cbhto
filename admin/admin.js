/* ==========================================================================
   Painel de publicação do CBHTO
   Administrador: tudo (aprovações, usuários, histórico, conteúdo do site antigo).
   Presidente e secretário: notícias e documentos do próprio comitê, sujeitos a aprovação.
   ========================================================================== */
(function () {
  'use strict';
  const COMITES = window.COMITES || [];
  const porId = {}; COMITES.forEach(c => porId[c.id] = c);
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const dataBR = d => d ? String(d).slice(0, 10).split('-').reverse().join('/') : '';
  const hoje = () => new Date().toISOString().slice(0, 10);
  const CATS_COMITE = ['Atas de reuniões', 'Resoluções e deliberações', 'Legislação', 'Câmaras técnicas', 'Listas de membros', 'Planos de bacia', 'Estudos e publicações', 'Diversos', 'Outros arquivos'];
  const CATS_GERAIS = ['Atas', 'Resoluções e deliberações', 'Legislação', 'Câmaras técnicas', 'Listas de membros', 'Planos de bacia', 'Publicações'];
  const STATUS = { publicado: 'Publicado', pendente: 'Aguardando aprovação', recusado: 'Recusado', removido: 'Retirado do site' };
  const PERFIL = { admin: 'Administrador', presidente: 'Presidente', secretario: 'Secretário(a)' };
  let EU = null, ABA = 'noticias', LEGADO = null;

  /* ---------- utilidades ---------- */
  function aviso(msg, erro) {
    const a = $('#aviso'); a.textContent = msg; a.className = 'mostrar' + (erro ? ' erro' : '');
    clearTimeout(aviso.t); aviso.t = setTimeout(() => a.className = '', erro ? 6000 : 3000);
  }
  async function api(caminho, op = {}) {
    const json = op.body && !(op.body instanceof FormData);
    const r = await fetch('/api/admin/' + caminho, Object.assign({ credentials: 'same-origin' }, op, {
      headers: Object.assign({ 'x-cbhto-painel': '1' }, json ? { 'content-type': 'application/json' } : {}),
      body: json ? JSON.stringify(op.body) : op.body
    }));
    let j = null; try { j = await r.json(); } catch { }
    if (!r.ok) { const e = new Error((j && j.erro) || `Erro ${r.status}`); e.status = r.status; throw e; }
    return j;
  }
  const chip = id => porId[id] ? `<span class="chip" style="background:${porId[id].cor}">${porId[id].sigla}</span>` : (id === 'cbhto' ? '<span class="chip" style="background:#0a2a4d">CBHTO</span>' : '');
  const selo = (st, motivo) => `<span class="selo ${st}" ${motivo ? `title="${esc(motivo)}"` : ''}>${STATUS[st] || esc(st)}</span>`;
  const admin = () => EU && EU.perfil === 'admin';
  function carregarScript(src) { return new Promise((ok, falha) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = falha; document.head.appendChild(s); }); }
  async function legado() {  // notícias e documentos do site antigo (somente leitura; o admin pode editar ou retirar)
    if (LEGADO) return LEGADO;
    await Promise.all(['../assets/js/noticias.js', '../assets/js/documentos.js', '../assets/js/documentos-gerais.js'].map(carregarScript));
    LEGADO = {
      noticias: (window.NOTICIAS || []).map(n => Object.assign({}, n, { id: String(n.id), legado: 1, status: 'publicado' })),
      documentos: (window.DOCUMENTOS || []).concat((window.DOCS_GERAIS || []).map(d => Object.assign({ comite: 'cbhto' }, d)))
        .filter(d => d.comite !== 'acervo').map(d => Object.assign({}, d, { id: 'arq:' + d.arquivo, legado: 1, status: 'publicado' }))
    };
    return LEGADO;
  }
  async function enviarArquivo(input, aceitar) {
    const f = input.files[0]; if (!f) return null;
    if (f.size > 25 * 1024 * 1024) { aviso('O arquivo passa de 25 MB. Comprima antes de enviar.', true); input.value = ''; return null; }
    const fd = new FormData(); fd.append('arquivo', f);
    aviso('Enviando ' + f.name + '…');
    try { const r = await api('upload', { method: 'POST', body: fd }); aviso('Arquivo enviado.'); return r; }
    catch (e) { aviso(e.message, true); return null; } finally { input.value = ''; }
  }

  /* ---------- estrutura ---------- */
  async function iniciar() {
    try { EU = await api('eu'); }
    catch (e) {
      $('#app').innerHTML = `<div class="bloqueio"><img src="../assets/img/marca/cbhto-azul.png" alt="CBHTO" style="height:46px"><h1 style="margin-top:18px">Painel de publicação</h1>
        <p>${esc(e.message)}</p><p><a class="btn" href="/admin/">Tentar novamente</a> <a class="btn linha" href="/">Voltar ao site</a></p></div>`;
      return;
    }
    const nomeComite = EU.comite && porId[EU.comite] ? porId[EU.comite].sigla : '';
    $('#app').innerHTML = `
      <header class="topo"><img src="../assets/img/marca/cbhto-branco.png" alt="CBHTO"><div class="titulo">Painel de publicação<small>Comitês de Bacias Hidrográficas do Tocantins</small></div>
        <div class="quem"><b>${esc(EU.nome || EU.email)}</b>${esc(EU.nomePerfil || PERFIL[EU.perfil])}${nomeComite ? ' · ' + nomeComite : ''}</div>
        <a href="/" target="_blank" rel="noopener">Ver o site</a><a href="/cdn-cgi/access/logout">Sair</a></header>
      <nav class="abas" id="abas"></nav><main id="tela"></main>`;
    await montarAbas(); abrir(ABA);
  }
  async function montarAbas() {
    let r = { pendentesNoticias: 0, pendentesDocumentos: 0 }; try { r = await api('resumo'); } catch { }
    const pend = r.pendentesNoticias + r.pendentesDocumentos;
    const abas = [['noticias', 'Notícias'], ['documentos', 'Documentos']];
    if (admin()) abas.push(['aprovacoes', 'Aprovações' + (pend ? `<span class="cont">${pend}</span>` : '')], ['usuarios', 'Usuários'], ['historico', 'Histórico']);
    $('#abas').innerHTML = abas.map(a => `<button data-aba="${a[0]}" class="${a[0] === ABA ? 'ativo' : ''}">${a[1]}</button>`).join('');
    $$('#abas button').forEach(b => b.onclick = () => abrir(b.dataset.aba));
  }
  function abrir(aba) {
    ABA = aba; $$('#abas button').forEach(b => b.classList.toggle('ativo', b.dataset.aba === aba));
    ({ noticias: () => telaConteudo('noticias'), documentos: () => telaConteudo('documentos'), aprovacoes: telaAprovacoes, usuarios: telaUsuarios, historico: telaHistorico })[aba]();
  }

  /* ---------- notícias e documentos ---------- */
  async function telaConteudo(tipo) {
    const tela = $('#tela'); const N = tipo === 'noticias';
    const intro = admin() ? (N ? 'Publique, edite ou retire notícias de qualquer comitê. As suas publicações vão direto para o site.' : 'Publique documentos dos comitês ou documentos gerais do CBHTO.')
      : `Publicações do ${porId[EU.comite] ? porId[EU.comite].sigla : 'seu comitê'}. Tudo o que você enviar passa pela aprovação do administrador antes de aparecer no site.`;
    tela.innerHTML = `<h1>${N ? 'Notícias' : 'Documentos'}</h1><p class="sub">${intro}</p>
      <div class="barra"><button class="btn" id="novo">+ ${N ? 'Nova notícia' : 'Novo documento'}</button><span class="espaco"></span>
        <input type="search" id="busca" placeholder="Buscar pelo título…"><select id="filtro"><option value="">Todas as situações</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}${admin() ? '<option value="antigo">Somente do site antigo</option>' : ''}</select>
        ${admin() ? `<select id="filtro-comite"><option value="">Todos os comitês</option>${COMITES.map(c => `<option value="${c.id}">${c.sigla}</option>`).join('')}${N ? '' : '<option value="cbhto">CBHTO (geral)</option>'}</select>` : ''}</div>
      <div class="cartao" id="lista"><div class="vazio">Carregando…</div></div><div class="paginas" id="paginas"></div>`;
    $('#novo').onclick = () => formulario(tipo, null);
    let itens = [];
    try {
      itens = (await api(tipo)).map(x => Object.assign(x, N ? { comites: JSON.parse(x.comites || '[]') } : {}));
      if (admin()) {
        const L = await legado(); const ids = new Set(itens.map(i => i.id));
        itens = itens.concat(L[tipo].filter(x => !ids.has(String(x.id))));
      }
    } catch (e) { $('#lista').innerHTML = `<div class="vazio">${esc(e.message)}</div>`; return; }
    let pag = 1; const POR = 25;
    const desenhar = () => {
      const t = ($('#busca').value || '').toLowerCase(), st = $('#filtro').value, fc = $('#filtro-comite') ? $('#filtro-comite').value : '';
      const lista = itens.filter(i => (!t || (i.titulo || '').toLowerCase().includes(t)) &&
        (!st || (st === 'antigo' ? i.legado : (i.status === st))) &&
        (!fc || (N ? (i.comites || []).includes(fc) : i.comite === fc)))
        .sort((a, b) => (a.status === 'pendente' ? -1 : 0) - (b.status === 'pendente' ? -1 : 0) || String(b.data || b.atualizado_em || b.ano || '').localeCompare(String(a.data || a.atualizado_em || a.ano || '')));
      const total = Math.max(1, Math.ceil(lista.length / POR)); if (pag > total) pag = total;
      const pagina = lista.slice((pag - 1) * POR, pag * POR);
      $('#lista').innerHTML = pagina.length ? `<table class="responsiva"><thead><tr><th>Título</th><th>${N ? 'Comitês' : 'Comitê / categoria'}</th><th>${N ? 'Data' : 'Ano'}</th><th>Situação</th><th></th></tr></thead><tbody>${pagina.map(i => linha(tipo, i)).join('')}</tbody></table>`
        : `<div class="vazio">Nenhum item encontrado.</div>`;
      $('#paginas').innerHTML = total > 1 ? Array.from({ length: total }, (_, k) => `<button class="${k + 1 === pag ? 'ativo' : ''}">${k + 1}</button>`).join('') : '';
      $$('#paginas button').forEach((b, k) => b.onclick = () => { pag = k + 1; desenhar(); window.scrollTo(0, 0); });
      $$('#lista [data-acao]').forEach(b => b.onclick = () => acao(tipo, b.dataset.acao, itens.find(i => String(i.id) === b.dataset.id)));
    };
    ['busca', 'filtro', 'filtro-comite'].forEach(id => { const el = $('#' + id); if (el) el.oninput = () => { pag = 1; desenhar(); }; });
    desenhar();
  }
  function linha(tipo, i) {
    const N = tipo === 'noticias';
    const podeEditar = admin() || (!i.legado && ['pendente', 'recusado'].includes(i.status));
    const acoes = [];
    if (admin() && i.status === 'pendente') acoes.push(`<button class="btn verde peq" data-acao="aprovar" data-id="${esc(i.id)}">Aprovar</button>`);
    if (i.status !== 'removido' && podeEditar) acoes.push(`<button class="btn linha peq" data-acao="editar" data-id="${esc(i.id)}">Editar</button>`);
    if (admin() && i.legado && i.status === 'removido') acoes.push(`<button class="btn linha peq" data-acao="restaurar" data-id="${esc(i.id)}">Restaurar</button>`);
    else if (podeEditar) acoes.push(`<button class="btn linha peq" data-acao="excluir" data-id="${esc(i.id)}">${i.legado || (admin() && i.status === 'publicado') ? 'Retirar' : 'Excluir'}</button>`);
    const meta = [i.legado ? '<span class="selo antigo">Site antigo</span>' : '', i.autor ? 'por ' + esc(i.autor) : '', i.motivo ? 'Motivo: ' + esc(i.motivo) : ''].filter(Boolean).join(' · ');
    return `<tr><td><div class="tit">${esc(i.titulo || '(sem título)')}</div>${meta ? `<div class="meta">${meta}</div>` : ''}</td>
      <td>${N ? ((i.comites || []).map(chip).join('') || '<span class="meta">Geral</span>') : chip(i.comite) + `<div class="meta">${esc(i.categoria || '')}</div>`}</td>
      <td>${N ? dataBR(i.data) : esc(i.ano || '')}</td><td>${selo(i.status, i.motivo)}</td><td class="acoes">${acoes.join('')}</td></tr>`;
  }
  async function acao(tipo, qual, item) {
    if (!item) return;
    try {
      if (qual === 'editar') return formulario(tipo, item);
      if (qual === 'aprovar') { await api(`${tipo}/${encodeURIComponent(item.id)}/aprovar`, { method: 'POST' }); aviso('Publicado no site.'); }
      if (qual === 'recusar') { const motivo = prompt('Motivo da recusa (aparece para quem enviou):', ''); if (motivo === null) return; await api(`${tipo}/${encodeURIComponent(item.id)}/recusar`, { method: 'POST', body: { motivo } }); aviso('Publicação recusada.'); }
      if (qual === 'restaurar') { await api(`${tipo}/${encodeURIComponent(item.id)}/restaurar`, { method: 'POST' }); aviso('Item do site antigo restaurado.'); }
      if (qual === 'excluir') {
        const legadoSemCopia = item.legado && !item.criado_em;
        if (!confirm(item.legado || item.status === 'publicado' ? `Retirar "${item.titulo}" do site?` : `Excluir "${item.titulo}"? Esta ação não pode ser desfeita.`)) return;
        await api(`${tipo}/${encodeURIComponent(item.id)}` + (legadoSemCopia ? `?legado=1&titulo=${encodeURIComponent(item.titulo || '')}` : ''), { method: 'DELETE' });
        aviso('Feito.');
      }
      await montarAbas(); abrir(ABA);
    } catch (e) { aviso(e.message, true); }
  }

  /* ---------- formulário ---------- */
  /* ---------- editor de texto rico (Jodit, licença MIT) ---------- */
  let EDITOR = null;
  function criarEditor(textarea, html) {
    if (!window.Jodit) { textarea.value = html; textarea.rows = 14; return null; }
    const ed = window.Jodit.make(textarea, {
      language: 'pt_br', height: 460, minHeight: 300, toolbarAdaptive: true, toolbarSticky: false,
      showCharsCounter: false, showWordsCounter: true, showXPathInStatusbar: false,
      sourceEditor: 'area', beautifyHTML: false,  // não baixa scripts externos (Ace/Beautify)
      askBeforePasteHTML: false, askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_clear_html', defaultActionOnPasteFromWord: 'insert_clear_html',
      buttons: ['paragraph', 'font', 'fontsize', 'lineHeight', '|', 'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'brush', 'eraser', '|',
        'ul', 'ol', 'outdent', 'indent', 'align', '|', 'table', 'image', 'link', 'hr', 'symbols', '|', 'undo', 'redo', 'selectall', 'copyformat', '|', 'preview', 'fullsize', 'source'],
      removeButtons: ['file', 'video', 'print', 'about', 'spellcheck', 'speechRecognize', 'ai-commands', 'ai-assistant'],
      controls: { font: { list: { 'Poppins,sans-serif': 'Poppins (padrão do site)', 'Arial,Helvetica,sans-serif': 'Arial', 'Georgia,serif': 'Georgia', "'Times New Roman',Times,serif": 'Times New Roman', 'Verdana,Geneva,sans-serif': 'Verdana' } } },
      style: { fontFamily: 'Poppins, sans-serif', fontSize: '16px' },
      image: { editSrc: false },
      uploader: {
        url: '/api/admin/upload', format: 'json', withCredentials: true, headers: { 'x-cbhto-painel': '1' },
        filesVariableName: () => 'arquivo',
        isSuccess: r => !!(r && r.ok),
        getMessage: r => (r && r.erro) || 'Não foi possível enviar a imagem.',
        process: r => ({ files: r && r.url ? [r.url] : [], path: '', baseurl: '', error: r && r.ok ? 0 : 1, msg: (r && r.erro) || '' }),
        defaultHandlerSuccess: function (d) { (d.files || []).forEach(f => this.s.insertImage(f, null, 640)); },
        defaultHandlerError: function (e) { aviso(e.message || 'Erro ao enviar a imagem.', true); }
      }
    });
    ed.value = html || '';
    return ed;
  }

  function fecharModal() { if (EDITOR) { try { EDITOR.destruct(); } catch { } EDITOR = null; } const m = $('.fundo-modal'); if (m) m.remove(); const r = $('.rodape-modal'); if (r) r.remove(); document.body.style.overflow = ''; }
  function formulario(tipo, item) {
    const N = tipo === 'noticias'; const novo = !item; item = item || {};
    const fixo = !admin();
    document.body.style.overflow = 'hidden';
    const fundo = document.createElement('div'); fundo.className = 'fundo-modal';
    const comitesSel = N ? (item.comites || (fixo ? [EU.comite] : [])) : [];
    const comiteDoc = item.comite || (fixo ? EU.comite : '');
    fundo.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2>${novo ? (N ? 'Nova notícia' : 'Novo documento') : (N ? 'Editar notícia' : 'Editar documento')}</h2>
      ${!admin() ? '<div class="aviso-box">Depois de salvar, a publicação fica <b>aguardando aprovação</b> do administrador.</div>' : ''}
      ${item.legado ? '<div class="aviso-box">Este item veio do site antigo. Ao salvar, a sua versão substitui a original no site.</div>' : ''}
      ${item.status === 'recusado' && item.motivo ? `<div class="aviso-box erro">Recusado: ${esc(item.motivo)}</div>` : ''}
      <div class="campo"><label for="f-titulo">Título</label><input type="text" id="f-titulo" maxlength="250" value="${esc(item.titulo || '')}"></div>
      ${N ? `
      <div class="linha2"><div class="campo"><label for="f-data">Data</label><input type="date" id="f-data" value="${esc((item.data || hoje()).slice(0, 10))}"></div>
        <div class="campo"><span class="rot">Comitês</span>${fixo ? `<div>${chip(EU.comite)}</div>` : `<div class="opcoes-comites">${COMITES.map(c => `<label><input type="checkbox" value="${c.id}" ${comitesSel.includes(c.id) ? 'checked' : ''}> ${c.sigla}</label>`).join('')}</div><div class="ajuda">Sem nenhum marcado, a notícia aparece como geral do CBHTO.</div>`}</div></div>
      <div class="campo"><span class="rot">Foto de capa</span><div class="capa"><img id="f-capa-img" src="${esc(item.imagem ? (item.imagem.startsWith('/') || item.imagem.startsWith('http') ? item.imagem : '../' + item.imagem) : '../assets/img/marca/cbhto-azul.png')}" alt=""><div><input type="file" id="f-capa" accept="image/jpeg,image/png,image/webp"><div class="ajuda">JPG, PNG ou WebP, até 25 MB.</div>${item.imagem ? '<button class="btn linha peq" type="button" id="f-capa-tirar" style="margin-top:6px">Remover foto</button>' : ''}</div></div><input type="hidden" id="f-imagem" value="${esc(item.imagem || '')}"></div>
      <div class="campo"><label for="f-resumo">Resumo <span style="font-weight:400;color:var(--suave)">(aparece nos cartões; opcional)</span></label><textarea id="f-resumo" rows="2" maxlength="400">${esc(item.resumo || '')}</textarea></div>
      <div class="campo"><span class="rot">Texto da notícia</span>
        <textarea id="f-html"></textarea><div class="ajuda">Use a barra de ferramentas para formatar o texto e inserir tabelas, imagens e links. Ao colar do Word, a formatação é limpa automaticamente.</div></div>` : `
      <div class="campo"><label for="f-descricao">Descrição <span style="font-weight:400;color:var(--suave)">(opcional)</span></label><textarea id="f-descricao" rows="2" maxlength="500">${esc(item.descricao || '')}</textarea></div>
      <div class="linha2"><div class="campo"><label for="f-comite">Comitê</label>${fixo ? `<div>${chip(EU.comite)}</div><input type="hidden" id="f-comite" value="${esc(EU.comite)}">` : `<select id="f-comite"><option value="">Escolha…</option>${COMITES.map(c => `<option value="${c.id}" ${comiteDoc === c.id ? 'selected' : ''}>${c.sigla} – ${esc(c.curto || c.nome)}</option>`).join('')}<option value="cbhto" ${comiteDoc === 'cbhto' ? 'selected' : ''}>CBHTO – documento geral</option></select>`}</div>
        <div class="campo"><label for="f-categoria">Categoria</label><select id="f-categoria"></select></div></div>
      <div class="linha2"><div class="campo"><label for="f-ano">Ano</label><input type="number" id="f-ano" min="1990" max="2100" value="${esc(item.ano || new Date().getFullYear())}"></div><div></div></div>
      <div class="campo"><span class="rot">Arquivo</span><input type="file" id="f-arquivo" accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.ods,.csv,.jpg,.jpeg,.png"><div class="ajuda">PDF, Word, Excel, ODT ou imagem, até 25 MB. Ou cole um link https abaixo.</div>
        <input type="url" id="f-link" placeholder="https://…" style="margin-top:8px" value="${esc(item.arquivo || '')}"></div>`}
      </div>`;
    const rod = document.createElement('div'); rod.className = 'rodape-modal';
    rod.innerHTML = `<button class="btn linha" id="f-cancelar">Cancelar</button>${admin() && item.status === 'pendente' ? '<button class="btn vermelho" id="f-recusar">Recusar</button>' : ''}<button class="btn" id="f-salvar">${admin() ? (item.status === 'pendente' ? 'Aprovar e publicar' : 'Salvar e publicar') : 'Enviar para aprovação'}</button>`;
    document.body.append(fundo, rod);
    fundo.onclick = e => { if (e.target === fundo && confirm('Fechar sem salvar?')) fecharModal(); };
    $('#f-cancelar').onclick = () => fecharModal();
    if ($('#f-recusar')) $('#f-recusar').onclick = async () => { fecharModal(); await acao(tipo, 'recusar', item); };
    if (N) {
      EDITOR = criarEditor($('#f-html'), item.html || '');
      $('#f-capa').onchange = async e => { const r = await enviarArquivo(e.target); if (r) { $('#f-imagem').value = r.url; $('#f-capa-img').src = r.url; } };
      if ($('#f-capa-tirar')) $('#f-capa-tirar').onclick = () => { $('#f-imagem').value = ''; $('#f-capa-img').src = '../assets/img/marca/cbhto-azul.png'; };
    } else {
      const sc = $('#f-comite'), cat = $('#f-categoria');
      const encherCats = () => { const lista = sc.value === 'cbhto' ? CATS_GERAIS : CATS_COMITE; cat.innerHTML = `<option value="">Escolha…</option>` + lista.map(c => `<option ${item.categoria === c ? 'selected' : ''}>${c}</option>`).join(''); };
      if (sc.tagName === 'SELECT') sc.onchange = encherCats; encherCats();
      $('#f-arquivo').onchange = async e => { const r = await enviarArquivo(e.target); if (r) { $('#f-link').value = r.url; if (!$('#f-titulo').value) $('#f-titulo').value = r.nome.replace(/\.[^.]+$/, ''); } };
    }
    $('#f-salvar').onclick = async () => {
      const b = { titulo: $('#f-titulo').value.trim(), legado: item.legado ? 1 : 0 };
      if (N) Object.assign(b, { data: $('#f-data').value, comites: fixo ? [EU.comite] : $$('.opcoes-comites input:checked').map(i => i.value), imagem: $('#f-imagem').value, resumo: $('#f-resumo').value.trim(), html: EDITOR ? EDITOR.value : $('#f-html').value });
      else Object.assign(b, { descricao: $('#f-descricao').value.trim(), comite: $('#f-comite').value, categoria: $('#f-categoria').value, ano: $('#f-ano').value, arquivo: $('#f-link').value.trim() });
      const btn = $('#f-salvar'); btn.disabled = true;
      try {
        if (novo) await api(tipo, { method: 'POST', body: b });
        else { await api(`${tipo}/${encodeURIComponent(item.id)}`, { method: 'PUT', body: b }); if (admin() && item.status === 'pendente') await api(`${tipo}/${encodeURIComponent(item.id)}/aprovar`, { method: 'POST' }); }
        fecharModal(); aviso(admin() ? 'Publicado no site.' : 'Enviado para aprovação do administrador.');
        await montarAbas(); abrir(ABA);
      } catch (e) { aviso(e.message, true); btn.disabled = false; }
    };
    setTimeout(() => $('#f-titulo').focus(), 50);
  }

  /* ---------- aprovações ---------- */
  async function telaAprovacoes() {
    const tela = $('#tela');
    tela.innerHTML = `<h1>Aprovações</h1><p class="sub">Notícias e documentos enviados por presidentes e secretários, aguardando a sua revisão.</p><div class="cartao" id="lista"><div class="vazio">Carregando…</div></div>`;
    try {
      const [n, d] = await Promise.all([api('noticias?status=pendente'), api('documentos?status=pendente')]);
      const itens = n.map(x => Object.assign(x, { tipo: 'noticias', comites: JSON.parse(x.comites || '[]') })).concat(d.map(x => Object.assign(x, { tipo: 'documentos' })));
      if (!itens.length) { $('#lista').innerHTML = '<div class="vazio">Nada aguardando aprovação.</div>'; return; }
      $('#lista').innerHTML = `<table class="responsiva"><thead><tr><th>Título</th><th>Tipo</th><th>Comitê</th><th>Enviado por</th><th></th></tr></thead><tbody>${itens.map((i, k) => `<tr>
        <td><div class="tit">${esc(i.titulo)}</div><div class="meta">${dataBR(i.atualizado_em || i.criado_em)}</div></td><td>${i.tipo === 'noticias' ? 'Notícia' : 'Documento'}</td>
        <td>${i.tipo === 'noticias' ? (i.comites || []).map(chip).join('') : chip(i.comite)}</td><td>${esc(i.autor || '')}</td>
        <td class="acoes"><button class="btn linha peq" data-k="${k}" data-a="ver">Revisar</button><button class="btn verde peq" data-k="${k}" data-a="aprovar">Aprovar</button><button class="btn vermelho peq" data-k="${k}" data-a="recusar">Recusar</button></td></tr>`).join('')}</tbody></table>`;
      $$('#lista [data-a]').forEach(b => b.onclick = () => { const i = itens[+b.dataset.k]; b.dataset.a === 'ver' ? formulario(i.tipo, i) : acao(i.tipo, b.dataset.a, i); });
    } catch (e) { $('#lista').innerHTML = `<div class="vazio">${esc(e.message)}</div>`; }
  }

  /* ---------- usuários ---------- */
  async function telaUsuarios() {
    const tela = $('#tela');
    tela.innerHTML = `<h1>Usuários</h1><p class="sub">Quem pode entrar no painel. O acesso é feito com um código enviado ao e-mail cadastrado, sem senha.</p>
      <div class="barra"><button class="btn" id="novo-u">+ Cadastrar usuário</button></div><div class="cartao" id="lista"><div class="vazio">Carregando…</div></div>`;
    $('#novo-u').onclick = () => formUsuario(null);
    try {
      const r = await api('usuarios');
      const fixos = r.fixos.map(e => `<tr><td><div class="tit">${esc(e)}</div><div class="meta">Administrador principal (definido na configuração)</div></td><td>Administrador</td><td>—</td><td><span class="selo publicado">Ativo</span></td><td></td></tr>`).join('');
      $('#lista').innerHTML = `<table class="responsiva"><thead><tr><th>Nome / e-mail</th><th>Perfil</th><th>Comitê</th><th>Situação</th><th></th></tr></thead><tbody>${fixos}${r.usuarios.map((u, k) => `<tr>
        <td><div class="tit">${esc(u.nome || u.email)}</div><div class="meta">${esc(u.email)}</div></td><td>${PERFIL[u.perfil] || esc(u.perfil)}</td><td>${chip(u.comite) || '—'}</td>
        <td>${u.ativo ? '<span class="selo publicado">Ativo</span>' : '<span class="selo removido">Desativado</span>'}</td>
        <td class="acoes"><button class="btn linha peq" data-k="${k}" data-a="editar">Editar</button><button class="btn linha peq" data-k="${k}" data-a="excluir">Excluir</button></td></tr>`).join('')}</tbody></table>`;
      $$('#lista [data-a]').forEach(b => b.onclick = async () => {
        const u = r.usuarios[+b.dataset.k];
        if (b.dataset.a === 'editar') return formUsuario(u);
        if (!confirm(`Excluir o acesso de ${u.email}?`)) return;
        try { await api('usuarios/' + encodeURIComponent(u.email), { method: 'DELETE' }); aviso('Acesso excluído.'); telaUsuarios(); } catch (e) { aviso(e.message, true); }
      });
    } catch (e) { $('#lista').innerHTML = `<div class="vazio">${esc(e.message)}</div>`; }
  }
  function formUsuario(u) {
    const novo = !u; u = u || { perfil: 'presidente', ativo: 1 };
    document.body.style.overflow = 'hidden';
    const fundo = document.createElement('div'); fundo.className = 'fundo-modal';
    fundo.innerHTML = `<div class="modal"><h2>${novo ? 'Cadastrar usuário' : 'Editar usuário'}</h2>
      <div class="campo"><label for="u-email">E-mail</label><input type="email" id="u-email" value="${esc(u.email || '')}" ${novo ? '' : 'disabled'}><div class="ajuda">A pessoa entra no painel com um código enviado para este e-mail.</div></div>
      <div class="campo"><label for="u-nome">Nome</label><input type="text" id="u-nome" maxlength="120" value="${esc(u.nome || '')}"></div>
      <div class="linha2"><div class="campo"><label for="u-perfil">Perfil</label><select id="u-perfil">${Object.entries(PERFIL).map(([k, v]) => `<option value="${k}" ${u.perfil === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="campo" id="u-comite-campo"><label for="u-comite">Comitê</label><select id="u-comite"><option value="">Escolha…</option>${COMITES.map(c => `<option value="${c.id}" ${u.comite === c.id ? 'selected' : ''}>${c.sigla} – ${esc(c.curto || c.nome)}</option>`).join('')}</select></div></div>
      <div class="campo"><label><input type="checkbox" id="u-ativo" ${u.ativo ? 'checked' : ''}> Acesso ativo</label></div>
      <div class="aviso-box"><b>Administrador:</b> publica direto, aprova, gerencia usuários e vê o histórico.<br><b>Presidente e Secretário(a):</b> enviam notícias e documentos só do próprio comitê, com aprovação do administrador. Não alteram o site.</div></div>`;
    const rod = document.createElement('div'); rod.className = 'rodape-modal';
    rod.innerHTML = '<button class="btn linha" id="u-cancelar">Cancelar</button><button class="btn" id="u-salvar">Salvar</button>';
    document.body.append(fundo, rod);
    const ajustar = () => $('#u-comite-campo').style.visibility = $('#u-perfil').value === 'admin' ? 'hidden' : 'visible';
    $('#u-perfil').onchange = ajustar; ajustar();
    $('#u-cancelar').onclick = fecharModal;
    $('#u-salvar').onclick = async () => {
      const b = { email: $('#u-email').value.trim(), nome: $('#u-nome').value.trim(), perfil: $('#u-perfil').value, comite: $('#u-comite').value, ativo: $('#u-ativo').checked };
      try { novo ? await api('usuarios', { method: 'POST', body: b }) : await api('usuarios/' + encodeURIComponent(u.email), { method: 'PUT', body: b }); fecharModal(); aviso('Usuário salvo.'); telaUsuarios(); }
      catch (e) { aviso(e.message, true); }
    };
  }

  /* ---------- histórico ---------- */
  async function telaHistorico() {
    const tela = $('#tela');
    tela.innerHTML = `<h1>Histórico</h1><p class="sub">As últimas 300 ações feitas no painel.</p><div class="cartao" id="lista"><div class="vazio">Carregando…</div></div>`;
    try {
      const r = await api('historico');
      $('#lista').innerHTML = r.length ? `<table class="responsiva"><thead><tr><th>Quando</th><th>Quem</th><th>Ação</th><th>Item</th></tr></thead><tbody>${r.map(h => `<tr>
        <td>${esc(new Date(h.quando).toLocaleString('pt-BR'))}</td><td>${esc(h.email)}</td><td>${esc(h.acao)} ${esc(h.tipo)}</td><td>${esc(h.titulo || h.item_id)}</td></tr>`).join('')}</tbody></table>` : '<div class="vazio">Nenhuma ação registrada ainda.</div>';
    } catch (e) { $('#lista').innerHTML = `<div class="vazio">${esc(e.message)}</div>`; }
  }

  iniciar();
})();
