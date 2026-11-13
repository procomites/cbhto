// GET /comite?c=... – preenche nome, resumo e imagem do comitê no próprio HTML,
// para a prévia aparecer certa ao compartilhar no WhatsApp, Facebook e outros.
export async function onRequestGet({ request, env, next }) {
  const resp = await next();
  const url = new URL(request.url); const id = (url.searchParams.get('c') || '').toLowerCase();
  if (!/^[a-z]{3,10}$/.test(id) || !(resp.headers.get('content-type') || '').includes('text/html')) return resp;
  let c = null;
  try {
    const a = await env.ASSETS.fetch(new URL('/assets/js/comites-meta.json', url));
    if (a.ok) c = (await a.json())[id];
  } catch (e) { }
  if (!c) return resp;

  const titulo = `${c.sigla} – ${c.nome}`, resumo = c.resumo || 'Comitê de bacia hidrográfica do Tocantins.';
  const imagem = `${url.origin}/assets/img/marca/compartilhar-${id}.jpg`;
  const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const attr = v => ({ element(el) { el.setAttribute('content', v); } });
  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(titulo + ' | CBHTO'); } })
    .on('meta[property="og:title"]', attr(titulo))
    .on('meta[property="og:description"]', attr(resumo))
    .on('meta[name="description"]', attr(resumo))
    .on('meta[property="og:image"]', attr(imagem))
    .on('head', { element(el) {
      el.append(`<meta property="og:type" content="website"><meta property="og:site_name" content="CBHTO"><meta property="og:url" content="${esc(url.origin + '/comite?c=' + id)}"><meta name="twitter:card" content="summary_large_image">`, { html: true });
    } })
    .transform(resp);
}
