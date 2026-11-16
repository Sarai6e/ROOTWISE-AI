param(
    [Parameter(Mandatory = $true)][string]$Pptx,
    [Parameter(Mandatory = $true)][string]$OutDir
)
$ErrorActionPreference = "Stop"
$resolved = (Resolve-Path $Pptx).Path
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
$out = (Resolve-Path $OutDir).Path

$app = New-Object -ComObject PowerPoint.Application
try {
    $deck = $app.Presentations.Open($resolved, $true, $false, $false)
    foreach ($slide in $deck.Slides) {
        $n = "{0:D2}" -f $slide.SlideIndex
        $target = Join-Path $out "slide-$n.png"
        $slide.Export($target, "PNG", 1920, 1080)
        Write-Output "exported $target"
    }
    $deck.Close()
}
finally {
    $app.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}
