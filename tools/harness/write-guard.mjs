import path from 'node:path';
import {
  isWorkflowPathWritable,
  workflowPolicy,
} from '../collab-space/policy.mjs';

/** Repository-relative posix path, or null when the file is outside the repository. */
export function relativeToRoot(root, filePath) {
  const relative = path.relative(path.resolve(root), path.resolve(filePath));
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  return relative.split(path.sep).join('/');
}

/**
 * The same rule `collab-space.map.yaml` states for each workflow, applied at the
 * moment a file is about to be written instead of after the run. No active
 * workflow means the harness is not in a prototype command and stays out of the way.
 */
export function decideWrite({ map, active, root, filePath }) {
  if (!active) {
    return { allowed: true, reason: 'no active prototype workflow' };
  }

  const relative = relativeToRoot(root, filePath);
  if (relative === null) {
    return { allowed: true, reason: 'outside the repository' };
  }

  const known = map.workflows.some((workflow) => workflow.id === active.workflow);
  if (!known) {
    return {
      allowed: false,
      reason:
        active.workflow +
        ' has no writable paths in collab-space.map.yaml. Use the CLI the workflow documents, ' +
        'or run `npm run workflow:end` if this edit belongs outside the workflow.',
    };
  }

  const policy = workflowPolicy(map, active.workflow, { feature: active.feature });
  if (isWorkflowPathWritable(policy, relative)) {
    return { allowed: true, reason: 'writable during ' + active.workflow };
  }

  return {
    allowed: false,
    reason:
      relative +
      ' is not writable during ' +
      active.workflow +
      ' for ' +
      active.feature +
      '. Writable paths: ' +
      policy.writablePaths.join(', ') +
      '. If the change belongs to a different workflow, start that /prototype-* command; ' +
      'if it is unrelated to any workflow, run `npm run workflow:end` first.',
  };
}
