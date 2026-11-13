/* ==========================================================================
   Painel – edição da página de cada comitê (aba "O Comitê" do site):
   descrição, imagem da bacia, ficha (sede, região, área, criação, municípios, e-mail) e diretoria.
   Administrador: edita qualquer comitê e publica direto.
   Presidente e secretário: editam o próprio comitê; a mudança espera aprovação.
   ========================================================================== */
(function () {
  'use strict';
  const P = () => window.PAINEL;
  const CAMPOS = { resumo: 'Resumo', sede: 'Sede', regiao: 'Região', area: 'Área da bacia', criacao: 'Criação', email: 'E-mail', municipios: 'Municípios', mapa: 'Imagem da bacia', diretoria: 'Diretoria', historia: 'Descrição' };
  const STATUS = { pendente: 'Aguardando aprovação', aprovada: 'Aprovada', recusada: 'Recusada' };
  let editor = null, DADOS = { publicadas: {}, pendentes: [] };
  const abs = s => !s ? '' : (/^(https?:|\/)/.test(s) ? s : '/' + s);                       // caminho que funciona dentro do painel
  const absHtml = h => String(h || '').replace(/(src|href)="(midia|assets)\//g, '$1="/$2/');

  async function estaticos() {   // textos originais do site (antes de qualquer edição)
    const { carregarScript } = P();
    if (!window.CONTEUDO) { try { await carregarScript('../assets/js/conteudo.js'); } catch (e) { } }
    if (!window.COMPOSICAO) { try { await carregarScript('../assets/js/composicao.js'); } catch (e) { } }
  }
  // dados em vigor de um comitê: o que está no site hoje (originais + última edição publicada)
  function emVigor(id) {
    const c = P().porId[id] || {}, x = (window.CONTEUDO || {})[id] || {}, k = (window.COMPOSICAO || {})[id] || {}, pub = DADOS.publicadas[id] || {};
    const hist0 = x.historia || '<h2>Quem somos</h2>' + (c.texto || []).map(p => `<p>${P().esc(p)}</p>`).join('');
    const base = {
      resumo: c.resumo || '', sede: c.sede || '', regiao: c.regiao || '', area: c.area || '', criacao: c.criacao || '', email: k.email || '',
      municipios: c.municipios || [], mapa: c.mapa || '', diretoria: k.diretoria || [],
      historia: /<img/.test(hist0) || !c.mapa ? hist0 : `<img src="${c.mapa}" alt="Área de abrangência | ${P().esc(c.curto || '')}">` + hist0
    };
    const o = Object.assign({}, base);
    for (const f of Object.keys(CAMPOS)) { const v = pub[f]; if (Array.isArray(v) ? v.length : v) o[f] = v; }
    return o;
  }
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const semTags = h => absHtml(h).replace(/\s+/g, ' ').trim();
  function mudancas(id, novo) {
    const at = emVigor(id);
    return Object.keys(CAMPOS).filter(f => f === 'historia' ? semTags(at.historia) !== semTags(novo.historia) : !igual(at[f] || (Array.isArray(novo[f]) ? [] : ''), novo[f] || (Array.isArray(at[f]) ? [] : ''))).map(f => CAMPOS[f]);
  }
  async function carregar() { try { DADOS = await P().api('paginas'); } catch (e) { P().aviso(e.message, true); } await estaticos(); }

  /* ---------------- tela de edição ---------------- */
  async function telaPaginas(op) {
    op = op || {};
    const { $, $$, esc, api, aviso, admin, COMITES, porId, EU, enviarArquivo, criarEditor, montarAbas, abrir } = P();
    const tela = $('#tela'); if (editor) { try { editor.destruct(); } catch (e) { } editor = null; }
    tela.innerHTML = '<div class="vazio">Carregando…</div>'; await carregar();
    const adm = admin(); const id = op.pendente ? op.pendente.comite : (adm ? (op.comite || COMITES[0].id) : EU.comite);
    const c = porId[id]; if (!c) { tela.innerHTML = '<div class="vazio">Comitê não encontrado.</div>'; return; }
    const d = op.pendente ? Object.assign(emVigor(id), op.pendente.dados) : emVigor(id);
    const minhas = DADOS.pendentes.filter(p => p.comite === id);
    const aguardando = !adm && minhas.find(p => p.status === 'pendente');
    const dAtual = aguardando ? Object.assign(emVigor(id), aguardando.dados) : d;
    tela.innerHTML = `<h1>${adm ? 'Páginas dos comitês' : 'Página do comitê'}</h1>
      <p class="sub">${adm ? 'Edite a página de qualquer comitê. O que você salvar vai direto para o site.' : 'Edite as informações do seu comitê. A mudança aparece no site depois que o administrador aprovar.'}</p>
      ${op.pendente ? `<div class="aviso-box">Edição enviada por <b>${esc(op.pendente.autor)}</b>. Mudou: ${esc(mudancas(id, op.pendente.dados).join(', ') || 'nada')}. Confira, ajuste se precisar e aprove ou recuse.</div>` : ''}
      ${aguardando ? '<div class="aviso-box">Você tem uma edição <b>aguardando aprovação</b>. Abaixo está a versão que você enviou; salvar de novo substitui o envio anterior.</div>' : ''}
      ${adm && !op.pendente ? `<div class="barra"><label for="pg-comite"><b>Comitê:</b></label><select id="pg-comite">${COMITES.map(x => `<option value="${x.id}" ${x.id === id ? 'selected' : ''}>${x.sigla} – ${esc(x.curto || x.nome)}</option>`).join('')}</select><a class="btn linha peq" href="/comite?c=${id}" target="_blank" rel="noopener">Ver a página no site</a></div>` : ''}
      <div class="cartao bloco">
        <h2 class="sec" style="margin-top:0">${esc(c.sigla)} – ${esc(c.nome)}</h2>
        <div class="campo"><label for="pg-resumo">Resumo <span class="leve">(uma frase, aparece abaixo do nome do comitê)</span></label><input type="text" id="pg-resumo" maxlength="220" value="${esc(dAtual.resumo)}"></div>
        <div class="linha2"><div class="campo"><label for="pg-sede">Sede</label><input type="text" id="pg-sede" maxlength="80" value="${esc(dAtual.sede)}"></div>
          <div class="campo"><label for="pg-regiao">Região</label><input type="text" id="pg-regiao" maxlength="60" value="${esc(dAtual.regiao)}"></div></div>
        <div class="linha2"><div class="campo"><label for="pg-area">Área da bacia</label><input type="text" id="pg-area" maxlength="40" value="${esc(dAtual.area)}" placeholder="Ex.: 12.310 km²"></div>
          <div class="campo"><label for="pg-criacao">Criação</label><input type="text" id="pg-criacao" maxlength="40" value="${esc(dAtual.criacao)}" placeholder="Ex.: 02/12/2024"></div></div>
        <div class="campo"><label for="pg-email">E-mail do comitê</label><input type="email" id="pg-email" maxlength="120" value="${esc(dAtual.email)}"></div>
        <div class="campo"><label for="pg-municipios">Municípios <span class="leve">(um por linha)</span></label><textarea id="pg-municipios" rows="6">${esc((dAtual.municipios || []).join('\n'))}</textarea></div>
        <div class="campo"><span class="rot">Imagem da bacia <span class="leve">(mapa ou área de abrangência)</span></span>
          ${dAtual.mapa ? `<img class="mapa-atual" id="pg-mapa-img" src="${esc(abs(dAtual.mapa))}" alt="">` : '<img class="mapa-atual" id="pg-mapa-img" alt="" hidden>'}
          <input type="file" id="pg-mapa-arq" accept="image/jpeg,image/png,image/webp"><input type="hidden" id="pg-mapa" value="${esc(dAtual.mapa)}"><div class="ajuda">Para trocar, envie uma imagem JPG, PNG ou WebP, até 25 MB.</div></div>
        <div class="campo"><span class="rot">Diretoria</span><div id="pg-dir"></div><button class="btn linha peq" type="button" id="pg-dir-mais">+ Adicionar pessoa</button></div>
        <div class="campo"><span class="rot">Descrição do comitê <span class="leve">(texto da aba "O Comitê": imagem, título e história)</span></span><textarea id="pg-historia"></textarea></div>
        <div class="barra" style="justify-content:flex-end;margin:0">
          ${op.pendente ? '<button class="btn linha" id="pg-voltar">Voltar</button><button class="btn vermelho" id="pg-recusar">Recusar</button><button class="btn verde" id="pg-salvar">Aprovar e publicar</button>'
          : `<button class="btn" id="pg-salvar">${adm ? 'Salvar e publicar' : 'Enviar para aprovação'}</button>`}</div>
      </div>
      ${!adm && minhas.length ? `<h2 class="sec">Suas edições enviadas</h2><div class="cartao"><table class="responsiva"><thead><tr><th>Enviada em</th><th>Situação</th><th></th></tr></thead><tbody>${minhas.map(p => `<tr>
        <td>${esc(new Date(p.criado_em).toLocaleString('pt-BR'))}</td><td><span class="selo ${p.status === 'aprovada' ? 'publicado' : p.status === 'recusada' ? 'recusado' : 'pendente'}">${STATUS[p.status] || esc(p.status)}</span>${p.motivo ? `<div class="meta">Motivo: ${esc(p.motivo)}</div>` : ''}</td>
        <td class="acoes">${p.status === 'pendente' ? `<button class="btn linha peq" data-pg-cancelar="${esc(p.id)}">Cancelar envio</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : ''}`;

    // diretoria: linhas editáveis
    const linhaDir = p => `<div class="dir-linha"><input type="text" data-d="cargo" maxlength="60" placeholder="Cargo" value="${esc(p.cargo || '')}"><input type="text" data-d="nome" maxlength="120" placeholder="Nome" value="${esc(p.nome || '')}"><input type="text" data-d="instituicao" maxlength="160" placeholder="Instituição" value="${esc(p.instituicao || '')}"><button class="btn linha peq" type="button" data-d-tirar>Remover</button></div>`;
    const ligarDir = () => $$('[data-d-tirar]').forEach(b => b.onclick = () => b.parentElement.remove());
    $('#pg-dir').innerHTML = (dAtual.diretoria || []).map(linhaDir).join(''); ligarDir();
    $('#pg-dir-mais').onclick = () => { $('#pg-dir').insertAdjacentHTML('beforeend', linhaDir({})); ligarDir(); };

    editor = criarEditor($('#pg-historia'), absHtml(dAtual.historia));
    $('#pg-mapa-arq').onchange = async e => { const r = await enviarArquivo(e.target); if (r) { $('#pg-mapa').value = r.url; const im = $('#pg-mapa-img'); im.src = r.url; im.hidden = false; } };
    if ($('#pg-comite')) $('#pg-comite').onchange = e => telaPaginas({ comite: e.target.value });
    $$('[data-pg-cancelar]').forEach(b => b.onclick = async () => { try { await api('paginas/' + encodeURIComponent(b.dataset.pgCancelar), { method: 'DELETE' }); aviso('Envio cancelado.'); telaPaginas(); } catch (e) { aviso(e.message, true); } });

    const ler = () => ({
      resumo: $('#pg-resumo').value.trim(), sede: $('#pg-sede').value.trim(), regiao: $('#pg-regiao').value.trim(), area: $('#pg-area').value.trim(), criacao: $('#pg-criacao').value.trim(),
      email: $('#pg-email').value.trim(), municipios: $('#pg-municipios').value.split('\n').map(s => s.trim()).filter(Boolean), mapa: $('#pg-mapa').value,
      diretoria: $$('.dir-linha').map(l => ({ cargo: $('[data-d=cargo]', l).value.trim(), nome: $('[data-d=nome]', l).value.trim(), instituicao: $('[data-d=instituicao]', l).value.trim() })).filter(p => p.nome),
      historia: editor ? editor.value : $('#pg-historia').value
    });
    $('#pg-salvar').onclick = async () => {
      const b = $('#pg-salvar'); b.disabled = true;
      try {
        if (op.pendente) { await api(`paginas/${encodeURIComponent(op.pendente.id)}/aprovar`, { method: 'POST', body: ler() }); aviso('Edição aprovada. Aparece no site em até 1 minuto.'); await montarAbas(); abrir('aprovacoes'); return; }
        const r = await api('paginas/' + id, { method: 'PUT', body: ler() });
        aviso(r.status === 'publicado' ? 'Página salva. Aparece no site em até 1 minuto.' : 'Edição enviada para aprovação do administrador.');
        await montarAbas(); telaPaginas({ comite: id });
      } catch (e) { aviso(e.message, true); b.disabled = false; }
    };
    if ($('#pg-voltar')) $('#pg-voltar').onclick = () => abrir('aprovacoes');
    if ($('#pg-recusar')) $('#pg-recusar').onclick = async () => {
      const motivo = prompt('Motivo da recusa (aparece para quem enviou):', ''); if (motivo === null) return;
      try { await api(`paginas/${encodeURIComponent(op.pendente.id)}/recusar`, { method: 'POST', body: { motivo } }); aviso('Edição recusada.'); await montarAbas(); abrir('aprovacoes'); } catch (e) { aviso(e.message, true); }
    };
  }

  /* ---------------- pendências na aba Aprovações (administrador) ---------------- */
  async function paginasPendentes(alvo) {
    const { $$, esc, chip, api, aviso, montarAbas, abrir } = P(); if (!alvo) return;
    await carregar(); const pend = DADOS.pendentes.filter(p => p.status === 'pendente');
    if (!pend.length) { alvo.innerHTML = ''; return; }
    alvo.innerHTML = `<h2 class="sec">Edições das páginas dos comitês</h2><div class="cartao"><table class="responsiva"><thead><tr><th>Comitê</th><th>O que mudou</th><th>Enviado por</th><th></th></tr></thead><tbody>${pend.map((p, k) => `<tr>
      <td>${chip(p.comite)}</td><td>${esc(mudancas(p.comite, p.dados).join(', ') || 'Sem mudanças')}<div class="meta">${esc(new Date(p.criado_em).toLocaleString('pt-BR'))}</div></td><td>${esc(p.autor || '')}</td>
      <td class="acoes"><button class="btn linha peq" data-pg="${k}" data-a="ver">Revisar</button><button class="btn verde peq" data-pg="${k}" data-a="aprovar">Aprovar</button><button class="btn vermelho peq" data-pg="${k}" data-a="recusar">Recusar</button></td></tr>`).join('')}</tbody></table></div>`;
    $$('[data-pg]', alvo).forEach(b => b.onclick = async () => {
      const p = pend[+b.dataset.pg];
      try {
        if (b.dataset.a === 'ver') { P().$$('#abas button').forEach(x => x.classList.toggle('ativo', x.dataset.aba === 'paginas')); return telaPaginas({ pendente: p }); }
        if (b.dataset.a === 'recusar') { const motivo = prompt('Motivo da recusa (aparece para quem enviou):', ''); if (motivo === null) return; await api(`paginas/${encodeURIComponent(p.id)}/recusar`, { method: 'POST', body: { motivo } }); aviso('Edição recusada.'); }
        else { await api(`paginas/${encodeURIComponent(p.id)}/aprovar`, { method: 'POST' }); aviso('Edição aprovada. Aparece no site em até 1 minuto.'); }
        await montarAbas(); abrir('aprovacoes');
      } catch (e) { aviso(e.message, true); }
    });
  }

  window.PAINEL_TELAS = Object.assign(window.PAINEL_TELAS || {}, { paginas: telaPaginas, paginasPendentes });
})();
