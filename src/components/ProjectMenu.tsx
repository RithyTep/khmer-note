"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  MoreHorizontal,
  Star,
  Link,
  Copy,
  Pencil,
  FolderInput,
  Trash2,
  ExternalLink,
  PanelRight,
  Share2,
  Globe,
  Type,
  Maximize2,
  Palette,
  Lock,
  Unlock,
  MessageSquare,
  Languages,
  Undo2,
  Download,
  Upload,
  BookOpen,
  Check,
  FileJson,
  FileText,
} from "lucide-react";
import { useProjectStore } from "@/store/project.store";

// Content node type for markdown conversion
type ContentNode = {
  type: string;
  content?: ContentNode[];
  text?: string;
  attrs?: { level?: number };
};

interface ProjectMenuProps {
  projectId: string;
  projectTitle: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onDelete: () => void;
  onOpenInNewTab: () => void;
  onShowToast?: (message: string) => void;
}

export function ProjectMenu({
  projectId,
  projectTitle,
  isFavorite,
  onToggleFavorite,
  onDuplicate,
  onRename,
  onDelete,
  onOpenInNewTab,
  onShowToast,
}: ProjectMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showExportSubmenu, setShowExportSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("projectMenu");

  const { projects, updateProject, createProject } = useProjectStore();
  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowExportSubmenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setShowExportSubmenu(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/p/${projectId}`;
    navigator.clipboard.writeText(url);
    onShowToast?.(t("linkCopied"));
    setIsOpen(false);
  };

  const handleSharePublish = () => {
    onShowToast?.(t("comingSoon"));
    setIsOpen(false);
  };

  // Toggle Small Text
  const handleToggleSmallText = useCallback(() => {
    if (!project) return;
    updateProject(projectId, { isSmallText: !project.isSmallText });
    onShowToast?.(
      project.isSmallText ? t("normalTextEnabled") : t("smallTextEnabled")
    );
    setIsOpen(false);
  }, [project, projectId, updateProject, t, onShowToast]);

  // Toggle Full Width
  const handleToggleFullWidth = useCallback(() => {
    if (!project) return;
    updateProject(projectId, { isFullWidth: !project.isFullWidth });
    onShowToast?.(
      project.isFullWidth ? t("normalWidthEnabled") : t("fullWidthEnabled")
    );
    setIsOpen(false);
  }, [project, projectId, updateProject, t, onShowToast]);

  // Toggle Lock
  const handleToggleLock = useCallback(() => {
    if (!project) return;
    updateProject(projectId, { isLocked: !project.isLocked });
    onShowToast?.(
      project.isLocked ? t("pageUnlocked") : t("pageLocked")
    );
    setIsOpen(false);
  }, [project, projectId, updateProject, t, onShowToast]);

  // Export as Markdown
  const handleExportMarkdown = useCallback(() => {
    if (!project) return;
    try {
      let markdown = `# ${project.title || projectTitle}\n\n`;

      if (project.content) {
        const contentObj =
          typeof project.content === "string"
            ? JSON.parse(project.content)
            : project.content;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const convertToMarkdown = (node: any): string => {
          if (!node) return "";
          let result = "";

          switch (node.type) {
            case "doc":
              if (node.content) {
                result = node.content.map(convertToMarkdown).join("\n");
              }
              break;
            case "paragraph":
              if (node.content) {
                result = node.content.map(convertToMarkdown).join("") + "\n";
              } else {
                result = "\n";
              }
              break;
            case "heading": {
              const level = node.attrs?.level || 1;
              const headingText = node.content
                ? node.content.map(convertToMarkdown).join("")
                : "";
              result = `${"#".repeat(level)} ${headingText}\n`;
              break;
            }
            case "bulletList":
              if (node.content) {
                result = node.content.map(convertToMarkdown).join("");
              }
              break;
            case "orderedList":
              if (node.content) {
                result = node.content
                  .map((n: ContentNode, i: number) => {
                    const itemText = convertToMarkdown(n);
                    return itemText.replace(/^- /, `${i + 1}. `);
                  })
                  .join("");
              }
              break;
            case "listItem":
              if (node.content) {
                const itemContent = node.content
                  .map(convertToMarkdown)
                  .join("")
                  .trim();
                result = `- ${itemContent}\n`;
              }
              break;
            case "text":
              result = node.text || "";
              break;
            case "codeBlock": {
              const codeText = node.content
                ? node.content.map(convertToMarkdown).join("")
                : "";
              result = `\`\`\`\n${codeText}\n\`\`\`\n`;
              break;
            }
            case "blockquote":
              if (node.content) {
                const quoteText = node.content
                  .map(convertToMarkdown)
                  .join("")
                  .trim();
                result = `> ${quoteText}\n`;
              }
              break;
            case "horizontalRule":
              result = "---\n";
              break;
            default:
              if (node.content) {
                result = node.content.map(convertToMarkdown).join("");
              } else if (node.text) {
                result = node.text;
              }
          }
          return result;
        };

        markdown += convertToMarkdown(contentObj);
      }

      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title || projectTitle || "untitled"}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onShowToast?.(t("exportedMarkdown"));
    } catch (error) {
      console.error("Export error:", error);
      onShowToast?.("Failed to export");
    }
    setIsOpen(false);
    setShowExportSubmenu(false);
  }, [project, projectTitle, t]);

  // Export as JSON
  const handleExportJSON = useCallback(() => {
    if (!project) return;
    try {
      const exportData = {
        title: project.title,
        content: project.content,
        emoji: project.emoji,
        cover: project.cover,
        isSmallText: project.isSmallText,
        isFullWidth: project.isFullWidth,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title || projectTitle || "untitled"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onShowToast?.(t("exportedJSON"));
    } catch (error) {
      console.error("Export error:", error);
      onShowToast?.("Failed to export");
    }
    setIsOpen(false);
    setShowExportSubmenu(false);
  }, [project, projectTitle, t]);

  // Import
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !project) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;

          if (file.name.endsWith(".json")) {
            const importData = JSON.parse(content);
            createProject(
              importData.title || "Imported Project",
              project.userId,
              importData.content
            );
            onShowToast?.(t("importedSuccess"));
          } else if (file.name.endsWith(".md") || file.name.endsWith(".txt")) {
            const title = file.name.replace(/\.(md|txt)$/, "") || "Imported Project";
            const lines = content.split("\n");
            const contentNodes = lines.map((line) => {
              if (line.startsWith("# ")) {
                return {
                  type: "heading",
                  attrs: { level: 1 },
                  content: [{ type: "text", text: line.slice(2) }],
                };
              } else if (line.startsWith("## ")) {
                return {
                  type: "heading",
                  attrs: { level: 2 },
                  content: [{ type: "text", text: line.slice(3) }],
                };
              } else if (line.startsWith("### ")) {
                return {
                  type: "heading",
                  attrs: { level: 3 },
                  content: [{ type: "text", text: line.slice(4) }],
                };
              } else if (line.startsWith("- ") || line.startsWith("* ")) {
                return {
                  type: "bulletList",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: line.slice(2) }],
                        },
                      ],
                    },
                  ],
                };
              } else if (line.trim() === "") {
                return { type: "paragraph" };
              } else {
                return {
                  type: "paragraph",
                  content: [{ type: "text", text: line }],
                };
              }
            });

            createProject(
              title,
              project.userId,
              contentNodes as Record<string, unknown>[]
            );
            onShowToast?.(t("importedSuccess"));
          }
        } catch (error) {
          console.error("Import error:", error);
          onShowToast?.("Failed to import file");
        }
      };
      reader.readAsText(file);

      event.target.value = "";
      setIsOpen(false);
    },
    [project, createProject, t, onShowToast]
  );

  const menuItems = [
    {
      icon: Star,
      label: isFavorite ? t("removeFavorite") : t("addFavorite"),
      onClick: () => {
        onToggleFavorite();
        setIsOpen(false);
      },
      filled: isFavorite,
    },
    { type: "divider" as const },
    {
      icon: Share2,
      label: t("sharePublish"),
      onClick: handleSharePublish,
    },
    {
      icon: Globe,
      label: t("publishLink"),
      onClick: handleSharePublish,
      disabled: true,
    },
    {
      icon: Link,
      label: t("copyLink"),
      onClick: handleCopyLink,
    },
    {
      icon: Copy,
      label: t("duplicate"),
      onClick: () => {
        onDuplicate();
        setIsOpen(false);
      },
    },
    { type: "divider" as const },
    {
      icon: Pencil,
      label: t("rename"),
      onClick: () => {
        onRename();
        setIsOpen(false);
      },
    },
    {
      icon: FolderInput,
      label: t("moveTo"),
      onClick: () => setIsOpen(false),
      disabled: true,
    },
    {
      icon: Trash2,
      label: t("trash"),
      onClick: () => {
        onDelete();
        setIsOpen(false);
      },
      danger: true,
    },
    { type: "divider" as const },
    {
      icon: Type,
      label: t("smallText"),
      onClick: handleToggleSmallText,
      toggle: true,
      checked: project?.isSmallText,
    },
    {
      icon: Maximize2,
      label: t("fullWidth"),
      onClick: handleToggleFullWidth,
      toggle: true,
      checked: project?.isFullWidth,
    },
    {
      icon: Palette,
      label: t("customizePage"),
      onClick: () => setIsOpen(false),
      disabled: true,
    },
    { type: "divider" as const },
    {
      icon: project?.isLocked ? Unlock : Lock,
      label: project?.isLocked ? t("unlockPage") : t("lockPage"),
      onClick: handleToggleLock,
    },
    {
      icon: MessageSquare,
      label: t("suggestEdits"),
      onClick: () => setIsOpen(false),
      disabled: true,
    },
    {
      icon: Languages,
      label: t("translate"),
      onClick: () => setIsOpen(false),
      disabled: true,
    },
    { type: "divider" as const },
    {
      icon: Undo2,
      label: t("undo"),
      onClick: () => setIsOpen(false),
      disabled: true,
      shortcut: "⌘Z",
    },
    {
      icon: Upload,
      label: t("import"),
      onClick: handleImportClick,
    },
    {
      icon: Download,
      label: t("export"),
      onClick: () => setShowExportSubmenu(!showExportSubmenu),
      hasSubmenu: true,
    },
    { type: "divider" as const },
    {
      icon: BookOpen,
      label: t("turnIntoWiki"),
      onClick: () => setIsOpen(false),
      disabled: true,
    },
    { type: "divider" as const },
    {
      icon: ExternalLink,
      label: t("openNewTab"),
      onClick: () => {
        onOpenInNewTab();
        setIsOpen(false);
      },
      shortcut: "⌃",
    },
    {
      icon: PanelRight,
      label: t("openSidePeek"),
      onClick: () => setIsOpen(false),
      disabled: true,
    },
  ];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.md,.txt"
        onChange={handleFileImport}
        className="hidden"
      />

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50 max-h-[70vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {menuItems.map((item, index) => {
            if (item.type === "divider") {
              return <div key={index} className="h-px bg-zinc-100 dark:bg-zinc-700 my-1" />;
            }

            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  item.disabled
                    ? "text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                    : item.danger
                    ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    item.filled ? "fill-yellow-400 text-yellow-400" : ""
                  }`}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.toggle && (
                  <div className={`w-8 h-4 rounded-full ${item.checked ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'} relative`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${item.checked ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                )}
                {item.hasSubmenu && (
                  <span className="text-zinc-400">›</span>
                )}
                {item.shortcut && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.shortcut}</span>
                )}
              </button>
            );
          })}

          {/* Export Submenu */}
          {showExportSubmenu && (
            <div className="absolute left-full top-0 ml-1 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              <button
                onClick={handleExportMarkdown}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <FileText className="h-4 w-4" />
                {t("exportMarkdown")}
              </button>
              <button
                onClick={handleExportJSON}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <FileJson className="h-4 w-4" />
                {t("exportJSON")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
