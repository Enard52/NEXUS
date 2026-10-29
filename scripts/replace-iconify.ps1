# PowerShell Script to Remove Iconify CDN References
param (
    [string]$rootPath = (Split-Path -Parent $PSScriptRoot)
)

$files = Get-ChildItem -Path $rootPath -Filter "nexus-*.html" -File -Recurse | 
         Where-Object { 
             $_.FullName -notmatch '\\backup_html\\' -and 
             $_.FullName -notmatch '\\mobile-app\\' -and 
             $_.FullName -notmatch '\\www_backup\\' 
         }

Write-Host "Found $($files.Count) HTML files to process..." -ForegroundColor Cyan

$modified = 0

foreach ($file in $files) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # Remove Iconify CDN
        $iconifyPattern = '<script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>'
        if ($content -like "*$iconifyPattern*") {
            $content = $content -replace $iconifyPattern, ''
        }
        
        # Remove Google Fonts preconnect
        $preconnect1 = '<link rel="preconnect" href="https://fonts.googleapis.com">'
        $preconnect2 = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        if ($content -like "*$preconnect1*") {
            $content = $content -replace $preconnect1, ''
        }
        if ($content -like "*$preconnect2*") {
            $content = $content -replace $preconnect2, ''
        }
        
        # Clean up multiple newlines
        $content = $content -replace "`n`n`n+", "`n`n"
        
        if ($content -ne $originalContent) {
            # PS 5.1 writes a BOM (U+FEFF) with `Set-Content -Encoding UTF8`; a BOM in a
            # workflow YAML makes GitHub fail to start the job. BOM-less UTF-8:
            [System.IO.File]::WriteAllText($file.FullName, $content, (New-Object System.Text.UTF8Encoding($false)))
            $modified++
            Write-Host "  Modified: $($file.Name)" -ForegroundColor Green
        }
    } catch {
        Write-Warning "Error processing $($file.FullName): $_"
    }
}

Write-Host "" -ForegroundColor Cyan
Write-Host "Completed! Modified $modified out of $($files.Count) files." -ForegroundColor Green
