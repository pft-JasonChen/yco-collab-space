# Intake rubric

Applied by an independent reviewer (a different model from the one that wrote the
source, or a human) after `npm run validate:intake` passes. The deterministic gate
proves the files are well formed; this rubric asks whether they will produce a
prototype a manager can decide on and RD can build from. Output validates against
`tools/prototype-cli/schemas/intake-review.schema.json`.

Score each dimension `pass`, `fail` or `unknown`, and quote the line that decided it.
A reason without a quoted line is not a reason. `unknown` when the evidence is missing;
never guess a pass.

| Id | Question | Pass when | Fail when |
|---|---|---|---|
| `review-goal-decidable` | Can a manager answer the review goal with one decision after using the prototype? | `intake.md` Review goal names the decision and what the manager will see to make it. | The goal is a feature list, or says "approve the design" with no decision named. |
| `scope-traceable` | Does every scope bullet map to at least one contract state or action? | Each `intake.md` Scope bullet can be pointed at a state or action id in `prototype.contract.yaml`. | A scope bullet has no state or action that would exercise it. |
| `acceptance-testable` | Is every acceptance criterion a given／when／then that a selector can assert? | Each `acceptance[]` entry names an observable outcome and `validation.yaml` asserts it with a selector, not prose. | A `then` says "works correctly" or the matching check only asserts the page loads. |
| `decisions-evidenced` | Does every decision have a basis a reader can check? | Each `## Decisions` bullet has a matching `## Decision basis` entry that cites the brief, an RD surface, a PM statement with a date, or a competitor observation with its evidence level. | A decision's only basis is "the PM prefers it" with no date, or a competitor claim the brief marks as inferred is cited as observed. |
| `open-decisions-honest` | Is "Open product decisions: None" true? | No sentence elsewhere in `intake.md`, `prd.md` or the brief's Confirm-with-PM list is still phrased as a question or "to be confirmed". | An unanswered question survives in the PRD or the brief while intake says None. |
| `reuse-resolved` | Is every role resolved with evidence that names the catalogue entry or the search that found nothing? | Each `componentReuse[]` evidence names a component id, an RD path, or the audit that came up empty. | Evidence is "no component exists" with nothing searched, or a `feature-only` role duplicates a catalogued component's states. |
| `presence-declared` | Are dialogs, menus, empty states and viewport-dependent chrome marked in `presence`, with the criterion that reaches them? | Every role whose description says dialog, menu, banner, empty, drawer or breadcrumb is `on-interaction`, `conditional` or `deferred`, and `via` names a real criterion. | Such a role is left at rest, or a `deferred` entry has no reason. |

Overall `status` is `pass` only when every dimension passes. One `fail` returns the
package to the PM with the quoted line; it does not go to generation.

## Calibration

Before a model's verdict is used as a gate, score three intake packages with a PM label
and a model label and compare. Disagreements on `decisions-evidenced` and
`open-decisions-honest` are the ones to expect; tighten the pass wording, not the model.

## Decision basis

- The deterministic intake gate catches structure, not judgement. The failures cloud
  storage's four review passes corrected were judgement failures: a scope item with no
  state behind it, a decision reversed without its basis being updated.
- Quoting the deciding line makes the review checkable by the PM in seconds and keeps a
  cheap judge honest.
