# Detail Modal layout rules

A split dialog: media on one side, metadata and Next Action on the other.

Next Action lists cross-tool destinations for this result. An action with no handler
renders disabled rather than being hidden, so the set stays stable between features.
The action row is the same shared row the History card uses, without edit.

## Decision basis

RD's next-action block reuses `icon-action-buttons` with a three-action set while the
History card uses four. Both draw from one component, which is why the sets can differ
without the presentation drifting.
