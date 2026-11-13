// Aparência do site: tema de cor, faixa da campanha e fotos dos banners.
// Só o administrador altera. Presidentes e secretários podem sugerir fotos para o banner do próprio comitê.
import { json, erro, texto, agora, novoId, registrar, COMITES } from './_lib.js';

export const TEMAS = ['padrao', 'mulheres', 'agua', 'ambiente', 'amarelo', 'rosa', 'novembro'];
const NOME_TEMA = { padrao: 'Padrão Procomitês', mulheres: 'Mulheres das Águas', agua: 'Dia Mundial da Água', ambiente: 'Semana do Meio Ambiente', amarelo: 'Setembro Amarelo', rosa: 'Outubro Rosa', novembro: 'Novembro Azul' };
const BANNERS = ['cbhto', ...COMITES];
const FOCOS = ['centro', 'esquerda', 'direita', 'topo', 'base'];
const fotoOk = s => /^(assets\/img\/fotos-banners\/[\w-]+\.jpg|midia\/[^"'<>\s\\]+\.(jpe?g|png|webp)|\/arquivos\/[\w\/.-]+\.(jpe?g|png|webp))$/i.test(s || '');
const linkOk = s => /^(https:\/\/[^\s"'<>]+|\/(?!\/)[^\s"'<>]*|[\w-]+\.html[^\s"'<>]*)$/i.test(s || '');

function lado(v) {
  if (!v || !fotoOk(v.src)) return null;
  return { src: v.src, foco: FOCOS.includes(v.foco) ? v.foco : 'centro', titulo: texto(v.titulo, 120), credito: texto(v.credito, 160) };
}
function limparBanners(b) {
  const out = {};
  for (const id of BANNERS) {
    const e = lado(b && b[id] && b[id].esq), d = lado(b && b[id] && b[id].dir);
    if (e || d) { out[id] = {}; if (e) out[id].esq = e; if (d) out[id].dir = d; }
  }
  return out;
}
function limparFaixa(f) {
  f = f || {}; const link = texto(f.link, 300);
  return { ativa: !!f.ativa, texto: texto(f.texto, 140), link: linkOk(link) ? link : '' };
}
async function gravar(env, chave, valor) {
  await env.DB.prepare('INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor').bind(chave, JSON.stringify(valor)).run();
}
export async function lerAparencia(env) {
  const r = await env.DB.prepare("SELECT chave, valor FROM config WHERE chave IN ('tema','faixa','banners')").all();
  const c = {}; for (const x of r.results) { try { c[x.chave] = JSON.parse(x.valor); } catch { } }
  return { tema: TEMAS.includes(c.tema) ? c.tema : 'padrao', faixa: limparFaixa(c.faixa), banners: limparBanners(c.banners) };
}
async function corpo(request) { try { return await request.json(); } catch { return {}; } }

// /api/admin/aparencia
export async function rotaAparencia(m, request, env, u) {
  if (m === 'GET') return json(await lerAparencia(env));
  if (m !== 'PUT') return erro('Operação não permitida.', 405);
  if (u.perfil !== 'admin') return erro('Apenas o administrador altera a aparência do site.', 403);
  const b = await corpo(request);
  if (b.tema !== undefined) {
    if (!TEMAS.includes(b.tema)) return erro('Tema inválido.');
    await gravar(env, 'tema', b.tema); await registrar(env, u, 'ativou o tema', 'aparência', b.tema, NOME_TEMA[b.tema]);
  }
  if (b.faixa !== undefined) {
    const f = limparFaixa(b.faixa);
    if (f.ativa && !f.texto) return erro('Escreva o texto da faixa.');
    if (b.faixa.link && !f.link) return erro('O link da faixa deve começar com https:// ou ser uma página do site.');
    await gravar(env, 'faixa', f); await registrar(env, u, f.ativa ? 'ligou a faixa da campanha' : 'desligou a faixa da campanha', 'aparência', 'faixa', f.texto);
  }
  if (b.banners !== undefined) {
    await gravar(env, 'banners', limparBanners(b.banners)); await registrar(env, u, 'alterou as fotos dos banners', 'aparência', 'banners', Object.keys(limparBanners(b.banners)).join(', ').toUpperCase() || 'padrão');
  }
  return json(await lerAparencia(env));
}

// /api/admin/sugestoes – fotos sugeridas para os banners
export async function rotaSugestoes(id, acao, m, request, env, u) {
  const admin = u.perfil === 'admin';
  if (m === 'GET') {
    const r = admin
      ? await env.DB.prepare("SELECT * FROM sugestoes ORDER BY (status='pendente') DESC, criado_em DESC LIMIT 100").all()
      : await env.DB.prepare('SELECT * FROM sugestoes WHERE banner = ? ORDER BY criado_em DESC LIMIT 50').bind(u.comite).all();
    return json(r.results);
  }
  if (m === 'POST' && !id) {
    const b = await corpo(request);
    const banner = admin ? texto(b.banner, 20) : u.comite;
    if (!BANNERS.includes(banner)) return erro('Banner inválido.');
    if (!['esq', 'dir'].includes(b.lado)) return erro('Escolha o lado da foto.');
    const f = lado(b); if (!f) return erro('Escolha uma foto válida.');
    if (f.src.startsWith('/arquivos/') && !f.credito) return erro('Informe o crédito da foto (quem tirou).');
    const nid = novoId('s');
    await env.DB.prepare("INSERT INTO sugestoes (id, banner, lado, src, foco, titulo, credito, autor, status, criado_em) VALUES (?,?,?,?,?,?,?,?, 'pendente', ?)")
      .bind(nid, banner, b.lado, f.src, f.foco, f.titulo, f.credito, u.email, agora()).run();
    await registrar(env, u, 'sugeriu foto', 'banner', nid, banner.toUpperCase());
    return json({ ok: true, id: nid });
  }
  const s = id ? await env.DB.prepare('SELECT * FROM sugestoes WHERE id = ?').bind(id).first() : null;
  if (!s) return erro('Sugestão não encontrada.', 404);
  if (m === 'POST' && acao === 'aprovar') {
    if (!admin) return erro('Apenas o administrador aprova.', 403);
    if (s.status !== 'pendente') return erro('Esta sugestão já foi analisada.');
    const ap = await lerAparencia(env); const bn = ap.banners;
    bn[s.banner] = Object.assign({}, bn[s.banner], { [s.lado]: { src: s.src, foco: s.foco, titulo: s.titulo, credito: s.credito } });
    await gravar(env, 'banners', limparBanners(bn));
    await env.DB.prepare("UPDATE sugestoes SET status='aprovada', revisado_por=? WHERE id=?").bind(u.email, id).run();
    await registrar(env, u, 'aprovou foto', 'banner', id, s.banner.toUpperCase());
    return json({ ok: true });
  }
  if (m === 'POST' && acao === 'recusar') {
    if (!admin) return erro('Apenas o administrador recusa.', 403);
    const b = await corpo(request);
    await env.DB.prepare("UPDATE sugestoes SET status='recusada', motivo=?, revisado_por=? WHERE id=?").bind(texto(b.motivo, 300), u.email, id).run();
    await registrar(env, u, 'recusou foto', 'banner', id, s.banner.toUpperCase());
    return json({ ok: true });
  }
  if (m === 'DELETE') {
    if (!admin && !(s.autor === u.email && s.status === 'pendente')) return erro('Você só pode excluir sugestões suas que ainda aguardam análise.', 403);
    await env.DB.prepare('DELETE FROM sugestoes WHERE id=?').bind(id).run();
    return json({ ok: true });
  }
  return erro('Operação não permitida.', 405);
}
