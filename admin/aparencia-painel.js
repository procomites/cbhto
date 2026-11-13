/* ==========================================================================
   Painel – aba Aparência (administrador): tema de cor, faixa da campanha e fotos dos banners.
   Aba "Banner do comitê" (presidente e secretário): sugerir fotos, com aprovação do administrador.
   Usa as ferramentas de admin.js (window.PAINEL) e de assets/js/aparencia.js (window.APARENCIA).
   ========================================================================== */
(function () {
  'use strict';
  const AP = window.APARENCIA;
  const P = () => window.PAINEL;
  const NOME_FOCO = { centro: 'Centro', esquerda: 'Lado esquerdo', direita: 'Lado direito', topo: 'Parte de cima', base: 'Parte de baixo' };
  const NOME_LADO = { esq: 'esquerda', dir: 'direita' };
  const STATUS = { pendente: 'Aguardando análise', aprovada: 'Aprovada', recusada: 'Recusada' };
  let ESTADO = { tema: 'padrao', faixa: {}, banners: {} };

  const nomeBanner = id => id === 'cbhto' ? 'CBHTO – banner geral' : ((P().porId[id] || {}).sigla || id.toUpperCase()) + ' – ' + ((P().porId[id] || {}).curto || '');
  const listaBanners = () => ['cbhto'].concat(P().COMITES.map(c => c.id)).filter(id => (window.BANNERS || {})[id]);
  const miniatura = src => src.charAt(0) === '/' ? src : '../' + src;
  // prévia do banner com um tema e (opcionalmente) uma foto em teste
  function previa(id, tema, troca, sufixo) {
    const base = Object.assign({}, ESTADO.banners[id]);
    return `<div class="previa-banner" data-tema="${tema}">${AP.banner(id, { raiz: '../', sufixo: '-' + sufixo, troca: Object.assign(base, troca) })}</div>`;
  }
  async function carregar() { try { ESTADO = await P().api('aparencia'); } catch (e) { P().aviso(e.message, true); } return ESTADO; }

  /* ---------------- aba Aparência (administrador) ---------------- */
  async function telaAparencia() {
    const { $, $$, esc, api, aviso } = P(); const tela = $('#tela');
    tela.innerHTML = '<div class="vazio">Carregando…</div>'; await carregar();
    const f = ESTADO.faixa || {};
    tela.innerHTML = `<h1>Aparência do site</h1><p class="sub">O tema muda as cores do site inteiro, inclusive o fundo dos banners. Os logos e as cores de cada comitê no mapa não mudam. A troca aparece no site em até 1 minuto.</p>
      <h2 class="sec">Tema de cor</h2>
      <div class="temas">${Object.entries(AP.TEMAS).map(([id, t]) => `<div class="tema-card${id === ESTADO.tema ? ' ativo' : ''}">
        ${previa('cbhto', id, null, 't-' + id)}
        <div class="tema-info"><b>${esc(t.nome)}</b><small>${esc(t.quando)}</small>
          <div class="amostras">${t.amostra.map(c => `<i style="background:${c}"></i>`).join('')}</div>
          ${id === ESTADO.tema ? '<span class="selo publicado">Em uso</span>' : `<button class="btn peq" data-tema-ativar="${id}">Ativar</button>`}</div></div>`).join('')}</div>
      <h2 class="sec">Faixa da campanha</h2>
      <p class="sub">Uma linha fina no topo de todas as páginas, na cor do tema. Use para o nome da campanha ou do evento.</p>
      <div class="cartao bloco"><div class="campo"><label><input type="checkbox" id="fx-ativa" ${f.ativa ? 'checked' : ''}> Mostrar a faixa no site</label></div>
        <div class="linha2"><div class="campo"><label for="fx-texto">Texto (até 140 letras)</label><input type="text" id="fx-texto" maxlength="140" value="${esc(f.texto || '')}" placeholder="Ex.: Setembro Amarelo: a vida importa"></div>
        <div class="campo"><label for="fx-link">Link ao clicar <span class="leve">(opcional)</span></label><input type="text" id="fx-link" maxlength="300" value="${esc(f.link || '')}" placeholder="https://… ou noticias.html"></div></div>
        <button class="btn" id="fx-salvar">Salvar faixa</button></div>
      <h2 class="sec">Fotos dos banners</h2>
      <p class="sub">Cada banner tem uma foto à esquerda e outra à direita. Escolha entre as paisagens das bacias, o acervo de fotos dos comitês ou envie uma foto nova.</p>
      <div class="banners-lista">${listaBanners().map(id => linhaBanner(id, 'adm')).join('')}</div>`;
    $$('[data-tema-ativar]').forEach(b => b.onclick = async () => {
      const id = b.dataset.temaAtivar; b.disabled = true;
      try { ESTADO = await api('aparencia', { method: 'PUT', body: { tema: id } }); aviso(`Tema "${AP.TEMAS[id].nome}" ativado. Aparece no site em até 1 minuto.`); telaAparencia(); }
      catch (e) { aviso(e.message, true); b.disabled = false; }
    });
    $('#fx-salvar').onclick = async () => {
      try { ESTADO = await api('aparencia', { method: 'PUT', body: { faixa: { ativa: $('#fx-ativa').checked, texto: $('#fx-texto').value.trim(), link: $('#fx-link').value.trim() } } }); aviso('Faixa salva.'); }
      catch (e) { aviso(e.message, true); }
    };
    ligarBanners('adm');
  }
  function linhaBanner(id, modo) {
    const { esc } = P(); const tr = ESTADO.banners[id] || {};
    const cred = k => tr[k] && tr[k].credito ? `<small>Foto da ${NOME_LADO[k]}: ${esc(tr[k].credito)}</small>` : '';
    const verbo = modo === 'adm' ? 'Trocar' : 'Sugerir';
    return `<div class="cartao banner-linha">${previa(id, ESTADO.tema, null, 'l-' + id)}
      <div class="banner-acoes"><b>${esc(nomeBanner(id))}</b>${cred('esq')}${cred('dir')}
        <div><button class="btn linha peq" data-trocar="${id}" data-lado="esq">${verbo} foto da esquerda</button>
        <button class="btn linha peq" data-trocar="${id}" data-lado="dir">${verbo} foto da direita</button>
        ${modo === 'adm' && (tr.esq || tr.dir) ? `<button class="btn linha peq" data-padrao="${id}">Voltar às fotos originais</button>` : ''}</div></div></div>`;
  }
  function ligarBanners(modo) {
    const { $$, api, aviso } = P();
    $$('[data-trocar]').forEach(b => b.onclick = () => escolherFoto(b.dataset.trocar, b.dataset.lado, modo));
    $$('[data-padrao]').forEach(b => b.onclick = async () => {
      if (!confirm('Voltar este banner às fotos originais?')) return;
      const bn = Object.assign({}, ESTADO.banners); delete bn[b.dataset.padrao];
      try { ESTADO = await api('aparencia', { method: 'PUT', body: { banners: bn } }); aviso('Fotos originais restauradas.'); telaAparencia(); } catch (e) { aviso(e.message, true); }
    });
  }

  /* ---------------- escolha da foto ---------------- */
  async function escolherFoto(id, lado, modo) {
    const { $, $$, esc, api, aviso, enviarArquivo, fecharModal, carregarScript, porId } = P();
    const sigla = id === 'cbhto' ? 'CBHTO' : (porId[id] || {}).sigla || id.toUpperCase();
    let sel = null;   // { src, titulo, credito }
    document.body.style.overflow = 'hidden';
    const fundo = document.createElement('div'); fundo.className = 'fundo-modal';
    fundo.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2>${modo === 'adm' ? 'Trocar' : 'Sugerir'} foto da ${NOME_LADO[lado]} – ${esc(sigla)}</h2>
      ${modo === 'adm' ? '' : '<div class="aviso-box">A foto sugerida só entra no site depois que o administrador aprovar.</div>'}
      <div class="abas-fotos"><button data-fonte="paisagens" class="ativo">Paisagens das bacias</button><button data-fonte="acervo">Acervo dos comitês</button><button data-fonte="enviar">Enviar foto</button></div>
      <div id="ft-area"></div>
      <div id="ft-escolhida" hidden><h3 class="sec">Prévia</h3><div id="ft-previa"></div>
        <div class="linha2"><div class="campo"><label for="ft-foco">Parte da foto que deve aparecer</label><select id="ft-foco">${Object.entries(NOME_FOCO).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <div class="campo"><label for="ft-credito">Crédito (quem tirou a foto)</label><input type="text" id="ft-credito" maxlength="160"></div></div></div></div>`;
    const rod = document.createElement('div'); rod.className = 'rodape-modal';
    rod.innerHTML = `<button class="btn linha" id="ft-cancelar">Cancelar</button><button class="btn" id="ft-usar" disabled>${modo === 'adm' ? 'Usar esta foto' : 'Enviar sugestão'}</button>`;
    document.body.append(fundo, rod);
    $('#ft-cancelar').onclick = fecharModal;
    const atualizar = () => {
      if (!sel) return;
      $('#ft-escolhida').hidden = false; $('#ft-usar').disabled = false;
      $('#ft-previa').innerHTML = previa(id, ESTADO.tema, { [lado]: { src: sel.src, foco: $('#ft-foco').value } }, 'p');
    };
    const escolher = f => { sel = f; $('#ft-credito').value = f.credito || ''; atualizar(); $('#ft-escolhida').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
    $('#ft-foco').onchange = atualizar;
    const grade = fotos => fotos.length ? `<div class="grade-fotos">${fotos.map((f, k) => `<button type="button" data-k="${k}" title="${esc(f.titulo || '')}"><img src="${esc(miniatura(f.src))}" alt="${esc(f.titulo || '')}" loading="lazy"><span>${esc(f.titulo || '')}</span></button>`).join('')}</div>` : '<div class="vazio">Nenhuma foto aqui.</div>';
    const ligarGrade = (fotos, raiz) => $$('.grade-fotos button', raiz).forEach(b => b.onclick = () => { $$('.grade-fotos button').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); escolher(fotos[+b.dataset.k]); });

    const fontes = {
      paisagens() {
        const todas = window.FOTOS_BANNER || [];
        const fotos = todas.filter(f => f.comites.includes(id)).concat(todas.filter(f => !f.comites.includes(id)));
        $('#ft-area').innerHTML = `<p class="sub">Fotos de rios e pontos turísticos das bacias, de uso livre. As da bacia deste banner vêm primeiro.</p>` + grade(fotos);
        ligarGrade(fotos, $('#ft-area'));
      },
      async acervo() {
        $('#ft-area').innerHTML = '<div class="vazio">Carregando o acervo…</div>';
        if (!window.GALERIAS) { try { await carregarScript('../assets/js/galerias.js'); } catch (e) { } }
        const albuns = (window.GALERIAS || []).filter(g => g.comite !== 'acervo' && (id === 'cbhto' || g.comite === id));
        if (!albuns.length) { $('#ft-area').innerHTML = '<div class="vazio">Este comitê ainda não tem álbuns no acervo.</div>'; return; }
        $('#ft-area').innerHTML = `<p class="sub">Fotos dos álbuns já publicados no site. Para banner, prefira paisagens e rios a fotos de pessoas.</p>
          <div class="campo"><label for="ft-album">Álbum</label><select id="ft-album">${albuns.map((g, k) => `<option value="${k}">${esc(((porId[g.comite] || {}).sigla || '') + ' · ' + g.titulo)} (${g.fotos.length})</option>`).join('')}</select></div><div id="ft-album-fotos"></div>`;
        const mostra = () => { const g = albuns[+$('#ft-album').value]; const cr = 'Acervo ' + ((porId[g.comite] || {}).sigla || 'CBHTO');
          const fotos = g.fotos.filter(s => /\.(jpe?g|png|webp)$/i.test(s)).map(s => ({ src: s, titulo: g.titulo, credito: cr }));
          $('#ft-album-fotos').innerHTML = grade(fotos); ligarGrade(fotos, $('#ft-album-fotos')); };
        $('#ft-album').onchange = mostra; mostra();
      },
      enviar() {
        $('#ft-area').innerHTML = `<p class="sub">Envie uma foto em formato deitado (paisagem), de preferência com 1.400 pontos de largura ou mais, em JPG, PNG ou WebP, até 25 MB.</p>
          <div class="campo"><input type="file" id="ft-arquivo" accept="image/jpeg,image/png,image/webp"></div>
          <div class="aviso-box">Só envie fotos do comitê ou de uso livre, e informe o crédito. Fotos tiradas de outros sites podem ter direitos autorais.</div>`;
        $('#ft-arquivo').onchange = async e => {
          const arq = e.target.files[0]; if (!arq) return;
          const dim = await new Promise(ok => { const im = new Image(); im.onload = () => ok([im.naturalWidth, im.naturalHeight]); im.onerror = () => ok([0, 0]); im.src = URL.createObjectURL(arq); });
          if (dim[0] && dim[0] < 1000 && !confirm(`Esta foto tem só ${dim[0]} pontos de largura e pode ficar borrada no banner. Enviar mesmo assim?`)) { e.target.value = ''; return; }
          const r = await enviarArquivo(e.target); if (r) escolher({ src: r.url, titulo: arq.name.replace(/\.[^.]+$/, ''), credito: '' });
        };
      }
    };
    $$('.abas-fotos button').forEach(b => b.onclick = () => { $$('.abas-fotos button').forEach(x => x.classList.toggle('ativo', x === b)); fontes[b.dataset.fonte](); });
    fontes.paisagens();

    $('#ft-usar').onclick = async () => {
      const credito = $('#ft-credito').value.trim();
      if (!credito) { aviso('Informe o crédito da foto (quem tirou).', true); $('#ft-credito').focus(); return; }
      const foto = { src: sel.src, foco: $('#ft-foco').value, titulo: sel.titulo || '', credito };
      const btn = $('#ft-usar'); btn.disabled = true;
      try {
        if (modo === 'adm') {
          const bn = Object.assign({}, ESTADO.banners); bn[id] = Object.assign({}, bn[id], { [lado]: foto });
          ESTADO = await api('aparencia', { method: 'PUT', body: { banners: bn } });
          fecharModal(); aviso('Foto trocada. Aparece no site em até 1 minuto.'); telaAparencia();
        } else {
          await api('sugestoes', { method: 'POST', body: Object.assign({ lado }, foto) });
          fecharModal(); aviso('Sugestão enviada para o administrador.'); telaBanner();
        }
      } catch (e) { aviso(e.message, true); btn.disabled = false; }
    };
  }

  /* ---------------- aba Banner do comitê (presidente e secretário) ---------------- */
  async function telaBanner() {
    const { $, $$, esc, api, aviso, EU } = P(); const tela = $('#tela'); const id = EU.comite;
    tela.innerHTML = '<div class="vazio">Carregando…</div>'; await carregar();
    let sug = []; try { sug = await api('sugestoes'); } catch (e) { }
    tela.innerHTML = `<h1>Banner do comitê</h1><p class="sub">Este é o banner do seu comitê na página inicial. Você pode sugerir outras fotos; elas entram no site depois que o administrador aprovar.</p>
      <div class="banners-lista">${(window.BANNERS || {})[id] ? linhaBanner(id, 'sug') : '<div class="vazio">Banner não encontrado.</div>'}</div>
      <h2 class="sec">Suas sugestões</h2><div class="cartao" id="lista">${sug.length ? `<table class="responsiva"><thead><tr><th>Foto</th><th>Lado</th><th>Crédito</th><th>Situação</th><th></th></tr></thead><tbody>${sug.map(s => `<tr>
        <td><img class="mini" src="${esc(miniatura(s.src))}" alt=""></td><td>${NOME_LADO[s.lado] || ''}</td><td>${esc(s.credito || '')}</td>
        <td><span class="selo ${s.status === 'aprovada' ? 'publicado' : s.status === 'recusada' ? 'recusado' : 'pendente'}">${STATUS[s.status] || esc(s.status)}</span>${s.motivo ? `<div class="meta">Motivo: ${esc(s.motivo)}</div>` : ''}</td>
        <td class="acoes">${s.status === 'pendente' ? `<button class="btn linha peq" data-sug-excluir="${esc(s.id)}">Cancelar</button>` : ''}</td></tr>`).join('')}</tbody></table>` : '<div class="vazio">Nenhuma sugestão enviada.</div>'}</div>`;
    ligarBanners('sug');
    $$('[data-sug-excluir]').forEach(b => b.onclick = async () => { try { await api('sugestoes/' + encodeURIComponent(b.dataset.sugExcluir), { method: 'DELETE' }); aviso('Sugestão cancelada.'); telaBanner(); } catch (e) { aviso(e.message, true); } });
  }

  /* ---------------- sugestões na aba Aprovações (administrador) ---------------- */
  async function sugestoes(alvo) {
    const { $$, esc, api, aviso, montarAbas, abrir } = P(); if (!alvo) return;
    let sug = []; try { sug = (await api('sugestoes')).filter(s => s.status === 'pendente'); } catch (e) { return; }
    if (!sug.length) { alvo.innerHTML = ''; return; }
    await carregar();
    alvo.innerHTML = `<h2 class="sec">Fotos sugeridas para os banners</h2><div class="cartao"><table class="responsiva"><thead><tr><th>Como fica</th><th>Banner</th><th>Enviado por</th><th></th></tr></thead><tbody>${sug.map((s, k) => `<tr>
      <td style="min-width:260px">${previa(s.banner, ESTADO.tema, { [s.lado]: { src: s.src, foco: s.foco } }, 's-' + k)}</td>
      <td><div class="tit">${esc(nomeBanner(s.banner))}</div><div class="meta">Foto da ${NOME_LADO[s.lado]} · crédito: ${esc(s.credito || 'não informado')}</div></td><td>${esc(s.autor || '')}</td>
      <td class="acoes"><button class="btn verde peq" data-sug="${esc(s.id)}" data-a="aprovar">Aprovar</button><button class="btn vermelho peq" data-sug="${esc(s.id)}" data-a="recusar">Recusar</button></td></tr>`).join('')}</tbody></table></div>`;
    $$('[data-sug]', alvo).forEach(b => b.onclick = async () => {
      try {
        if (b.dataset.a === 'recusar') { const motivo = prompt('Motivo da recusa (aparece para quem sugeriu):', ''); if (motivo === null) return; await api(`sugestoes/${encodeURIComponent(b.dataset.sug)}/recusar`, { method: 'POST', body: { motivo } }); aviso('Sugestão recusada.'); }
        else { await api(`sugestoes/${encodeURIComponent(b.dataset.sug)}/aprovar`, { method: 'POST' }); aviso('Foto aprovada. Aparece no site em até 1 minuto.'); }
        await montarAbas(); abrir('aprovacoes');
      } catch (e) { aviso(e.message, true); }
    });
  }

  window.PAINEL_TELAS = { aparencia: telaAparencia, banner: telaBanner, sugestoes };
})();
