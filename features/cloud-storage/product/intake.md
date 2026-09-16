# Cloud Storage — Intake

## Problem

YCO accumulates every AI result a user generates, but the current `/account/gallery`
page treats that library as an unbounded feed: there is no capacity, no way to group
items, and no way to recover a deleted one. Users cannot answer three basic questions —
how much room do I have left, where do I put things, and how do I get something back —
so they stop trusting the product as a place to keep work and start re-downloading
everything locally.

Cloud Storage turns My Gallery into a managed space: a visible quota, folders, a
recoverable trash, and an upgrade path that is attached to the number it is about.

## Review goal

The manager should be able to approve the complete storage experience on YCO's existing
gallery surface: the two-level taxonomy that replaces today's tool-named tabs, the
four-stage capacity behaviour from normal through blocked, per-file upload feedback
inside the grid, folder and trash management, and the two-path purchase flow that lets a
user either upgrade the subscription or buy capacity alone.

## Target user

A signed-in YCO user who has generated results across several tools and uploaded source
media. In this prototype they are on the free plan with 5 GB, so every capacity state is
reachable from synthetic local data.

## Scope

- Evolve the existing `/account/gallery` composition rather than introducing a second
  library page. The prototype keeps RD's authenticated header, desktop category rail,
  page heading, horizontally draggable tab row, justified desktop grid and two-column
  narrow masonry.
- Replace today's tool-named tabs (Photos, Videos, AI Image Generator, AI Tools, AI
  Agent) with a two-level taxonomy. Level one is five stable tabs — Projects, Images,
  Videos, Uploads, Trash — and level two is a tool-family filter inside Images and
  Videos. New tools join an existing family instead of adding a tab.
- Keep Projects distinct from finished results. A project is re-editable; an image or
  video is a finished output. They are different user intents and get different tabs.
- Show a persistent capacity meter in the page heading, adjacent to the upgrade entry,
  so the metric and the action are never separated.
- Drive four capacity states from one synthetic usage value: normal below 75 percent, a
  warning tint at 75, a persistent page banner at 90, and a blocking dialog at 100.
- Show upload progress inside the grid cell that the file will occupy, extending the
  existing gallery-cell loading state. No floating upload queue is built.
- Upload files one at a time until the quota is exhausted. Remaining files fail as
  quota failures, which are visually and behaviourally distinct from format failures:
  a format failure offers another file, a quota failure offers cleanup or purchase.
- Provide folders with create, rename, move-into, open, breadcrumb and delete. Folder
  organisation is available on the free plan and is never gated.
- Provide a trash tab that holds deleted items for 30 days, states that policy in a
  banner, shows the remaining days on every card, sorts by the date moved, and supports
  restore, delete-forever and empty-all.
- Offer a two-path purchase overlay: subscription upgrade first, with a secondary entry
  that buys capacity alone. Capacity packs show the resulting total, not just the
  increment.
- After a successful synthetic purchase, retry the uploads that had failed for quota
  rather than returning the user to an unchanged page.
- Use the existing batch editing toolbar and select-all header for multi-select, with
  size-descending sort as the cleanup path.
- Keep every number, task, price and file synthetic and local. No backend, storage
  service, payment provider, quota API or account state is implied.

## Open product decisions

None. The PM confirmed the taxonomy, capacity numbers, upload model, purchase model and
v1 exclusions on 2026-09-15. Remaining gaps are design gaps, not product blockers.

## Decision basis

- A competitive teardown of Picsart, Fotor, CapCut and Canva on 2026-09-14 established
  the patterns this feature adopts and the ones it rejects. It is recorded in
  `docs/research/2026-09-14-cloud-storage-competitive-ux.md`.
- The repository convention is production-surface-first, so the audit began in the RD
  snapshot. `/account/gallery` and `my-gallery-page` already own the grid, cell, tabs,
  batch toolbar and delete confirmation this feature needs, and `common/pricing-modal`
  already owns the subscription overlay.
- The same audit found no RD component for capacity, folders or trash. Those are the
  genuinely new surfaces, and the prototype is scoped so the manager review concentrates
  on them.
- Tool-named tabs do not survive tool growth. Fotor's equivalent filter has reached 62
  entries and needs its own search field to stay usable; YCO's current five tabs would
  follow. A media-level tab with a tool-family filter keeps level one fixed.
- Capacity is never the headline benefit in any competitor's upgrade copy, but it is the
  trigger users act on. Attaching the upgrade entry to the meter, as CapCut does, avoids
  the mismatch seen in Picsart, where the storage row opens a credits-led modal.
- Organisation is not a paywall. Fotor gates folders behind a subscription, which leaves
  free libraries disordered and suppresses the accumulation that makes an upgrade worth
  buying.
- Deletion must be recoverable. Picsart deletes permanently from a hover menu, which is
  the highest-risk pattern found in the teardown.
- The PM chose in-cell upload progress over a floating queue to keep development cost
  minimal, accepting that batch cancel and pre-flight capacity checks are not available
  and that capacity exhaustion therefore surfaces as per-file failures.
