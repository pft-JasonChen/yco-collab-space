/** Shared plumbing for Claude Code hook scripts: read the event, answer, never crash the session. */
export async function readStdinJson() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function respond(payload) {
  process.stdout.write(JSON.stringify(payload) + '\n');
}

/**
 * A hook that throws would surface as a harness error on every tool call. Fail
 * open with a note on stderr instead; the deterministic gates still run later.
 */
export async function guarded(label, run) {
  try {
    await run();
  } catch (error) {
    process.stderr.write('[' + label + '] hook skipped: ' + error.message + '\n');
    process.exitCode = 0;
  }
}
