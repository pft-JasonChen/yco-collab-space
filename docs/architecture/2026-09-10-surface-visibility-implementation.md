# Surface visibility implementation — 2026-09-10

Implemented on `feat/surface-visibility`, integrating `main` at `1f43c07`.
The project owner approved independent version bindings, separate zone/slot
namespaces, and retaining `shell` as a semantic category. This is implementation
direction, not an RD canonical or Designer visual approval.

## Review entry points

- `npm run dev`, then follow **Surface Browser** from the feature index.
- The route comes from `prototype.config.json`: `/surfaces/`.
- Direct version links use `?pack=workspace%2Ftool-video%402026-09`.
- `preview=1` opens the same renderer in isolation. Embedded previews use iframes
  so real component breakpoints react to the selected viewport width.
- `npm run storybook`: **Surfaces / Review** contains seven stories.
- `npm run surfaces:browser` remains the local metadata-only index.

The browser lists 26 entries and all 11 defined versions. Seven current versions
have interactive demonstrations: six `pattern/*` packs and `tool-video/2026-09`.
The photo workspace has some mapped chrome/inspector roles but no complete
preview. Marketing, image-generator and the old video version likewise do not get
invented implementations. Planned entries remain visible.

Search, status/kind/preview filters, version selection, version-specific adopters,
composition, required zones/slots, binding gaps and layout rules are available.
The configured desktop, compact-desktop and tablet widths can be inspected.

## Sources and boundaries

`surface.yaml` owns semantic zones. `component-slots.yaml` owns roles and its
existing `composes` field is the only authoritative composition declaration.
`bindings.yaml` identifies current implementations, with separate `zones` and
`slots` namespaces. A missing implementation carries an explicit reason.
`preview.recipe` chooses a small composition using the real shared components;
`preview.components` resolves through component contracts, not another import map.
Supporting fixture components can be present even when they are not owned by the
pack (for example, the dialog reached from a history card).

These are component demonstrations with synthetic feature content, not production
feature implementations. Required feature-owned video playback/settings/status
gaps remain visible. Seeing a preview never changes catalog or release approval.

`validate:surfaces` now checks bindings for every existing version, required
zone/slot coverage, component existence, identity, composition versions and cycles.
The rendered tests check the actual exports and interactions. The local browser
no longer derives usage from English prose or treats shell names as imports.

The Vite virtual module emits an explicit public projection. RD source, source
hashes, Figma keys, decision history and feature input manifests are not bundled.
No backend or model API is called by the browser. New UI uses the existing tokens.

Adding binding files changes the existing whole-folder pack hash. The active
working feature metadata was re-recorded through `prototype-update` after the
mapping additions. This does not renew old approvals. Both features remain
`pm-prototype-working`; all surface approvals remain unchanged. Future frozen
revisions should use immutable dependency snapshots and separate contract versus
implementation hashes (see the architecture review).

## Build repair

Button now has `rd.portability: reference` and no `rd.verbatimFiles`, reflecting
the owner's report of RD's decision. Upstream source hashes and vendored bytes
are untouched. Two other verbatim files remain checked. Disabled colours, padding
and the loading spinner remain prototype changes awaiting RD canonical review.

The original parity failure was only the first gate: spinner raw mask colours,
an undefined Credit Controls font token and stale feature provenance also blocked
the full validation chain. The mask now uses `currentColor`; the font uses the
existing `--font-weight-weak`. Both preserve the intended current visual result.

The lockfile gained missing optional TypeScript platform dependencies, without
upgrading direct dependencies. Git attributes prevent Windows newline conversion
from breaking recorded hashes; the Vite launcher uses Node instead of attempting
to execute a Unix `.bin/vite` shim on Windows. Surface paths serialize as POSIX.

## Verification

Run `npm ci`, `npm run build`, then `npm run test:surfaces`. The surface test starts
and cleans up its own built-preview server. `SURFACE_TEST_URL` can target an
already running server. `SURFACE_EVIDENCE_DIR` selects the artifact directory.

Also run `npm run build-storybook` and existing `test:rendered` checks for both
features. The added GitHub Actions workflow runs these on pull requests and main;
the repository owner must make its job required in branch protection. A local
successful run does not prove GitHub settings or a Vercel deployment are enabled.

Human follow-up: review the seven previews, record concrete findings against
zones/rules/bindings, and use the existing approval workflow only after actual
Designer/PM review. Do not promote provisional surfaces automatically.
