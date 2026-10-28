# NEXUS otomasyon kurulumu — YALNIZCA BİR KEZ çalıştırılır.
# GitHub Actions'a gizli anahtarları yükler; sonrasında web, site ve Android sürümleri kendiliğinden yayınlanır.
# Kullanım (PowerShell):  .\scripts\setup-automation.ps1
# Gerekenler: GitHub CLI giriş yapmış olmalı (gh auth status).
$ErrorActionPreference = "Stop"
$repo = "Enard52/NEXUS"
$ks = Join-Path $env:USERPROFILE "NEXUS-signing"

Write-Host "1/3 Android imza anahtarı yükleniyor..."
$props = @{}
Get-Content (Join-Path $ks "keystore.properties") | ForEach-Object { if ($_ -match "^(\w+)=(.*)$") { $props[$Matches[1]] = $Matches[2] } }
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $ks "nexus-release.jks"))) | gh secret set ANDROID_KEYSTORE_B64 --repo $repo
$props["storePassword"] | gh secret set ANDROID_KEYSTORE_PASSWORD --repo $repo
$props["keyAlias"] | gh secret set ANDROID_KEY_ALIAS --repo $repo
$props["keyPassword"] | gh secret set ANDROID_KEY_PASSWORD --repo $repo

Write-Host "2/3 Cloudflare API anahtarı (web yayını). Oluşturma: https://dash.cloudflare.com/profile/api-tokens -> 'Edit Cloudflare Workers' şablonu ya da Pages:Edit izni"
$cf = Read-Host "Cloudflare API token (boş bırakırsan web otomatik yayını kurulmaz)" -AsSecureString
$cfPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($cf))
if ($cfPlain) { $cfPlain | gh secret set CLOUDFLARE_API_TOKEN --repo $repo }

Write-Host "3/3 Site deposu anahtarı (tanıtım sitesi). Oluşturma: https://github.com/settings/personal-access-tokens/new -> yalnızca Enard52.github.io deposu, Contents: Read and write"
$st = Read-Host "Site deposu token (boş bırakırsan site otomatik yayını kurulmaz)" -AsSecureString
$stPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($st))
if ($stPlain) { $stPlain | gh secret set SITE_REPO_TOKEN --repo $repo }

Write-Host "Tamam. Kurulu anahtarlar:"; gh secret list --repo $repo
