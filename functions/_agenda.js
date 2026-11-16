// Agenda de reuniões e eventos dos comitês.
// Administrador publica direto (qualquer comitê ou "geral"). Presidente e secretário cadastram só para o próprio comitê, com aprovação.
import { json, erro, texto, agora, novoId, registrar, COMITES } from './_lib.js';

const dataOk = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const horaOk = s => /^([01]\d|2[0-3]):[0-5]\d$/.test(s || '');
const linkOk = s => /^(https:\/\/|\/arquivos\/|midia\/)/i.test(s || '') && !/["'<>`\s\\]/.test(s);
async function corpo(request) { try { return await request.json(); } catch { return {}; } }
const hoje = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);   // horário de Palmas (UTC-3)

function limpar(b) {
  b = b || {};
  const hora = texto(b.hora, 5), link = texto(b.link, 600);
  return { titulo: texto(b.titulo, 160), data: texto(b.data, 10), hora: horaOk(hora) ? hora : '', local: texto(b.local, 200), descricao: texto(b.descricao, 600), link: linkOk(link) ? link : '' };
}

export async function agendaPublicada(env) {
  const r = await env.DB.prepare("SELECT id, comite, titulo, data, hora, local, descricao, link FROM agenda WHERE status='publicado' AND data >= ? ORDER BY data, hora LIMIT 60").bind(hoje()).all();
  return r.results;
}

// /api/admin/agenda
export async function rotaAgenda(id, acao, m, request, env, u) {
  const admin = u.perfil === 'admin';
  if (m === 'GET') {
    const r = admin
      ? await env.DB.prepare("SELECT * FROM agenda ORDER BY (status='pendente') DESC, data DESC LIMIT 200").all()
      : await env.DB.prepare('SELECT * FROM agenda WHERE comite = ? ORDER BY data DESC LIMIT 100').bind(u.comite).all();
    return json(r.results);
  }
  if (m === 'POST' && !id) {
    const b = await corpo(request), d = limpar(b);
    const comite = admin ? texto(b.comite, 20) : u.comite;
    if (!COMITES.includes(comite) && !(admin && comite === 'geral')) return erro('Escolha o comitê.');
    if (!d.titulo) return erro('Escreva o nome da reunião ou evento.');
    if (!dataOk(d.data)) return erro('Informe a data.');
    const nid = novoId('e'), status = admin ? 'publicado' : 'pendente';
    await env.DB.prepare('INSERT INTO agenda (id, comite, titulo, data, hora, local, descricao, link, status, autor, criado_em) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .bind(nid, comite, d.titulo, d.data, d.hora, d.local, d.descricao, d.link, status, u.email, agora()).run();
    await registrar(env, u, admin ? 'publicou evento na agenda' : 'enviou evento da agenda para aprovação', 'agenda', nid, d.titulo);
    return json({ ok: true, status, id: nid });
  }
  const e = id ? await env.DB.prepare('SELECT * FROM agenda WHERE id = ?').bind(id).first() : null;
  if (!e) return erro('Evento não encontrado.', 404);
  const dono = e.comite === u.comite;
  if (m === 'PUT') {
    if (!admin && !dono) return erro('Você só altera eventos do seu comitê.', 403);
    const b = await corpo(request), d = limpar(b);
    if (!d.titulo) return erro('Escreva o nome da reunião ou evento.');
    if (!dataOk(d.data)) return erro('Informe a data.');
    let comite = e.comite;
    if (admin && (COMITES.includes(b.comite) || b.comite === 'geral')) comite = b.comite;
    const status = admin ? (e.status === 'pendente' ? 'pendente' : 'publicado') : 'pendente';
    await env.DB.prepare("UPDATE agenda SET comite=?, titulo=?, data=?, hora=?, local=?, descricao=?, link=?, status=?, motivo='' WHERE id=?")
      .bind(comite, d.titulo, d.data, d.hora, d.local, d.descricao, d.link, status, id).run();
    await registrar(env, u, 'editou evento da agenda', 'agenda', id, d.titulo);
    return json({ ok: true, status });
  }
  if (m === 'POST' && (acao === 'aprovar' || acao === 'recusar')) {
    if (!admin) return erro('Apenas o administrador aprova ou recusa.', 403);
    const b = await corpo(request);
    if (acao === 'aprovar') await env.DB.prepare("UPDATE agenda SET status='publicado', motivo='', revisado_por=? WHERE id=?").bind(u.email, id).run();
    else await env.DB.prepare("UPDATE agenda SET status='recusado', motivo=?, revisado_por=? WHERE id=?").bind(texto(b.motivo, 300), u.email, id).run();
    await registrar(env, u, acao === 'aprovar' ? 'aprovou evento da agenda' : 'recusou evento da agenda', 'agenda', id, e.titulo);
    return json({ ok: true });
  }
  if (m === 'DELETE') {
    if (!admin && !dono) return erro('Você só exclui eventos do seu comitê.', 403);
    await env.DB.prepare('DELETE FROM agenda WHERE id=?').bind(id).run();
    await registrar(env, u, 'excluiu evento da agenda', 'agenda', id, e.titulo);
    return json({ ok: true });
  }
  return erro('Operação não permitida.', 405);
}
