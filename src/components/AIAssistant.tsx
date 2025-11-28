"use client";

import { memo, useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import {
  Bot,
  ArrowUp,
  History,
  Share,
  MoreHorizontal,
  PenTool,
  Languages,
  Search,
  Lightbulb,
  ShieldCheck,
  X,
  Plus,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { UI_TEXT, API_HEADERS } from "@/lib/constants";

// Lazy load markdown renderer (~100KB) - only loads when there are messages
const ReactMarkdown = lazy(() => import("react-markdown"));
const remarkGfm = import("remark-gfm").then(m => [m.default]);

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface ChatsResponse {
  chats: Chat[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Memoized message component to prevent unnecessary re-renders
const MessageContent = memo(function MessageContent({
  content,
  isUser
}: {
  content: string;
  isUser: boolean;
}) {
  if (isUser) {
    return <>{content}</>;
  }

  return (
    <Suspense fallback={<div className="animate-pulse">{content}</div>}>
      <MarkdownRenderer content={content} />
    </Suspense>
  );
});

// Separate component for markdown to enable lazy loading
function MarkdownRenderer({ content }: { content: string }) {
  const [plugins, setPlugins] = useState<Parameters<typeof ReactMarkdown>[0]['remarkPlugins']>([]);

  useEffect(() => {
    remarkGfm.then((p) => setPlugins(p as typeof plugins));
  }, []);

  return (
    <ReactMarkdown remarkPlugins={plugins}>
      {content}
    </ReactMarkdown>
  );
}

// AI Avatar Component
const AIAvatar = memo(function AIAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "w-5 h-5" : "w-7 h-7";
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <div className={`relative ${sizeClasses} flex-shrink-0`}>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 rounded-lg border border-amber-200/60 dark:border-amber-700/40 shadow-sm flex items-center justify-center">
        <Bot size={iconSize} className="text-amber-600 dark:text-amber-500" strokeWidth={1.5} />
      </div>
    </div>
  );
});

// Suggestion Card Component
const SuggestionCard = memo(function SuggestionCard({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: typeof PenTool;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 hover:border-amber-100 dark:hover:border-amber-800/50 transition-colors duration-200 text-left"
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
        <span className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">{label}</span>
      </div>
      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{description}</p>
    </button>
  );
});

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert?: (text: string) => void;
  getContext?: () => Promise<string>;
  user?: User;
}

export const AIAssistant = memo(function AIAssistant({
  isOpen,
  onClose,
  onInsert,
  getContext,
  user,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fetchedRef = useRef(false);

  const { AI_ASSISTANT } = UI_TEXT;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [messages, isOpen, scrollToBottom]);

  // Load latest chat on open - only once
  useEffect(() => {
    if (isOpen && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchChats();
    }
  }, [isOpen]);

  const fetchChats = useCallback(async (cursor?: string) => {
    try {
      if (cursor) {
        setIsLoadingMore(true);
      }

      const url = cursor
        ? `/api/ai/chats?cursor=${cursor}&limit=20`
        : '/api/ai/chats?limit=20';

      const res = await fetch(url, {
        headers: { [API_HEADERS.CLIENT_KEY]: API_HEADERS.CLIENT_VALUE }
      });

      if (res.ok) {
        const data: ChatsResponse = await res.json();

        if (cursor) {
          setRecentChats(prev => [...prev, ...data.chats]);
        } else {
          setRecentChats(data.chats);
        }

        setHasMoreChats(data.hasMore);
        setNextCursor(data.nextCursor);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  const loadMoreChats = useCallback(() => {
    if (nextCursor && !isLoadingMore) {
      fetchChats(nextCursor);
    }
  }, [nextCursor, isLoadingMore, fetchChats]);

  const loadChat = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/ai/chats/${id}`, {
        headers: { [API_HEADERS.CLIENT_KEY]: API_HEADERS.CLIENT_VALUE }
      });
      if (res.ok) {
        const chat = await res.json();
        setChatId(chat.id);
        setMessages(chat.messages.map((m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content
        })));
        setShowHistory(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, promptText?: string) => {
    e?.preventDefault();
    const text = promptText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let context = "";
    if (getContext) {
      try {
        context = await getContext();
      } catch (err) {
        console.error("Failed to get context", err);
      }
    }

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [API_HEADERS.CLIENT_KEY]: API_HEADERS.CLIENT_VALUE
        },
        body: JSON.stringify({
          prompt: text,
          context,
          action: "chat",
          chatId
        }),
      });

      if (!response.ok) throw new Error("Failed to generate response");

      const data = await response.json();

      if (data.chatId) {
        setChatId(data.chatId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.result || "I apologize, I couldn't generate a response.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (messages.length < 5) {
        fetchChats();
      }
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setChatId(null);
    setShowHistory(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-3 w-[calc(100vw-24px)] max-w-[320px] sm:bottom-6 sm:right-6 sm:w-[380px] sm:max-w-[380px] md:w-[420px] md:max-w-[420px] h-[50vh] max-h-[400px] sm:h-[70vh] sm:max-h-[550px] bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col overflow-hidden z-50 animate-fade-in-up">

      {/* Decorative Top Pattern */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 opacity-80" />

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="text-amber-600 dark:text-amber-500 flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
              {AI_ASSISTANT.TITLE}
            </h1>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide mt-0.5">
              {AI_ASSISTANT.SUBTITLE}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-md transition-all duration-200 ${
              showHistory
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
            title="History"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={handleNewChat}
            className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-md transition-all duration-200"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-md transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Chat History Area */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {showHistory ? (
          // History Panel
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              {AI_ASSISTANT.RECENT_CHATS}
            </h3>
            {recentChats.map(chat => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                  chatId === chat.id
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-zinc-900 dark:text-zinc-100 border border-amber-200 dark:border-amber-800/50'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border border-transparent'
                }`}
              >
                <div className="font-medium truncate">{chat.title}</div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  <span>{new Date(chat.updatedAt).toLocaleDateString()}</span>
                  {chat._count?.messages && (
                    <span>• {chat._count.messages} messages</span>
                  )}
                </div>
              </button>
            ))}
            {recentChats.length === 0 && (
              <div className="text-center text-zinc-400 dark:text-zinc-500 text-sm py-8">
                {AI_ASSISTANT.NO_CHATS}
              </div>
            )}
            {hasMoreChats && (
              <button
                onClick={loadMoreChats}
                disabled={isLoadingMore}
                className="w-full py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  AI_ASSISTANT.LOAD_MORE
                )}
              </button>
            )}
          </div>
        ) : messages.length === 0 ? (
          // Welcome Screen
          <div className="flex items-start gap-3 w-full">
            <AIAvatar />
            <div className="flex flex-col w-full">
              <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                  {AI_ASSISTANT.GREETING}
                  <span className="inline-block text-amber-500">👋</span>
                </h2>

                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  {AI_ASSISTANT.GREETING_MESSAGE}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <SuggestionCard
                    icon={PenTool}
                    label={AI_ASSISTANT.SUGGESTIONS.WRITE.label}
                    description={AI_ASSISTANT.SUGGESTIONS.WRITE.description}
                    onClick={() => handleSubmit(undefined, "Help me write content")}
                  />
                  <SuggestionCard
                    icon={Languages}
                    label={AI_ASSISTANT.SUGGESTIONS.TRANSLATE.label}
                    description={AI_ASSISTANT.SUGGESTIONS.TRANSLATE.description}
                    onClick={() => handleSubmit(undefined, "Translate this text")}
                  />
                  <SuggestionCard
                    icon={Search}
                    label={AI_ASSISTANT.SUGGESTIONS.RESEARCH.label}
                    description={AI_ASSISTANT.SUGGESTIONS.RESEARCH.description}
                    onClick={() => handleSubmit(undefined, "Help me research")}
                  />
                  <SuggestionCard
                    icon={Lightbulb}
                    label={AI_ASSISTANT.SUGGESTIONS.BRAINSTORM.label}
                    description={AI_ASSISTANT.SUGGESTIONS.BRAINSTORM.description}
                    onClick={() => handleSubmit(undefined, "Brainstorm ideas for me")}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Messages
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "flex-row-reverse" : "flex-row"} items-start gap-2.5`}
              >
                {message.role === "user" ? (
                  user?.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={24}
                      height={24}
                      className="rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-medium">{user?.name?.charAt(0) || "U"}</span>
                    </div>
                  )
                ) : (
                  <AIAvatar />
                )}

                <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                  <div
                    className={`text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3 py-2 rounded-2xl rounded-tr-sm"
                        : "text-zinc-600 dark:text-zinc-300 prose prose-zinc dark:prose-invert prose-sm max-w-none"
                    }`}
                  >
                    <MessageContent content={message.content} isUser={message.role === "user"} />
                  </div>
                  {message.role === "assistant" && onInsert && (
                    <button
                      onClick={() => onInsert(message.content)}
                      className="mt-2 flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 px-2.5 py-1 rounded-full transition-colors border border-amber-200 dark:border-amber-800/50"
                    >
                      <ArrowRight size={10} />
                      {AI_ASSISTANT.INSERT}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-start">
                <AIAvatar />
                <div className="flex items-center gap-1 h-7 pt-1">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-3 sm:p-4 pt-2 bg-white dark:bg-zinc-900 z-20">
        <div className="relative group shadow-sm rounded-lg">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={AI_ASSISTANT.PLACEHOLDER}
            className="ai-textarea w-full pl-3 pr-10 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-600 transition-all duration-200 resize-none"
            rows={1}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-200 ${
                input.trim() && !isLoading
                  ? "bg-amber-600 hover:bg-amber-700 text-white hover:scale-105 active:scale-95"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-3">
          <ShieldCheck className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
            {AI_ASSISTANT.DISCLAIMER}
          </p>
        </div>
      </footer>
    </div>
  );
});
