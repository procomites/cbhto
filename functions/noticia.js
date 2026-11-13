// GET /noticia?id=... – preenche título, resumo e foto da notícia no próprio HTML,
// para a prévia aparecer certa ao compartilhar no WhatsApp, Facebook e outros (eles não executam JavaScript).
import { preparar } from './_lib.js';

const limpo = (s, max) => String(s == null ? '' : s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export async function onRequestGet({ request, env, next }) {
  const resp = await next();
  const url = new URL(request.url); const id = url.searchParams.get('id');
  if (!id || id.length > 80 || !(resp.headers.get('content-type') || '').includes('text/html')) return resp;

  let n = null;
  try {   // notícias publicadas pelo painel
    await preparar(env);
    const r = await env.DB.prepare('SELECT titulo, resumo, imagem, html, status FROM noticias WHERE id = ?').bind(id).first();
    if (r && r.status === 'publicado') {
      n = r;
      if (!n.imagem) { const m = /<img[^>]+src="([^"]+)"/i.exec(r.html || ''); if (m) n.imagem = m[1]; }   // sem capa: usa a 1ª imagem do texto
    }
  } catch (e) { }
  if (!n) {   // notícias do acervo (arquivo gerado por gerar-conteudo)
    try {
      const a = await env.ASSETS.fetch(new URL('/assets/js/noticias-meta.json', url));
      if (a.ok) { const m = await a.json(); if (m[id]) n = { titulo: m[id].t, resumo: m[id].r, imagem: m[id].i }; }
    } catch (e) { }
  }
  if (!n || !n.titulo) return resp;

  const titulo = limpo(n.titulo, 150), resumo = limpo(n.resumo, 220) || 'Notícia dos Comitês de Bacias Hidrográficas do Tocantins.';
  const img = n.imagem && !/["'<>\s]/.test(n.imagem) ? n.imagem : 'assets/img/marca/compartilhar.jpg';
  const imagem = /^https:\/\//.test(img) ? img : url.origin + '/' + img.replace(/^\//, '');
  const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const attr = v => ({ element(el) { el.setAttribute('content', v); } });

  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(titulo + ' | CBHTO'); } })
    .on('meta[property="og:title"]', attr(titulo))
    .on('meta[property="og:description"]', attr(resumo))
    .on('meta[name="description"]', attr(resumo))
    .on('meta[property="og:image"]', attr(imagem))
    .on('head', { element(el) {
      el.append(`<meta property="og:type" content="article"><meta property="og:site_name" content="CBHTO"><meta property="og:url" content="${esc(url.origin + '/noticia?id=' + encodeURIComponent(id))}"><meta name="twitter:card" content="summary_large_image">`, { html: true });
    } })
    .transform(resp);
}
