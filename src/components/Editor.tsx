"use client";

import { useCallback, memo, useMemo, useEffect } from "react";
import {
  filterSuggestionItems,
  insertOrUpdateBlock,
  PartialBlock,
  BlockNoteEditor,
} from "@blocknote/core";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  DefaultReactSuggestionItem,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useTheme } from "next-themes";

import {
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Quote,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Table,
  Image,
} from "lucide-react";

type EditorType = BlockNoteEditor;

const alertTypes = {
  info: { icon: Info, color: "#3b82f6", bg: "#eff6ff", label: "ព័ត៌មាន" },
  success: { icon: CheckCircle, color: "#22c55e", bg: "#f0fdf4", label: "ជោគជ័យ" },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "#fffbeb", label: "ការព្រមាន" },
  error: { icon: AlertCircle, color: "#ef4444", bg: "#fef2f2", label: "កំហុស" },
  tip: { icon: Lightbulb, color: "#8b5cf6", bg: "#faf5ff", label: "គន្លឹះ" },
};

function insertAlert(editor: EditorType, type: keyof typeof alertTypes) {
  const config = alertTypes[type];
  insertOrUpdateBlock(editor, {
    type: "paragraph",
    props: {
      textColor: type === "info" ? "blue" : type === "success" ? "green" : type === "warning" ? "yellow" : type === "error" ? "red" : "purple",
      backgroundColor: type === "info" ? "blue" : type === "success" ? "green" : type === "warning" ? "yellow" : type === "error" ? "red" : "purple",
    },
    content: [{ type: "text", text: `${config.label}: `, styles: { bold: true } }],
  });
}

function getCustomSlashMenuItems(editor: EditorType): DefaultReactSuggestionItem[] {
  const customItems: DefaultReactSuggestionItem[] = [
    {
      title: "ក្បាលអត្ថបទ ១",
      subtext: "ចំណងជើងធំ",
      onItemClick: () => {
        insertOrUpdateBlock(editor, { type: "heading", props: { level: 1 } });
      },
      aliases: ["h1", "heading1", "title"],
      group: "ចំណងជើង",
      icon: <Heading1 size={18} />,
    },
    {
      title: "ក្បាលអត្ថបទ ២",
      subtext: "ចំណងជើងមធ្យម",
      onItemClick: () => {
        insertOrUpdateBlock(editor, { type: "heading", props: { level: 2 } });
      },
      aliases: ["h2", "heading2", "subtitle"],
      group: "ចំណងជើង",
      icon: <Heading2 size={18} />,
    },
    {
      title: "ក្បាលអត្ថបទ ៣",
      subtext: "ចំណងជើងតូច",
      onItemClick: () => {
        insertOrUpdateBlock(editor, { type: "heading", props: { level: 3 } });
      },
      aliases: ["h3", "heading3"],
      group: "ចំណងជើង",
      icon: <Heading3 size={18} />,
    },
    {
      title: "បញ្ជីចំណុច",
      subtext: "បង្កើតបញ្ជីចំណុច",
      onItemClick: () => {
        insertOrUpdateBlock(editor, { type: "bulletListItem" });
      },
      aliases: ["ul", "bullet", "list"],
      group: "បញ្ជី",
      icon: <List size={18} />,
    },
    {
      title: "បញ្ជីលេខ",
      subtext: "បង្កើតបញ្ជីលេខ",
      onItemClick: () => {
        insertOrUpdateBlock(editor, { type: "numberedListItem" });
      },
      aliases: ["ol", "numbered", "list"],
      group: "បញ្ជី",
      icon: <ListOrdered size={18} />,
    },
    {
      title: "បញ្ជីធីក",
      subtext: "បង្កើតបញ្ជីធីក",
      onItemClick: () => {
        insertOrUpdateBlock(editor, { type: "checkListItem" });
      },
      aliases: ["todo", "checkbox", "checklist"],
      group: "បញ្ជី",
      icon: <CheckSquare size={18} />,
    },
    {
      title: "សម្រង់",
      subtext: "សម្រង់អត្ថបទ",
      onItemClick: () => {
        insertOrUpdateBlock(editor, {
          type: "paragraph",
          props: { textColor: "gray" },
          content: [{ type: "text", text: "", styles: { italic: true } }],
        });
      },
      aliases: ["quote", "blockquote"],
      group: "មូលដ្ឋាន",
      icon: <Quote size={18} />,
    },
    {
      title: "កូដ",
      subtext: "បន្ទប់កូដ",
      onItemClick: () => {
        insertOrUpdateBlock(editor, { type: "codeBlock" });
      },
      aliases: ["code", "codeblock", "programming"],
      group: "មូលដ្ឋាន",
      icon: <Code size={18} />,
    },
    {
      title: "តារាង",
      subtext: "បន្ថែមតារាង",
      onItemClick: () => {
        insertOrUpdateBlock(editor, {
          type: "table",
          content: {
            type: "tableContent",
            rows: [
              { cells: [[], [], []] },
              { cells: [[], [], []] },
              { cells: [[], [], []] },
            ],
          },
        });
      },
      aliases: ["table", "grid"],
      group: "កម្រិតខ្ពស់",
      icon: <Table size={18} />,
    },
    {
      title: "រូបភាព",
      subtext: "បន្ថែមរូបភាព",
      onItemClick: () => {
        insertOrUpdateBlock(editor, { type: "image" });
      },
      aliases: ["image", "img", "picture", "photo"],
      group: "ឯកសារ",
      icon: <Image size={18} />,
    },
    {
      title: "ព័ត៌មាន",
      subtext: "បន្ទប់ព័ត៌មាន (ខៀវ)",
      onItemClick: () => insertAlert(editor, "info"),
      aliases: ["info", "note", "callout"],
      group: "ការជូនដំណឹង",
      icon: <Info size={18} className="text-blue-500" />,
    },
    {
      title: "ជោគជ័យ",
      subtext: "បន្ទប់ជោគជ័យ (បៃតង)",
      onItemClick: () => insertAlert(editor, "success"),
      aliases: ["success", "done", "complete"],
      group: "ការជូនដំណឹង",
      icon: <CheckCircle size={18} className="text-green-500" />,
    },
    {
      title: "ការព្រមាន",
      subtext: "បន្ទប់ព្រមាន (លឿង)",
      onItemClick: () => insertAlert(editor, "warning"),
      aliases: ["warning", "caution", "alert"],
      group: "ការជូនដំណឹង",
      icon: <AlertTriangle size={18} className="text-yellow-500" />,
    },
    {
      title: "កំហុស",
      subtext: "បន្ទប់កំហុស (ក្រហម)",
      onItemClick: () => insertAlert(editor, "error"),
      aliases: ["error", "danger", "important"],
      group: "ការជូនដំណឹង",
      icon: <AlertCircle size={18} className="text-red-500" />,
    },
    {
      title: "គន្លឹះ",
      subtext: "បន្ទប់គន្លឹះ (ស្វាយ)",
      onItemClick: () => insertAlert(editor, "tip"),
      aliases: ["tip", "hint", "idea"],
      group: "ការជូនដំណឹង",
      icon: <Lightbulb size={18} className="text-purple-500" />,
    },
  ];

  return customItems;
}

interface EditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
  editable?: boolean;
  editorRef?: React.MutableRefObject<BlockNoteEditor | null>;
}

export const Editor = memo(function Editor({
  initialContent,
  onChange,
  editable = true,
  editorRef,
}: EditorProps) {
  const { resolvedTheme } = useTheme();
  const editor = useCreateBlockNote({
    initialContent: initialContent
      ? (initialContent as PartialBlock[])
      : undefined,
  });

  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  const handleChange = useCallback(() => {
    if (onChange) {
      onChange(editor.document as PartialBlock[]);
    }
  }, [editor, onChange]);

  return (
    <div className="blocknote-wrapper">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor), query)
          }
        />
      </BlockNoteView>
      <style jsx global>{`
        .blocknote-wrapper {
          width: 100%;
        }
        .blocknote-wrapper .bn-editor {
          padding: 0;
          font-family: inherit;
        }
        .blocknote-wrapper .bn-block-content {
          font-size: 16px;
          line-height: 1.8;
        }
        .blocknote-wrapper [data-content-type="heading"] {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .blocknote-wrapper [data-level="1"] .bn-inline-content {
          font-size: 2em;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .blocknote-wrapper [data-level="2"] .bn-inline-content {
          font-size: 1.5em;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .blocknote-wrapper [data-level="3"] .bn-inline-content {
          font-size: 1.25em;
          font-weight: 600;
        }
        .blocknote-wrapper .bn-side-menu {
          left: -48px;
        }
        .blocknote-wrapper .bn-block-group .bn-block-group {
          margin-left: 1.5em;
        }

        /* Checklist styling */
        .blocknote-wrapper [data-content-type="checkListItem"] {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .blocknote-wrapper [data-content-type="checkListItem"] input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin-top: 4px;
          accent-color: #3b82f6;
          cursor: pointer;
        }
        .blocknote-wrapper [data-content-type="checkListItem"][data-checked="true"] .bn-inline-content {
          text-decoration: line-through;
          color: #9ca3af;
        }

        /* Code block styling */
        .blocknote-wrapper [data-content-type="codeBlock"] {
          background: #1e1e1e;
          border-radius: 8px;
          padding: 16px;
          margin: 8px 0;
          overflow-x: auto;
        }
        .blocknote-wrapper [data-content-type="codeBlock"] code {
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.6;
          color: #d4d4d4;
        }

        /* Table styling */
        .blocknote-wrapper [data-content-type="table"] {
          margin: 16px 0;
          border-collapse: collapse;
          width: 100%;
        }
        .blocknote-wrapper [data-content-type="table"] td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          min-width: 100px;
        }
        .blocknote-wrapper [data-content-type="table"] tr:first-child td {
          background: #f9fafb;
          font-weight: 500;
        }

        /* Bullet list styling */
        .blocknote-wrapper [data-content-type="bulletListItem"]::before {
          content: "•";
          color: #6b7280;
          font-weight: bold;
          margin-right: 8px;
        }

        /* Numbered list styling */
        .blocknote-wrapper [data-content-type="numberedListItem"] {
          counter-increment: list-counter;
        }

        /* Image styling */
        .blocknote-wrapper [data-content-type="image"] {
          margin: 16px 0;
        }
        .blocknote-wrapper [data-content-type="image"] img {
          border-radius: 8px;
          max-width: 100%;
        }

        /* Slash menu styling */
        .bn-suggestion-menu {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12);
          padding: 8px;
          max-height: 400px;
          overflow-y: auto;
        }
        .bn-suggestion-menu-item {
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background 0.15s;
        }
        .bn-suggestion-menu-item:hover,
        .bn-suggestion-menu-item[data-hovered="true"] {
          background: #f3f4f6;
        }
        .bn-suggestion-menu-item-title {
          font-weight: 500;
          font-size: 14px;
          color: #1f2937;
        }
        .bn-suggestion-menu-item-subtitle {
          font-size: 12px;
          color: #6b7280;
        }
        .bn-suggestion-menu-label {
          padding: 8px 12px 4px;
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Formatting toolbar styling */
        .bn-formatting-toolbar {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          padding: 4px;
        }
        .bn-formatting-toolbar button {
          padding: 6px 8px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .bn-formatting-toolbar button:hover {
          background: #f3f4f6;
        }
        .bn-formatting-toolbar button[data-active="true"] {
          background: #e5e7eb;
        }

        /* Side menu styling */
        .bn-side-menu {
          opacity: 0;
          transition: opacity 0.15s;
        }
        .bn-block-outer:hover .bn-side-menu,
        .bn-side-menu:hover {
          opacity: 1;
        }
        .bn-side-menu button {
          padding: 4px;
          border-radius: 6px;
          color: #9ca3af;
          transition: all 0.15s;
        }
        .bn-side-menu button:hover {
          background: #f3f4f6;
          color: #4b5563;
        }

        /* Drag handle */
        .bn-drag-handle {
          cursor: grab;
        }
        .bn-drag-handle:active {
          cursor: grabbing;
        }

        /* Placeholder styling */
        .bn-block-content[data-is-empty-and-focused="true"]::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        /* Link styling */
        .bn-inline-content a {
          color: #3b82f6;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .bn-inline-content a:hover {
          color: #2563eb;
        }

        /* Selection styling */
        .bn-editor ::selection {
          background: #dbeafe;
        }

        /* Color backgrounds */
        [data-background-color="blue"] {
          background: #eff6ff !important;
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          margin: 8px 0;
        }
        [data-background-color="green"] {
          background: #f0fdf4 !important;
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 4px solid #22c55e;
          margin: 8px 0;
        }
        [data-background-color="yellow"] {
          background: #fffbeb !important;
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
          margin: 8px 0;
        }
        [data-background-color="red"] {
          background: #fef2f2 !important;
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 4px solid #ef4444;
          margin: 8px 0;
        }
        [data-background-color="purple"] {
          background: #faf5ff !important;
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 4px solid #8b5cf6;
          margin: 8px 0;
        }
        [data-background-color="gray"] {
          background: #f9fafb !important;
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 4px solid #9ca3af;
          margin: 8px 0;
        }

        /* Dark mode overrides */
        :global(.dark) .bn-editor {
          background-color: transparent !important;
        }
        :global(.dark) .bn-suggestion-menu {
          background: #18181b;
          border-color: #27272a;
        }
        :global(.dark) .bn-suggestion-menu-item:hover,
        :global(.dark) .bn-suggestion-menu-item[data-hovered="true"] {
          background: #27272a;
        }
        :global(.dark) .bn-suggestion-menu-item-title {
          color: #e4e4e7;
        }
        :global(.dark) .bn-suggestion-menu-item-subtitle {
          color: #a1a1aa;
        }
        :global(.dark) .bn-formatting-toolbar {
          background: #18181b;
          border-color: #27272a;
        }
        :global(.dark) .bn-formatting-toolbar button:hover {
          background: #27272a;
        }
        :global(.dark) .bn-formatting-toolbar button[data-active="true"] {
          background: #3f3f46;
        }
        :global(.dark) .bn-side-menu button:hover {
          background: #27272a;
          color: #e4e4e7;
        }
        :global(.dark) .blocknote-wrapper [data-content-type="table"] td {
          border-color: #27272a;
        }
        :global(.dark) .blocknote-wrapper [data-content-type="table"] tr:first-child td {
          background: #27272a;
        }
        :global(.dark) [data-background-color="blue"] {
          background: rgba(59, 130, 246, 0.1) !important;
        }
        :global(.dark) [data-background-color="green"] {
          background: rgba(34, 197, 94, 0.1) !important;
        }
        :global(.dark) [data-background-color="yellow"] {
          background: rgba(245, 158, 11, 0.1) !important;
        }
        :global(.dark) [data-background-color="red"] {
          background: rgba(239, 68, 68, 0.1) !important;
        }
        :global(.dark) [data-background-color="purple"] {
          background: rgba(139, 92, 246, 0.1) !important;
        }
        :global(.dark) [data-background-color="gray"] {
          background: rgba(156, 163, 175, 0.1) !important;
        }
      `}</style>
    </div>
  );
});
