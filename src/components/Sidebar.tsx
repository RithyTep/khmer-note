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
} from "lucide-react";
import { useState, useRef, useCallback, memo, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useClickOutside, useEscapeKey } from "@/hooks/useClickOutside";
import { UI_TEXT } from "@/lib/constants";
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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  useClickOutside([menuRef, buttonRef], closeMenu, isOpen);
  useEscapeKey(closeMenu, isOpen);

  const handleAction = (action: () => void) => {
    action();
    closeMenu();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?project=${project.id}`);
    closeMenu();
  };

  const handleOpenNewTab = () => {
    window.open(`/?project=${project.id}`, "_blank");
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
  };

  const { PROJECT_MENU } = UI_TEXT;

  const menuContent = isOpen && typeof document !== "undefined" ? createPortal(
    <div
      ref={menuRef}
      className="fixed w-52 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 py-1 z-[100]"
      style={{ top: menuPosition.top, left: menuPosition.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <MenuItem
        icon={Star}
        label={project.isFavorite ? PROJECT_MENU.REMOVE_FAVORITE : PROJECT_MENU.ADD_FAVORITE}
        onClick={() => handleAction(onToggleFavorite)}
        iconClassName={project.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}
      />

      <MenuDivider />

      <MenuItem icon={Link} label={PROJECT_MENU.COPY_LINK} onClick={handleCopyLink} />
      <MenuItem icon={Copy} label={PROJECT_MENU.DUPLICATE} onClick={() => handleAction(onDuplicate)} />
      <MenuItem icon={Pencil} label={PROJECT_MENU.RENAME} onClick={() => handleAction(onRename)} />

      <MenuDivider />

      <MenuItem icon={FolderInput} label={PROJECT_MENU.MOVE_TO} onClick={() => {}} disabled shortcut="→" />
      <MenuItem icon={Trash2} label={PROJECT_MENU.TRASH} onClick={() => handleAction(onDelete)} variant="danger" />

      <MenuDivider />

      <MenuItem icon={ExternalLink} label={PROJECT_MENU.OPEN_NEW_TAB} onClick={handleOpenNewTab} shortcut="⌃" />
      <MenuItem icon={PanelRight} label={PROJECT_MENU.OPEN_SIDE_PEEK} onClick={() => {}} disabled />
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

  return (
    <div
      onClick={onSelect}
      className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer [touch-action:manipulation] ${
        isSelected ? selectedStyles : defaultStyles
      }`}
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
  const { SIDEBAR } = UI_TEXT;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wrap onSelectProject to close sidebar on mobile
  const handleSelectProject = useCallback((projectId: string) => {
    onSelectProject(projectId);
    // Close sidebar on mobile (check if window width is less than md breakpoint)
    if (typeof window !== "undefined" && window.innerWidth < 768) {
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
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md transition-colors"
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
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
          <NavButton icon={Search} label={SIDEBAR.SEARCH} onClick={onOpenSearch} shortcut="⌘K" />
          <NavButton icon={Inbox} label={SIDEBAR.INBOX} />
          <NavButton icon={Settings2} label={SIDEBAR.SETTINGS} />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {favoriteProjects.length > 0 && (
            <div>
              <h3 className="px-2 text-xs font-semibold text-zinc-400 mb-1 tracking-tight">
                {SIDEBAR.FAVORITES}
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
                {SIDEBAR.ALL_NOTES}
              </h3>
              <button
                onClick={onCreateProject}
                className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50 rounded transition-colors"
                title={SIDEBAR.CREATE_NOTE}
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
              <p className="text-xs text-zinc-400 px-2 py-2">{SIDEBAR.NO_NOTES}</p>
            ) : null}
          </div>
        </div>

        {onSignOut && (
          <div className="p-3 border-t border-zinc-200">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>{SIDEBAR.SIGN_OUT}</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
});
