/* ==========================================================================
   CBHTO – aparência do site: tema de cor, faixa da campanha e banners em camadas.
   O administrador escolhe tudo no painel (aba Aparência); aqui só se aplica.
   ========================================================================== */
(function () {
  'use strict';
  // Lista dos temas (as cores ficam em assets/css/temas.css). "amostra" é usada só nos cartões do painel.
  const TEMAS = {
    padrao:   { nome: 'Padrão Procomitês', quando: 'O ano todo', amostra: ['#023971', '#065598', '#0494cb', '#2ab46c'] },
    mulheres: { nome: 'Mulheres das Águas', quando: 'Encontro Mulheres das Águas', amostra: ['#7a2f52', '#b0527d', '#dc8fb0', '#9be3e8'] },
    agua:     { nome: 'Dia Mundial da Água', quando: 'Semana de 22 de março', amostra: ['#003b73', '#0072bd', '#00a9dc', '#37d6c9'] },
    ambiente: { nome: 'Semana do Meio Ambiente', quando: 'Junho', amostra: ['#0f3d24', '#1d7a45', '#49b86f', '#c6e04a'] },
    amarelo:  { nome: 'Setembro Amarelo', quando: 'Setembro', amostra: ['#23272e', '#3d4651', '#c79a00', '#f5c400'] },
    rosa:     { nome: 'Outubro Rosa', quando: 'Outubro', amostra: ['#9b2c5e', '#c9427f', '#e884ad', '#ffd3e3'] },
    novembro: { nome: 'Novembro Azul', quando: 'Novembro', amostra: ['#0a2351', '#1f4fb8', '#4f8ff5', '#7fb2ff'] }
  };
  const FOCOS = { centro: 'xMidYMid', esquerda: 'xMinYMid', direita: 'xMaxYMid', topo: 'xMidYMin', base: 'xMidYMax' };
  const CHAVE = 'cbhto-aparencia';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const fotoOk = s => /^(assets\/img\/fotos-banners\/[\w-]+\.jpg|midia\/[^"'<>\s\\]+\.(jpe?g|png|webp)|\/arquivos\/[\w\/.-]+\.(jpe?g|png|webp))$/i.test(s || '');
  const linkOk = s => /^(https:\/\/|\/(?!\/)|[\w-]+\.html)/i.test(s || '');

  let estado = {};
  try { estado = JSON.parse(localStorage.getItem(CHAVE) || '{}') || {}; } catch (e) { estado = {}; }

  function aplicarTema(id) { document.documentElement.dataset.tema = TEMAS[id] ? id : 'padrao'; }
  function aplicarFaixa() {
    const f = estado.faixa || {}; let el = document.querySelector('.faixa-campanha');
    if (!f.ativa || !f.texto) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.className = 'faixa-campanha'; el.setAttribute('role', 'note'); document.body.prepend(el); }
    el.innerHTML = linkOk(f.link) ? `<a href="${esc(f.link)}">${esc(f.texto)}</a>` : esc(f.texto);
  }
  const NO_PAINEL = document.documentElement.hasAttribute('data-painel');   // no painel o tema só aparece nas prévias
  if (!NO_PAINEL) aplicarTema(estado.tema);   // aplica logo o último tema conhecido, para a página não "piscar" na cor errada
  if (!NO_PAINEL) { if (document.body) aplicarFaixa(); else document.addEventListener('DOMContentLoaded', aplicarFaixa); }

  /* Banner em camadas: fotos + tinta do tema + contorno da bacia + logo. raiz = prefixo dos caminhos ('' no site, '../' no painel). */
  function banner(id, op) {
    op = op || {}; const B = (window.BANNERS || {})[id]; if (!B) return '';
    const raiz = op.raiz || '', troca = Object.assign({}, (estado.banners || {})[id], op.troca);
    const lado = k => { const t = troca[k]; return t && fotoOk(t.src) ? { src: t.src, foco: t.foco } : B[k]; };
    const esq = lado('esq'), dir = lado('dir');
    const g = Object.assign({ ex: 0, ew: 1180, dx: 740, dw: 1180, m0: 760, m1: 1160 }, B.geo);
    const u = 'bn-' + id + (op.sufixo || ''), href = op.adiar ? 'data-href' : 'href';
    const url = s => s.charAt(0) === '/' ? s : raiz + s;
    const par = f => (FOCOS[f] || FOCOS.centro) + ' slice';
    const img = (f, x, w, extra) => `<image ${href}="${esc(url(f.src))}" x="${x}" y="0" width="${w}" height="569" preserveAspectRatio="${par(f.foco)}"${extra || ''}/>`;
    const L = B.logo;
    const circulos = (B.circulos || []).map(c => `<circle class="ban-disco" cx="${c.cx}" cy="${c.cy}" r="${c.r}"/><image href="${esc(raiz + c.src)}" x="${c.cx - c.w / 2}" y="${c.cy - c.h / 2}" width="${c.w}" height="${c.h}"/>`).join('');
    const frase = B.frase ? `<text class="ban-frase" x="960" y="${B.frase.y}">${esc(B.frase.texto)}</text>` : '';
    return `<svg class="banner-svg" viewBox="0 0 1920 569" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(op.rotulo || 'Banner')}">
<defs><linearGradient id="${u}m" gradientUnits="userSpaceOnUse" x1="${g.m0}" y1="0" x2="${g.m1}" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<mask id="${u}k" maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="569"><rect width="1920" height="569" fill="url(#${u}m)"/></mask>
<linearGradient id="${u}t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="ban-t1"/><stop offset="1" class="ban-t2"/></linearGradient>
<linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ban-s1"/><stop offset="1" class="ban-s2"/></linearGradient>
<filter id="${u}f" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="569"><feGaussianBlur stdDeviation="22"/></filter>
<clipPath id="${u}c"><rect width="1920" height="569"/></clipPath></defs>
<rect width="1920" height="569" fill="#0a2a3a"/>${img(dir, g.dx, g.dw)}${img(esq, g.ex, g.ew, ` mask="url(#${u}k)"`)}
<rect width="1920" height="569" fill="url(#${u}t)"/>
<g clip-path="url(#${u}c)"><path class="ban-somb" d="${B.d}" filter="url(#${u}f)"/><path d="${B.d}" fill="url(#${u}s)" opacity=".93"/></g>
<image href="${esc(raiz + L.src)}" x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}"/>${circulos}${frase}</svg>`;
  }
  // Carrega as fotos dos banners que foram adiadas (slides que não aparecem de início)
  function carregarAdiadas(raizEl) { (raizEl || document).querySelectorAll('image[data-href]').forEach(i => { i.setAttribute('href', i.getAttribute('data-href')); i.removeAttribute('data-href'); }); }

  window.APARENCIA = {
    TEMAS, FOCOS, banner, carregarAdiadas, fotoOk,
    get estado() { return estado; },
    aplicar(ap) {   // recebe { tema, faixa, banners } vindo do servidor
      if (!ap || typeof ap !== 'object') return;
      estado = { tema: TEMAS[ap.tema] ? ap.tema : 'padrao', faixa: ap.faixa || {}, banners: ap.banners || {} };
      try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { }
      if (!NO_PAINEL) { aplicarTema(estado.tema); aplicarFaixa(); }
    },
    // créditos das fotos em uso e da biblioteca, sem repetir
    creditos() {
      const vistos = new Set(), out = [];
      const junta = (titulo, credito) => { const k = (titulo || '') + '|' + (credito || ''); if (credito && !vistos.has(k)) { vistos.add(k); out.push({ titulo, credito }); } };
      (window.FOTOS_BANNER || []).forEach(f => junta(f.titulo, f.credito));
      Object.values(estado.banners || {}).forEach(b => ['esq', 'dir'].forEach(k => { if (b && b[k]) junta(b[k].titulo || 'Foto de banner', b[k].credito); }));
      return out;
    }
  };
})();
