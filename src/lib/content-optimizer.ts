type BlockNoteBlock = {
  id?: string;
  type?: string;
  props?: Record<string, unknown>;
  content?: unknown[];
  children?: BlockNoteBlock[];
};

const DEFAULT_PROPS: Record<string, unknown> = {
  backgroundColor: "default",
  textColor: "default",
  textAlignment: "left",
  level: 1,
};

const REMOVABLE_EMPTY_KEYS = ["styles", "children", "content"];

function isEmptyObject(obj: unknown): boolean {
  return (
    obj !== null &&
    typeof obj === "object" &&
    !Array.isArray(obj) &&
    Object.keys(obj as object).length === 0
  );
}

function isEmptyArray(arr: unknown): boolean {
  return Array.isArray(arr) && arr.length === 0;
}

function optimizeProps(props: Record<string, unknown>): Record<string, unknown> | undefined {
  const optimized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (DEFAULT_PROPS[key] === value) continue;
    if (isEmptyObject(value) || isEmptyArray(value)) continue;
    optimized[key] = value;
  }

  return Object.keys(optimized).length > 0 ? optimized : undefined;
}

function optimizeInlineContent(content: unknown[]): unknown[] | undefined {
  if (!Array.isArray(content) || content.length === 0) return undefined;

  const optimized = content.map((item) => {
    if (typeof item !== "object" || item === null) return item;

    const obj = item as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (key === "styles" && isEmptyObject(value)) continue;
      result[key] = value;
    }

    return result;
  });

  return optimized.length > 0 ? optimized : undefined;
}

function optimizeBlock(block: BlockNoteBlock): BlockNoteBlock {
  const optimized: BlockNoteBlock = {};

  if (block.id) optimized.id = block.id;
  if (block.type) optimized.type = block.type;

  if (block.props) {
    const optimizedProps = optimizeProps(block.props);
    if (optimizedProps) optimized.props = optimizedProps;
  }

  if (block.content && Array.isArray(block.content) && block.content.length > 0) {
    const optimizedContent = optimizeInlineContent(block.content);
    if (optimizedContent) optimized.content = optimizedContent;
  }

  if (block.children && Array.isArray(block.children) && block.children.length > 0) {
    optimized.children = block.children.map(optimizeBlock);
  }

  return optimized;
}

export function optimizeContent(
  content: Record<string, unknown>[] | null | undefined
): Record<string, unknown>[] | undefined {
  if (!content || !Array.isArray(content)) return undefined;
  if (content.length === 0) return undefined;

  return content.map((block) => optimizeBlock(block as BlockNoteBlock));
}

export function deoptimizeBlock(block: BlockNoteBlock): BlockNoteBlock {
  return {
    id: block.id,
    type: block.type || "paragraph",
    props: {
      backgroundColor: "default",
      textColor: "default",
      textAlignment: "left",
      ...block.props,
    },
    content: block.content || [],
    children: block.children?.map(deoptimizeBlock) || [],
  };
}

export function deoptimizeContent(
  content: Record<string, unknown>[] | null | undefined
): Record<string, unknown>[] | null {
  if (!content || !Array.isArray(content)) return null;
  if (content.length === 0) return null;

  return content.map((block) => deoptimizeBlock(block as BlockNoteBlock));
}
