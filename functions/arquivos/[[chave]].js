// GET /arquivos/... – entrega os arquivos enviados pelo painel (guardados no Workers KV).
// Vídeos respondem a pedidos parciais (Range), exigidos pelo iPhone/Safari para tocar e avançar o vídeo.
const SEGUROS = /^(application\/pdf|image\/(jpeg|png|webp|gif)|video\/(mp4|webm))$/;

export async function onRequestGet({ request, env, params }) {
  const chave = (params.chave || []).join('/');
  if (!chave || !env.ARQUIVOS) return new Response('Arquivo não encontrado', { status: 404 });
  const ehVideo = /\.(mp4|webm)$/i.test(chave);
  const { value, metadata } = await env.ARQUIVOS.getWithMetadata(chave, { type: ehVideo ? 'arrayBuffer' : 'stream', cacheTtl: 86400 });
  if (!value) return new Response('Arquivo não encontrado', { status: 404 });
  const tipo = (metadata && metadata.tipo) || 'application/octet-stream';
  const nome = (metadata && metadata.nome) || chave.split('/').pop();
  const headers = {
    'content-type': tipo,
    'cache-control': 'public, max-age=31536000, immutable',
    'x-content-type-options': 'nosniff',
    'content-disposition': (SEGUROS.test(tipo) ? 'inline' : 'attachment') + `; filename*=UTF-8''${encodeURIComponent(nome)}`
  };
  if (!ehVideo) return new Response(value, { headers });

  const total = value.byteLength;
  headers['accept-ranges'] = 'bytes';
  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  if (!m || (m[1] === '' && m[2] === '')) { headers['content-length'] = String(total); return new Response(value, { headers }); }
  let ini, fim;
  if (m[1] === '') { ini = Math.max(0, total - Number(m[2])); fim = total - 1; }
  else { ini = Number(m[1]); fim = m[2] === '' ? total - 1 : Math.min(Number(m[2]), total - 1); }
  if (ini >= total || ini > fim) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${total}` } });
  headers['content-range'] = `bytes ${ini}-${fim}/${total}`;
  headers['content-length'] = String(fim - ini + 1);
  return new Response(value.slice(ini, fim + 1), { status: 206, headers });
}
