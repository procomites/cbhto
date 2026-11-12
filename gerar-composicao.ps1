# ===========================================================================
#  Lê a planilha "COMPOSIÇÃO COMITÊS - Atualização 2026.xlsx" (pasta PROCOMITÊS)
#  e gera assets/js/composicao.js (diretoria, e-mail e membros de cada comitê).
#  Para atualizar o site: corrija a planilha e rode este script de novo
#  (botão direito > Executar com o PowerShell).
# ===========================================================================
param([string]$Planilha = (Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) 'COMPOSIÇÃO COMITÊS - Atualização 2026.xlsx'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$base = Split-Path -Parent $MyInvocation.MyCommand.Path

# Aba da planilha -> comitê do site
$abas = @{ 'COCO E CAIAPÓ' = 'cbhrcc'; 'LAGO DE PALMAS' = 'cbhlp'; 'FORMOSO' = 'cbhrf'; 'MANUEL ALVES' = 'cbhrma'
           'LONTRA E CORDA' = 'cbhlc'; 'RIO PALMA' = 'cbhrp'; 'STº ANTONIO E STª TEREZA' = 'cbhsast' }
# Correções de grafia conferidas em outras fontes (planilha -> site)
$correcoes = @{ 'Guilherme Fiezzi' = 'Guilherme Tiezzi' }

function Limpa($s) { if ($null -eq $s) { return '' }; $t = ([string]$s -replace '\s+', ' ').Trim(); foreach ($k in $correcoes.Keys) { $t = $t.Replace($k, $correcoes[$k]) }; $t }
function J($s) { '"' + ((Limpa $s) -replace '\\', '\\' -replace '"', '\"') + '"' }

$tmp = Join-Path $env:TEMP ('composicao_' + [guid]::NewGuid().ToString('N') + '.xlsx')
Copy-Item -LiteralPath $Planilha $tmp   # cópia: funciona mesmo com a planilha aberta no Excel
$z = [IO.Compression.ZipFile]::OpenRead($tmp)
function X($n) { $e = $z.GetEntry($n); if (-not $e) { return $null }; $r = New-Object IO.StreamReader($e.Open()); $t = $r.ReadToEnd(); $r.Close(); [xml]$t }
$ss = @(); $sx = X 'xl/sharedStrings.xml'; if ($sx) { foreach ($si in $sx.sst.si) { $ss += $si.InnerText } }
$wb = X 'xl/workbook.xml'; $rels = X 'xl/_rels/workbook.xml.rels'
$saida = New-Object System.Collections.ArrayList

foreach ($sh in $wb.workbook.sheets.sheet) {
  $nomeAba = ([string]$sh.name).Trim()
  $id = $abas[$nomeAba]; if (-not $id) { Write-Host "  (aba ignorada: $nomeAba)"; continue }
  $rid = $sh.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
  $tgt = ($rels.Relationships.Relationship | Where-Object Id -eq $rid).Target
  $x = X ('xl/' + $tgt.TrimStart('/').Replace('xl/', ''))
  $cel = @{}
  foreach ($row in $x.worksheet.sheetData.row) { foreach ($c in $row.c) { $v = $c.v; if ($c.t -eq 's') { $v = $ss[[int]$v] } elseif ($c.t -eq 'inlineStr') { $v = $c.is.InnerText }; if ($v) { $cel[$c.r] = [string]$v } } }
  $titulo = Limpa ($cel['C1'] + ' ' + $cel['B1'])
  $mandato = if ($titulo -match '(\d{4})\s*[-–]\s*(\d{4})') { "$($matches[1])–$($matches[2])" } else { '' }
  $email = Limpa $cel['E8']
  $dir = @()
  foreach ($r in 8, 9, 10) { $nome = Limpa $cel["C$r"]; if ($nome) {
      $cargo = switch -Regex ($cel["B$r"]) { '^Vice' { 'Vice-presidente' } '^Secret' { 'Secretário(a) executivo(a)' } default { 'Presidente' } }
      $dir += '{"cargo":' + (J $cargo) + ',"nome":' + (J $nome) + ',"instituicao":' + (J $cel["D$r"]) + '}' } }
  $membros = @(); $cad = ''
  for ($r = 13; $r -le 400; $r++) {
    $vaga = Limpa $cel["B$r"]; if (-not $vaga) { continue }
    if ($cel["A$r"]) { $cad = Limpa $cel["A$r"] }
    $seg = Limpa $cel["C$r"]; $inst = Limpa $cel["D$r"]; $rep = Limpa $cel["E$r"]
    if ($seg -match '^VAGA$') { $seg = ''; $inst = '' }
    if ($seg -match '^Usu') { $seg = 'Usuários de Água' }
    $membros += '{"cadeira":' + (J $cad) + ',"vaga":' + (J $vaga) + ',"segmento":' + (J $seg) + ',"instituicao":' + (J $inst) + ',"representante":' + (J $rep) + '}'
  }
  $tot = '{"poder":' + [int]$cel['C4'] + ',"sociedade":' + [int]$cel['C5'] + ',"usuarios":' + [int]$cel['C6'] + ',"total":' + [int]$cel['E5'] + '}'
  [void]$saida.Add("  `"$id`": {`"mandato`":" + (J $mandato) + ',"email":' + (J $email) + ',"totais":' + $tot + ",`n    `"diretoria`":[" + ($dir -join ',') + "],`n    `"membros`":[`n      " + ($membros -join ",`n      ") + "]}")
  Write-Host ("  {0,-8} {1,3} vagas  diretoria: {2}  e-mail: {3}" -f $id, $membros.Count, $dir.Count, $email)
}
$z.Dispose(); Remove-Item $tmp -Force
$js = "/* Gerado por gerar-composicao.ps1 em $(Get-Date -Format 'dd/MM/yyyy HH:mm') a partir da planilha de composição dos comitês. */`nwindow.COMPOSICAO = {`n" + ($saida -join ",`n") + "`n};`n"
[IO.File]::WriteAllText((Join-Path $base 'assets\js\composicao.js'), $js, (New-Object Text.UTF8Encoding($false)))
Write-Host 'Pronto: assets\js\composicao.js'
