// /api/admin/... – painel de publicação (exige login pelo Cloudflare Access).
// Perfis: admin (tudo) · presidente e secretario (notícias e documentos do próprio comitê, com aprovação do admin).
import { json, erro, preparar, usuarioAtual, limparHTML, registrar, texto, urlArquivo, agora, novoId, COMITES, PERFIS, NOME_PERFIL } from '../../_lib.js';

const CATS_COMITE = ['Atas de reuniões', 'Resoluções e deliberações', 'Legislação', 'Câmaras técnicas', 'Listas de membros', 'Planos de bacia', 'Estudos e publicações', 'Diversos', 'Outros arquivos'];
const CATS_GERAIS = ['Atas', 'Resoluções e deliberações', 'Legislação', 'Câmaras técnicas', 'Listas de membros', 'Planos de bacia', 'Publicações'];
const TIPOS_UPLOAD = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', odt: 'application/vnd.oasis.opendocument.text', ods: 'application/vnd.oasis.opendocument.spreadsheet', csv: 'text/csv' };
const LIMITE_MB = 25;

export async function onRequest({ request, env, params }) {
  try {
    await preparar(env);
    const u = await usuarioAtual(request, env);
    if (!u) return erro('Você não está conectado. Abra o painel pelo endereço /admin para entrar.', 401);
    if (u.semAcesso) return json({ erro: `O e-mail ${u.email} ainda não tem acesso ao painel. Peça ao administrador para cadastrá-lo.`, email: u.email }, 403);
    const partes = (params.rota || []).map(decodeURIComponent);
    const rec = partes.shift();
    const acao = ['aprovar', 'recusar', 'restaurar'].includes(partes[partes.length - 1]) ? partes.pop() : undefined;
    const id = partes.length ? partes.join('/') : undefined;  // ids de documentos antigos contêm "/"
    const m = request.method;
    const admin = u.perfil === 'admin';

    if (rec === 'eu') return json({ email: u.email, nome: u.nome, perfil: u.perfil, nomePerfil: NOME_PERFIL[u.perfil], comite: u.comite, fixo: !!u.fixo });
    if (rec === 'resumo') {
      const r = await env.DB.batch([
        env.DB.prepare("SELECT COUNT(*) n FROM noticias WHERE status='pendente'" + (admin ? '' : ' AND comites LIKE ?')).bind(...(admin ? [] : [`%"${u.comite}"%`])),
        env.DB.prepare("SELECT COUNT(*) n FROM documentos WHERE status='pendente'" + (admin ? '' : ' AND comite = ?')).bind(...(admin ? [] : [u.comite]))
      ]);
      return json({ pendentesNoticias: r[0].results[0].n, pendentesDocumentos: r[1].results[0].n });
    }
    if (rec === 'noticias' || rec === 'documentos') return await conteudo(rec, id, acao, m, request, env, u);
    if (rec === 'upload' && m === 'POST') return await upload(request, env, u);
    if (rec === 'usuarios') { if (!admin) return erro('Apenas o administrador pode gerenciar usuários.', 403); return await usuarios(id, m, request, env, u); }
    if (rec === 'historico' && m === 'GET') {
      if (!admin) return erro('Apenas o administrador.', 403);
      const r = await env.DB.prepare('SELECT * FROM historico ORDER BY id DESC LIMIT 300').all();
      return json(r.results);
    }
    return erro('Rota não encontrada.', 404);
  } catch (e) {
    return erro('Erro no servidor: ' + (e && e.message ? e.message : e), 500);
  }
}

// ---------- notícias e documentos ----------
async function lerCorpo(request) { try { return await request.json(); } catch { return {}; } }
const doComite = (tipo, linha, comite) => tipo === 'noticias' ? JSON.parse(linha.comites || '[]').includes(comite) : linha.comite === comite;

async function validar(tipo, b, u) {
  const admin = u.perfil === 'admin';
  if (tipo === 'noticias') {
    const titulo = texto(b.titulo, 250); if (!titulo) throw new Error('Informe o título.');
    const data = /^\d{4}-\d{2}-\d{2}$/.test(b.data || '') ? b.data : agora().slice(0, 10);
    let comites = Array.isArray(b.comites) ? b.comites.filter(c => COMITES.includes(c)) : [];
    if (!admin) comites = [u.comite];
    const html = await limparHTML(String(b.html || '').slice(0, 300000));
    if (!html.replace(/<[^>]+>/g, '').trim()) throw new Error('Escreva o texto da notícia.');
    let resumo = texto(b.resumo, 400);
    if (!resumo) resumo = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220);
    return { titulo, data, comites: JSON.stringify(comites), imagem: urlArquivo(b.imagem), resumo, html };
  }
  const titulo = texto(b.titulo, 250); if (!titulo) throw new Error('Informe o título do documento.');
  let comite = admin ? texto(b.comite, 20) : u.comite;
  if (!(COMITES.includes(comite) || (admin && comite === 'cbhto'))) throw new Error('Comitê inválido.');
  const cats = comite === 'cbhto' ? CATS_GERAIS : CATS_COMITE;
  const categoria = cats.includes(b.categoria) ? b.categoria : null; if (!categoria) throw new Error('Escolha a categoria.');
  const arquivo = urlArquivo(b.arquivo); if (!arquivo) throw new Error('Envie o arquivo ou informe um link https.');
  const ano = /^\d{4}$/.test(String(b.ano || '')) ? String(b.ano) : agora().slice(0, 4);
  return { titulo, descricao: texto(b.descricao, 500), comite, categoria, ano, arquivo };
}

async function conteudo(tipo, id, acao, m, request, env, u) {
  const admin = u.perfil === 'admin';
  const tab = tipo; const rotulo = tipo === 'noticias' ? 'notícia' : 'documento';
  if (m === 'GET' && !id) {
    const url = new URL(request.url); const st = url.searchParams.get('status');
    let sql = `SELECT * FROM ${tab}`; const cond = [], args = [];
    if (!admin) { if (tipo === 'noticias') { cond.push('comites LIKE ?'); args.push(`%"${u.comite}"%`); } else { cond.push('comite = ?'); args.push(u.comite); } cond.push('legado = 0'); }
    if (st) { cond.push('status = ?'); args.push(st); }
    if (cond.length) sql += ' WHERE ' + cond.join(' AND ');
    sql += ' ORDER BY COALESCE(atualizado_em, criado_em) DESC LIMIT 500';
    const r = await env.DB.prepare(sql).bind(...args).all();
    return json(r.results);
  }
  const linha = id ? await env.DB.prepare(`SELECT * FROM ${tab} WHERE id = ?`).bind(id).first() : null;

  if (m === 'POST' && !id) {  // criar
    const b = await lerCorpo(request); const v = await validar(tipo, b, u);
    const status = admin ? (b.status === 'pendente' ? 'pendente' : 'publicado') : 'pendente';
    const nid = novoId(tipo === 'noticias' ? 'n' : 'd'); const t = agora();
    const cols = Object.keys(v);
    await env.DB.prepare(`INSERT INTO ${tab} (id, ${cols.join(',')}, status, autor, criado_em, atualizado_em, revisado_por, legado) VALUES (?, ${cols.map(() => '?').join(',')}, ?, ?, ?, ?, ?, 0)`)
      .bind(nid, ...cols.map(c => v[c]), status, u.email, t, t, admin ? u.email : null).run();
    await registrar(env, u, admin ? 'publicou' : 'enviou para aprovação', rotulo, nid, v.titulo);
    return json({ ok: true, id: nid, status });
  }

  if (id && acao === 'aprovar' && m === 'POST') {
    if (!admin) return erro('Apenas o administrador aprova publicações.', 403);
    if (!linha) return erro('Item não encontrado.', 404);
    await env.DB.prepare(`UPDATE ${tab} SET status='publicado', revisado_por=?, motivo=NULL, atualizado_em=? WHERE id=?`).bind(u.email, agora(), id).run();
    await registrar(env, u, 'aprovou', rotulo, id, linha.titulo);
    return json({ ok: true });
  }
  if (id && acao === 'recusar' && m === 'POST') {
    if (!admin) return erro('Apenas o administrador recusa publicações.', 403);
    if (!linha) return erro('Item não encontrado.', 404);
    const b = await lerCorpo(request);
    await env.DB.prepare(`UPDATE ${tab} SET status='recusado', revisado_por=?, motivo=?, atualizado_em=? WHERE id=?`).bind(u.email, texto(b.motivo, 500), agora(), id).run();
    await registrar(env, u, 'recusou', rotulo, id, linha.titulo);
    return json({ ok: true });
  }

  if (id && m === 'PUT') {  // editar
    const b = await lerCorpo(request); const v = await validar(tipo, b, u);
    const t = agora(); const cols = Object.keys(v);
    if (!linha) {  // edição de item do site antigo (somente administrador)
      if (!admin || !b.legado) return erro('Item não encontrado.', 404);
      await env.DB.prepare(`INSERT INTO ${tab} (id, ${cols.join(',')}, status, autor, criado_em, atualizado_em, revisado_por, legado) VALUES (?, ${cols.map(() => '?').join(',')}, 'publicado', ?, ?, ?, ?, 1)`)
        .bind(String(id).slice(0, 300), ...cols.map(c => v[c]), u.email, t, t, u.email).run();
      await registrar(env, u, 'editou (site antigo)', rotulo, id, v.titulo);
      return json({ ok: true });
    }
    if (!admin) {
      if (!doComite(tipo, linha, u.comite) || linha.legado || !['pendente', 'recusado'].includes(linha.status))
        return erro('Você só pode alterar publicações do seu comitê que ainda aguardam aprovação ou foram recusadas.', 403);
    }
    const status = admin ? (linha.status === 'removido' ? 'publicado' : linha.status) : 'pendente';
    await env.DB.prepare(`UPDATE ${tab} SET ${cols.map(c => c + '=?').join(',')}, status=?, atualizado_em=?, motivo=${admin ? 'motivo' : 'NULL'} WHERE id=?`)
      .bind(...cols.map(c => v[c]), status, t, id).run();
    await registrar(env, u, admin ? 'editou' : 'editou e reenviou', rotulo, id, v.titulo);
    return json({ ok: true, status });
  }

  if (id && m === 'DELETE') {
    const url = new URL(request.url);
    if (!linha) {  // retirar do site um item do site antigo
      if (!admin || url.searchParams.get('legado') !== '1') return erro('Item não encontrado.', 404);
      const tit = texto(url.searchParams.get('titulo'), 250);
      if (tipo === 'noticias') await env.DB.prepare("INSERT INTO noticias (id, titulo, status, autor, criado_em, atualizado_em, revisado_por, legado) VALUES (?,?, 'removido', ?, ?, ?, ?, 1)").bind(id, tit, u.email, agora(), agora(), u.email).run();
      else await env.DB.prepare("INSERT INTO documentos (id, titulo, status, autor, criado_em, atualizado_em, revisado_por, legado) VALUES (?,?, 'removido', ?, ?, ?, ?, 1)").bind(id, tit, u.email, agora(), agora(), u.email).run();
      await registrar(env, u, 'retirou do site (site antigo)', rotulo, id, tit);
      return json({ ok: true });
    }
    if (!admin) {
      if (!doComite(tipo, linha, u.comite) || linha.legado || !['pendente', 'recusado'].includes(linha.status))
        return erro('Você só pode excluir publicações do seu comitê que ainda não foram publicadas.', 403);
      await env.DB.prepare(`DELETE FROM ${tab} WHERE id=?`).bind(id).run();
    } else if (linha.legado) {
      await env.DB.prepare(`UPDATE ${tab} SET status='removido', atualizado_em=? WHERE id=?`).bind(agora(), id).run();
    } else {
      await env.DB.prepare(`DELETE FROM ${tab} WHERE id=?`).bind(id).run();
    }
    await registrar(env, u, 'excluiu', rotulo, id, linha.titulo);
    return json({ ok: true });
  }
  if (id && m === 'POST' && acao === 'restaurar') {  // desfaz a retirada de um item do site antigo
    if (!admin) return erro('Apenas o administrador.', 403);
    if (linha && linha.legado) { await env.DB.prepare(`DELETE FROM ${tab} WHERE id=?`).bind(id).run(); await registrar(env, u, 'restaurou original', rotulo, id, linha.titulo); }
    return json({ ok: true });
  }
  return erro('Operação não permitida.', 405);
}

// ---------- envio de arquivos (R2) ----------
async function upload(request, env, u) {
  if (!env.ARQUIVOS) return erro('Armazenamento de arquivos (R2) não configurado.', 500);
  const fd = await request.formData(); const f = fd.get('arquivo');
  if (!f || typeof f === 'string') return erro('Nenhum arquivo recebido.');
  if (f.size > LIMITE_MB * 1024 * 1024) return erro(`O arquivo passa de ${LIMITE_MB} MB. Comprima antes de enviar.`);
  const ext = (f.name.split('.').pop() || '').toLowerCase(); const tipo = TIPOS_UPLOAD[ext];
  if (!tipo) return erro('Tipo de arquivo não permitido. Use PDF, imagem (JPG, PNG, WebP), Word, Excel ou ODT.');
  const base = f.name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60) || 'arquivo';
  const d = new Date(); const chave = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${Math.random().toString(36).slice(2, 8)}-${base}.${ext}`;
  await env.ARQUIVOS.put(chave, f.stream(), { httpMetadata: { contentType: tipo }, customMetadata: { nome: f.name.slice(0, 120), enviadoPor: u.email } });
  await registrar(env, u, 'enviou arquivo', 'arquivo', chave, f.name);
  return json({ ok: true, url: '/arquivos/' + chave, nome: f.name, tamanho: f.size });
}

// ---------- usuários ----------
async function usuarios(id, m, request, env, u) {
  if (m === 'GET') { const r = await env.DB.prepare('SELECT * FROM usuarios ORDER BY perfil, comite, nome').all(); return json({ usuarios: r.results, fixos: String(env.ADMIN_EMAILS || '').toLowerCase().split(/[\s,;]+/).filter(Boolean) }); }
  if (m === 'POST' || m === 'PUT') {
    const b = await lerCorpo(request);
    const email = texto(m === 'PUT' ? id : b.email, 200).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return erro('E-mail inválido.');
    const perfil = PERFIS.includes(b.perfil) ? b.perfil : null; if (!perfil) return erro('Escolha o perfil.');
    const comite = perfil === 'admin' ? null : (COMITES.includes(b.comite) ? b.comite : null);
    if (perfil !== 'admin' && !comite) return erro('Escolha o comitê do presidente ou secretário.');
    const ativo = b.ativo === false || b.ativo === 0 ? 0 : 1;
    if (m === 'POST') {
      const ja = await env.DB.prepare('SELECT email FROM usuarios WHERE email=?').bind(email).first();
      if (ja) return erro('Este e-mail já está cadastrado.');
      await env.DB.prepare('INSERT INTO usuarios (email, nome, perfil, comite, ativo, criado_em) VALUES (?,?,?,?,?,?)').bind(email, texto(b.nome, 120), perfil, comite, ativo, agora()).run();
      await registrar(env, u, 'cadastrou usuário', 'usuário', email, `${NOME_PERFIL[perfil]}${comite ? ' – ' + comite.toUpperCase() : ''}`);
    } else {
      if (email === u.email && (perfil !== 'admin' || !ativo)) return erro('Você não pode retirar o seu próprio acesso de administrador.');
      await env.DB.prepare('UPDATE usuarios SET nome=?, perfil=?, comite=?, ativo=? WHERE email=?').bind(texto(b.nome, 120), perfil, comite, ativo, email).run();
      await registrar(env, u, 'alterou usuário', 'usuário', email, `${NOME_PERFIL[perfil]}${comite ? ' – ' + comite.toUpperCase() : ''}${ativo ? '' : ' (desativado)'}`);
    }
    return json({ ok: true });
  }
  if (m === 'DELETE') {
    const email = texto(id, 200).toLowerCase();
    if (email === u.email) return erro('Você não pode excluir o seu próprio acesso.');
    await env.DB.prepare('DELETE FROM usuarios WHERE email=?').bind(email).run();
    await registrar(env, u, 'excluiu usuário', 'usuário', email, email);
    return json({ ok: true });
  }
  return erro('Operação não permitida.', 405);
}
