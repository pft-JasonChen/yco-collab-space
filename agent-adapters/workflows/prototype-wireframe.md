# Prototype Wireframe workflow

Input: one feature slug with confirmed Intake source.

Output: `features/<feature>/product/wireframe/<viewport>.html` — one static page per
configured viewport, plus `README.md` recording the layout decisions the PM took on it.

The wireframe exists so the PM can settle bands, ordering and density before a single
React file is generated. Cloud Storage's 2026-09-15 layout review, held against an
interactive wireframe, replaced an entire header band and removed three controls; doing
that on a generated prototype costs a full regeneration per pass.

## Boundary

- May write only `features/<feature>/product/wireframe/**`.
- No React, no shared component imports, no generated code. Token names may be quoted
  as labels; no token values and no raw colours are painted beyond greys.
- Excluded from the generation input hash; it is review material, not a source the
  generator reads.
- Decisions the PM takes on the wireframe are recorded by `prototype-revise` or
  `prototype-intake` into `surface-intent.yaml` and `decisions.md`. The wireframe README
  lists them so nothing is lost between the two steps.

## Procedure

1. Run `npm run feature:digest -- <feature>` and read the digest, `product/intake.md`
   and `product/surface-intent.yaml`.
2. Draw the at-rest composition only: every zone from the surface context as a labelled
   box, every at-rest component role as a labelled placeholder inside its zone, in the
   order the responsive priority states. Zones marked `on-interaction`, `conditional`
   or `deferred` appear as a one-line note, not as boxes.
3. Produce one page per viewport in `prototype.config.json`, plain HTML with inline
   CSS, greyscale, system font. Each box carries the zone or role id as visible text and
   as `data-surface-zone` / `data-component-role`, so the wireframe and the later
   prototype share a vocabulary.
4. Show the PM the desktop page first. Take the layout review in the conversation: band
   order, what leaves, what moves, what is missing. Apply each change to the wireframe
   and re-show.
5. Write `README.md` in the wireframe folder: the date, the decisions taken, in the
   words the PM used, and which source file each one belongs in.
6. Report the decision list and stop. Ask the PM whether to run `prototype-revise` to
   record the decisions into source, or `prototype-update` if nothing in source changed.

## Stop conditions

- Intake is not confirmed; there is no composition to draw.
- The PM asks for visual design (colour, type, imagery). That is Designer work and a
  design gap, not a wireframe change.
