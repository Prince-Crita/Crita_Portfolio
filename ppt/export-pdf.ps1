# Exports the deck to a slides PDF through Microsoft PowerPoint — a fail-safe for
# presenting on machines without PowerPoint or without the Satoshi font.
# Usage: powershell -ExecutionPolicy Bypass -File ppt/export-pdf.ps1 [deck.pptx]
param([string]$Deck = (Join-Path $PSScriptRoot 'Crita-Portfolio-2026.pptx'))
$ErrorActionPreference = 'Stop'
$path = (Resolve-Path $Deck).Path
$pdf = [System.IO.Path]::ChangeExtension($path, '.slides.pdf') -replace '\.slides\.pdf$', '-Slides.pdf'
$app = New-Object -ComObject PowerPoint.Application
try {
  $pres = $app.Presentations.Open($path, -1, 0, 0)
  $pres.SaveAs($pdf, 32)   # ppSaveAsPDF
  $pres.Close()
} finally {
  $app.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}
"Slides PDF: $pdf ($([math]::Round((Get-Item $pdf).Length / 1MB, 1)) MB)"
