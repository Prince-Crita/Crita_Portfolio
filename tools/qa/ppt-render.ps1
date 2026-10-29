# Renders every slide of a .pptx to PNG through Microsoft PowerPoint (true rendering, real fonts).
# Usage: powershell -File ppt-render.ps1 <deck.pptx> <outDir> [width]
param([string]$Deck, [string]$Out, [int]$Width = 1600)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $Out | Out-Null
$app = New-Object -ComObject PowerPoint.Application
try {
  $pres = $app.Presentations.Open((Resolve-Path $Deck).Path, -1, 0, 0)   # ReadOnly, Untitled=false, WithWindow=false
  $h = [int]($Width * 9 / 16)
  foreach ($slide in $pres.Slides) {
    $file = Join-Path $Out ("slide-{0:D2}.png" -f $slide.SlideIndex)
    $slide.Export($file, 'PNG', $Width, $h)
  }
  "rendered $($pres.Slides.Count) slides"
  $pres.Close()
} finally {
  $app.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}
