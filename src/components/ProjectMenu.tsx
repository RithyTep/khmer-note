"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

interface ProjectMenuProps {
  projectId: string;
  projectTitle: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onDelete: () => void;
  onOpenInNewTab: () => void;
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
}: ProjectMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?project=${projectId}`;
    navigator.clipboard.writeText(url);
    setIsOpen(false);
  };

  const menuItems = [
    {
      icon: Star,
      label: isFavorite ? "ដកចេញពីចំណូលចិត្ត" : "បន្ថែមទៅចំណូលចិត្ត",
      onClick: () => {
        onToggleFavorite();
        setIsOpen(false);
      },
      filled: isFavorite,
    },
    { type: "divider" as const },
    {
      icon: Link,
      label: "ចម្លងតំណ",
      onClick: handleCopyLink,
    },
    {
      icon: Copy,
      label: "ស្ទួន",
      onClick: () => {
        onDuplicate();
        setIsOpen(false);
      },
    },
    {
      icon: Pencil,
      label: "ប្តូរឈ្មោះ",
      onClick: () => {
        onRename();
        setIsOpen(false);
      },
    },
    { type: "divider" as const },
    {
      icon: FolderInput,
      label: "ផ្លាស់ទីទៅ",
      onClick: () => setIsOpen(false),
      disabled: true,
    },
    {
      icon: Trash2,
      label: "ផ្លាស់ទីទៅធុងសំរាម",
      onClick: () => {
        onDelete();
        setIsOpen(false);
      },
      danger: true,
    },
    { type: "divider" as const },
    {
      icon: ExternalLink,
      label: "បើកក្នុងផ្ទាំងថ្មី",
      onClick: () => {
        onOpenInNewTab();
        setIsOpen(false);
      },
      shortcut: "⌃",
    },
    {
      icon: PanelRight,
      label: "បើកក្នុង Side Peek",
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

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50"
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
                {item.shortcut && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
