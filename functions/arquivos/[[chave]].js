// GET /arquivos/... – entrega os arquivos enviados pelo painel (guardados no R2).
const SEGUROS = /^(application\/pdf|image\/(jpeg|png|webp|gif))$/;

export async function onRequestGet({ env, params }) {
  const chave = (params.chave || []).join('/');
  if (!chave || !env.ARQUIVOS) return new Response('Arquivo não encontrado', { status: 404 });
  const obj = await env.ARQUIVOS.get(chave);
  if (!obj) return new Response('Arquivo não encontrado', { status: 404 });
  const tipo = (obj.httpMetadata && obj.httpMetadata.contentType) || 'application/octet-stream';
  const nome = (obj.customMetadata && obj.customMetadata.nome) || chave.split('/').pop();
  const h = new Headers({
    'content-type': tipo,
    'cache-control': 'public, max-age=31536000, immutable',
    'x-content-type-options': 'nosniff',
    'content-disposition': (SEGUROS.test(tipo) ? 'inline' : 'attachment') + `; filename*=UTF-8''${encodeURIComponent(nome)}`
  });
  if (obj.httpEtag) h.set('etag', obj.httpEtag);
  return new Response(obj.body, { headers: h });
}
