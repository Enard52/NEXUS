# PowerShell Script to Replace CDN References with Local Paths
# Usage: .\replace-cdn.ps1

param (
    [string]$rootPath = (Split-Path -Parent $PSScriptRoot)
)

# Files to process (all stitch-*.html in root and www)
$files = Get-ChildItem -Path $rootPath -Filter "stitch-*.html" -File -Recurse

Write-Host "Found $($files.Count) HTML files to process..." -ForegroundColor Cyan

$counter = 0
$modified = 0

foreach ($file in $files) {
    $counter++
    Write-Progress -Activity "Processing HTML files" -Status "Processing $($file.FullName)..." -PercentComplete ($counter / $files.Count * 100)
    
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # Replace Tailwind CSS CDN
        $content = $content -replace '<script src="https://cdn\.tailwindcss\.com\?plugins=forms,container-queries"></script>', '<link href="css/tailwind.css" rel="stylesheet"/>'
        $content = $content -replace '<script src="https://cdn\.tailwindcss\.com\?plugins=forms"></script>', '<link href="css/tailwind.css" rel="stylesheet"/>'
        $content = $content -replace '<script src="https://cdn\.tailwindcss\.com"></script>', '<link href="css/tailwind.css" rel="stylesheet"/>'
        
        # Replace Google Fonts Inter
        $content = $content -replace '<link href="https://fonts\.googleapis\.com/css2\?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">', '<link href="fonts/inter/inter.css" rel="stylesheet"/>'
        $content = $content -replace '<link href="https://fonts\.googleapis\.com/css2\?family=Inter:wght@400;500;600;700,800&display=swap" rel="stylesheet">', '<link href="fonts/inter/inter.css" rel="stylesheet"/>'
        $content = $content -replace '<link href="https://fonts\.googleapis\.com/css2\?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">', '<link href="fonts/inter/inter.css" rel="stylesheet"/>'
        $content = $content -replace '@import url(''https://fonts\.googleapis\.com/css2\?family=Inter:wght@400;500;600;700;800&display=swap'');', ''
        
        # Replace Lucide Icons CDN
        $content = $content -replace '<script src="https://unpkg\.com/lucide@latest"></script>', '<script src="js/lucide.js"></script>'
        
        # Replace Iconify (optional - keep for now)
        # $content = $content -replace '<script src="https://code\.iconify\.design/iconify-icon/1\.0\.7/iconify-icon\.min\.js"></script>', '<script src="js/iconify.js"></script>'
        
        # Only write if content changed
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            $modified++
            Write-Host "  Modified: $($file.Name)" -ForegroundColor Green
        }
    } catch {
        Write-Warning "Error processing $($file.FullName): $_"
    }
}

Write-Host "" -ForegroundColor Cyan
Write-Host "Completed! Modified $modified out of $($files.Count) files." -ForegroundColor Green
