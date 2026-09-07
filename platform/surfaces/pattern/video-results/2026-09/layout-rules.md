# Video Results layout rules

Two tabs over one result column: the working view, and History.

The segmented control keeps the intrinsic width RD gives it and is centred above the
body; it does not stretch. While a task runs, the History tab carries an activity dot
so the user can leave the working view and still see progress is happening.

The filter belongs to History and is composed here rather than inside the list, so a
feature cannot end up with two filters.

## Decision basis

Composing the filter at this level instead of inside the list is what stops each
video family from growing its own copy — the mistake `icon-action-buttons` already
corrected once for the result-action row.
