import { resolveSurfaceContext } from "./surface-policy.mjs";
import { buildSharedComponentProvenance } from "../design-library/component-provenance.mjs";
import { integrityErrors, objectDigest } from "./content-integrity.mjs";
import {
  resourceProvenanceErrors,
  tokenProvenanceErrors,
} from "./resource-provenance.mjs";

// Rebuild current dependencies rather than trusting the paths in generation.json.
export async function generationEvidenceErrors(feature, generation, workspace) {
  try {
    const surface = await resolveSurfaceContext(feature, { workspace });
    const components = await buildSharedComponentProvenance(feature, workspace);
    return [
      ...surface.errors,
      ...(objectDigest(components) !== objectDigest(generation.components)
        ? ["Shared component provenance changed or incomplete"]
        : []),
      ...(!Array.isArray(generation.resources?.selected) ||
      !Array.isArray(generation.resources?.requestedCollections)
        ? ["Resource provenance is missing"]
        : []),
      ...(surface.context?.contextHash !== generation.surface?.contextHash
        ? ["Surface context changed since generation"]
        : []),
      ...(await resourceProvenanceErrors(generation.resources, workspace)),
      ...(await tokenProvenanceErrors(generation.tokens, workspace)),
      ...(await integrityErrors(feature, generation, {
        workspace,
        surface: surface.context,
        components,
      })),
    ];
  } catch (error) {
    return ["Generation evidence resolution failed: " + error.message];
  }
}
