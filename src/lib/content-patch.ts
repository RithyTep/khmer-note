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
 * Uses structural diffing to only track actual changes
 */
export function generateContentPatches(
  oldContent: Record<string, unknown>[] | null | undefined,
  newContent: Record<string, unknown>[] | null | undefined
): ContentPatchResult {
  const base = oldContent ?? [];
  const target = newContent ?? [];
  const patches: Patch[] = [];
  const inversePatches: Patch[] = [];

  // Create a map of old blocks by id for efficient lookup
  const oldBlocksById = new Map<string, { index: number; block: Record<string, unknown> }>();
  base.forEach((block, index) => {
    const id = block.id as string;
    if (id) oldBlocksById.set(id, { index, block });
  });

  // Track which old blocks are still present
  const usedOldIds = new Set<string>();

  // Generate patches for each block in the new content
  target.forEach((newBlock, newIndex) => {
    const blockId = newBlock.id as string;
    const oldEntry = blockId ? oldBlocksById.get(blockId) : undefined;

    if (!oldEntry) {
      // New block - add it
      patches.push({ op: "add", path: [newIndex], value: newBlock });
      inversePatches.push({ op: "remove", path: [newIndex] });
    } else {
      usedOldIds.add(blockId);
      // Existing block - check if it changed
      const oldBlock = oldEntry.block;
      const oldJson = JSON.stringify(oldBlock);
      const newJson = JSON.stringify(newBlock);
      
      if (oldJson !== newJson) {
        // Block content changed - replace it
        patches.push({ op: "replace", path: [newIndex], value: newBlock });
        inversePatches.push({ op: "replace", path: [newIndex], value: oldBlock });
      }
      // If position changed but content same, we still need to track it
      // but we don't need a patch since we're doing full array replacement
    }
  });

  // Find removed blocks
  oldBlocksById.forEach((entry, id) => {
    if (!usedOldIds.has(id)) {
      patches.push({ op: "remove", path: [entry.index], value: entry.block });
      inversePatches.push({ op: "add", path: [entry.index], value: entry.block });
    }
  });

  return { patches, inversePatches };
}

/**
 * Applies patches to existing content to produce new content
 * Handles our custom block-based patches
 */
export function applyContentPatches(
  content: Record<string, unknown>[] | null | undefined,
  patches: Patch[]
): Record<string, unknown>[] {
  const base = [...(content ?? [])];
  
  // Create a map of existing blocks by id
  const blocksById = new Map<string, Record<string, unknown>>();
  base.forEach((block) => {
    const id = block.id as string;
    if (id) blocksById.set(id, block);
  });

  // Apply patches
  for (const patch of patches) {
    const index = patch.path[0] as number;
    const value = patch.value as Record<string, unknown> | undefined;

    if (patch.op === "add" && value) {
      // Insert at position (or append if beyond length)
      if (index >= base.length) {
        base.push(value);
      } else {
        base.splice(index, 0, value);
      }
      const id = value.id as string;
      if (id) blocksById.set(id, value);
    } else if (patch.op === "replace" && value) {
      // Replace at position
      const oldBlock = base[index];
      if (oldBlock) {
        const oldId = oldBlock.id as string;
        if (oldId) blocksById.delete(oldId);
      }
      base[index] = value;
      const id = value.id as string;
      if (id) blocksById.set(id, value);
    } else if (patch.op === "remove") {
      // Remove by finding the block with matching id
      if (value) {
        const removeId = (value as Record<string, unknown>).id as string;
        if (removeId) {
          const removeIndex = base.findIndex((b) => b.id === removeId);
          if (removeIndex !== -1) {
            base.splice(removeIndex, 1);
            blocksById.delete(removeId);
          }
        }
      } else if (typeof index === "number" && index < base.length) {
        const removedBlock = base[index];
        base.splice(index, 1);
        const id = removedBlock?.id as string;
        if (id) blocksById.delete(id);
      }
    }
  }

  return base;
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
  threshold = 0.8 // Use patches if they're less than 80% of full content size
): boolean {
  if (!fullContent || fullContent.length === 0) return false;
  if (patches.length === 0) return false;

  const patchSize = estimatePatchSize(patches);
  const contentSize = JSON.stringify(fullContent).length;

  // Always use patches if content is large (>10KB)
  if (contentSize > 10000 && patchSize < contentSize) {
    return true;
  }

  return patchSize < contentSize * threshold;
}
