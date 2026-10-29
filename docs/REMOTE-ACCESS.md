# Reaching your home when you are away (free VPN)

NEXUS talks to your devices directly on your home network, so it has no cloud to relay through.
To control the home from outside you put your phone or laptop **on the home network through a
VPN**. After that, NEXUS works exactly as it does at home: the same device addresses, no extra setting.

> Status: this guide is written from the public Tailscale and WireGuard documentation. The NEXUS
> maintainers have not yet tested it on every setup. If you try it, please tell us what worked
> in an issue so we can correct this page.

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
4. Install Tailscale on your phone and sign in with the same account. Leave it connected.
5. Open NEXUS. Devices you paired at home are reachable the same way as before, because their
   `192.168.x.y` addresses now route through the VPN.

## Option B — WireGuard on your router

If your router supports WireGuard (OpenWrt, many Mikrotik, Fritz!Box via VPN apps, UniFi, pfSense/OPNsense):

1. Create a WireGuard server on the router and a client profile for your phone.
2. Route the home subnet through the tunnel (`AllowedIPs` includes your home range, e.g. `192.168.1.0/24`).
3. Connect the phone, then open NEXUS.

You need a way for the phone to reach the router from outside (a public IP or a free dynamic DNS name, and one forwarded UDP port).

## What does not work yet

- NEXUS has no "hub address" setting. Devices are always addressed by their local IP, so the
  VPN must make that local range reachable (as above). Adding a setting to pair devices through a
  fixed remote address is open for contribution ([#87](https://github.com/Enard52/NEXUS/issues/87)).
- Devices behind a Philips Hue bridge or Home Assistant are reached through that hub's local address; the same VPN route covers them.
- Discovery (scanning for new devices) works only on the local network. Pair new devices while at home.

## Safety

- Never expose a device or NEXUS directly to the internet with port forwarding. Use the VPN.
- Keep the VPN account protected with two-factor authentication.
