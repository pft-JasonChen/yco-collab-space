# Handoff: Claude Code → Codex (code-to-Figma sync)

## Who's doing what

- **Claude Code** (me, in this repo) makes the actual code changes — fixing components in `platform/ui/**`, features in `features/**`, based on live feedback from the designer comparing the running prototype against Figma.
- **Codex** (you) reads what Claude changed and pushes the matching updates back into the Figma file, so Figma and the code stay in sync without the designer having to describe every pixel fix twice.

## Where everything is

- **Repo (local, on this machine):** `/Users/marukoting/Claude/Projects/yco-collab-space`
- **Repo (GitHub):** `https://github.com/pft-JasonChen/yco-collab-space`, branch `main`
- **Figma file:** `https://www.figma.com/design/jb5SgyshmuPse0L7IFm0QO/YCO_Tool-Pages` (file key `jb5SgyshmuPse0L7IFm0QO`)

## The sync queue — your main input

Every time Claude finishes a fix, it appends one entry to:

```
design-library/figma-sync-queue.json
```

Each entry looks like this:

```json
{
  "id": "2026-09-15-ratio-icon-size",
  "status": "pending",
  "component": "ratio",
  "componentYaml": "design-library/components/ratio/component.yaml",
  "figmaNodeId": "15012-276926",
  "property": "option icon wrapper size",
  "from": "36px outer box / 22px inner icon (padding 7px each side)",
  "to": "32px outer box / 18px inner icon (same 7px padding)",
  "commit": "4da2d78",
  "sourceFile": "platform/ui/ratio/Ratio.module.scss",
  "note": "optional extra context"
}
```

**Field meanings:**

- `figmaNodeId` — the Figma node to open. When this is `null`, no exact node was given during the live feedback session — Claude matched the fix against a screenshot only. **In that case, find the right frame yourself and treat the fix as a best-effort candidate to verify, not a confirmed target.**
- `from` / `to` — the actual value change, in plain language. This is the thing to reproduce in Figma.
- `commit` — the git commit where this landed. Use `git show <commit> -- <sourceFile>` to see the real diff if `from`/`to` alone isn't enough.
- `componentYaml` — when set, this component's `decisionBasis` list has a longer, fuller explanation of the fix (why, exact quote from the designer, any caveats). Read it if `from`/`to` is ambiguous.
- `note` — anything Claude flagged as uncertain or needing your own verification against Figma directly (Claude did not have Figma tool access during this session).

## Your workflow, per entry

1. Open the Figma node (`figmaNodeId`, if given) at the file above.
2. Read `from` → `to`. If unclear, check `componentYaml`'s `decisionBasis` (search for the date/quote) and/or `git show <commit>`.
3. Apply the equivalent change in Figma (resize, restyle, reposition, whatever `to` describes).
4. Update the entry's `"status"` in `design-library/figma-sync-queue.json`:
   - `"done"` — applied, matches.
   - `"needs-discussion"` — you found a mismatch, or the code's fix doesn't look right against the real Figma frame; add a `"codexNote"` field explaining what you found.
5. Commit the queue file update yourself (or hand it back — whichever workflow you and the designer prefer).

## Important notes

- Entries with `figmaNodeId: null` or a `note` asking you to "find the frame" mean Claude worked from a screenshot comparison only, not a Figma node reference. Treat these as lower-confidence — verify against the real frame before applying.
- Some entries aren't visual values at all — e.g. `2026-09-15-generate-cta-sticky-rule` is a **layout behavior** (CSS `position: sticky`, no static Figma value to copy). For those, just confirm the reference frame still matches the described behavior; there's nothing to "set" in Figma beyond that.
- If you find a `component.yaml`'s `rd.portability` field is `reference` rather than `verbatim`, that means the code has deliberately diverged from RD's real (production) source for that file — check `decisionBasis` for why before assuming it's a bug.
- Today's batch (all under commit `4da2d78`) covers: Ratio icon size/gap/typography/border, the (previously unreachable) `image_extender` variant, UploadMediaBlock's video thumbnail icons, the Generate CTA's sticky behavior + removed box/shadow styling, and video-expansion's canvas card border/shadow + fill-height sizing.

## Going forward

This queue file is meant to be a living hand-off — Claude will keep appending new entries after each future fix. You don't need this whole document again; just re-read `design-library/figma-sync-queue.json` for anything with `"status": "pending"`.
