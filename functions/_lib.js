// Biblioteca comum das funções do painel (Cloudflare Pages Functions).
// Recursos usados: banco D1 (env.DB), arquivos R2 (env.ARQUIVOS), login Cloudflare Access.

export const COMITES = ['cbhlp', 'cbhrf', 'cbhlc', 'cbhrma', 'cbhrp', 'cbhsast', 'cbhrcc'];
export const PERFIS = ['admin', 'presidente', 'secretario'];
export const NOME_PERFIL = { admin: 'Administrador', presidente: 'Presidente', secretario: 'Secretário(a)' };

export function json(dados, status = 200, extra = {}) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...extra }
  });
}
export const erro = (msg, status = 400) => json({ erro: msg }, status);

// ---------- banco ----------
let pronto = false;
export async function preparar(env) {
  if (pronto) return;
  if (!env.DB) throw new Error('Banco D1 não configurado (binding DB).');
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS usuarios (
      email TEXT PRIMARY KEY, nome TEXT, perfil TEXT NOT NULL, comite TEXT, ativo INTEGER DEFAULT 1, criado_em TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS noticias (
      id TEXT PRIMARY KEY, titulo TEXT, data TEXT, comites TEXT, imagem TEXT, resumo TEXT, html TEXT,
      status TEXT, autor TEXT, criado_em TEXT, atualizado_em TEXT, revisado_por TEXT, motivo TEXT, legado INTEGER DEFAULT 0)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS documentos (
      id TEXT PRIMARY KEY, titulo TEXT, descricao TEXT, comite TEXT, categoria TEXT, ano TEXT, arquivo TEXT,
      status TEXT, autor TEXT, criado_em TEXT, atualizado_em TEXT, revisado_por TEXT, motivo TEXT, legado INTEGER DEFAULT 0)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS historico (
      id INTEGER PRIMARY KEY AUTOINCREMENT, quando TEXT, email TEXT, acao TEXT, tipo TEXT, item_id TEXT, titulo TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS config (chave TEXT PRIMARY KEY, valor TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS paginas (comite TEXT PRIMARY KEY, dados TEXT, autor TEXT, atualizado_em TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS paginas_pendentes (
      id TEXT PRIMARY KEY, comite TEXT, dados TEXT, autor TEXT, status TEXT, motivo TEXT, criado_em TEXT, revisado_por TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS sugestoes (
      id TEXT PRIMARY KEY, banner TEXT, lado TEXT, src TEXT, foco TEXT, titulo TEXT, credito TEXT,
      autor TEXT, status TEXT, motivo TEXT, criado_em TEXT, revisado_por TEXT)`)
  ]);
  pronto = true;
}
export const agora = () => new Date().toISOString();
export const novoId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export async function registrar(env, u, acao, tipo, id, titulo) {
  await env.DB.prepare('INSERT INTO historico (quando, email, acao, tipo, item_id, titulo) VALUES (?,?,?,?,?,?)')
    .bind(agora(), u.email, acao, tipo, String(id), String(titulo || '').slice(0, 200)).run();
}

// ---------- login (Cloudflare Access) ----------
const cacheChaves = { chaves: null, quando: 0 };
function b64url(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
async function chavesAccess(time) {
  if (cacheChaves.chaves && Date.now() - cacheChaves.quando < 3600e3) return cacheChaves.chaves;
  const r = await fetch(`https://${time}/cdn-cgi/access/certs`);
  const j = await r.json(); cacheChaves.chaves = j.keys || []; cacheChaves.quando = Date.now();
  return cacheChaves.chaves;
}
async function emailDoToken(token, env) {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return null;
  const cab = JSON.parse(new TextDecoder().decode(b64url(h)));
  const carga = JSON.parse(new TextDecoder().decode(b64url(p)));
  const jwk = (await chavesAccess(env.ACCESS_TEAM_DOMAIN)).find(k => k.kid === cab.kid);
  if (!jwk) return null;
  const chave = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', chave, b64url(s), new TextEncoder().encode(h + '.' + p));
  if (!ok) return null;
  const aud = Array.isArray(carga.aud) ? carga.aud : [carga.aud];
  if (!aud.includes(env.ACCESS_AUD)) return null;
  if (carga.iss && carga.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return null;
  if (cab.alg !== 'RS256') return null;
  const agoraS = Date.now() / 1000;
  if (!carga.exp || carga.exp < agoraS) return null;
  if (carga.nbf && carga.nbf > agoraS + 60) return null;
  return String(carga.email || '').toLowerCase() || null;
}
function cookie(req, nome) {
  const c = req.headers.get('cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + nome + '=([^;]+)'));
  return m ? m[1] : null;
}
export async function usuarioAtual(request, env) {
  let email = null;
  const url = new URL(request.url);
  // Somente para testes no computador (wrangler pages dev). Nunca é usado no site publicado.
  if (env.DEV_EMAIL && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) email = String(env.DEV_EMAIL).toLowerCase();
  else {
    const token = request.headers.get('cf-access-jwt-assertion') || cookie(request, 'CF_Authorization');
    if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
    try { email = await emailDoToken(token, env); } catch { email = null; }
  }
  if (!email) return null;
  const admins = String(env.ADMIN_EMAILS || '').toLowerCase().split(/[\s,;]+/).filter(Boolean);
  const u = await env.DB.prepare('SELECT * FROM usuarios WHERE email = ?').bind(email).first();
  if (admins.includes(email)) return { email, nome: (u && u.nome) || 'Administrador', perfil: 'admin', comite: null, ativo: 1, fixo: true };
  if (!u || !u.ativo) return { email, semAcesso: true };
  return u;
}

// ---------- limpeza do texto das notícias (impede scripts e código estranho) ----------
const PERMITIDAS = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup', 'span', 'div', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'img', 'figure', 'figcaption', 'hr', 'table', 'caption', 'colgroup', 'col', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th']);
// Estilos aceitos do editor (cores, tamanhos, alinhamento, tabelas); o resto é descartado
const ESTILOS = new Set(['color', 'background-color', 'font-size', 'font-family', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line', 'text-align', 'vertical-align', 'line-height', 'width', 'height', 'max-width', 'border', 'border-color', 'border-style', 'border-width', 'border-collapse', 'padding', 'padding-left', 'margin-left', 'float', 'display', 'margin', 'list-style-type']);
function limparEstilo(css) {
  return String(css || '').split(';').map(d => {
    const i = d.indexOf(':'); if (i < 0) return '';
    const p = d.slice(0, i).trim().toLowerCase(), v = d.slice(i + 1).trim();
    if (!ESTILOS.has(p) || !v || v.length > 120) return '';
    if (/url\s*\(|expression|javascript:|@import|[<>{}\\]/i.test(v)) return '';
    if (!/^[#\w\s,.%()\-"'+/]+$/.test(v)) return '';
    return `${p}: ${v}`;
  }).filter(Boolean).join('; ');
}
const REMOVER = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'option', 'link', 'meta', 'svg', 'math', 'video', 'audio', 'noscript', 'template', 'base', 'frame', 'frameset', 'title', 'head']);
const urlSegura = (v, img) => img ? /^(https:\/\/|\/arquivos\/|\/?midia\/|\/?assets\/img\/)/i.test(v) : /^(https?:\/\/|mailto:|\/(?!\/)|noticia\.html|comite\.html|documentos\.html)/i.test(v);
export async function limparHTML(html) {
  const resp = new HTMLRewriter()
    .on('*', {
      element(el) {
        const t = el.tagName.toLowerCase();
        if (REMOVER.has(t)) { el.remove(); return; }
        if (!PERMITIDAS.has(t)) { el.removeAndKeepContent(); return; }
        for (const [nome] of [...el.attributes]) {
          const v = (el.getAttribute(nome) || '').trim();
          if (nome === 'style') { const s = limparEstilo(v); if (s) el.setAttribute('style', s); else el.removeAttribute('style'); continue; }
          const ok = (t === 'a' && nome === 'href' && urlSegura(v, false)) || (t === 'img' && nome === 'src' && urlSegura(v, true)) ||
            (t === 'img' && nome === 'alt') || ((t === 'img' || t === 'col' || t === 'td' || t === 'th' || t === 'table') && (nome === 'width' || nome === 'height') && /^\d{1,4}%?$/.test(v)) ||
            ((t === 'td' || t === 'th') && (nome === 'colspan' || nome === 'rowspan') && /^\d{1,2}$/.test(v));
          if (!ok) el.removeAttribute(nome);
        }
        if (t === 'a') { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener'); }
        if (t === 'img') el.setAttribute('loading', 'lazy');
      },
      comments(c) { c.remove(); }
    })
    .onDocument({ comments(c) { c.remove(); } })
    .transform(new Response(String(html || ''), { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return (await resp.text()).trim();
}
export const texto = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
export const urlArquivo = v => { v = texto(v, 600); return /^(\/arquivos\/|midia\/|https:\/\/)/i.test(v) && !/["'<>`\s\\]/.test(v) ? v : ''; };
// Proteção contra envio de formulários de outros sites (CSRF): exige cabeçalho próprio e mesma origem
export function origemValida(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return true;
  if (request.headers.get('x-cbhto-painel') !== '1') return false;
  const origem = request.headers.get('origin');
  return !origem || origem === new URL(request.url).origin;
}
