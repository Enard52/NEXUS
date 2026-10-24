@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo NEXUS - fotograflari indiriyor (bir kez calistirmak yeterli)
if not exist "assets\photos" mkdir "assets\photos"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ids='1489599849927-2ee91cede3ba','1505693416388-ac5ce068fe85','1513694203232-719a280e022f','1518770660439-4636190af475','1524758631624-e2822e304c36','1558002038-1055907df827','1565814329452-e1efa11c5b89','1586023492125-27b2c045efd7','1618221195710-dd6b41faaea6'; $hata=0; foreach($i in $ids){ $f='assets/photos/photo-'+$i+'.jpg'; if(Test-Path $f){ Write-Host 'var  ' $f; continue }; try{ Invoke-WebRequest -UseBasicParsing -Uri ('https://images.unsplash.com/photo-'+$i+'?auto=format&fit=crop&w=800&q=80') -OutFile $f; Write-Host 'indi ' $f } catch { $hata++; Write-Host 'HATA ' $i } }; if($hata -eq 0){ Write-Host 'Tum fotograflar hazir.' } else { Write-Host ($hata.ToString()+' fotograf indirilemedi; internetini kontrol edip tekrar calistir.') }"
echo.
echo Bitti. Bu pencereyi kapatabilirsin.
pause
