param(
    [Parameter(Mandatory = $true)][string]$OutDir
)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
$out = (Resolve-Path $OutDir).Path

# Each line is tuned to the timing marks in the NASA submission guide:
# 0:00 intro, 0:02 challenge, 0:05 name, 0:10 idea, 0:20 future.
$lines = @(
    @{ id = "01-intro";     rate = 3; text = "We are Team ROOTWISE AI." },
    @{ id = "02-challenge"; rate = 3; text = "Farmers must choose what to plant as the climate shifts." },
    @{ id = "03-name";      rate = 1; text = "ROOTWISE AI. Grow decisions, harvest the future." },
    @{ id = "04-idea";      rate = 1; text = "A farmer draws a plot, adds soil data and compares crops. NASA satellite climate explains every answer." },
    @{ id = "05-future";    rate = 1; text = "It works offline, in five languages. Healthier soil, resilient farms, on Earth and beyond." }
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Zira Desktop")
$synth.Volume = 100

foreach ($line in $lines) {
    $synth.Rate = $line.rate
    $path = Join-Path $out ($line.id + ".wav")
    $fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(44100, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
    $synth.SetOutputToWaveFile($path, $fmt)
    $synth.Speak($line.text)
    $synth.SetOutputToNull()
    Write-Output ("{0}  rate={1}" -f $line.id, $line.rate)
}
$synth.Dispose()
