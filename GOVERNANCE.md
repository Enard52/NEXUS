# Governance

NEXUS is maintained by [@Enard52](https://github.com/Enard52). This page keeps the rules short and
predictable so contributors know what to expect.

## Decisions

- Small changes (fixes, docs, new device support that follows an existing pattern): one maintainer review is enough.
- Larger changes (new protocol, data model, anything that touches accounts, payments, privacy or security): open an issue first and wait for a maintainer to agree on the approach before writing code.
- A change is declined if it needs a vendor cloud, fakes a successful result, collects user data without naming the recipient in the privacy policy, or puts a secret in the repository.

## Pull requests

- `main` is protected: every change goes through a pull request. CI must pass (typecheck, tests, format, dependency audit, UI states and accessibility basics, CodeQL), a code owner must approve (see `.github/CODEOWNERS`), approval is dismissed when new commits are pushed, conversations must be resolved, history stays linear (squash merge) and force-pushes and deletions are blocked.
- Release tags (`v*`) can only be created, moved or deleted by the maintainer.
- Workflow runs from first-time and all other outside contributors need a maintainer's approval before they start.
- Connector pull requests must include packet/response-format tests in `packages/web/src/lan-*.test.ts`. If the connector was not tried on real hardware, say so in the pull request; do not claim it is verified.
- Generated mirrors (`www/`, `desktop/app/`, Android and iOS assets) are never edited by hand; run the sync scripts described in `docs/ARCHITECTURE.md`.

## Response times (best effort, volunteers)

Issues and pull requests are looked at weekly. Security reports sent privately (see [SECURITY.md](SECURITY.md)) are answered first.

## Becoming a maintainer

Contributors with several merged, well-reviewed pull requests and a record of following these rules can be invited to review and merge. Maintainers can step down at any time.

## Conduct

Everyone follows the [Code of Conduct](CODE_OF_CONDUCT.md).
