# Cloud Storage — Product decisions

## Decisions

- The feature name and slug are Cloud Storage and `cloud-storage`.
- Cloud Storage evolves the existing `/account/gallery` page rather than adding a second
  library surface. The prototype keeps RD's authenticated header, desktop category rail,
  page heading, draggable tab row, justified desktop grid and narrow two-column masonry.
- The surface strategy is hybrid: `library/gallery@2026-09` is primary and
  `commerce/pricing-overlay@2026-09` is borrowed for `close-action`, `feature-list`,
  `plan-tabs`, `plan-list` and `checkout-action`.
- The taxonomy is two levels. Level one is five fixed tabs in this order: Projects,
  Images, Videos, Uploads, Trash. Level two is a tool-family filter inside Images and
  Videos, and a file-format filter inside Uploads.
- Today's tool-named tabs — Photos, Videos, AI Image Generator, AI Tools, AI Agent — are
  replaced. Tool identity moves into the level-two filter so that adding a tool never
  adds a tab.
- Projects is a separate level-one tab rather than a filter. Re-editable work and
  finished output are different user intents, and collapsing them into media type would
  erase the distinction the PM required.
- Sorting offers newest, oldest and size-descending on every content tab.
  Size-descending is the cleanup path. Trash sorts by the date moved.
- The free plan is 5 GB with no retention limit. Folders, renaming, moving, batch
  actions and trash are all available on the free plan and are never gated.
- Paid capacity is 100 GB on the subscription, plus purchasable capacity packs of
  10 GB and 100 GB with monthly and yearly billing. All prices and quotas are synthetic.
- The capacity meter sits in the page heading, adjacent to the upgrade entry. The metric
  and the action it triggers are never separated.
- Capacity has four states driven by one usage value: normal below 75 percent, warning
  from 75 to 89, critical from 90 to 99 with a persistent banner, and full at 100 with a
  blocking dialog raised at the moment an action needs space.
- Every capacity state above normal offers a cleanup action alongside the purchase
  action. Paying is never the only exit.
- Cleanup does not get a dedicated view in this version. The cleanup action enters the
  existing batch selection mode with sort switched to size-descending, and the batch
  toolbar reports the space the selection occupies.
- Upload progress renders inside the destination grid cell, extending the existing
  gallery-cell loading state. No floating upload queue is built.
- Consequently there is no batch cancel and no pre-flight capacity check. Files upload
  one at a time until the quota is exhausted.
- When the quota is exhausted mid-batch, the remaining files become quota failures.
  A quota failure is a distinct cell state from a format failure: a format failure
  offers another file, a quota failure offers cleanup and capacity and does not offer a
  retry that cannot succeed.
- A completed synthetic purchase retries the quota-failed uploads instead of returning
  the user to an unchanged page.
- Deletion is always recoverable. Items move to trash, are held 30 days, show their
  remaining days on the card, and can be restored, deleted permanently or emptied in
  bulk.
- Trashed items still count against the quota, and the trash banner says so.
- The purchase overlay opens on the subscription path and exposes a secondary
  Expand storage only entry that switches to the capacity path in the same overlay, with
  a back control. The capacity path states the resulting total rather than only the
  increment.
- File size is shown on every grid cell. RD's gallery does not show it, and without it a
  cleanup decision cannot be made from the grid.
- Search, favourites and drag-into-folder are excluded from this version.
- A floating upload queue and a dedicated manage-storage view are excluded from this
  version.
- Sharing and every collaboration surface are excluded from this feature entirely.
- The prototype exposes one review control that sets synthetic usage to each capacity
  state, because those states cannot be reached reliably by uploading during a review.
- `product/i18n.json` is not authored at Intake. The dictionary validator requires every
  declared key to be used by generated code, so the copy deck is specified in the PRD and
  the dictionary is authored during `prototype-update` alongside the generated feature.
- All storage, quota, upload, purchase, renewal and trash behaviour is local and
  synthetic. No backend, storage service, payment provider or account state is implied.

## Decision basis

- PM confirmation was completed on 2026-09-15 across four rounds covering page
  positioning, taxonomy, v1 scope, capacity and purchase model, upload feedback, and the
  three exclusions.
- The competitive teardown recorded in
  `docs/research/2026-09-14-cloud-storage-competitive-ux.md` supplies the evidence for
  each pattern adopted or rejected. It was produced from first-hand operation of Picsart
  on a free account, Fotor on Pro+, CapCut on Pro and Canva on a free account.
- The repository convention is production-surface-first, so the audit began in the RD
  snapshot rather than in the competitor set. `/account/gallery` and `my-gallery-page`
  already own the grid, cell, tabs, batch toolbar, select-all header and delete
  confirmation.
- The same audit found no RD component for capacity, folders or trash. Searching the
  intake inventory for storage returns only localStorage utilities. Those three are
  therefore the genuinely new surfaces, and the review is scoped to them.
- Tool-named tabs do not survive tool growth. Fotor's equivalent filter reached 62
  entries and now needs a search field inside the dropdown to remain usable. YCO's five
  tabs would follow the same path, so level one was fixed at five buckets.
- The PM selected the two-level taxonomy over both keeping RD's five tabs and moving to
  a lifecycle taxonomy, on the basis that it preserves the current mental model while
  removing the growth problem.
- CapCut attaches its upgrade entry directly to the capacity figure in the page heading.
  Picsart separates them, and its storage row opens a credits-led modal in which storage
  appears eleventh in the benefit list; that mismatch is the specific failure this
  feature avoids.
- Fotor gates folder creation and moving behind a subscription. A free user who cannot
  organise accumulates less, which suppresses the very growth that makes an upgrade
  worth buying, so organisation was kept free.
- Fotor's free tier also deletes creations after 30 days. Retention limits damage trust
  in the word cloud more than capacity limits do, so the free plan has no retention
  limit.
- Picsart deletes permanently from a hover menu with no trash. CapCut holds items 30
  days and prints the remaining days on each card. The CapCut pattern was adopted whole.
- CapCut is the only competitor that sells capacity separately, from $0.99 per month,
  through a secondary entry beneath the subscription call to action. That two-path shape
  was adopted, and the borrowed pricing-overlay pack already declares a plan-tabs slot
  for switching subscription and pay-as-you-go offers.
- No competitor shows the resulting total when a capacity pack is bought, and no
  competitor resumes the interrupted action after purchase. Both were added because the
  teardown identified them as concrete, low-cost differentiators.
- Only Picsart shows file size on the grid cell. It is the single piece of information a
  cleanup decision needs, so it was adopted despite RD's gallery omitting it.
- The PM chose in-cell upload progress over a floating queue explicitly to minimise
  development cost, and accepted the two consequences: no batch cancel, and capacity
  exhaustion surfacing as per-file failures rather than as a pre-flight block. RD already
  ships an inline uploading status in AI Video Filters and Video Enhance, and three
  aiTools upload steps each duplicate a photo-selection progress bar, so the in-cell
  pattern has production precedent and an extraction candidate.
- The PM declined a dedicated manage-storage view and directed cleanup to reuse the
  existing batch toolbar with size sorting, accepting that the released-space figure is
  shown only during selection rather than as a standing view.
- Both Surface Packs are provisional, so manager review judges behaviour, taxonomy and
  design-system compliance rather than visual similarity to a frozen production
  reference.

## Post-prototype TODO

- Confirm the 5 GB free quota against YCO's real average asset size. If video generation
  dominates, a single 4K result can approach 200 MB and 5 GB holds roughly 25 of them.
  The number in this prototype is aligned to competitors, not to YCO telemetry.
- Decide how a project is metered. If a project retains every intermediate asset, its
  footprint will far exceed its finished output, and the meter has to state which it
  counts.
- Derive the real tool-family groupings from YCO's shipped tool list and write down the
  rule that assigns a new tool to a family, so level two cannot drift back into a flat
  tool list.
- Propose `gallery-grid`, `gallery-cell`, the draggable tab row and the duplicated
  upload progress bar for extraction into the shared component pilot. All four are
  reproduced as feature code in this prototype only because no catalogued component
  covers them yet.
