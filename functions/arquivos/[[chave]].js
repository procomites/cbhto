// GET /arquivos/... – entrega os arquivos enviados pelo painel (guardados no Workers KV).
const SEGUROS = /^(application\/pdf|image\/(jpeg|png|webp|gif))$/;

export async function onRequestGet({ env, params }) {
  const chave = (params.chave || []).join('/');
  if (!chave || !env.ARQUIVOS) return new Response('Arquivo não encontrado', { status: 404 });
  const { value, metadata } = await env.ARQUIVOS.getWithMetadata(chave, { type: 'stream', cacheTtl: 86400 });
  if (!value) return new Response('Arquivo não encontrado', { status: 404 });
  const tipo = (metadata && metadata.tipo) || 'application/octet-stream';
  const nome = (metadata && metadata.nome) || chave.split('/').pop();
  return new Response(value, {
    headers: {
      'content-type': tipo,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
      'content-disposition': (SEGUROS.test(tipo) ? 'inline' : 'attachment') + `; filename*=UTF-8''${encodeURIComponent(nome)}`
    }
  });
}
