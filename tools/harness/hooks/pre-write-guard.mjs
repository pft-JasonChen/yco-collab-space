import { fromRoot } from '../../prototype-cli/project.mjs';
import { loadCollabMap } from '../../collab-space/policy.mjs';
import { readActiveWorkflow } from '../active-workflow.mjs';
import { decideWrite } from '../write-guard.mjs';
import { guarded, readStdinJson, respond } from './io.mjs';

// PreToolUse for Edit / Write / MultiEdit / NotebookEdit. Denies a write the active
// workflow's collab-space.map.yaml policy does not allow, with the reason Claude
// needs to pick the right workflow instead of retrying.
await guarded('pre-write-guard', async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path ?? input?.tool_input?.notebook_path;
  if (!filePath) return;

  const active = await readActiveWorkflow();
  if (!active) return;

  const decision = decideWrite({
    map: await loadCollabMap(),
    active,
    root: fromRoot(),
    filePath,
  });
  if (decision.allowed) return;

  respond({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: '[write-guard] ' + decision.reason,
    },
  });
});
