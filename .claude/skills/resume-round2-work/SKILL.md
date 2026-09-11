---
name: resume-round2-work
description: Resume the yco-collab-space component-foundation-pilot Round 2 work (sidebar, empty-image, upload-media-block) in a brand-new Claude Code session with no prior context. Use this whenever the user asks to "continue" the round 2 work, asks what's left to do on the pilot components, or opens a new session on this project after the PR is opened.
---

# Resume: component-foundation-pilot — Round 2

This project is `yco-collab-space`. This skill exists because a previous
session did a large batch of Round 2 work and the user wanted a way to pick it
back up from a **fresh** Claude Code session (no conversation history). Read
this whole file before doing anything else.

## 0. Orient yourself first

```bash
git status
git branch --show-current
git log --oneline -5
gh pr view feat/component-foundation-pilot-round2 2>/dev/null || echo "gh not installed — check GitHub in a browser instead"
```

The branch should be `feat/component-foundation-pilot-round2`, already pushed
to `origin`, with a PR open against `main` (title: "Round 2: Sidebar, Empty
Image, Upload Media Block"). If `git status` shows uncommitted changes, that
means someone (you, in a later turn) made further edits without committing —
check `git diff` before doing anything else so you don't lose or duplicate
work.

**If the PR shows as merged**: Round 2 is done and shipped. Run
`git fetch origin && git checkout main && git merge origin/main` to catch up,
then ask the user what Round 3 should cover (see the pilot component list in
the "What's left" section below) rather than assuming there's more Round 2
work.

## 1. Governance model (read before touching anything)

This repo uses a `component-foundation-pilot` workflow defined in
`collab-space.map.yaml`. Key rule: `platform/ui/**`, `.storybook/**`,
`design-library/**`, `tools/design-library/**`, and `package.json` are open
for `[pm, designer, rd, agent]` to edit directly. `features/{feature}/product`,
`features/{feature}/generated`, `platform/tokens/rd`, and `.env` are normally
**agent-regeneration-only** — Round 2 made a few direct, PM-approved exceptions
to `features/video-expansion/generated/**` (each one has an in-file comment
explaining why and flagging it for `prototype-update` reconciliation with RD).
Don't revert those comments; if you make further direct edits to a `generated/`
file, follow the same pattern (comment explaining why + flag for RD).

**Git workflow discipline**: branch before pushing, never push `main` directly.
Once a branch is shared (pushed / has an open PR), merge — don't rebase — to
avoid rewriting shared history. Before branching from `main`, verify local
`main` is actually caught up with `origin/main` (`git fetch` + `git log
main..origin/main`), since `git fetch` alone doesn't move the local `main`
pointer.

**Credentials**: never enter a username/password/PAT/token yourself. If a git
or `gh` command needs auth, stop and ask the user to run it (or sign in) in
their own terminal/browser.

## 2. What Round 2 actually changed

Read the PR body (`gh pr view feat/component-foundation-pilot-round2 --json
body -q .body`, or open the PR on GitHub) for the full list. Short version:

- **Result Page Shell / sidebar**: fixed active-item color (was the only place
  using `--text-information` instead of `--text-brand`), added real
  hover/press/active-hover/active-press states, rebuilt divider + spacing to
  match Figma exactly, split `defaultToolFamilies` into its own file (Fast
  Refresh fix), flattened `ai-agent.svg`'s gradient.
- **New `platform/ui/empty-image`**: Figma's "Empty Image" illustration
  (node 13023:12548 in file `jb5SgyshmuPse0L7IFm0QO`... no wait, `EmptyImage`'s
  Figma source is `JXNIQPJT9I9qFrgtiaCn4i` node 13023:12548), all ~10 types x
  base/sunken. Only wired into Video Expansion's `type="video"` case so far.
- **`platform/ui/upload-media-block`**: extended with
  `type="startEnd"/"multiple"/"template"` + toggle/error/hint rows, covering
  Figma file `jb5SgyshmuPse0L7IFm0QO` nodes 4515:64126 / 10525:145816.
  `type="single"` (the original/default) is unchanged.
- **`platform/ui/video-results-surface`**: fixed a wrong token
  (`--fill-weaker` → `--fill-weak`) and a real CSS specificity bug where
  `features/video-expansion`'s own `button, input { font: inherit }` reset
  was silently beating the tabs' own font-weight.
- **`platform/runtime/PrototypeFrame` + `ResultPageShell`**: fixed the
  prototype banner's height stacking on top of `ResultPageShell`'s hardcoded
  `100vh`, which pushed footer content below the fold. `ResultPageShell` now
  sizes to `100%` of its parent instead of the raw viewport.
- **`features/video-expansion/generated/**`**: wired in `EmptyImage` and the
  real `Button` (was a hand-rolled 48px button matching none of Button's 4
  official sizes), removed a redundant divider, fixed panel spacing to
  16px/8px, inherited the two fixes above.

A companion Figma "Before/After Meeting Visual" board (file
`e0sBSn4WS0ITnrN4ZK231Q`, node 7:2 — **not a spec file**, just a
Notion/meeting-prep artifact, not part of the repo) has a
`component:round-2-summary` text section documenting the changes above in the
same table format as the existing Button/Credit Controls/Ratio sections. It
has no before/after screenshots yet (unlike the other sections) — only the
change-summary table. If the user wants full before/after screenshots added
for Round 2 too, that needs the same Playwright-based screenshot pipeline used
for the earlier sections (git worktree at a specific commit, isolated dev
server, `deviceScaleFactor: 2-3`, forced white background before capture) —
ask before setting that up again, it's a real chunk of work.

## 3. What's still open / likely next

- **PR review**: check whether Jason/RD has commented or approved
  `feat/component-foundation-pilot-round2`. Address review feedback the same
  way Round 1 (PR #3) was handled — evidence-based answers grounded in git
  history/token lookups, not guesses.
- **Remaining pilot components not yet started** (per the original component
  list): Icon Action Buttons, Tool Page Layout, Video History, Video Info
  Dialog, Video Results Surface (partially touched this round — only the tab
  bug, not a full pass), Video Timeline, Video Trim Modal.
- **`EmptyImage` is only wired into one consumer** (Video Expansion's
  `type="video"`, `background="base"`). The other ~9 types have real Figma
  specs and assets already downloaded to
  `design-library/assets/icon/yco-empty-state/` but no feature uses them yet —
  wire in a new type only when an actual feature needs it (per the
  established "don't build ahead of real consumers" convention from this
  project).
- **Open background task** (may or may not still be pending — check
  `/tasks` or ask the user): provenance.yaml gap for `yco-result-page-shell`
  and `yco-online-editor` asset collections — explicitly out of scope for
  Round 1/2, tracked as a follow-up, not yet actioned as of Round 2.
- **Not yet written down anywhere durable**: the Button-size convention
  (4 fixed sizes; composites override their own wrapper locally with a
  hardcoded, Figma-cited value; promote to an official size only once 3+
  unrelated components independently need the same value). Consider adding
  it to `platform/ui/button/component.yaml`'s `decisionBasis` or a
  `docs/design-system/` note if the user wants it recorded.

## 4. How to verify anything locally

Two dev servers, both already configured in `.claude/launch.json`:

```
preview_start name="collab-space"   # port 5177 — the actual app / Video Expansion feature page
preview_start name="storybook"      # port 6006 — Storybook for platform/ui components
```

**If a fix "doesn't take" after editing and restarting normally**: this repo
hit a real Vite/Storybook on-disk transform cache bug during Round 2 — clearing
`node_modules/.cache/storybook` and `node_modules/.vite*` and restarting fixed
it both times. Check that before assuming a fresh bug.

Useful URLs once the servers are up:
- `http://127.0.0.1:5177/features/video-expansion/` — the real feature page
- `http://localhost:6006/?path=/story/ui-empty-image--all-variants` — every
  EmptyImage type/background combo in one grid
- `http://localhost:6006/?path=/story/ui-upload-media-block--start-and-end-filled`
  (and `--multiple-images`, `--template`, `--with-error`) — the new
  UploadMediaBlock variants

Console errors mentioning `defaultToolFamilies` or a stale gradient/color on
`ai-agent.svg` are almost certainly the stale-cache issue above, not a live
regression — verify with a fresh network request / `getComputedStyle` before
concluding otherwise (this tripped up the previous session more than once).
