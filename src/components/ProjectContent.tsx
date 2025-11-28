"use client";

import { useRef, useCallback, useMemo, useState, useEffect, memo, lazy, Suspense } from "react";
import { Menu, MoreHorizontal, Star, ImagePlus, X, Sparkles, Loader2, History } from "lucide-react";
import Link from "next/link";
import { useProject } from "@/hooks/useProject";
import { LazyEditor } from "./LazyEditor";
import { CoverSelector } from "./CoverSelector";
import { AIAssistant } from "./AIAssistant";
import { PartialBlock, BlockNoteEditor } from "@blocknote/core";
import { getCachedProject } from "@/lib/cache-client";
import { UI_TEXT, TIMING } from "@/lib/constants";
import { useTheme } from "next-themes";
import type { EmojiClickData } from "emoji-picker-react";
import { Theme as EmojiTheme } from "emoji-picker-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { Project } from "@/types";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

const EmojiPickerFallback = () => (
  <div className="w-[350px] h-[400px] bg-white dark:bg-zinc-800 rounded-lg shadow-xl flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
  </div>
);

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ProjectContentProps {
  projectId: string;
  onToggleSidebar: () => void;
  onShowToast: (message: string) => void;
  user?: User;
}

interface HeaderProps {
  project: Project | null;
  formattedTime: string;
  onToggleSidebar: () => void;
  onToggleFavorite: () => void;
  onOpenAI: () => void;
}

const Header = memo(function Header({ project, formattedTime, onToggleSidebar, onToggleFavorite, onOpenAI }: HeaderProps) {
  const { HEADER, TOAST } = UI_TEXT;

  return (
    <header className="h-12 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-3 sm:px-4 flex-shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-1 sm:gap-2 text-sm text-zinc-500 dark:text-zinc-400 min-w-0 flex-1">
        <button
          onClick={onToggleSidebar}
          className="md:hidden mr-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1 rounded text-zinc-700 dark:text-zinc-300 flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        {project && (
          <>
            <span className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer hidden sm:inline">
              {HEADER.NOTES}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">/</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[120px] sm:max-w-[200px]">
              {project.title}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        <Link
          href="/changelog"
          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded transition-colors"
          title="Changelog"
        >
          <History className="w-4 h-4" />
        </Link>
        {project && (
          <>
            <button
              onClick={onToggleFavorite}
              className={`p-1.5 rounded transition-colors ${
                project.isFavorite
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
              title={project.isFavorite ? TOAST.REMOVED_FROM_FAVORITES : TOAST.ADDED_TO_FAVORITES}
            >
              <Star className={`w-4 h-4 ${project.isFavorite ? "fill-current" : ""}`} />
            </button>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:block">
              {HEADER.LAST_EDITED} {formattedTime}
            </span>
            <button className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
});

function useDebounce<T>(callback: (value: T) => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (value: T) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(value), delay);
    },
    [callback, delay]
  );
}

export function ProjectContent({
  projectId,
  onToggleSidebar,
  onShowToast,
  user,
}: ProjectContentProps) {
  const { TOAST } = UI_TEXT;
  const cachedProject = useMemo(() => getCachedProject(projectId), [projectId]);
  const { project: fetchedProject, updateProject } = useProject(projectId);
  const project = fetchedProject || cachedProject;

  const titleRef = useRef<HTMLHeadingElement>(null);
  const [, setIsReady] = useState(!!project);
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const editorRef = useRef<BlockNoteEditor | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useClickOutside([emojiPickerRef], () => setShowEmojiPicker(false));

  const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
    updateProject({ emoji: emojiData.emoji });
    setShowEmojiPicker(false);
  }, [updateProject]);

  const handleAIInsert = useCallback(async (text: string) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      try {
        const blocks = await editor.tryParseMarkdownToBlocks(text);
        const currentBlock = editor.getTextCursorPosition().block;
        editor.insertBlocks(
          blocks,
          currentBlock,
          "after"
        );
      } catch {
        const blocks = await editor.tryParseMarkdownToBlocks(text);
        const docBlocks = editor.document;
        if (docBlocks.length > 0) {
           const lastBlock = docBlocks[docBlocks.length - 1];
           editor.insertBlocks(
             blocks,
             lastBlock,
             "after"
           );
        } else {
           editor.replaceBlocks(editor.document, blocks);
        }
      }
    }
  }, []);

  const getContext = useCallback(async () => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const blocks = editor.document;
      return await editor.blocksToMarkdownLossy(blocks);
    }
    return "";
  }, []);

  useEffect(() => {
    if (project) setIsReady(true);
  }, [project]);

  useEffect(() => {
    if (project?.title) {
      document.title = `${project.title} - Khmer Note`;
    }
  }, [project?.title]);

  const saveTitle = useCallback(
    (newTitle: string) => {
      if (newTitle && newTitle !== project?.title) {
        updateProject({ title: newTitle });
      }
    },
    [project?.title, updateProject]
  );

  const debouncedSaveTitle = useDebounce(saveTitle, TIMING.DEBOUNCE_TITLE_MS);

  const handleTitleChange = useCallback(() => {
    const newTitle = titleRef.current?.innerText || "";
    debouncedSaveTitle(newTitle);
    if (newTitle) {
      document.title = `${newTitle} - Khmer Note`;
    }
  }, [debouncedSaveTitle]);

  const saveContent = useCallback(
    (content: PartialBlock[]) => {
      updateProject({ content: content as unknown as Record<string, unknown>[] });
    },
    [updateProject]
  );

  const debouncedSaveContent = useDebounce(saveContent, TIMING.DEBOUNCE_CONTENT_MS);

  const handleContentChange = useCallback(
    (content: PartialBlock[]) => debouncedSaveContent(content),
    [debouncedSaveContent]
  );

  const handleToggleFavorite = useCallback(() => {
    updateProject({ isFavorite: !project?.isFavorite });
    onShowToast(project?.isFavorite ? TOAST.REMOVED_FROM_FAVORITES : TOAST.ADDED_TO_FAVORITES);
  }, [project?.isFavorite, updateProject, onShowToast, TOAST]);

  const handleCoverChange = useCallback(
    (cover: string | null) => {
      updateProject({ cover });
    },
    [updateProject]
  );

  const getCoverStyle = useCallback((cover: string) => {
    if (cover.startsWith("linear-gradient") || cover.startsWith("#")) {
      return { background: cover };
    }
    return { backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" };
  }, []);

  const formattedTime = useMemo(() => {
    if (!project?.updatedAt) return "";
    return new Date(project.updatedAt).toLocaleTimeString("km-KH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [project?.updatedAt]);

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-900 relative">
      <Header
        project={project}
        formattedTime={formattedTime}
        onToggleSidebar={onToggleSidebar}
        onToggleFavorite={handleToggleFavorite}
        onOpenAI={() => setShowAI(true)}
      />

      <div className={`flex-1 overflow-y-auto transition-opacity duration-150 ${project ? "opacity-100" : "opacity-0"}`}>
        {project && (
          <>
            {project.cover ? (
              <div
                className="relative h-48 md:h-64 w-full group"
                style={getCoverStyle(project.cover)}
                onMouseEnter={() => setIsHoveringCover(true)}
                onMouseLeave={() => setIsHoveringCover(false)}
              >
                <div
                  className={`absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 ${
                    isHoveringCover ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <button
                    onClick={() => setShowCoverSelector(true)}
                    className="px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <ImagePlus size={14} />
                    ប្តូរគម្រប
                  </button>
                  <button
                    onClick={() => handleCoverChange(null)}
                    className="p-1.5 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-12" />
            )}

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-12">
              <div className="group relative mb-6 sm:mb-8">
                {!project.cover && (
                  <button
                    onClick={() => setShowCoverSelector(true)}
                    className="mb-4 px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                  >
                    <ImagePlus size={14} />
                    បន្ថែមគម្រប
                  </button>
                )}
                <div className="relative inline-block">
                  <div
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="mb-3 sm:mb-4 inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 text-3xl sm:text-4xl hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 rounded-lg cursor-pointer transition-all select-none"
                  >
                    {project.emoji}
                  </div>
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 z-50" ref={emojiPickerRef}>
                      <Suspense fallback={<EmojiPickerFallback />}>
                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          theme={resolvedTheme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                        />
                      </Suspense>
                    </div>
                  )}
                </div>
                <h1
                  ref={titleRef}
                  key={`title-${project.id}`}
                  className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 border-none bg-transparent w-full"
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  onInput={handleTitleChange}
                >
                  {project.title}
                </h1>
              </div>

              <div className="min-h-[400px]">
                <LazyEditor
                  key={project.id}
                  initialContent={project.content as PartialBlock[] | undefined}
                  onChange={handleContentChange}
                  editable={true}
                  editorRef={editorRef}
                />
              </div>

              <div className="h-32" />
            </div>
          </>
        )}
      </div>

      <CoverSelector
        isOpen={showCoverSelector}
        onClose={() => setShowCoverSelector(false)}
        onSelect={handleCoverChange}
        currentCover={project?.cover ?? null}
      />

      {!showAI && (
        <button
          onClick={() => setShowAI(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-stone-900 dark:bg-zinc-800 text-white rounded-full shadow-xl hover:bg-stone-800 dark:hover:bg-zinc-700 hover:scale-105 transition-all flex items-center justify-center z-40 group animate-fade-in border border-stone-700 dark:border-zinc-700"
          title="Open AI Assistant"
        >
          <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      <AIAssistant
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        onInsert={handleAIInsert}
        getContext={getContext}
        user={user}
      />
    </main>
  );
}
