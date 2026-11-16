/* ==========================================================================
   Painel – agenda de reuniões e eventos.
   Administrador: cadastra para qualquer comitê e publica direto; aprova ou recusa os envios.
   Presidente e secretário: cadastram para o próprio comitê; o evento espera aprovação.
   ========================================================================== */
(function () {
  'use strict';
  const P = () => window.PAINEL;
  const STATUS = { publicado: 'No site', pendente: 'Aguardando aprovação', recusado: 'Recusado' };
  const dataBR = d => d ? d.split('-').reverse().join('/') : '';
  const hoje = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const nomeComite = id => id === 'geral' ? 'Todos os comitês' : ((P().porId[id] || {}).sigla || id);

  function linha(e) {
    const { esc, admin } = P(), passado = e.data < hoje();
    return `<tr data-id="${esc(e.id)}"><td><b>${dataBR(e.data)}</b>${e.hora ? `<div class="meta">${esc(e.hora)}</div>` : ''}</td>
      <td><div class="tit">${esc(e.titulo)}</div><div class="meta">${esc(e.local || '')}</div>${e.status === 'recusado' && e.motivo ? `<div class="meta">Motivo: ${esc(e.motivo)}</div>` : ''}</td>
      <td>${esc(nomeComite(e.comite))}</td>
      <td><span class="selo ${e.status === 'recusado' ? 'recusado' : e.status === 'pendente' ? 'pendente' : passado ? 'removido' : 'publicado'}">${e.status === 'publicado' && passado ? 'Já realizado' : STATUS[e.status] || e.status}</span></td>
      <td class="acoes">${admin() && e.status === 'pendente' ? '<button class="btn peq verde" data-a="aprovar">Aprovar</button><button class="btn peq linha" data-a="recusar">Recusar</button>' : ''}<button class="btn peq linha" data-a="editar">Editar</button><button class="btn peq vermelho" data-a="excluir">Excluir</button></td></tr>`;
  }
  function tabela(lista) {
    return lista.length ? `<table class="responsiva"><thead><tr><th>Data</th><th>Reunião ou evento</th><th>Comitê</th><th>Situação</th><th></th></tr></thead><tbody>${lista.map(linha).join('')}</tbody></table>`
      : '<div class="vazio">Nenhum evento cadastrado.</div>';
  }
  function ligar(el, lista, recarregar) {
    const { api, aviso } = P();
    el.querySelectorAll('button[data-a]').forEach(b => b.onclick = async () => {
      const e = lista.find(x => x.id === b.closest('tr').dataset.id), a = b.dataset.a;
      try {
        if (a === 'editar') return formulario(e, recarregar);
        if (a === 'aprovar') { await api('agenda/' + e.id + '/aprovar', { method: 'POST', body: {} }); aviso('Evento publicado no site.'); }
        if (a === 'recusar') { const motivo = prompt('Motivo da recusa (aparece para quem enviou):'); if (motivo === null) return; await api('agenda/' + e.id + '/recusar', { method: 'POST', body: { motivo } }); aviso('Evento recusado.'); }
        if (a === 'excluir') { if (!confirm('Excluir "' + e.titulo + '" da agenda?')) return; await api('agenda/' + e.id, { method: 'DELETE' }); aviso('Evento excluído.'); }
        recarregar(); P().montarAbas();
      } catch (err) { aviso(err.message, true); }
    });
  }

  async function telaAgenda() {
    const { $, api, admin, EU, porId } = P(), tela = $('#tela');
    tela.innerHTML = `<h1>Agenda</h1><p class="sub">${admin() ? 'Reuniões e eventos dos comitês. O que você cadastrar aparece direto no site, em "Próximas reuniões".' : `Reuniões e eventos do ${(porId[EU.comite] || {}).sigla || 'seu comitê'}. Cada evento passa pela aprovação do administrador antes de aparecer no site.`}</p>
      <div class="barra"><button class="btn" id="ag-novo">+ Novo evento</button></div><div class="cartao" id="ag-lista"><div class="vazio">Carregando…</div></div>`;
    const carregar = async () => {
      try { const l = await api('agenda'); $('#ag-lista').innerHTML = tabela(l); ligar($('#ag-lista'), l, carregar); }
      catch (e) { $('#ag-lista').innerHTML = `<div class="vazio">${P().esc(e.message)}</div>`; }
    };
    $('#ag-novo').onclick = () => formulario(null, carregar);
    carregar();
  }

  // bloco usado na aba Aprovações
  async function agendaPendentes(el) {
    if (!el) return;
    const { api } = P();
    const carregar = async () => {
      try {
        const l = (await api('agenda')).filter(e => e.status === 'pendente');
        el.innerHTML = l.length ? `<h2 class="sec">Eventos da agenda <span class="leve">aguardando aprovação</span></h2><div class="cartao">${tabela(l)}</div>` : '';
        ligar(el, l, carregar);
      } catch (e) { el.innerHTML = ''; }
    };
    carregar();
  }

  function formulario(e, aoSalvar) {
    const { $, esc, api, aviso, admin, COMITES, fecharModal } = P(), novo = !e; e = e || {};
    document.body.style.overflow = 'hidden';
    const fundo = document.createElement('div'); fundo.className = 'fundo-modal';
    fundo.innerHTML = `<div class="modal"><h2>${novo ? 'Novo evento na agenda' : 'Editar evento'}</h2>
      ${admin() ? `<div class="campo"><label for="ag-comite">Comitê</label><select id="ag-comite"><option value="">Escolha…</option><option value="geral" ${e.comite === 'geral' ? 'selected' : ''}>Todos os comitês</option>${COMITES.map(c => `<option value="${c.id}" ${e.comite === c.id ? 'selected' : ''}>${c.sigla} – ${esc(c.curto || c.nome)}</option>`).join('')}</select></div>` : ''}
      <div class="campo"><label for="ag-titulo">Nome da reunião ou evento</label><input type="text" id="ag-titulo" maxlength="160" value="${esc(e.titulo || '')}" placeholder="Ex.: 2ª Reunião Ordinária de 2026"></div>
      <div class="linha2"><div class="campo"><label for="ag-data">Data</label><input type="date" id="ag-data" value="${esc(e.data || '')}"></div>
        <div class="campo"><label for="ag-hora">Horário</label><input type="time" id="ag-hora" value="${esc(e.hora || '')}"><div class="ajuda">Opcional.</div></div></div>
      <div class="campo"><label for="ag-local">Local</label><input type="text" id="ag-local" maxlength="200" value="${esc(e.local || '')}" placeholder="Ex.: Auditório da Câmara Municipal de Taguatinga, ou link da videoconferência"></div>
      <div class="campo"><label for="ag-desc">Pauta resumida</label><textarea id="ag-desc" rows="4" maxlength="600">${esc(e.descricao || '')}</textarea><div class="ajuda">Opcional, até 600 letras.</div></div>
      <div class="campo"><label for="ag-link">Link da convocação</label><input type="url" id="ag-link" maxlength="600" value="${esc(e.link || '')}" placeholder="https://…"><div class="ajuda">Opcional. Cole o endereço do documento de convocação, começando por https://</div></div>
      ${admin() ? '' : '<div class="aviso-box">Depois de salvar, o evento fica aguardando a aprovação do administrador.</div>'}</div>`;
    const rod = document.createElement('div'); rod.className = 'rodape-modal';
    rod.innerHTML = '<button class="btn linha" id="ag-cancelar">Cancelar</button><button class="btn" id="ag-salvar">Salvar</button>';
    document.body.append(fundo, rod);
    $('#ag-cancelar').onclick = fecharModal;
    $('#ag-salvar').onclick = async () => {
      const b = { comite: admin() ? $('#ag-comite').value : undefined, titulo: $('#ag-titulo').value.trim(), data: $('#ag-data').value, hora: $('#ag-hora').value, local: $('#ag-local').value.trim(), descricao: $('#ag-desc').value.trim(), link: $('#ag-link').value.trim() };
      if (b.link && !/^https:\/\//i.test(b.link)) return aviso('O link precisa começar por https://', true);
      try {
        const r = novo ? await api('agenda', { method: 'POST', body: b }) : await api('agenda/' + e.id, { method: 'PUT', body: b });
        fecharModal(); aviso(r.status === 'publicado' ? 'Evento publicado no site.' : 'Enviado para aprovação do administrador.'); aoSalvar(); P().montarAbas();
      } catch (err) { aviso(err.message, true); }
    };
    setTimeout(() => $('#ag-titulo').focus(), 50);
  }

  window.PAINEL_TELAS = Object.assign(window.PAINEL_TELAS || {}, { agenda: telaAgenda, agendaPendentes });
})();
