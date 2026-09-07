# Video Tool layout rules

Keep upload or settings, processing feedback and video result as distinguishable
regions. The player is the primary result after processing. Feature-specific settings
may change the inspector but should not obscure progress or playback.

## Decision basis

The upload-to-processing-to-playback sequence is stable across video tools and provides
a useful starting pattern without defining the feature itself.


## What this version adds over 2026-08

2026-08 described the video workflow in prose and left the surrounding regions to each
feature, so composing the standard shell, History, detail dialog, uploaded-media block
and action footer all had to be recorded as deviations.

This version composes those regions from `platform/surfaces/pattern/**`. Following them
is now the pack's behaviour, not a departure from it. What remains a deviation is what
is genuinely specific to a feature: how it renders its working view, and any surface it
deliberately omits.
