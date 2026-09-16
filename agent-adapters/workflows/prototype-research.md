# Prototype Research workflow

Input: one feature slug and the PM's one-line statement of the need. Optional: the
competitor products the PM wants examined, and any account the PM has already opened.

Output: `features/<feature>/product/research/brief.md`, in the format of
`features/_template/product/research/brief.md`. Nothing else is written.

Research is optional. A small change that reuses an existing surface can go straight to
Intake. Run it when the feature introduces a page pattern, a purchase or capacity
model, or any behaviour that competitors have already shaped user expectations for.

## Boundary

- May write only `features/<feature>/product/research/**` and `docs/research/**`.
- Never edits `product/**` source files, `generated/**`, `platform/**` or the Design
  Library.
- The brief is excluded from the generation input hash, so writing it never stales an
  existing prototype.
- Never logs in, creates accounts, accepts terms or enters credentials on a competitor
  site. A page that needs a signed-in account the PM has not already opened is recorded
  as unobserved.

## Procedure

1. Create the feature folder if it does not exist:

   ```bash
   npm run prototype:create -- <feature> "<Feature title>"
   ```

2. Production audit first. Read `platform/surfaces/site-map.yaml`,
   `platform/surfaces/catalog.yaml`, `platform/surfaces/shared-surfaces.yaml` and the
   output of `npm run library:components`. Record under `## Production audit`:
   - `### Existing` — the RD surfaces, modules and shared components that already cover
     part of the need, by catalogue id;
   - `### Missing` — the parts with no RD counterpart. These are what the review will
     concentrate on.
3. Competitive teardown, delegated to the research sub-agent where the adapter supports
   one, so competitor pages never enter the main context. For each competitor, record
   what was observed first-hand, on which account tier, and what is inferred. The
   `## Evidence` table is mandatory and is the first thing a reader checks.
4. Derive `## UX principles`: each principle names the competitor lesson or the RD
   convention it comes from.
5. Write `## Recommendations`. Every item ends with `source:` naming the competitor
   pattern, the RD surface or the PM statement it derives from, and says whether it
   reuses, adapts or departs from the existing YCO pattern. An item without a source is
   not written.
6. Write `## Confirm with PM`: the questions the brief cannot answer from evidence
   (real usage numbers, pricing, taxonomy that needs the product's own tool list).
7. Set `- Status: draft`. Show the PM the Recommendations and Confirm-with-PM sections
   in the conversation. When the PM confirms, set `- Status: confirmed`.
8. Run:

   ```bash
   npm run validate:intake -- --feature <feature>
   ```

   A confirmed brief must pass the brief rules; a draft only needs its sections.

9. Report: which recommendations the PM adopted, which were rejected and why, and the
   open questions Intake must resolve. Do not start Intake unless the PM asks.

## Stop conditions

- The PM has not named a problem or a target user; research has nothing to aim at.
- A competitor can only be observed by logging in with credentials the PM has not
  already entered themselves.
- The production audit cannot be completed because the catalogue or site map is
  missing; report it rather than guessing.
