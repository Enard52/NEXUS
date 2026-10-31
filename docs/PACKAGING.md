# Free distribution channels (owner applies)

All of these cost nothing. Each needs an account/PR from the owner; the repository only prepares the inputs.

| Channel | Status | How |
| --- | --- | --- |
| GitHub Releases | live | `desktop-release.yml`, `android-release.yml` |
| winget | prepared | `node scripts/gen-winget-manifest.mjs <version>` writes `manifests/e/Enard52/NEXUS/<version>/` from the **published** SHA-256; open a PR to `microsoft/winget-pkgs` with those files. The installer is unsigned, so SmartScreen may warn. |
| Flathub | not started | Needs a flatpak manifest built from the Linux AppImage/deb plus metainfo; submit via a PR to `flathub/flathub`. Review is manual and takes time. |
| F-Droid | not started | Needs a reproducible, source-built APK and `fdroiddata` metadata. Firebase push (a proprietary dependency) must be absent in that build flavour. |
| iOS | live (sideload) | Web app + AltStore: [IOS-BUILD.md](IOS-BUILD.md). The App Store needs a paid Apple account and is skipped. |

Paid options kept ready for a future budget (not used now): Google Play ($25 one time), Microsoft Store, paid Windows code-signing
certificate (SignPath Foundation offers free signing for open-source projects; see the code-signing page), Apple Developer ($99/year).
