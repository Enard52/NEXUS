Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\ensar\AppData\Roaming\Qoder\SharedClientCache\cache\images\task-879\ChatGPT Image 31 Tem 2026 18_07_21-17ce89c3.png'
$outDir = Join-Path $PSScriptRoot '_crop'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$slugs = @(
  'led-strip','light-switch','power-strip','wall-switch',
  'motion-sensor','door-sensor','temp-humidity','water-leak',
  'air-conditioner','humidifier','air-quality','refrigerator'
)
$cols = 4
$rows = 3

$img = [System.Drawing.Image]::FromFile($src)
Write-Host ("SRC {0}x{1}" -f $img.Width, $img.Height)
$cellW = [int][Math]::Floor($img.Width / $cols)
$cellH = [int][Math]::Floor($img.Height / $rows)

# JPEG encoder @ quality 92
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]92)

for ($i = 0; $i -lt $slugs.Count; $i++) {
  $r = [int][Math]::Floor($i / $cols)
  $c = $i % $cols
  $x = $c * $cellW
  $y = $r * $cellH
  $rect = New-Object System.Drawing.Rectangle($x, $y, $cellW, $cellH)
  $bmp = New-Object System.Drawing.Bitmap($cellW, $cellH)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $cellW, $cellH)), $rect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $out = Join-Path $outDir ($slugs[$i] + '.jpg')
  $bmp.Save($out, $enc, $ep)
  $bmp.Dispose()
  Write-Host ("OK  {0}  ({1},{2}) {3}x{4}" -f $slugs[$i], $x, $y, $cellW, $cellH)
}
$img.Dispose()
Write-Host 'DONE'
