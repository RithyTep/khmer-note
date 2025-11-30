"use client";

import {
  Search,
  Inbox,
  Settings2,
  X,
  Plus,
  LogOut,
  MoreHorizontal,
  Star,
  Link,
  Copy,
  Pencil,
  FolderInput,
  Trash2,
  ExternalLink,
  PanelRight,
  LucideIcon,
  Sun,
  Moon,
  Languages,
  Type,
  Maximize2,
  Lock,
  Unlock,
  Download,
  Upload,
  FileText,
  FileJson,
  Check,
  Globe,
  Share2,
} from "lucide-react";
import { useState, useRef, useCallback, memo, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useClickOutside, useEscapeKey, useLocale } from "@/hooks";
import { BREAKPOINTS } from "@/lib/constants";
import { localeNames } from "@/i18n/config";
import { useProjectStore } from "@/store/project.store";
import { trpc } from "@/lib/trpc";
import type { Project } from "@/types";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onToggleFavorite?: (projectId: string) => void;
  onDuplicateProject?: (projectId: string) => void;
  onRenameProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  user?: User;
  onSignOut?: () => void;
}

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
  shortcut?: string;
  iconClassName?: string;
}

const MenuItem = memo(function MenuItem({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  variant = "default",
  shortcut,
  iconClassName,
}: MenuItemProps) {
  const baseStyles = "w-full flex items-center gap-3 px-3 py-1.5 text-sm transition-colors";
  const variantStyles = {
    default: disabled
      ? "text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md",
    danger: "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]}`}
    >
      <Icon className={`w-4 h-4 ${iconClassName ?? ""}`} />
      <span>{label}</span>
      {shortcut && <span className="ml-auto text-xs text-zinc-400">{shortcut}</span>}
    </button>
  );
});

function MenuDivider() {
  return <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1 mx-3" />;
}

interface ProjectItemMenuProps {
  project: Project;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function ProjectItemMenu({
  project,
  onToggleFavorite,
  onDuplicate,
  onRename,
  onDelete,
}: ProjectItemMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showExportSubmenu, setShowExportSubmenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("projectMenu");

  const { updateProject, createProject } = useProjectStore();
  
  // tRPC mutation for immediate server sync
  const updateMutation = trpc.project.update.useMutation();

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setShowExportSubmenu(false);
  }, []);

  useClickOutside([menuRef, buttonRef], closeMenu, isOpen);
  useEscapeKey(closeMenu, isOpen);

  const handleAction = (action: () => void) => {
    action();
    closeMenu();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${project.id}`);
    closeMenu();
  };

  const handleOpenNewTab = () => {
    window.open(`/p/${project.id}`, "_blank");
    closeMenu();
  };

  const handleToggleSmallText = async () => {
    const newValue = !project.isSmallText;
    updateProject(project.id, { isSmallText: newValue });
    try {
      await updateMutation.mutateAsync({ id: project.id, isSmallText: newValue });
    } catch (error) {
      console.error("Failed to sync:", error);
    }
    closeMenu();
  };

  const handleToggleFullWidth = async () => {
    const newValue = !project.isFullWidth;
    updateProject(project.id, { isFullWidth: newValue });
    try {
      await updateMutation.mutateAsync({ id: project.id, isFullWidth: newValue });
    } catch (error) {
      console.error("Failed to sync:", error);
    }
    closeMenu();
  };

  const handleToggleLock = async () => {
    const newValue = !project.isLocked;
    updateProject(project.id, { isLocked: newValue });
    try {
      await updateMutation.mutateAsync({ id: project.id, isLocked: newValue });
    } catch (error) {
      console.error("Failed to sync:", error);
    }
    closeMenu();
  };

  const handleTogglePublish = async () => {
    const isPublishing = !project.isPublished;
    const publishedUrl = isPublishing ? `${window.location.origin}/public/${project.id}` : null;
    
    // Update local state
    updateProject(project.id, { 
      isPublished: isPublishing,
      publishedUrl,
    });
    
    // Sync to server immediately
    try {
      await updateMutation.mutateAsync({
        id: project.id,
        isPublished: isPublishing,
        publishedUrl,
      });
    } catch (error) {
      console.error("Failed to sync publish state:", error);
    }
    
    closeMenu();
  };

  const handleCopyPublishLink = async () => {
    const publicUrl = `${window.location.origin}/public/${project.id}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
    closeMenu();
  };

  const handleExportMarkdown = () => {
    try {
      let markdown = `# ${project.title}\n\n`;
      if (project.content) {
        const contentObj = typeof project.content === "string" 
          ? JSON.parse(project.content) 
          : project.content;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const convertToMarkdown = (node: any): string => {
          if (!node) return "";
          let result = "";
          switch (node.type) {
            case "doc":
              if (node.content) result = node.content.map(convertToMarkdown).join("\n");
              break;
            case "paragraph":
              if (node.content) result = node.content.map(convertToMarkdown).join("") + "\n";
              else result = "\n";
              break;
            case "heading": {
              const level = node.attrs?.level || 1;
              const text = node.content ? node.content.map(convertToMarkdown).join("") : "";
              result = `${"#".repeat(level)} ${text}\n`;
              break;
            }
            case "bulletList":
            case "orderedList":
              if (node.content) result = node.content.map(convertToMarkdown).join("");
              break;
            case "listItem":
              if (node.content) {
                const itemContent = node.content.map(convertToMarkdown).join("").trim();
                result = `- ${itemContent}\n`;
              }
              break;
            case "text":
              result = node.text || "";
              break;
            default:
              if (node.content) result = node.content.map(convertToMarkdown).join("");
              else if (node.text) result = node.text;
          }
          return result;
        };
        markdown += convertToMarkdown(contentObj);
      }
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title || "untitled"}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
    }
    closeMenu();
  };

  const handleExportJSON = () => {
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
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title || "untitled"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
    }
    closeMenu();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (file.name.endsWith(".json")) {
          const importData = JSON.parse(content);
          createProject(importData.title || "Imported Project", project.userId, importData.content);
        } else if (file.name.endsWith(".md") || file.name.endsWith(".txt")) {
          const title = file.name.replace(/\.(md|txt)$/, "") || "Imported Project";
          const lines = content.split("\n");
          const contentNodes = lines.map((line) => {
            if (line.startsWith("# ")) {
              return { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: line.slice(2) }] };
            } else if (line.startsWith("## ")) {
              return { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: line.slice(3) }] };
            } else if (line.startsWith("- ") || line.startsWith("* ")) {
              return { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: line.slice(2) }] }] }] };
            } else if (line.trim() === "") {
              return { type: "paragraph" };
            } else {
              return { type: "paragraph", content: [{ type: "text", text: line }] };
            }
          });
          createProject(title, project.userId, contentNodes as Record<string, unknown>[]);
        }
      } catch (error) {
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
    closeMenu();
  };

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 220),
      });
    }
    setIsOpen(!isOpen);
    setShowExportSubmenu(false);
  };

  const menuContent = isOpen && typeof document !== "undefined" ? createPortal(
    <div
      ref={menuRef}
      className="fixed w-52 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 py-1 z-[100]"
      style={{ top: menuPosition.top, left: menuPosition.left }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.md,.txt"
        onChange={handleFileImport}
        className="hidden"
      />

      <MenuItem
        icon={Star}
        label={project.isFavorite ? t("removeFavorite") : t("addFavorite")}
        onClick={() => handleAction(onToggleFavorite)}
        iconClassName={project.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}
      />

      <MenuDivider />

      <MenuItem icon={Link} label={t("copyLink")} onClick={handleCopyLink} />
      <MenuItem icon={Copy} label={t("duplicate")} onClick={() => handleAction(onDuplicate)} />
      <MenuItem icon={Pencil} label={t("rename")} onClick={() => handleAction(onRename)} />

      <MenuDivider />

      <MenuItem icon={FolderInput} label={t("moveTo")} onClick={() => {}} disabled shortcut="→" />
      <MenuItem icon={Trash2} label={t("trash")} onClick={() => handleAction(onDelete)} variant="danger" />

      <MenuDivider />

      {/* New Features */}
      <button
        onClick={handleToggleSmallText}
        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md transition-colors"
      >
        <Type className="w-4 h-4" />
        <span>{t("smallText")}</span>
        <div className={`ml-auto w-8 h-4 rounded-full ${project.isSmallText ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'} relative`}>
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${project.isSmallText ? 'right-0.5' : 'left-0.5'}`} />
        </div>
      </button>

      <button
        onClick={handleToggleFullWidth}
        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md transition-colors"
      >
        <Maximize2 className="w-4 h-4" />
        <span>{t("fullWidth")}</span>
        <div className={`ml-auto w-8 h-4 rounded-full ${project.isFullWidth ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'} relative`}>
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${project.isFullWidth ? 'right-0.5' : 'left-0.5'}`} />
        </div>
      </button>

      <button
        onClick={handleToggleLock}
        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md transition-colors"
      >
        {project.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        <span>{project.isLocked ? t("unlockPage") : t("lockPage")}</span>
        {project.isLocked && <Check className="w-4 h-4 ml-auto text-blue-500" />}
      </button>

      <MenuDivider />

      {/* Publish/Share Link */}
      <button
        onClick={handleTogglePublish}
        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{project.isPublished ? t("unpublish") : t("publishToWeb")}</span>
        <div className={`ml-auto w-8 h-4 rounded-full ${project.isPublished ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'} relative`}>
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${project.isPublished ? 'right-0.5' : 'left-0.5'}`} />
        </div>
      </button>

      {project.isPublished && (
        <button
          onClick={handleCopyPublishLink}
          className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>{t("copyPublicLink")}</span>
        </button>
      )}

      <MenuDivider />

      <MenuItem icon={Upload} label={t("import")} onClick={handleImportClick} />
      
      <div className="relative">
        <button
          onClick={() => setShowExportSubmenu(!showExportSubmenu)}
          className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{t("export")}</span>
          <span className="ml-auto text-zinc-400">›</span>
        </button>
        
        {showExportSubmenu && (
          <div className="absolute left-full top-0 ml-1 w-44 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 py-1 z-[101]">
            <button
              onClick={handleExportMarkdown}
              className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t("exportMarkdown")}
            </button>
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              <FileJson className="w-4 h-4" />
              {t("exportJSON")}
            </button>
          </div>
        )}
      </div>

      <MenuDivider />

      <MenuItem icon={ExternalLink} label={t("openNewTab")} onClick={handleOpenNewTab} shortcut="⌃" />
      <MenuItem icon={PanelRight} label={t("openSidePeek")} onClick={() => {}} disabled />
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggleMenu}
        className="p-1 rounded hover:bg-zinc-300/50 dark:hover:bg-zinc-700 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
      {menuContent}
    </div>
  );
}

interface ProjectItemProps {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const ProjectItem = memo(function ProjectItem({
  project,
  isSelected,
  onSelect,
  onToggleFavorite,
  onDuplicate,
  onRename,
  onDelete,
}: ProjectItemProps) {
  const selectedStyles = "bg-zinc-200/60 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium";
  const defaultStyles = "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100";

  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    onSelect();
  }, [onSelect]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer select-none ${
        isSelected ? selectedStyles : defaultStyles
      }`}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
    >
      <span className="text-base">{project.emoji}</span>
      <span className="truncate flex-1">{project.title}</span>
      <ProjectItemMenu
        project={project}
        onToggleFavorite={onToggleFavorite}
        onDuplicate={onDuplicate}
        onRename={onRename}
        onDelete={onDelete}
      />
    </div>
  );
});

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onDuplicateProject?: (id: string) => void;
  onRenameProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
}

function ProjectList({
  projects,
  selectedProjectId,
  onSelectProject,
  onToggleFavorite,
  onDuplicateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectListProps) {
  return (
    <div className="space-y-0.5">
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          isSelected={selectedProjectId === project.id}
          onSelect={() => onSelectProject(project.id)}
          onToggleFavorite={() => onToggleFavorite?.(project.id)}
          onDuplicate={() => onDuplicateProject?.(project.id)}
          onRename={() => onRenameProject?.(project.id)}
          onDelete={() => onDeleteProject?.(project.id)}
        />
      ))}
    </div>
  );
}

interface UserAvatarProps {
  user?: User;
}

function UserAvatar({ user }: UserAvatarProps) {
  if (user?.image) {
    return (
      <Image
        src={user.image}
        alt={user.name || "User"}
        width={24}
        height={24}
        className="rounded-full"
        loading="lazy"
      />
    );
  }

  return (
    <div className="w-6 h-6 bg-orange-500 rounded-full text-[10px] flex items-center justify-center text-white font-semibold shadow-sm">
      {user?.name?.charAt(0) || "K"}
    </div>
  );
}

interface NavButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  shortcut?: string;
}

const NavButton = memo(function NavButton({ icon: Icon, label, onClick, shortcut }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 py-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md transition-colors text-sm group"
    >
      <Icon className="w-4 h-4 group-hover:text-zinc-800 dark:group-hover:text-zinc-200" />
      <span>{label}</span>
      {shortcut && (
        <span className="ml-auto text-[10px] text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1 rounded">
          {shortcut}
        </span>
      )}
    </button>
  );
});

export const Sidebar = memo(function Sidebar({
  isOpen,
  onClose,
  onOpenSearch,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onToggleFavorite,
  onDuplicateProject,
  onRenameProject,
  onDeleteProject,
  user,
  onSignOut,
}: SidebarProps) {
  const favoriteProjects = useMemo(() => projects.filter((p) => p.isFavorite), [projects]);
  const otherProjects = useMemo(() => projects.filter((p) => !p.isFavorite), [projects]);
  const t = useTranslations("sidebar");
  const { theme, setTheme } = useTheme();
  const { locale, toggleLocale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wrap onSelectProject to close sidebar on mobile
  const handleSelectProject = useCallback((projectId: string) => {
    onSelectProject(projectId);
    // Close sidebar on mobile (check if window width is less than md breakpoint)
    if (typeof window !== "undefined" && window.innerWidth < BREAKPOINTS.MOBILE) {
      onClose();
    }
  }, [onSelectProject, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col flex-shrink-0 transition-transform duration-300 fixed md:static z-30 h-full select-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-3 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2 p-2 text-left group">
            <UserAvatar user={user} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-zinc-700 dark:text-zinc-200">
                {user?.name || "Camnova"}
              </p>
              <p className="text-[10px] text-zinc-400 truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {mounted && (
              <>
                <button
                  onClick={toggleLocale}
                  className="p-2 text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  title={localeNames[locale]}
                >
                  <Languages className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  title="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="md:hidden p-2 text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-3 pb-2 space-y-0.5">
          <NavButton icon={Search} label={t("search")} onClick={onOpenSearch} shortcut="⌘K" />
          <NavButton icon={Inbox} label={t("inbox")} />
          <NavButton icon={Settings2} label={t("settings")} />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {favoriteProjects.length > 0 && (
            <div>
              <h3 className="px-2 text-xs font-semibold text-zinc-400 mb-1 tracking-tight">
                {t("favorites")}
              </h3>
              <ProjectList
                projects={favoriteProjects}
                selectedProjectId={selectedProjectId}
                onSelectProject={handleSelectProject}
                onToggleFavorite={onToggleFavorite}
                onDuplicateProject={onDuplicateProject}
                onRenameProject={onRenameProject}
                onDeleteProject={onDeleteProject}
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <h3 className="text-xs font-semibold text-zinc-400 tracking-tight">
                {t("allNotes")}
              </h3>
              <button
                onClick={onCreateProject}
                className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50 rounded transition-colors"
                title={t("createNote")}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {otherProjects.length > 0 ? (
              <ProjectList
                projects={otherProjects}
                selectedProjectId={selectedProjectId}
                onSelectProject={handleSelectProject}
                onToggleFavorite={onToggleFavorite}
                onDuplicateProject={onDuplicateProject}
                onRenameProject={onRenameProject}
                onDeleteProject={onDeleteProject}
              />
            ) : projects.length === 0 ? (
              <p className="text-xs text-zinc-400 px-2 py-2">{t("noNotes")}</p>
            ) : null}
          </div>
        </div>

        {onSignOut && (
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>{t("signOut")}</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
});
