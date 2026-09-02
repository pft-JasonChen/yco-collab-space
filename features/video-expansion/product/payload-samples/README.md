# Engine payload samples (optional)

PM-owned. Put a de-identified sample here **only when the real engine request shape is
already known**, so RD can wire the API against it instead of deriving it from the
prototype. If the shape is not known yet, leave this folder empty — the task contract
still describes the inputs, their semantics and their bounds.

## Rules

- One `.json` file per request shape. Name it after what it submits.
- **De-identified.** `validate:inputs` fails the build on a bearer token, an
  `authorization`/`cookie` header, a credential-shaped key, a JWT, an AWS key, a real
  email address, or any URL outside `example.com` / `example.org`.
- Real task ids, user ids and file ids must be replaced with obvious placeholders.
- These files are never imported by the prototype and never reach the public build
  (`validate:public-build` rejects them).
- The prototype still calls no backend. A sample here is a recorded shape, not a call.
