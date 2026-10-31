# Reaching your home when you are away (free VPN)

NEXUS has no cloud and no relay server. The app (desktop or phone) sends commands **directly to each
device's local IP address**. Away from home those addresses are unreachable, so the only way to
control the home is to put your phone or laptop **on the home network through a VPN**. After that NEXUS
behaves as it does at home: same device addresses, no extra setting.

> Status: this guide is written from the NEXUS source code and the public Tailscale and WireGuard
> documentation. The maintainers have not yet tested it on every setup or with every device. If you
> try it, please tell us what worked in an issue so we can correct this page.

## How NEXUS reaches devices (why a VPN is needed, and what it must provide)

- There is no "hub" server that the phone connects to. The desktop app and the phone app each talk to
  the devices themselves ([ARCHITECTURE.md](ARCHITECTURE.md)).
- **Local-address guard.** Commands are only sent to local addresses: `localhost`, `10.x.x.x`,
  `172.16–31.x.x`, `192.168.x.x`, `169.254.x.x`, IPv6 `fc00::/7` / `fe80::/10`, and names ending in
  `.local` (the app layer also accepts `.lan`, `.home`, `.internal`, `.home.arpa`). Anything else
  is refused with a "not a local network address" error. The desktop app enforces the same rule
  again on its side (`isPrivateHost` in `desktop/main.cjs`), so a public address can never be
  reached by a command.
- **Consequence for VPNs:** the VPN has to carry your **home subnet** (e.g. `192.168.1.0/24`) so the
  devices' existing local IPs keep working (a *subnet router* / site-to-site style setup). Reaching
  devices by a VPN-internal address does not work: Tailscale's `100.x.y.z` addresses and `*.ts.net`
  names are not in the allowed list above and will be refused.

## Option A — Tailscale subnet router (easiest)

You need one always-on machine at home (a Raspberry Pi, a mini PC, a NAS, or the PC that runs NEXUS).

1. Install Tailscale on that machine and sign in. Tailscale currently has a free plan for personal
   use; check [their pricing page](https://tailscale.com/pricing) for the current limits.
2. Advertise your home network from that machine, replacing the range with your own
   (for example `192.168.1.0/24`):
   ```
   tailscale up --advertise-routes=192.168.1.0/24
   ```
   On Linux, also turn on IP forwarding as described in
   [Tailscale's subnet router guide](https://tailscale.com/kb/1019/subnets).
3. In the Tailscale admin console, open the machine and **approve the advertised route**.
4. Install Tailscale on your phone and sign in with the same account. Leave it connected. (If your
   phone is on a different network that also uses `192.168.1.x`, the ranges collide; change your home
   router's range to something less common, e.g. `192.168.77.0/24`.)
5. Open NEXUS. Devices paired at home are reached through their `192.168.x.y` addresses, which now
   route through the VPN.

Self-hosting the coordination server with [Headscale](https://github.com/juanfont/headscale) is an
alternative if you do not want a Tailscale account; the subnet-route idea is the same.

## Option B — WireGuard on your router or a home machine

If your router supports WireGuard (OpenWrt, many Mikrotik, UniFi, pfSense/OPNsense, some Fritz!Box
setups) or you can run [WireGuard](https://www.wireguard.com/) on an always-on home machine:

1. Create a WireGuard server and a client profile for your phone.
2. Put your **home subnet** in the phone profile's `AllowedIPs` (e.g. `192.168.1.0/24`) so only home traffic
   goes through the tunnel.
3. Connect the phone, then open NEXUS.

The phone must be able to reach the server from outside: a public IP (or a free dynamic-DNS name) and
one forwarded **UDP** port to the WireGuard server. If your provider puts you behind carrier-grade NAT
(no public IPv4), port forwarding is impossible; use Option A, which works through NAT without
opening any port.

## What stays on at home

- The VPN machine (Option A/B) must be powered and online.
- The **desktop app is not required for the phone** to control HTTP devices (the phone talks to them
  itself), but anything that lives in the desktop app does need it running, for example the HomeKit bridge.

## What does not work remotely (honest limits)

- **Remote address (optional).** Settings → Remote Access Address lets you give a paired device or hub (Hue bridge,
  Home Assistant) a second address, for example a Tailscale 100.x address or a forwarded port. NEXUS tries the local
  address first and uses the remote one only when the local one does not answer; if neither answers it reports the failure.
  Only private/VPN ranges (including 100.64.0.0/10) are accepted, never public addresses. The mapping stays on the device
  and is not synced or backed up. Not verified against a real VPN yet.
- **UDP/TCP devices only work from the desktop app.** WiZ, LIFX and Govee (UDP) and Kasa, Yeelight and local Tuya (TCP) go
  through the desktop app's network bridge; the phone app has HTTP only and reports these as
  unsupported. Remote control of such devices from the phone is therefore not possible, VPN or not.
- **Discovery and Wake-on-LAN** rely on local broadcasts, which do not cross a routed VPN. Pair new
  devices while at home.
- **The browser/PWA is not a reliable remote client**: it can only reach devices that allow cross-origin
  requests, and browsers block plain-`http` device calls from `https` pages. Use the Android app or the
  desktop app.
- Devices behind a Philips Hue bridge or Home Assistant are reached through that hub's local address; the
  same VPN route covers them.
- Cloud-only devices are out of scope: NEXUS only controls what it can reach on the local network.

## Safety

- Never expose a device or NEXUS directly to the internet with port forwarding. Use the VPN.
- Keep the VPN account protected with two-factor authentication; with WireGuard, keep private keys
  private and give each phone its own key so you can revoke one.
- Advertise only your home subnet, not a default route, unless you also want all phone traffic
  to go home.
- A subnet route gives the phone access to **every** device on the home network, not only NEXUS ones.
  Use Tailscale ACLs or router firewall rules if you want to restrict that.
