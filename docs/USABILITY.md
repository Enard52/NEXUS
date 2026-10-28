# NEXUS — Usability Review (27 Oct 2026)

Question: has ease-of-use actually been addressed? Answer with evidence from the
automated audits (386 measurements, 63 screens × 4 device profiles) plus the fixes
landed in the last two release tours. Verdict: the fundamentals are genuinely in
place — here is what exists, what was just fixed, and the short list still open.

## Already in place (verified)

- **Touch targets:** 0 findings — every link/button meets the 32px comfort bar
  (WCAG 2.5.8 AA is 24px; we enforce the stricter bar). Invisible hit-area
  expansion keeps the design pixel-identical.
- **Keyboard & mobile keyboards:** Enter submits on login, register, password
  reset, home/room/member forms, device rename, setup codes, HA token; mobile
  keyboards show "Go/Done". No form requires a button click.
- **Scroll stability:** site modals no longer shift the page horizontally
  (scrollbar-width compensation, 27 Oct).
- **Accessibility:** full `prefers-reduced-motion` support + a kill switch for
  sounds/motion/haptics in Settings; all icon-only buttons labeled; EN/TR
  complete (653/653 strings, automated coverage gate).
- **Honesty UX:** unsupported devices/features say so in the UI instead of
  pretending — the single most trust-building usability choice in the project.
- **Onboarding & empty states:** fresh-account walkthrough exists; empty device
  states have explicit action buttons (audited across profiles).
- **Feedback:** sound/motion/haptics with per-user toggles; toasts for copy/send;
  scene runs play one sound, not device cacophony.

## Fixed this tour

- Invite email links now land with an explicit "Invite accepted" confirmation
  (previously a silent sign-in felt like "nothing happened").
- Site modal open/close no longer shifts layout.
- Notification-channel fields commit on Enter.

## Open quick wins (next usability pass)

1. **Destructive actions:** device/room removal uses inline confirm — consider the
   branded dialog with undo toast (5s) on all destructive paths for consistency.
2. **First-run device scan:** LAN discovery requires tapping "Scan"; surface a
   one-time auto-scan on first entry with a progress state (desktop already has
   the engine; mobile needs the same affordance).
3. **Error messages with next steps:** a few failures (LAN timeout) still show the
   technical cause; append the retry/help link consistently (pattern exists on
   energy screens).
4. **Settings search:** settings are one long page; a small filter input would
   future-proof as the list grows.
5. **Password reset from login error:** when login fails with "email or password
   wrong", offer the reset link inline (link exists on the page, not in the error).

None of these block the open-source launch; they are the next polish tour.
