# History List layout rules

One card per result, newest first. A card carries its feature tags, its date, the
media, and the shared action row.

The action row is not the feature's to rebuild. Like and dislike are mutually
exclusive and clear on re-click; edit and download are delegated to the consumer.
Processing and failed states occupy the same footprint as a completed card.

## Decision basis

RD owns this row once, in `video-feature/icon-action-buttons`, and consumes it from
both the History card and the detail dialog. Video History and Video Info Dialog each
rebuilt it before 2026-09-02; this pattern exists so that cannot recur.
