# Building NEXUS for your own iPhone (free Apple ID)

NEXUS does not use a paid Apple Developer account and will not be on the App Store. The Capacitor iOS shell lives in
`ios/`, so anyone with a Mac can build it for their own iPhone with a free Apple ID.

## Easiest: the unsigned IPA

When a release has `NEXUS-ios-unsigned.ipa` attached (built by the manual `ios-unsigned.yml` workflow), install it with
[AltStore](https://altstore.io) or [Sideloadly](https://sideloadly.io) using your free Apple ID. The tool signs it for
your device. This path has not been verified on a real iPhone yet; please report what you see.

## Build it yourself

Prerequisites: a Mac, Xcode (current release), Node 22, and an iPhone connected by cable (or Wi-Fi debugging).

```bash
npm install
npm run build:full        # builds web assets and syncs them into ios/App/App/public
npx cap sync ios
open ios/App/App.xcworkspace   # or ios/App/App.xcodeproj if no workspace exists
```

In Xcode: select the **App** target > **Signing & Capabilities** > tick *Automatically manage signing* > choose your
**Personal Team**. Change the bundle identifier (for example `com.yourname.nexus`) because `com.nexus.app` is taken for
free accounts. Pick your iPhone and press Run. On the phone: Settings > General > VPN & Device Management > trust your
developer profile.

## Limits of a free Apple ID

- The app expires after **7 days**. Re-run from Xcode (or let AltStore refresh it) to re-sign it.
- At most 3 apps with a free Personal Team on a device.
- **Push notifications are not available on iOS**: APNs needs a paid account. Notifications while the app is open and
  the local automation features work; closed-app push does not.
- The home hub (the desktop app) still does the always-on work; the iPhone is a client.