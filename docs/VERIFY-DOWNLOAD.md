# Verify your download / İndirdiğini doğrula

Every installer is published in [Enard52/nexus-releases](https://github.com/Enard52/nexus-releases) with a
SHA-256 checksum file (`SHA256SUMS-Windows.txt`, `SHA256SUMS-Linux.txt`, `SHA256SUMS-Android.txt`, iOS has its own).
Android builds also carry a build-provenance attestation (Sigstore, keyless).

## Check the SHA-256

Windows (PowerShell):

```powershell
(Get-FileHash .\NEXUS-Setup.exe -Algorithm SHA256).Hash
```

Linux / macOS:

```bash
sha256sum NEXUS-linux.AppImage
```

Compare the result with the line for your file in the checksum file. If they differ, delete the file and download again.

## Check the build provenance (Android, optional)

With the [GitHub CLI](https://cli.github.com):

```bash
gh attestation verify NEXUS-Android.apk --repo Enard52/NEXUS
```

## Windows SmartScreen

Windows builds are not signed with a paid code-signing certificate yet, so SmartScreen may warn on first run.
Checking the SHA-256 above is the way to be sure the file is the one we published. See the code-signing page on the site.

---

## Türkçe

Her kurulum dosyası [Enard52/nexus-releases](https://github.com/Enard52/nexus-releases) deposunda SHA-256 sağlama dosyasıyla yayımlanır.
Android sürümlerinde ayrıca anahtarsız (Sigstore) kaynak kanıtı bulunur.

- **Windows:** `(Get-FileHash .\NEXUS-Setup.exe -Algorithm SHA256).Hash`
- **Linux / macOS:** `sha256sum NEXUS-linux.AppImage`
- Çıkan değeri sağlama dosyasındaki satırla karşılaştır. Farklıysa dosyayı sil ve yeniden indir.
- **Android kaynak kanıtı (isteğe bağlı):** `gh attestation verify NEXUS-Android.apk --repo Enard52/NEXUS`
- Windows sürümleri henüz ücretli bir kod imzalama sertifikasıyla imzalı değildir; SmartScreen uyarı verebilir. Dosyanın bizim yayımladığımız dosya olduğundan emin olmak için yukarıdaki SHA-256 kontrolünü kullan.
