import { loadCollabMap, workflowPolicy } from '../../collab-space/policy.mjs';
import { parseWorkflowPrompt, writeActiveWorkflow } from '../active-workflow.mjs';
import { guarded, readStdinJson } from './io.mjs';

// UserPromptSubmit. When the user types a /prototype-* command, record the active
// workflow so the write guard and the stop hook know what is running, and put the
// writable paths in front of Claude before it reads anything else.
await guarded('prompt-workflow', async () => {
  const input = await readStdinJson();
  const parsed = parseWorkflowPrompt(input?.prompt);
  if (!parsed) return;

  const state = await writeActiveWorkflow(parsed);
  const map = await loadCollabMap();
  const hasPolicy = map.workflows.some((workflow) => workflow.id === state.workflow);
  const lines = [
    '[workflow] Active: ' + state.workflow + ' for ' + state.feature + '.',
  ];

  if (hasPolicy) {
    const policy = workflowPolicy(map, state.workflow, { feature: state.feature });
    lines.push('Writable: ' + policy.writablePaths.join(', ') + '.');
    lines.push('Protected: ' + policy.protectedPaths.join(', ') + '.');
  } else {
    lines.push('No file writes are allowed in this workflow; use the CLI it documents.');
  }

  lines.push('Edits outside the writable paths are denied by the write guard.');
  process.stdout.write(lines.join(' ') + '\n');
});
