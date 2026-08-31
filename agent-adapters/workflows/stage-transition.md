# Stage transition workflow

Input: one feature slug and one requested target stage.

1. Read `collab-space.map.yaml`, the feature `releases.json`, current
   `generated/generation.json`, design gaps and product design reference.
2. Explain in natural language what the target stage means and who must approve it.
3. Show the exact evidence being approved: current input hash, token package/version,
   selected Design Library files, PM temporary assets and unresolved gaps.
4. For `design-final`, stop if Figma/design reference is not final, any gap is not
   resolved, a PM temporary asset is selected, or tokens are not RD-compatible.
5. Wait for explicit confirmation from the named human role. Never treat earlier chat
   agreement or manager feedback as this transition approval.
6. Record it with:

   ```bash
   npm run stage:transition -- --feature <feature> --to <stage> --actor <actor> --confirm
   ```

7. If another actor is required, report the remaining approval. Do not impersonate it.
8. After completion, report the frozen evidence hash. `rd-handoff` and `qa-spec` are
   parallel outputs from the same design-final revision.

Humans should not edit `releases.json` directly. The CLI is an internal mechanism;
PM／Designer may ask the Agent in ordinary language to move to the next review stage.
