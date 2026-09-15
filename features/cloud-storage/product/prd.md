# Cloud Storage

## Goal

Give a YCO user a managed home for everything they create and upload: a visible quota,
a taxonomy that survives tool growth, folders, a recoverable trash, and an upgrade path
attached to the number that triggers it. The PM prototype confirms the web experience
and the capacity behaviour, not a storage service or billing contract.

## Required behaviour

### Page shell and entry

- The feature opens at `/features/cloud-storage/`.
- The route reproduces the current `/account/gallery` composition: the authenticated
  header, the desktop tool-category rail, the page heading, the horizontally draggable
  tab row with its active indicator, and the justified result grid.
- Header and rail items stay visible for context but do not navigate in this prototype.
- The page heading is followed by the capacity meter described below.

### Taxonomy

- Level one is exactly five tabs, in this order: Projects, Images, Videos, Uploads,
  Trash. The set is fixed; a new tool never adds a tab.
- Projects holds re-editable work. Images and Videos hold finished AI outputs. Uploads
  holds source media the user supplied. Trash holds deleted items.
- Images and Videos expose a level-two tool-family filter with an All option plus the
  families a synthetic library contains. A tool belongs to exactly one family.
- Uploads exposes a file-format filter instead of a tool-family filter, because a
  supplied file has no generating tool.
- Every tab supports sorting by newest, oldest and size. Size-descending is the cleanup
  path, so it is offered on every content tab.
- Trash sorts by the date an item was moved to trash, not the date it was created.
- Search, favourites and drag-into-folder are explicitly out of scope for this version.

### Capacity meter and states

- The page heading shows used and total capacity, a proportional bar, a Manage entry and
  an Upgrade entry. The meter and the upgrade entry are adjacent and never separated.
- The synthetic plan is 5 GB. Usage is a local value the prototype can drive through
  every state.
- Normal, below 75 percent: neutral bar, no banner, no interruption.
- Warning, 75 to 89 percent: the bar takes the warning tint and the meter exposes the
  remaining amount. No banner.
- Critical, 90 to 99 percent: the bar takes the critical tint and a persistent banner
  appears below the heading, offering cleanup and capacity actions.
- Full, at 100 percent: a blocking dialog appears at the moment an action needs space,
  offering cleanup, a capacity pack and a subscription upgrade.
- The meter reports its state as a data attribute so each state is verifiable.
- Cleanup is not a separate view in this version. The cleanup action enters the existing
  batch selection mode with sort switched to size-descending, so the largest items are
  actionable first.

### Upload

- Upload progress renders inside the grid cell the file will occupy, extending the
  existing gallery-cell loading treatment. There is no floating upload queue, so there
  is no batch cancel and no pre-flight capacity check.
- An uploading cell shows the file name, a determinate progress bar and a cancel
  control.
- Files upload one at a time. Each file that fits is stored and the meter updates.
- When the quota is exhausted mid-batch, every remaining file becomes a quota failure.
  A quota-failure cell explains that space ran out and offers cleanup and capacity
  actions. Retrying without freeing or buying space is not offered, because it cannot
  succeed.
- An unsupported or corrupt file becomes a format failure. A format-failure cell offers
  choosing another file. The two failure kinds are distinguishable in the DOM.
- After a successful synthetic purchase, quota-failure cells are retried automatically
  and the user is not sent back to an unchanged page.

### Items

- A cell shows its thumbnail, a type-appropriate badge, the item name, and its type,
  file size and date. File size on the cell is required: it is the only information that
  makes a cleanup decision possible.
- Hovering a cell reveals a selection checkbox and an overflow menu.
- The overflow menu is grouped by intent and ends with the destructive action: open and
  details; duplicate and download; rename, move to folder; move to trash.
- Renaming happens in place on the item name.
- Opening an item shows the shared detail dialog with preview, metadata and the existing
  next-action choices.
- Deleting moves an item to trash and never deletes permanently from the grid. The
  confirmation copy says the item moves to trash and can be restored for 30 days.

### Folders

- Folders are available on the free plan. No folder capability is gated or metered.
- A Folders section sits above the item grid on Projects, Images, Videos and Uploads.
- A folder card shows its name, item count and the space it occupies.
- Creating a folder opens a small dialog with a pre-selected default name, a discard
  action and a confirm action.
- Opening a folder replaces the grid with that folder's contents and shows a breadcrumb
  back to the tab root.
- A folder can be renamed and deleted. Deleting a folder moves the folder and its
  contents to trash together, and the confirmation states the item count.
- Items move into folders through the overflow menu and the batch toolbar. Dragging is
  out of scope for this version.

### Trash

- Trash holds deleted items for 30 days.
- A banner states the policy in the user's terms: items are kept for 30 days and are
  then deleted permanently.
- Every trash card shows the days remaining. The last day is emphasised.
- Trash supports restore, delete forever, and empty all. Empty all requires
  confirmation.
- Restoring returns an item to the tab and folder it came from.
- Trash counts against the quota, and the trash banner says so, because a user who
  deletes to free space and sees no change would otherwise assume the meter is broken.
- Empty trash shows an educational empty state that states the 30-day policy.

### Purchase

- The purchase overlay opens from the meter's upgrade entry, the critical banner and the
  full dialog. All three lead to the same overlay.
- The overlay opens on the subscription path, which shows current usage, the plan
  benefit list with capacity included, monthly and yearly options, and a checkout
  action.
- A secondary entry, Expand storage only, switches to the capacity path without leaving
  the overlay. A back control returns to the subscription path.
- The capacity path offers two packs, plus 10 GB and plus 100 GB, with monthly and
  yearly billing.
- The capacity path states the resulting total, not only the increment, so the user sees
  what they will have rather than what they are adding.
- Both paths show a summary line with the amount due. Mid-cycle proration is shown as a
  synthetic line so the layout is reviewable.
- Checkout is inert. Confirming advances to a synthetic success state that updates the
  meter, closes the overlay, and retries any quota-failed uploads.
- The overlay shows a synthetic renewal date and an inert manage-renewal entry.

### Batch operations

- Selection mode uses the existing batch editing toolbar and select-all header.
- The toolbar supports download, move to folder and move to trash.
- The toolbar shows the number of selected items and the space they occupy, so the user
  can see the effect of a cleanup before committing to it.

### Responsive behaviour

- At desktop and compact-desktop widths the category rail is visible and the grid uses
  justified rows.
- At tablet width the rail is hidden, the grid becomes a two-column masonry, and the tab
  row stays horizontally reachable by dragging.
- The capacity meter, the critical banner and the purchase overlay must remain usable
  without horizontal overflow at every configured viewport.

### Review controls

- Because capacity states cannot be reached reliably by uploading real files during a
  review, the prototype exposes one review control that sets synthetic usage to normal,
  warning, critical or full. It is a prototype affordance, is visually marked as such,
  and has no production counterpart.
- Upload is reachable from an upload entry in the page actions as well as from the
  blocking dialog, so the full state can be demonstrated without first filling the
  library.

### Prototype simplifications

- Usage, quota, file sizes, dates, prices, renewal dates and upload durations are
  synthetic local values.
- Thumbnails and media are temporary PM mock assets.
- Upload uses local files only and never transmits them.
- The 30-day trash countdown is derived from synthetic timestamps and does not expire
  during a review session.

## Out of scope

- Sharing, collaboration, invitations, permissions and any multi-user surface.
- A floating upload queue, batch upload cancel and pre-flight capacity checks.
- Search, favourites and drag-into-folder.
- A dedicated manage-storage view. Cleanup reuses batch selection.
- Real payment, billing, proration calculation, tax, currency conversion and refunds.
- Real storage, quota enforcement, upload service, CDN, polling and persistence.
- Real authentication, entitlement, account state and cross-device sync.
- Production copy, final Figma and Designer-approved media.
