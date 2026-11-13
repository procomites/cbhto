// GET /api/conteudo – notícias e documentos publicados pelo painel (lido pelo site público).
import { json, preparar } from '../_lib.js';
import { lerAparencia } from '../_aparencia.js';

export async function onRequestGet({ env }) {
  try {
    await preparar(env);
    const [n, d] = await env.DB.batch([
      env.DB.prepare("SELECT id, titulo, data, comites, imagem, resumo, html, status FROM noticias WHERE status IN ('publicado','removido')"),
      env.DB.prepare("SELECT id, titulo, descricao, comite, categoria, ano, arquivo, status FROM documentos WHERE status IN ('publicado','removido')")
    ]);
    const noticias = [], documentos = [], removidos = { noticias: [], documentos: [] };
    for (const r of n.results) {
      if (r.status === 'removido') { removidos.noticias.push(r.id); continue; }
      let comites = []; try { comites = JSON.parse(r.comites || '[]'); } catch { }
      noticias.push({ id: r.id, titulo: r.titulo, data: r.data, comites, imagem: r.imagem || '', resumo: r.resumo || '', html: r.html || '' });
    }
    for (const r of d.results) {
      if (r.status === 'removido') { removidos.documentos.push(r.id); continue; }
      documentos.push({ id: r.id, titulo: r.titulo, descricao: r.descricao || '', comite: r.comite, categoria: r.categoria, ano: r.ano || '', arquivo: r.arquivo });
    }
    const aparencia = await lerAparencia(env);
    return json({ noticias, documentos, removidos, aparencia }, 200, { 'cache-control': 'public, max-age=60' });
  } catch (e) {
    return json({ noticias: [], documentos: [], removidos: { noticias: [], documentos: [] }, aviso: 'painel não configurado' }, 200);
  }
}
