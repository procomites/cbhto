# Abre o site no navegador sem precisar de hospedagem: http://localhost:8088
# Uso: clique com o botão direito > "Executar com o PowerShell". Feche a janela para parar.
param([int]$Porta = 8088)
$raiz = $PSScriptRoot
$tipos = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.svg'='image/svg+xml'; '.webp'='image/webp'; '.gif'='image/gif'; '.pdf'='application/pdf'; '.json'='application/json' }
$srv = New-Object System.Net.HttpListener
$srv.Prefixes.Add("http://localhost:$Porta/")
$srv.Start()
Write-Host "Site disponível em http://localhost:$Porta/  (feche esta janela para parar)"
if (-not $env:SEM_NAVEGADOR) { Start-Process "http://localhost:$Porta/" }
while ($srv.IsListening) {
    $ctx = $srv.GetContext()
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if (-not $rel) { $rel = 'index.html' }
    $arq = Join-Path $raiz ($rel -replace '/', '\')
    try {
        if ((Test-Path -LiteralPath $arq -PathType Leaf) -and ([IO.Path]::GetFullPath($arq).StartsWith($raiz))) {
            $b = [IO.File]::ReadAllBytes($arq)
            $t = $tipos[[IO.Path]::GetExtension($arq).ToLower()]; if (-not $t) { $t = 'application/octet-stream' }
            $ctx.Response.ContentType = $t
            $ctx.Response.OutputStream.Write($b, 0, $b.Length)
        } else { $ctx.Response.StatusCode = 404 }
    } catch {}
    $ctx.Response.Close()
}
