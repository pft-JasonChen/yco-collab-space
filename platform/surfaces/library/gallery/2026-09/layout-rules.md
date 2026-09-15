# My Gallery layout rules

Use the RD `/account/gallery` composition: authenticated header, optional category rail,
page heading, sticky media-family tabs and a justified result grid. Each tab must be
able to show both populated and empty content without requesting history data.

## Removed production dependencies

History APIs, polling, task detail fetches, Redux red dots, Next.js routing, account
state, downloads, CMS categories and analytics are excluded.
