# ==========================================================================
#  GERA O CONTEÚDO DO NOVO SITE A PARTIR DO BACKUP DO SITE ANTIGO
#  Lê  ..\Backup site CBHTO\paginas  e  ..\Backup site CBHTO\arquivos
#  Gera assets/js/noticias.js, documentos.js, galerias.js, conteudo.js
#  e copia para midia/ as imagens e arquivos usados (fotos grandes são reduzidas).
#  Uso: powershell -ExecutionPolicy Bypass -File gerar-conteudo.ps1
# ==========================================================================
$ErrorActionPreference = 'Continue'
$site  = $PSScriptRoot
$bk    = Join-Path (Split-Path $site) 'Backup site CBHTO'
$pg    = Join-Path $bk 'paginas'
$arq   = Join-Path $bk 'arquivos'
$midia = Join-Path $site 'midia'
$js    = Join-Path $site 'assets\js'
$utf8  = New-Object Text.UTF8Encoding($false)
$script:usados = @{}
$script:faltando = @{}

function Ler($f) { [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8) }
function Dec($s) { try { [Uri]::UnescapeDataString($s) } catch { $s } }
function HD($s)  { [Net.WebUtility]::HtmlDecode($s) }
function Txt($h) { (HD ((($h -replace '<[^>]+>', ' ') -replace '\s+', ' '))).Trim() }

function ComiteDe([string]$s) {
    $s = $s.ToLower()
    if ($s -match 'ci-lago|cilago|ci_lago|ci lago') { return 'acervo' }
    if ($s -match 'cbhlp|cbhel|entorno|lago de palmas|lago_palmas') { return 'cbhlp' }
    if ($s -match 'cbhrf|formoso') { return 'cbhrf' }
    if ($s -match 'cbhrma|manuel|manoel') { return 'cbhrma' }
    if ($s -match 'cbhlc|cbhrlc|lontra') { return 'cbhlc' }
    if ($s -match 'cbhrp|rio_palma|rio-palma|rio palma') { return 'cbhrp' }
    if ($s -match 'sast|santa tereza|santo ant') { return 'cbhsast' }
    if ($s -match 'cbhrcc|coco e caiap') { return 'cbhrcc' }
    return ''
}

# caminho do site antigo (/images/...) -> caminho no site novo (midia/...)
function Midia([string]$src) {
    $s = (HD $src) -replace '^https?://(www\.)?cbhto\.com\.br', ''
    $s = $s -replace '[?#].*$', ''
    if ($s -notmatch '^/?images/') { return $null }
    $rel = Dec ($s.TrimStart('/'))
    $orig = Join-Path $arq ($rel -replace '/', '\')
    if (-not (Test-Path -LiteralPath $orig -PathType Leaf)) { $script:faltando[$rel] = 1; return $null }
    $script:usados[$rel] = 1
    $partes = $rel.Substring(7) -split '/' | ForEach-Object { [Uri]::EscapeDataString($_) }
    return 'midia/' + ($partes -join '/')
}

function Link([string]$href) {
    $h = HD $href
    if ($h -match '(?:noticias)/(\d+)-') { return "noticia.html?id=$($matches[1])" }
    $m = Midia $h
    if ($m) { return $m }
    if ($h -match '^/') { return 'https://cbhto.com.br' + $h }
    return $h
}

$evSrc = [Text.RegularExpressions.MatchEvaluator] {
    param($m)
    $attr = $m.Groups[1].Value; $val = $m.Groups[2].Value
    if ($attr -eq 'src') {
        if ($val -match 'youtube\.com/embed/([\w-]+)') { return "src=`"https://www.youtube.com/embed/$($matches[1])`"" }
        $n = Midia $val; if ($n) { return "src=`"$n`"" } else { return 'src="" data-faltando="1"' }
    }
    return "href=`"$(Link $val)`""
}

function Limpar([string]$h) {
    $h = [regex]::Replace($h, '(?s)<script.*?</script>', '')
    $h = [regex]::Replace($h, '(?s)<style.*?</style>', '')
    $h = [regex]::Replace($h, '(?s)<!--.*?-->', '')
    $h = [regex]::Replace($h, '\s(class|id|style|data-[\w-]+|srcset|sizes|loading|width|height|align|border|title|itemprop|itemscope|itemtype|rel|target|frameborder|allow|dir|lang)="[^"]*"', '')
    $h = [regex]::Replace($h, '(src|href)="([^"]*)"', $evSrc)
    $h = [regex]::Replace($h, '<img[^>]*data-faltando="1"[^>]*>', '')
    $h = [regex]::Replace($h, '</?(span|font|div|section|article|figure|o:p)\b[^>]*>', '')
    $h = [regex]::Replace($h, '<p>(\s|&nbsp;|<br\s*/?>)*</p>', '')
    $h = [regex]::Replace($h, '<a href="[^"]*">\s*(<img[^>]*>)\s*</a>', '$1')
    $h = [regex]::Replace($h, '\s{2,}', ' ')
    return $h.Trim()
}

# ---------- títulos em CAIXA ALTA -> forma normal ----------
$siglas = 'CBHTO CBHLP CBHEL CBHRF CBHRMA CBHLC CBHRLC CBHRP CBHSAST CBHRCC CBH CBHS SAST SEMARH CI-LAGO CI IFTO UFT UNITINS UNIRG NATURATINS MPTO MPE TJTO TJ ANA CERH CNRH FNCBH FTCBH ERCOB SNGRH PERH PRH CAR CCAR TAC ADAPEC RURALTINS SENAR EMBRAPA FAPTO ONG ONGS IBRAMARH ABAS UHE TO DF PNRH ODS COP30 COP UFNT SEBRAE SESC SENAC CREA CRBIO PSA PIB GT CT CTS ATER APA RPPN PRODES II III IV VI VII VIII IX XI XII XIII XIV XV XX'.Split(' ')
$proprios = @{}
'Tocantins Araguaia Formoso Palma Palmas Lontra Corda Manuel Manoel Alves Santo Antônio Santa Tereza Coco Caiapó Gurupi Araguaína Natividade Taguatinga Dianópolis Paranã Arraias Pium Caseara Araguacema Brasil Brasília Goiás Lagoa Confusão Porto Nacional Miracema Paraíso Lajeado Xambioá Wanderlândia Aragominas Almas Peixe Alvorada Cristalândia Dueré Talismã Figueirópolis Sandolândia Araguaçu Babaçulândia Darcinópolis Carmolândia Angico Riachinho Piraquê Ananás Araguanã Combinado Aurora Lavandeira Taipas Conceição Pindorama Silvanópolis Fátima Aliança Crixás Barrolândia Abreulândia Divinópolis Marianópolis Javaés Bananal Cerrado Amazônia Luís Eduardo Magalhães Gorete Mário Maria Cristina Rocha Janeiro Fevereiro Março Abril Maio Junho Julho Agosto Setembro Outubro Novembro Dezembro Mulheres Águas Semana Água Estado Governo Ministério Público Federal Estadual Câmara Técnica Plano Recursos Hídricos'.Split(' ') | ForEach-Object { $proprios[$_.ToLower()] = $_ }
$siglaSet = @{}; $siglas | ForEach-Object { $siglaSet[$_] = 1 }

function Titulo([string]$t) {
    $t = ($t -replace '\s+', ' ').Trim()
    $letras = ($t -replace '[^\p{L}]', '')
    if ($letras.Length -lt 6) { return $t }
    $mai = ($letras -creplace '[^\p{Lu}]', '').Length
    if ($mai / $letras.Length -lt 0.7) { return $t }
    $saida = @(); $inicio = $true
    foreach ($w in $t.Split(' ')) {
        $nucleo = $w -replace '^[^\p{L}\d]+|[^\p{L}\d]+$', ''
        $up = $nucleo.ToUpper()
        if (-not $nucleo) { $novo = $w }
        elseif ($siglaSet.ContainsKey($up) -or $nucleo -match '\d' -or $up -match '^CBH') { $novo = $w }
        elseif ($proprios.ContainsKey($nucleo.ToLower())) { $novo = $w.Replace($nucleo, $proprios[$nucleo.ToLower()]) }
        else {
            $low = $w.ToLower()
            if ($inicio) { $i = [regex]::Match($low, '\p{L}').Index; $low = $low.Substring(0, $i) + $low.Substring($i, 1).ToUpper() + $low.Substring($i + 1) }
            $novo = $low
        }
        $saida += $novo
        $inicio = ($w -match '[.:!?]$')
    }
    $r = ($saida -join ' ')
    $i = [regex]::Match($r, '\p{L}').Index
    return $r.Substring(0, $i) + $r.Substring($i, 1).ToUpper() + $r.Substring($i + 1)
}

function Arq($nome) { Get-ChildItem -LiteralPath $pg -Filter $nome -ErrorAction SilentlyContinue | Select-Object -First 1 }
$todas = Get-ChildItem -LiteralPath $pg -Filter '*.html'

# ======================= NOTÍCIAS =======================
Write-Host 'Notícias...'
$comiteDaNoticia = @{}
foreach ($f in $todas | Where-Object { $_.Name -match '^(cbh\w+)-noticias\.html' -or $_.Name -match '^tags_' }) {
    $c = if ($f.Name -match '^tags_(.+?)\.html') { ComiteDe $matches[1] } else { ComiteDe ($f.Name -replace '-noticias.*$', '') }
    if (-not $c -or $c -eq 'acervo') { continue }
    foreach ($m in [regex]::Matches((Ler $f.FullName), 'noticias/(\d+)-')) {
        $id = [int]$m.Groups[1].Value
        if (-not $comiteDaNoticia[$id]) { $comiteDaNoticia[$id] = New-Object Collections.ArrayList }
        if (-not $comiteDaNoticia[$id].Contains($c)) { [void]$comiteDaNoticia[$id].Add($c) }
    }
}
$padroes = [ordered]@{
    cbhlp = 'CBHLP|CBHEL|Lago de Palmas|Entorno do Lago'; cbhrf = 'CBHRF|Rio Formoso|Comitê do Formoso'; cbhrma = 'CBHRMA|Manuel Alves|Manoel Alves'
    cbhlc = 'CBHLC|CBHRLC|Lontra e Corda'; cbhrp = 'CBHRP|Rio Palma'; cbhsast = 'CBHSAST|Santo Antônio e Santa Tereza|SAST'; cbhrcc = 'CBHRCC|Coco e Caiapó'
}
$noticias = @{}
foreach ($f in $todas) {
    if ($f.Name -notmatch '^[a-z-]*noticias_(\d+)-') { continue }
    $id = [int]$matches[1]
    if ($noticias.ContainsKey($id)) { continue }
    $h = Ler $f.FullName
    $a = [regex]::Match($h, '(?s)<article class="nt-content">(.*)').Groups[1].Value
    if (-not $a) { continue }
    $d = [regex]::Match($a, 'cck_value_jform_calendar">\s*(\d\d)/(\d\d)/(\d{4})')
    $data = if ($d.Success) { "$($d.Groups[3].Value)-$($d.Groups[2].Value)-$($d.Groups[1].Value)" } else { '' }
    $tit = Titulo (Txt ([regex]::Match($a, '(?s)<h1[^>]*>(.*?)</h1>').Groups[1].Value))
    $capaOrig = [regex]::Match($a, '(?s)<div class="nt-img">.*?<img[^>]*?src="([^"]+)"').Groups[1].Value
    $capa = if ($capaOrig) { Midia $capaOrig } else { $null }
    $ft = [regex]::Match($a, '(?s)<div class="fulltext">(.*?)(<div class="limpar"></div>\s*)?<section class="bl-coment">')
    if (-not $ft.Success) { $ft = [regex]::Match($a, '(?s)<div class="fulltext">(.*)') }
    $corpo = $ft.Groups[1].Value -replace '(?s)</div>\s*$', ''
    $html = Limpar $corpo
    $texto = Txt $corpo
    $res = if ($texto.Length -gt 230) { $texto.Substring(0, $texto.Substring(0, 230).LastIndexOf(' ')) + '…' } else { $texto }
    $cs = New-Object Collections.ArrayList
    if ($comiteDaNoticia[$id]) { $comiteDaNoticia[$id] | ForEach-Object { [void]$cs.Add($_) } }
    if ($cs.Count -eq 0) {
        foreach ($k in $padroes.Keys) { if ($tit -match $padroes[$k]) { [void]$cs.Add($k) } }
    }
    if ($cs.Count -eq 0) {
        $melhor = ''; $max = 0
        foreach ($k in $padroes.Keys) { $n = ([regex]::Matches($texto, $padroes[$k])).Count; if ($n -gt $max) { $max = $n; $melhor = $k } }
        if ($max -ge 2) { [void]$cs.Add($melhor) }
    }
    $noticias[$id] = [ordered]@{ id = $id; titulo = $tit; data = $data; comites = @($cs); imagem = $capa; resumo = $res; html = $html }
}
$listaN = @($noticias.Values | Sort-Object { $_.data }, { $_.id } -Descending)
Write-Host "  $($listaN.Count) notícias"

# ======================= GALERIAS =======================
Write-Host 'Galerias...'
$galerias = @{}
foreach ($f in $todas) {
    if ($f.Name -notmatch '^(cbh\w+|midia-ci-lago|ci-lago)[-_].*fotos_(\d+)-') { continue }
    $id = [int]$matches[2]
    if ($galerias.ContainsKey($id)) { continue }
    $h = Ler $f.FullName
    $tit = Titulo (Txt ([regex]::Match($h, '(?s)<section class="ft content">\s*<h2>(.*?)</h2>').Groups[1].Value))
    if (-not $tit) { continue }
    $fotos = New-Object Collections.ArrayList
    $g = [regex]::Match($h, '(?s)<div class="ft_galeria">(.*?)</section>').Groups[1].Value
    foreach ($m in [regex]::Matches($g, '<a[^>]*href="([^"]+\.(?:jpe?g|png|webp|gif))"', 'IgnoreCase')) {
        $u = Midia $m.Groups[1].Value
        if ($u -and -not $fotos.Contains($u)) { [void]$fotos.Add($u) }
    }
    if ($fotos.Count -eq 0) {
        foreach ($m in [regex]::Matches($g, '<img[^>]*src="([^"]+)"')) { $u = Midia $m.Groups[1].Value; if ($u -and -not $fotos.Contains($u)) { [void]$fotos.Add($u) } }
    }
    if ($fotos.Count -eq 0) { continue }
    $galerias[$id] = [ordered]@{ id = $id; comite = (ComiteDe $f.Name); titulo = $tit; fotos = @($fotos) }
}
$listaG = @($galerias.Values | Sort-Object { $_.id } -Descending)
Write-Host "  $($listaG.Count) galerias"

# ======================= DOCUMENTOS =======================
Write-Host 'Documentos...'
function CategoriaDe([string]$k) {
    $k = $k.ToLower()
    if ($k -match 'ci-lago') {
        if ($k -match 'atas') { return 'Atas' }; if ($k -match 'portarias') { return 'Portarias' }; if ($k -match 'regimento') { return 'Regimento interno' }
        if ($k -match 'decretos|leis|resolucoes') { return 'Legislação' }; if ($k -match 'planos') { return 'Planos' }; if ($k -match 'relatorios') { return 'Relatórios' }
        if ($k -match 'convenio|contratos-de-gestao') { return 'Convênio e contratos de gestão' }; if ($k -match 'cronograma') { return 'Cronograma de pagamento' }
        if ($k -match 'licitacao|homologacao|dispensa|extrato') { return 'Licitações e contratos' }
        return 'Outros'
    }
    if ($k -match 'atas') { return 'Atas de reuniões' }
    if ($k -match 'legislacao') { return 'Legislação' }
    if ($k -match 'lista-dos-membros') { return 'Lista de membros' }
    if ($k -match 'diversos') { return 'Diversos' }
    if ($k -match 'arquivos') { return 'Arquivos' }
    return 'Diversos'
}
$docs = New-Object Collections.ArrayList
$vistos = @{}
foreach ($f in $todas) {
    $h = Ler $f.FullName
    if ($h -notmatch 'class="cl ') { continue }
    $chave = $f.Name -replace '\.html(_start=\d+)?\.html$', ''
    $c = ComiteDe $chave; $cat = CategoriaDe $chave
    foreach ($b in ($h -split '<div class="cl ' | Select-Object -Skip 1)) {
        $href = [regex]::Match($b, 'href="([^"]+)"').Groups[1].Value
        if (-not $href) { continue }
        $tit = Txt ([regex]::Match($b, '(?s)<h2 class="cl-title">(.*?)</h2>').Groups[1].Value)
        $desc = Txt ([regex]::Match($b, '(?s)<p class="cl-descricao">(.*?)</p>').Groups[1].Value)
        $ano = Txt ([regex]::Match($b, '(?s)cck_value_jform_calendar">(.*?)</div>').Groups[1].Value)
        if ($desc -eq $tit) { $desc = '' }
        $url = Link $href
        if ($vistos.ContainsKey("$c|$url")) { continue }
        $vistos["$c|$url"] = 1
        [void]$docs.Add([ordered]@{ titulo = (Titulo $tit); descricao = $desc; comite = $c; categoria = $cat; ano = $ano; arquivo = $url })
    }
}

# ======================= CONTEÚDO DE CADA COMITÊ =======================
Write-Host 'Páginas dos comitês...'
$conteudo = [ordered]@{}
foreach ($c in 'cbhlp', 'cbhrf', 'cbhlc', 'cbhrma', 'cbhrp', 'cbhsast') {
    $x = [ordered]@{ historia = ''; diretoria = ''; videos = @(); camaras = @() }
    $f = Arq "$c-institucional_o-comite.html.html"
    $vids = New-Object Collections.ArrayList
    if ($f) {
        $h = Ler $f.FullName
        $x.historia = Limpar ([regex]::Match($h, '(?s)<section class="fulltext">(.*?)</section>').Groups[1].Value)
        foreach ($m in [regex]::Matches($h, 'youtube\.com/embed/([\w-]+)')) { if (-not ($vids | Where-Object { $_.id -eq $m.Groups[1].Value })) { [void]$vids.Add([ordered]@{ id = $m.Groups[1].Value; titulo = '' }) } }
    }
    $f = Arq "$c-institucional_diretoria-executiva.html.html"
    if ($f) { $x.diretoria = Limpar ([regex]::Match((Ler $f.FullName), '(?s)<section class="fulltext">(.*?)</section>').Groups[1].Value) }
    foreach ($f in $todas | Where-Object { $_.Name -match "^$c-midia_.*videos" }) {
        $h = Ler $f.FullName
        foreach ($m in [regex]::Matches($h, '(?s)<h3 class="vd-title">(.*?)</h3>.*?youtube\.com/embed/([\w-]+)')) {
            $vid = $m.Groups[2].Value
            $ex = $vids | Where-Object { $_.id -eq $vid }
            if ($ex) { $ex.titulo = Txt $m.Groups[1].Value } else { [void]$vids.Add([ordered]@{ id = $vid; titulo = (Txt $m.Groups[1].Value) }) }
        }
    }
    $x.videos = @($vids)
    $cams = New-Object Collections.ArrayList
    foreach ($f in $todas | Where-Object { $_.Name -match "^$c-camaras-tecncias_(\d+)-" }) {
        $cid = [int]([regex]::Match($f.Name, '_(\d+)-').Groups[1].Value)
        $h = Ler $f.FullName
        $tit = Txt ([regex]::Match($h, '(?s)<h1 class="cmt-title">(.*?)</h1>').Groups[1].Value)
        $corpo = Limpar ([regex]::Match($h, '(?s)<section class="fulltext">(.*?)</section>').Groups[1].Value)
        $bx = [regex]::Match($h, '(?s)<div class="cmt-baixar">.*?href="([^"]+)"').Groups[1].Value
        $url = if ($bx) { Link $bx } else { '' }
        [void]$cams.Add([ordered]@{ id = $cid; titulo = $tit; html = $corpo; arquivo = $url })
        if ($url) { [void]$docs.Add([ordered]@{ titulo = $tit; descricao = (Txt $corpo); comite = $c; categoria = 'Câmaras técnicas'; ano = ''; arquivo = $url }) }
    }
    $x.camaras = @($cams | Sort-Object { $_.id } -Descending)
    $conteudo[$c] = $x
}

# ---------- arquivos do backup que nenhuma página listou ----------
$extDoc = '\.(pdf|docx?|xlsx?|pptx?|odt|ods|zip|rar|csv|kmz|kml)$'
$jaTem = @{}; $docs | ForEach-Object { $jaTem[$_.arquivo] = 1 }
foreach ($fi in Get-ChildItem -LiteralPath $arq -Recurse -File | Where-Object { $_.Name -match $extDoc }) {
    $rel = $fi.FullName.Substring($arq.Length + 1) -replace '\\', '/'
    $u = Midia ('/' + $rel)
    if (-not $u -or $jaTem[$u]) { continue }
    $c = ComiteDe $rel; if (-not $c) { $c = 'cbhto' }
    $nome = [IO.Path]::GetFileNameWithoutExtension($fi.Name) -replace '[-_]+', ' '
    [void]$docs.Add([ordered]@{ titulo = (Titulo $nome); descricao = ''; comite = $c; categoria = $(if ($c -eq 'acervo') { 'Outros' } else { 'Outros arquivos' }); ano = ''; arquivo = $u })
}
# ---------- ajustes de categoria e nomes ----------
$nomes = @{ 'cbhtomanualdamarca' = 'Manual da marca CBHTO'; 'volume-1-cartilha' = 'Cartilha – Volume 1'; 'volume-2-cartilha' = 'Cartilha – Volume 2'; 'volume-3-cartilha' = 'Cartilha – Volume 3'
            'altimetria1' = 'Mapa de altimetria'; 'curvascota30' = 'Mapa de curvas de nível (cota 30)'; 'curvascota50' = 'Mapa de curvas de nível (cota 50)'; 'curvasrios' = 'Mapa de curvas e rios' }
$perfilGeral = $false
foreach ($d in $docs) {
    foreach ($k in $nomes.Keys) { if ($d.arquivo -match [regex]::Escape($k)) { $d.titulo = $nomes[$k] } }
    if ($d.comite -eq 'cbhto') { $d.categoria = 'Publicações' }
    elseif ($d.comite -ne 'acervo') {
        if ($d.titulo -match '(?i)plano de bacia') { $d.categoria = 'Planos de bacia' }
        elseif ($d.titulo -match '(?i)perfil de usu') { $d.categoria = 'Estudos e publicações' }
        elseif ($d.categoria -eq 'Lista de membros') { $d.categoria = 'Listas de membros' }
        elseif ($d.categoria -in 'Diversos', 'Outros arquivos' -and $d.titulo -match '(?i)resolu|delibera|ad referendum|mo[cç][aã]o') { $d.categoria = 'Resoluções e deliberações' }
    }
}
# o estudo do perfil de usuários é estadual: entra também uma vez nos documentos gerais
$perfil = $docs | Where-Object { $_.titulo -match '(?i)perfil de usu' -and $_.arquivo -like 'midia/*' } | Select-Object -First 1
if ($perfil) { [void]$docs.Add([ordered]@{ titulo = 'Estudo do perfil dos usuários de recursos hídricos do Tocantins'; descricao = ''; comite = 'cbhto'; categoria = 'Publicações'; ano = $perfil.ano; arquivo = $perfil.arquivo }) }
Write-Host "  $($docs.Count) documentos"

# ======================= GRAVAR JS =======================
function Gravar($nome, $var, $obj) {
    $json = ConvertTo-Json -InputObject $obj -Depth 8 -Compress
    [IO.File]::WriteAllText((Join-Path $js $nome), "/* Gerado por gerar-conteudo.ps1 em $(Get-Date -Format 'dd/MM/yyyy HH:mm') */`nwindow.$var = $json;`n", $utf8)
}
Gravar 'noticias.js' 'NOTICIAS' $listaN
Gravar 'galerias.js' 'GALERIAS' $listaG
Gravar 'documentos.js' 'DOCUMENTOS' @($docs)
Gravar 'conteudo.js' 'CONTEUDO' $conteudo

# ======================= COPIAR MÍDIA =======================
Write-Host "Copiando $($script:usados.Count) arquivos para midia/ ..."
Add-Type -AssemblyName System.Drawing
$jpeg = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object Drawing.Imaging.EncoderParameter([Drawing.Imaging.Encoder]::Quality, [long]80)
$n = 0
foreach ($rel in $script:usados.Keys) {
    $orig = Join-Path $arq ($rel -replace '/', '\')
    $dest = Join-Path $midia ($rel.Substring(7) -replace '/', '\')
    if ((Test-Path -LiteralPath $dest) -and (Get-Item -LiteralPath $dest).LastWriteTime -ge (Get-Item -LiteralPath $orig).LastWriteTime) { continue }
    New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
    $fi = Get-Item -LiteralPath $orig
    if ($fi.Extension -match '^\.jpe?g$' -and $fi.Length -gt 350KB) {
        try {
            $img = [Drawing.Image]::FromFile($orig)
            $w = $img.Width; $hh = $img.Height; $esc = [Math]::Min(1.0, 1600 / [Math]::Max($w, $hh))
            $bmp = New-Object Drawing.Bitmap([int]($w * $esc), [int]($hh * $esc))
            $g = [Drawing.Graphics]::FromImage($bmp); $g.InterpolationMode = 'HighQualityBicubic'
            $g.DrawImage($img, 0, 0, $bmp.Width, $bmp.Height); $g.Dispose(); $img.Dispose()
            $bmp.Save($dest, $jpeg, $ep); $bmp.Dispose(); $n++
            continue
        } catch { }
    }
    Copy-Item -LiteralPath $orig -Destination $dest -Force
}
Write-Host "  $n fotos reduzidas"
if ($script:faltando.Count) {
    $script:faltando.Keys | Sort-Object | Set-Content -Encoding UTF8 (Join-Path $site 'arquivos-faltando.txt')
    Write-Host "  $($script:faltando.Count) arquivos citados não estão no backup (lista em arquivos-faltando.txt)"
}
$tam = (Get-ChildItem -LiteralPath $midia -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
Write-Host ("Pronto. Pasta midia: {0:N0} MB" -f $tam)
