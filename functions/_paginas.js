// Páginas dos comitês editáveis pelo painel (aba "O Comitê": descrição, ficha, diretoria e imagem da bacia).
// Administrador publica direto. Presidente e secretário editam só o próprio comitê, com aprovação do administrador.
import { json, erro, texto, agora, novoId, registrar, limparHTML, COMITES } from './_lib.js';

const imgOk = s => /^\/?(assets\/img\/[\w\/.-]+|midia\/[^"'<>\s\\]+|arquivos\/[\w\/.-]+)\.(jpe?g|png|webp)$/i.test(s || '');
const emailOk = s => /^[^@\s"'<>]+@[^@\s"'<>]+\.[^@\s"'<>]+$/.test(s || '');

export async function limparPagina(d) {
  d = d || {}; const o = {};
  o.resumo = texto(d.resumo, 220); o.sede = texto(d.sede, 80); o.regiao = texto(d.regiao, 60);
  o.area = texto(d.area, 40); o.criacao = texto(d.criacao, 40);
  const email = texto(d.email, 120); o.email = emailOk(email) ? email : '';
  o.municipios = (Array.isArray(d.municipios) ? d.municipios : []).map(m => texto(m, 60)).filter(Boolean).slice(0, 60);
  const mapa = texto(d.mapa, 400); o.mapa = imgOk(mapa) ? mapa : '';
  o.diretoria = (Array.isArray(d.diretoria) ? d.diretoria : []).map(p => ({ cargo: texto(p && p.cargo, 60), nome: texto(p && p.nome, 120), instituicao: texto(p && p.instituicao, 160) })).filter(p => p.nome).slice(0, 12);
  o.historia = await limparHTML(String(d.historia || '').slice(0, 200000));
  return o;
}
const ler = v => { try { return JSON.parse(v); } catch { return {}; } };
async function corpo(request) { try { return await request.json(); } catch { return {}; } }

export async function paginasPublicadas(env) {
  const r = await env.DB.prepare('SELECT comite, dados FROM paginas').all(); const o = {};
  for (const x of r.results) o[x.comite] = ler(x.dados);
  return o;
}
async function publicar(env, comite, dados, email) {
  await env.DB.prepare('INSERT INTO paginas (comite, dados, autor, atualizado_em) VALUES (?,?,?,?) ON CONFLICT(comite) DO UPDATE SET dados=excluded.dados, autor=excluded.autor, atualizado_em=excluded.atualizado_em')
    .bind(comite, JSON.stringify(dados), email, agora()).run();
}

// /api/admin/paginas
export async function rotaPaginas(id, acao, m, request, env, u) {
  const admin = u.perfil === 'admin';
  if (m === 'GET') {
    const publicadas = await paginasPublicadas(env);
    const r = admin
      ? await env.DB.prepare("SELECT * FROM paginas_pendentes ORDER BY (status='pendente') DESC, criado_em DESC LIMIT 60").all()
      : await env.DB.prepare('SELECT * FROM paginas_pendentes WHERE comite = ? ORDER BY criado_em DESC LIMIT 20').bind(u.comite).all();
    const pendentes = r.results.map(x => Object.assign(x, { dados: ler(x.dados) }));
    return json({ publicadas: admin ? publicadas : { [u.comite]: publicadas[u.comite] }, pendentes });
  }
  if (m === 'PUT') {   // salvar a página de um comitê
    const comite = admin ? texto(id, 20) : u.comite;
    if (!COMITES.includes(comite)) return erro('Comitê inválido.');
    const dados = await limparPagina(await corpo(request));
    if (!dados.historia.replace(/<[^>]+>/g, '').trim()) return erro('Escreva a descrição do comitê.');
    if (admin) { await publicar(env, comite, dados, u.email); await registrar(env, u, 'editou a página', 'comitê', comite, comite.toUpperCase()); return json({ ok: true, status: 'publicado' }); }
    await env.DB.prepare("DELETE FROM paginas_pendentes WHERE comite = ? AND autor = ? AND status = 'pendente'").bind(comite, u.email).run();   // fica só a versão mais recente
    const nid = novoId('p');
    await env.DB.prepare("INSERT INTO paginas_pendentes (id, comite, dados, autor, status, criado_em) VALUES (?,?,?,?, 'pendente', ?)").bind(nid, comite, JSON.stringify(dados), u.email, agora()).run();
    await registrar(env, u, 'enviou edição da página para aprovação', 'comitê', nid, comite.toUpperCase());
    return json({ ok: true, status: 'pendente', id: nid });
  }
  const p = id ? await env.DB.prepare('SELECT * FROM paginas_pendentes WHERE id = ?').bind(id).first() : null;
  if (!p) return erro('Edição não encontrada.', 404);
  if (m === 'POST' && acao === 'aprovar') {
    if (!admin) return erro('Apenas o administrador aprova.', 403);
    if (p.status !== 'pendente') return erro('Esta edição já foi analisada.');
    const b = await corpo(request);   // o administrador pode ajustar antes de aprovar
    const dados = await limparPagina(b && b.historia !== undefined ? b : ler(p.dados));
    await publicar(env, p.comite, dados, p.autor);
    await env.DB.prepare("UPDATE paginas_pendentes SET status='aprovada', revisado_por=? WHERE id=?").bind(u.email, id).run();
    await registrar(env, u, 'aprovou edição da página', 'comitê', id, p.comite.toUpperCase());
    return json({ ok: true });
  }
  if (m === 'POST' && acao === 'recusar') {
    if (!admin) return erro('Apenas o administrador recusa.', 403);
    const b = await corpo(request);
    await env.DB.prepare("UPDATE paginas_pendentes SET status='recusada', motivo=?, revisado_por=? WHERE id=?").bind(texto(b.motivo, 300), u.email, id).run();
    await registrar(env, u, 'recusou edição da página', 'comitê', id, p.comite.toUpperCase());
    return json({ ok: true });
  }
  if (m === 'DELETE') {
    if (!admin && !(p.autor === u.email && p.status === 'pendente')) return erro('Você só pode cancelar edições suas que ainda aguardam análise.', 403);
    await env.DB.prepare('DELETE FROM paginas_pendentes WHERE id=?').bind(id).run();
    return json({ ok: true });
  }
  return erro('Operação não permitida.', 405);
}
