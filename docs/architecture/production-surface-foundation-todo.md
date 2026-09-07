# Production Surface Foundation — Post Video Expansion TODO

Status: queued after the Video Expansion manager-review prototype.

> This file states the goal and the six follow-up items. The sequenced execution plan —
> merged with the RD-handoff workstreams, with the recorded Product Owner decisions and
> the Phase A results — lives in
> [`2026-09-03-collab-space-execution-plan.md`](./2026-09-03-collab-space-execution-plan.md).

## Goal

Make production surface rules, conventions, architecture, and existing RD public/shared
components the default starting point for every future prototype. New UI is allowed
only after the repository audit confirms that no existing production component or
surface rule covers the need.

## Follow-up work

1. Build a YCO site map covering product routes, Result Page families, global shell,
   tool-family navigation, and shared modal/history flows.
2. Interview the Product Owner about navigation logic, naming conventions, responsive
   rules, route ownership, shared-surface boundaries, and known production exceptions.
3. Inventory RD composition chains from page entry through surface, layout, shared
   components, assets, and feature adapters.
4. Record reusable surface contracts for Tool Page, Video Results, History, Detail
   Modal, uploaded media, and action-footer patterns.
5. Add a production-component lookup checklist to prototype intake so an agent must
   document reuse evidence before generating feature UI.
6. Add visual and geometry parity fixtures for representative production surfaces.

## Exit condition

The next feature can resolve its page and surface composition from the site map and
surface catalog before any feature-specific UI is generated.
