import { produce, enablePatches, applyPatches, Patch } from "immer";

// Enable patches for Immer
enablePatches();

export type { Patch };

export interface ContentPatchResult {
  patches: Patch[];
  inversePatches: Patch[];
}

/**
 * Generates patches representing the difference between old and new content
 * These patches are much smaller than sending the full content
 */
export function generateContentPatches(
  oldContent: Record<string, unknown>[] | null | undefined,
  newContent: Record<string, unknown>[] | null | undefined
): ContentPatchResult {
  const base = oldContent ?? [];
  const patches: Patch[] = [];
  const inversePatches: Patch[] = [];

  produce(
    base,
    (draft) => {
      // Clear existing content and add new
      draft.length = 0;
      if (newContent) {
        for (const block of newContent) {
          draft.push(block as Record<string, unknown>);
        }
      }
    },
    (p, ip) => {
      patches.push(...p);
      inversePatches.push(...ip);
    }
  );

  return { patches, inversePatches };
}

/**
 * Applies patches to existing content to produce new content
 */
export function applyContentPatches(
  content: Record<string, unknown>[] | null | undefined,
  patches: Patch[]
): Record<string, unknown>[] {
  const base = content ?? [];
  return applyPatches(base, patches);
}

/**
 * Optimizes patches by removing redundant operations
 * For example, multiple "replace" operations on the same path can be merged
 */
export function optimizePatches(patches: Patch[]): Patch[] {
  if (patches.length === 0) return patches;

  const pathMap = new Map<string, Patch>();

  for (const patch of patches) {
    const pathKey = patch.path.join("/");

    if (patch.op === "replace" || patch.op === "add") {
      // Keep only the latest replace/add for the same path
      pathMap.set(pathKey, patch);
    } else if (patch.op === "remove") {
      // If we previously added/replaced at this path, just remove both
      if (pathMap.has(pathKey)) {
        const existing = pathMap.get(pathKey)!;
        if (existing.op === "add") {
          pathMap.delete(pathKey);
        } else {
          pathMap.set(pathKey, patch);
        }
      } else {
        pathMap.set(pathKey, patch);
      }
    }
  }

  return Array.from(pathMap.values());
}

/**
 * Estimates the size of patches in bytes (rough estimation)
 */
export function estimatePatchSize(patches: Patch[]): number {
  return JSON.stringify(patches).length;
}

/**
 * Determines if it's more efficient to send patches vs full content
 * Returns true if patches should be used
 */
export function shouldUsePatch(
  patches: Patch[],
  fullContent: Record<string, unknown>[] | null | undefined,
  threshold = 0.5 // Use patches if they're less than 50% of full content size
): boolean {
  if (!fullContent || fullContent.length === 0) return false;
  if (patches.length === 0) return false;

  const patchSize = estimatePatchSize(patches);
  const contentSize = JSON.stringify(fullContent).length;

  return patchSize < contentSize * threshold;
}
