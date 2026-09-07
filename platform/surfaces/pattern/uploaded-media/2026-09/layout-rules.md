# Uploaded Media layout rules

One block with two states. Empty shows the accepted formats and limits; loaded shows
the thumbnail, the duration, and the actions.

Remove and replace are the shared actions. A feature may inject exactly one action of
its own through the action slot — Video Expansion injects Trim. Rebuilding the block
to add more is not the intended path; propose a shared change instead.

## Decision basis

Constraining features to one injected action is what keeps the block recognisable
across tools. Video Expansion needed only Trim, and that is the evidence the slot is
wide enough.
