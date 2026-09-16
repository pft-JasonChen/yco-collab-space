# Cloud Storage — Product decisions

`## Decisions` is canonical and reflects the prototype as it stands after the PM review
passes recorded in `## Review log`. On 2026-09-16 the agent folded the five dated review
sections that used to follow the Decisions list into this shape; each pass is kept
verbatim below, and a bullet here that a pass changed says so in the log, not here.

## Decisions

### Positioning and surface

- The feature name and slug are Cloud Storage and `cloud-storage`.
- Cloud Storage evolves the existing `/account/gallery` page rather than adding a second
  library surface. The prototype keeps RD's authenticated header, desktop category rail,
  page heading, draggable tab row, justified desktop grid and narrow two-column masonry.
- The surface strategy is hybrid: `library/gallery@2026-09` is primary and
  `commerce/pricing-overlay@2026-09` is borrowed for `close-action`, `feature-list`,
  `plan-tabs`, `plan-list` and `checkout-action`.
- The header is three bands: the capacity meter with its action, the level-one tab row,
  then one toolbar. There is no standalone New project / Upload / Import row, Import from
  phone is not in v1, and the retention tip is dropped.
- Below the shared header's mobile breakpoint (768px) the category rail collapses into
  the header drawer through the header's own menu button, so categories are reachable at
  every width.
- Entering a folder replaces the page title with the breadcrumb and hides both the
  level-one tab row and the capacity meter. The breadcrumb root is the tab you came from
  and is the way back.

### Taxonomy and filtering

- The taxonomy is two levels. Level one is six fixed tabs in this order: Projects,
  Images, Videos, AI Agent, Uploads, Trash. Adding a tool never adds a tab. Today's
  tool-named tabs — Photos, Videos, AI Image Generator, AI Tools, AI Agent — are replaced.
- Projects is a separate level-one tab rather than a filter. Re-editable work and
  finished output are different user intents.
- AI Agent is a level-one tab placed after Videos because it is a creation source. It
  lists individual outputs, not session containers; every agent cell names its source
  session on the meta line.
- Level two is the Type filter, drawn from the YCO Feature Type sheet: eighteen features
  under two types, AI Image and AI Video. On Images the menu lists the eight AI Image
  features and nothing else; on Videos the ten AI Video features; neither shows group
  headers. The mixed tabs — Projects, AI Agent, Uploads — list all eighteen under both
  headers.
- A media filter (images / videos) appears only on the mixed-media tabs. There is no
  file-format filter.
- Sort is one menu with two groups: Sort by (Date modified, Date created) and Order
  (Newest first, Oldest first). There is no name sort and no size sort. Trash sorts by
  the date an item was moved.
- A view control switches between the justified grid and a list whose rows lead with a
  small thumbnail.

### Creating and uploading

- The create control is per tab. Uploads offers File Upload / Folder Upload / Create
  folder, and the hidden file input behind File Upload is the feature's only upload
  entry. Projects offers Create project and Create folder. Images, Videos and AI Agent
  have a plain Create folder button. Trash has no create control; Empty Trash takes that
  position.
- Create project opens a file picker and, once a file is chosen, stops at a named
  boundary for `edit/result-photo`, which is a different surface
  (`workspace/tool-photo-editing`) this feature does not absorb.
- Upload progress renders inside the destination grid cell, extending the existing
  gallery-cell loading state. No floating upload queue is built, so there is no batch
  cancel and no pre-flight capacity check. Files upload one at a time until the quota is
  exhausted.
- When the quota is exhausted mid-batch, the remaining files become quota failures. A
  quota failure is a distinct cell state from a format failure: a format failure offers
  another file; a quota failure offers Remove or Upgrade and never a retry that cannot
  succeed.
- A completed synthetic purchase retries the quota-failed uploads instead of returning
  the user to an unchanged page.

### Capacity and purchase

- The free plan is 5 GB with no retention limit. Folders, renaming, moving, batch
  actions and trash are all available on the free plan and are never gated.
- Paid capacity is 100 GB on the subscription, plus purchasable capacity packs of 10 GB
  and 100 GB with monthly and yearly billing. All prices and quotas are synthetic.
- The capacity meter sits in the page heading adjacent to its action, which is the
  secondary brand button at tiny size: Upgrade for a free user, Expand storage for Pro.
  Pro is the highest subscription, so its action goes straight to the capacity packs.
- Capacity has four states driven by one usage value: normal below 75 percent, warning
  from 75 to 89, critical from 90 to 99 with a persistent banner, and full at 100 with a
  full banner of the same shape one step up the severity ramp, plus a blocking dialog
  raised at the moment an action needs space. The full dialog states what is blocked and
  carries one action, Upgrade Space, which opens the purchase overlay; it has no meter of
  its own.
- Manage space is removed everywhere: from the critical banner, the full dialog and the
  quota-failure cell. This reverses the earlier principle that paying must never be the
  only exit, and it is a deliberate PM call. A user at 100 percent has one signposted way
  forward, buying space, and can still delete items manually from the grid.
- The purchase overlay opens on the subscription path and exposes a secondary Expand
  storage only entry that switches to the capacity path in the same overlay, with a back
  control. The capacity path states the resulting total rather than only the increment.
  The Add storage overlay carries no title pill. Checkout is inert: confirming advances to
  a synthetic success state that updates the meter, closes the overlay and retries
  quota-failed uploads.

### Items, selection and actions

- A cell shows its thumbnail, a type-appropriate badge, the item name, then type, size
  and date. File size stays on the cell: the page carries a capacity meter that asks the
  user to decide about space on every visit, and a cell that omits size cannot support
  that decision.
- Selection has no mode switch. Hovering a cell reveals a checkbox at its top-left; the
  first click both selects that item and enters selection mode. RD's placement stays the
  shared component's default; Cloud Storage opts in.
- The cell's action cluster is RD's own `cell-actions`: Download is a button on the
  translucent dark pill and More opens RD's dark on-photo menu. The menu has three
  labelled groups — Open, Organise, Remove — with move-to-trash last; the destructive
  entry is flagged by a data attribute and its trash glyph, not by colour.
- The selection bar is low-weight: a leading close control, the item count and the space
  those items occupy, select-all, then export / move / delete as icon-plus-label actions
  with no fills. Its icons are masked to the button's own colour so the destructive tone
  reaches the glyph.
- The list view and the Trash table are one shared component, `data-table`, and differ
  only in the columns each declares. Both carry the same plain row menu; Download stays
  reachable as its own icon button.

### Folders and trash

- A folder card shows its name, item count and the space it occupies. Creating a folder
  opens a small dialog with a pre-selected default name.
- Deletion is always recoverable. Items move to trash, are held 30 days, show their
  remaining days, and can be restored, deleted permanently or emptied in bulk.
- Trash is a table: name, type, deleted date, and the days left before automatic
  deletion. Restore and Delete forever sit in a per-row menu; deleting permanently raises
  a confirmation that names the item and says it cannot be undone.
- Trash rows are selectable with the same bar the content tabs use, reporting count and
  selected size, offering Restore and Delete forever and not Export. Restore is a real
  move back to the tab and folder the item came from and raises a short confirmation
  toast.
- Empty Trash raises a confirmation that states how many items go. Trash has an empty
  state that teaches the 30-day rule.
- Trashed items still count against the quota, and the trash banner says so.

### Review tooling and boundaries

- The prototype exposes one review control, a Demo widget pinned bottom-left and
  collapsed to a single Demo pill, carrying the four capacity states and a Free / Pro
  plan switch. Its dashed treatment marks it as a review tool, not product UI.
- Search, favourites and drag-into-folder are excluded from this version, as are a
  floating upload queue and a dedicated manage-storage view. Sharing and every
  collaboration surface are excluded from this feature entirely.
- `product/i18n.json` keys are declared with `status: planned` at Intake; the full gate
  requires every key to be used once code is generated.
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
  tabs would follow the same path, so level one was fixed.
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
- Only Picsart shows file size on the grid cell. It was dropped on 2026-09-16 when the
  cleanup path went, then restored the same day because the capacity meter makes space a
  decision on every visit and the competitor set is not carrying a meter.
- The PM chose in-cell upload progress over a floating queue explicitly to minimise
  development cost, and accepted the two consequences: no batch cancel, and capacity
  exhaustion surfacing as per-file failures rather than as a pre-flight block. RD already
  ships an inline uploading status in AI Video Filters and Video Enhance, and three
  aiTools upload steps each duplicate a photo-selection progress bar, so the in-cell
  pattern has production precedent and an extraction candidate.
- The PM declined a dedicated manage-storage view on 2026-09-15 and then, on 2026-09-16,
  removed the cleanup entry altogether. The reversal of "paying is never the only exit"
  is recorded as a deliberate call with its consequence, not dropped silently.
- The selection pattern (hover checkbox, first click enters selection) is the one
  Picsart, Fotor, CapCut and Canva all use; it removes a click from every batch action.
- The folder header follows Fotor: the header states where you are rather than where you
  could go.
- Level two comes from the YCO Feature Type sheet rather than invented families, so the
  filter cannot drift back into a flat tool list as tools are added.
- Both Surface Packs are provisional, so manager review judges behaviour, taxonomy and
  design-system compliance rather than visual similarity to a frozen production
  reference.

## Review log

Append-only. Each pass is kept as it was written; the canonical list above already
reflects it.

### Layout review, 2026-09-15

Decisions taken with the PM against an interactive wireframe, after the page had been
composed from shared components. All of them replace earlier entries above.

- The header row is three bands: capacity meter with the upgrade entry, the level-one
  tab row, then one toolbar. The standalone New project / Upload / Import from phone
  row is gone; it cost a full band for three actions and pushed the grid down.
- `Import from phone` is dropped from v1 entirely. `Manage` leaves the meter row —
  cleanup is still reachable from the critical banner and the full dialog, which is
  where the user is actually blocked, and CS-007 / CS-008 keep asserting it.
- The retention tip ("Everything you create is saved here.") is dropped. It stated the
  product's default rather than telling anyone anything.
- Selection no longer has a mode switch. Hovering a cell reveals a checkbox at its
  top-left; the first click both selects that item and enters selection mode. This is
  the pattern Picsart, Fotor, CapCut and Canva all use, and it removes a click from
  every batch action. RD's own placement (top-right, selection mode only) stays the
  shared component's default; Cloud Storage opts in.
- Sort exposes Date Modified, Date Created and Alphabetical, plus File size. File size
  was not in the PM's list but is kept, after review, because the cleanup path depends
  on it: `Manage space` sorts by size descending so the largest items come first, and
  CS-004 asserts it. Without a size sort there is no cleanup entry point.
- Sort direction is a separate control rather than doubled options, so all four fields
  can be read in either direction without eight menu entries.
- The view control switches between the justified grid and a list whose rows lead with a
  small thumbnail. The trash tab already rendered as a list; it now uses the same one.
- One create entry: `New +` opens File Upload, Folder Upload and New Folder. The upload
  file input lives behind it, which is why the upload flow could not be built before this
  layout was settled.
- The media filter is a mixed-media control and appears only on the tabs that hold both
  kinds — Projects and Uploads. It replaces the JPG / PNG / MP4 format filter, whose
  granularity nobody asked for; the sketch has two left-side controls, not three.
- The review control moves into a collapsible Demo widget pinned bottom-left, collapsed
  to a single `Demo` pill. It carries the four capacity states and a Free / Pro plan
  switch, so a reviewer can see the same page under a Pro quota. Its dashed treatment is
  deliberate: DESIGN-013 requires it to be unmistakably a review tool.
- Below the shared header's mobile breakpoint the category rail collapses into the header
  drawer, using the header's own menu button. The rail breakpoint moved from 1024 to 768
  to match, so there is no width at which categories are unreachable — which is what the
  surface-structure zone failure was really reporting.
- The item overflow menu is newly designed, with the PM's agreement, because RD has no
  per-item menu to extract: its editing toolbar carries only select, cancel, delete and
  download. Four labelled groups — Open, Organise, Get, Remove — with move-to-trash last
  and marked destructive.

### Follow-up decisions, 2026-09-15

- The folder view follows Fotor's header: entering a folder replaces the page title with
  the breadcrumb and hides both the level-one tab row and the capacity meter, so the
  header states where you are rather than where you could go. The breadcrumb root is the
  tab you came from, not the app name, and it is the way back.
- AI Agent becomes a sixth level-one tab, placed after Videos because it is a creation
  source; Uploads and Trash stay the two buckets at the end.
- The tab lists **individual outputs**, not session containers. A chat mixes images and
  videos, so the media filter applies directly to files, and the tool-family filter keeps
  working because each output still comes from a tool. The cost of a flat list is that
  you cannot see which results belong together, so every agent cell names its source
  session on the meta line. Revisit if sessions need their own lifecycle actions —
  renaming a conversation, or reopening it with its full context.

### Capacity and toolbar review, 2026-09-16

- **Level two comes from the YCO Feature Type sheet.** Eighteen features under two types,
  AI Image and AI Video, rendered as two group headers in the level-two filter. The
  invented families (portrait, product, style, audio) are gone; every mock item is remapped
  onto a real feature id.
- **Sort is one menu with two groups**, Sort by and Order, replacing the field dropdown plus
  a separate direction icon. The icon button was a control that cost a slot and said
  nothing until you already knew what it did.
- **File size leaves the cell.** None of the four competitors shows it, and the reason it
  was kept — sorting largest-first to clear space — no longer exists. Size stays in the
  selection bar, where it answers "how much will this free".
  _Reversed on 2026-09-16 — see the PM review below._
- **Manage space is removed everywhere**: from the critical banner, the full dialog and the
  quota-failure cell. This reverses an earlier recorded principle that paying must never be
  the only exit, and it is a deliberate PM call, not an oversight. The consequence is that
  a user at 100% has exactly one way forward — buy space — and can still delete items
  manually from the grid, which is not signposted at the moment of blocking.
- **A blocked upload offers Remove or Upgrade.** Remove clears the failed cell; retry is
  still absent, because retrying cannot succeed until space exists.
- **The full dialog is a real surface**, not a bare three-button box: it shows the capacity
  that is full as a meter, states what is blocked, and carries one action, Upgrade Space,
  which opens the purchase overlay.
- **Pro cannot upgrade.** Pro is the highest subscription, so the meter's action becomes
  Expand storage and goes straight to the capacity packs path.
- **The selection bar is low-weight.** A leading close control, the item count and the
  space they occupy, select-all, then export / move / delete as icon-plus-label actions
  with no fills. RD's filled-pill row stays the shared component's default.

### Toolbar, trash and cell actions, 2026-09-16 (second pass)

- **Sort keeps date fields only.** Name leaves the list; the field group is Date modified
  and Date created, the order group Newest / Oldest first.
- **The create control is per tab, not one menu everywhere.** Uploads keeps File Upload /
  Folder Upload / Create folder — which is where the upload flow now lives, because
  "uploads" is exactly what a user's own files are. Projects offers Create project and
  Create folder. Images, Videos and AI Agent have one action left, so it is a plain
  Create folder button rather than a menu of one. Trash has no create control; Empty Trash
  takes that position instead.
- **Create project hands off rather than pretending.** It opens a file picker, and once a
  file is chosen the prototype stops at a named boundary for `edit/result-photo`. That
  route renders RD's `components/result-page` — 1,551 files — which is a different surface
  (`workspace/tool-photo-editing`), not something Cloud Storage should absorb.
- **The cell's action cluster is RD's own `cell-actions`.** The previous control was the
  toolbar dropdown in its borderless variant, which has no ground and so vanished over a
  light thumbnail. RD had already solved this: Download and More share a translucent dark
  pill with white glyphs. Download becoming its own button collapses the menu's Get group,
  so the item menu is now three groups — Open, Organise, Remove — rather than four.
- **Trash is a table**: name, type, deleted date, and the days left before automatic
  deletion. The People column in the reference is a sharing column and sharing is out of
  scope for v1. Restore and Delete from Trash move into a per-row menu, and deleting
  permanently raises a confirmation that names the item and says it cannot be undone.
- **The full-storage dialog loses its red meter**, which overlapped the close control and
  repeated a number the page already shows.

### PM review, 2026-09-16 (third pass)

- **The level-two filter is called Type, and it is scoped to the tab's own medium.** It was
  labelled Tool family, which named an internal taxonomy rather than the thing being
  picked. On Images the menu now lists the eight AI Image features and nothing else; on
  Videos, the ten AI Video ones. Offering the other medium's features on a single-medium tab
  was offering eleven filters that can only ever empty the grid. The group headers go with
  them on those two tabs, because a header there names the tab you are standing on. The
  mixed tabs — Projects, AI Agent, Uploads — keep all eighteen under both headers, since
  there a video feature is a real filter.
- **File size returns to the grid cell**, as type, size, date, matching the order the list
  view's columns already used. The 2026-09-16 decision to drop it reasoned from the removed
  cleanup path and from competitors. Both still hold, and it is still being reversed: this
  page carries a capacity meter that asks the user to decide about space on every visit, and
  a cell that says what a file is and when it was made but not how big it is cannot support
  that decision. The competitor set is not carrying a storage meter.
- **Full capacity gets a banner of its own**, the same shape as the critical one and one
  step up the same severity ramp — the error pair the meter's fill already uses at that
  state. Until now, 100 percent was visible only in the meter until something failed; the
  blocking dialog said so at the moment of a save, which is the worst moment to learn it.
  The dialog is unchanged and still raises separately.
- **Trash rows are selectable, and Empty Trash works.** Empty Trash had no handler at all —
  a button that has always done nothing. It now raises a confirmation that states how many
  items go, and the tab has an empty state, which it never needed before because nothing
  could empty it. Selection in Trash uses the same bar the content tabs use, reporting the
  same count and selected size, and offers Restore and Delete forever. It does not offer
  Export: exporting out of Trash is a way to keep a file you have already thrown away.
  Restore is a real move — the mock records which tab and folder each row came from — and
  raises a short confirmation toast, because otherwise restoring and deleting look identical
  from the grid.
- **The list view and the Trash table are one component.** They were two CSS grids in the
  same stylesheet with different row heights, paddings, header weights and row actions, so
  the same product had two tables that did not look related. Both are now the shared
  `data-table`, extracted from the guideline Figma table, and the only thing that differs is
  which columns each declares. The library row's on-photo action pill goes with it: that
  control exists to stay legible over a photograph, and on a white table it was the one
  element that did not belong to the table. Both tables now carry the same plain row menu,
  which is what Trash already used. Download stays reachable as its own icon button.
- **The capacity meter's action uses the secondary brand button at tiny size**, replacing a
  tertiary small one, so Expand storage and Upgrade sit at the weight the button set
  intends for an inline action beside a metric.
- **The Add storage overlay loses its blue title pill.** With one offer, the shared pricing
  overlay falls back to RD's single-offer badge, which here restated the dialog's own title
  immediately beneath it. Passing no tabs removes it without touching the shared component.
- **The selection bar's icons are masked rather than painted.** They are RD's white glyphs,
  drawn for its filled pills; on the ghost bar's light ground they were white on white. The
  same asset now takes the button's own colour, which also carries the destructive action's
  red onto its trash icon. The fix is in the shared component, so every ghost-variant
  consumer gets it.

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
- AI Agent now has its own tab, listing individual outputs (decided 2026-09-15, above).
  Still open: whether a session itself needs to be an addressable object — reopening a
  conversation with its context, renaming it, or deleting a whole session at once. None of
  those is reachable from a flat list of results.
- Decide how a blocked user clears space now that Manage space is gone. Deleting from the
  grid still works but nothing points at it from the banner or the full dialog, so the only
  signposted exit is payment. Worth watching in review.
