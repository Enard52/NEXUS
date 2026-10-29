# NEXUS — son adımlar (masaüstünden çift tıkla: NEXUS-son-adimlar.cmd)
# 1) Kökteki tek seferlik yama betiklerini scripts\archive'e taşır (silmez)
# 2) www\ içindeki uygulamaya ait olmayan dosyaları scripts\archive\www-arsiv'e taşır (silmez)
#    -> Capacitor www'nin tamamını telefona koyduğu için APK küçülür, iç dosyalar uygulamaya girmez
# 3) Güncel uygulama dosyalarını www'ye kopyalar ve Android projesini senkronlar (npx cap sync)
$ErrorActionPreference = "Continue"
Set-Location (Split-Path $PSScriptRoot -Parent)
$root = Get-Location
$log = Join-Path $root "scripts\son-adimlar.log"
Start-Transcript -Path $log -Force | Out-Null

$archive = "scripts\archive"
New-Item -ItemType Directory -Force -Path $archive | Out-Null

# --- 1) Kök: eski yama betikleri ---
$patterns = @("fix_*.cjs","fix.cjs","update_*.cjs","inject_*.cjs","scratch_*.cjs","scratch_*.txt","sync_*.cjs","add_*.cjs","populate_*.cjs","remove_*.cjs","replace_*.cjs","rewrite_*.cjs","rebuild_*.cjs","restore_*.cjs","revert_*.cjs","build_*catalog.cjs","create_integrations.cjs","map_images.cjs","regex_replace.cjs","reorder_chat_buttons.cjs","scrape_unsplash.cjs","smart_fixes.cjs","clean_fix.cjs","apply_logic.cjs","enable_static_card_hiding.cjs","fetch_test*.cjs","test_ids.cjs","temp_*.py","tmp_*.py","temp_assets.txt","out.txt","non_utf8.txt","words.txt")
foreach ($p in $patterns) {
  Get-ChildItem -Path . -Filter $p -File -ErrorAction SilentlyContinue | ForEach-Object {
    Move-Item -LiteralPath $_.FullName -Destination $archive -Force
    Write-Host "arşivlendi: $($_.Name)"
  }
}
Get-ChildItem -Path . -File | Where-Object { $_.Name -like "www && cp*" } | ForEach-Object {
  Move-Item -LiteralPath $_.FullName -Destination (Join-Path $archive ("broken-" + [guid]::NewGuid().ToString("N").Substring(0,8) + ".html")) -Force
  Write-Host "bozuk adlı dosya arşivlendi"
}

# --- 2) www: yalnızca uygulama dosyaları kalır ---
$keepDirs  = @("css","fonts","js","assets","icons","leaflet","public")
$keepFiles = @("index.html","logos.json","logo.png","siri-logo.png","favicon.ico","ai-fab.js","auth.js","cloud-sync.js","cloud-config.js","data.js","desktop.js","device-controls.js","lan-connectors.js","setup-codes.js","sheet-gestures.js","smart-card-detail-state.js","smart-scene-page.js","supported-devices.js","theme.js","command-palette.js","event-bridge.js")
$wwwArchive = Join-Path $archive "www-arsiv"
New-Item -ItemType Directory -Force -Path $wwwArchive | Out-Null
if (Test-Path "www") {
  Get-ChildItem -LiteralPath "www" -Force | ForEach-Object {
    $name = $_.Name
    $keep = $false
    if ($_.PSIsContainer) { $keep = $keepDirs -contains $name }
    else { $keep = ($keepFiles -contains $name) -or ($name -like "nexus-*.html") }
    if (-not $keep) {
      Move-Item -LiteralPath $_.FullName -Destination (Join-Path $wwwArchive $name) -Force
      Write-Host "www'den taşındı: $name"
    }
  }
}

# --- 3) Güncel dosyalar + Android senkronu ---
Write-Host "Uygulama dosyaları www'ye kopyalanıyor..."
node scripts\sync-www.mjs
if (-not (Test-Path "node_modules\@capacitor\cli")) {
  Write-Host "Bagimliliklar kuruluyor (pnpm install, ilk seferde birkac dakika surebilir)..."
  & cmd /c "npx -y pnpm@10.26.1 install 2>&1" | ForEach-Object { Write-Host $_ }
}
Write-Host "Capacitor senkronizasyonu (Android)..."
& cmd /c "npx cap sync android 2>&1" | ForEach-Object { Write-Host $_ }
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: Android senkronu basarisiz (kod $LASTEXITCODE)" } else { Write-Host "Android senkronu tamam." }
Write-Host ""
Write-Host "Bitti. Ayrıntılar: scripts\son-adimlar.log"
Stop-Transcript | Out-Null
