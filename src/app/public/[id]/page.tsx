"use client";

import { useEffect, useState, useCallback } from "react";
import { notFound } from "next/navigation";
import NextImage from "next/image";

interface Project {
  id: string;
  title: string;
  content: Record<string, unknown>[] | null;
  emoji: string;
  cover: string | null;
  isSmallText: boolean;
  isFullWidth: boolean;
  isPublished: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBlock(block: any, index: number): React.ReactNode {
  if (!block) return null;

  const { type, content, props, children } = block;

  const getTextFromContent = (contentArray: unknown[]): string => {
    if (!Array.isArray(contentArray)) return "";
    return contentArray
      .map((item: unknown) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          return obj.text || "";
        }
        return "";
      })
      .join("");
  };

  const textContent = getTextFromContent(content || []);

  switch (type) {
    case "paragraph":
      return (
        <p key={index} className="mb-3 text-zinc-700 dark:text-zinc-300">
          {textContent || <br />}
        </p>
      );
    case "heading":
      const level = props?.level || 1;
      const headingClasses: Record<number, string> = {
        1: "text-3xl font-bold mb-4",
        2: "text-2xl font-semibold mb-3",
        3: "text-xl font-medium mb-2",
      };
      const className = `${headingClasses[level] || headingClasses[1]} text-zinc-900 dark:text-zinc-100`;
      if (level === 1) return <h1 key={index} className={className}>{textContent}</h1>;
      if (level === 2) return <h2 key={index} className={className}>{textContent}</h2>;
      return <h3 key={index} className={className}>{textContent}</h3>;
    case "bulletListItem":
      return (
        <li key={index} className="ml-6 list-disc text-zinc-700 dark:text-zinc-300">
          {textContent}
        </li>
      );
    case "numberedListItem":
      return (
        <li key={index} className="ml-6 list-decimal text-zinc-700 dark:text-zinc-300">
          {textContent}
        </li>
      );
    case "checkListItem":
      return (
        <div key={index} className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={props?.checked || false}
            readOnly
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          <span className={`text-zinc-700 dark:text-zinc-300 ${props?.checked ? "line-through opacity-60" : ""}`}>
            {textContent}
          </span>
        </div>
      );
    case "codeBlock":
      return (
        <pre key={index} className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm">
          <code>{textContent}</code>
        </pre>
      );
    case "image":
      return props?.url ? (
        <div key={index} className="my-4">
          <img
            src={props.url}
            alt={props.caption || "Image"}
            className="max-w-full rounded-lg"
          />
          {props.caption && (
            <p className="text-sm text-zinc-500 mt-2 text-center">{props.caption}</p>
          )}
        </div>
      ) : null;
    case "alert":
      const alertColors: Record<string, string> = {
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200",
        error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
        info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200",
        success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
      };
      const alertClass = alertColors[props?.type] || alertColors.info;
      return (
        <div key={index} className={`p-4 rounded-lg border mb-4 ${alertClass}`}>
          {textContent}
        </div>
      );
    default:
      // Handle nested children
      if (Array.isArray(children) && children.length > 0) {
        return (
          <div key={index}>
            {textContent && <p className="mb-2 text-zinc-700 dark:text-zinc-300">{textContent}</p>}
            {children.map((child: unknown, i: number) => renderBlock(child, i))}
          </div>
        );
      }
      return textContent ? (
        <p key={index} className="mb-3 text-zinc-700 dark:text-zinc-300">{textContent}</p>
      ) : null;
  }
}

export default function PublicProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setProjectId(p.id));
  }, [params]);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/public/${projectId}`);
      
      if (response.status === 404) {
        setError("not_found");
        return;
      }
      
      if (response.status === 403) {
        setError("not_published");
        return;
      }
      
      if (!response.ok) {
        setError("error");
        return;
      }
      
      const data = await response.json();
      setProject(data);
    } catch {
      setError("error");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId, fetchProject]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-zinc-600"></div>
      </div>
    );
  }

  if (error === "not_found") {
    notFound();
  }

  if (error === "not_published") {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-6xl">🔒</div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          This page is not published
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-center max-w-md">
          The owner has not made this page available to the public.
        </p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-6xl">😕</div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Something went wrong
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          We couldn&apos;t load this page. Please try again later.
        </p>
      </div>
    );
  }

  const blocks = Array.isArray(project.content) ? project.content : [];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 overflow-x-auto">
      {/* Cover */}
      {project.cover && (
        <div className="relative w-full h-48 md:h-64">
          <NextImage
            src={project.cover}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="w-full px-4 md:px-8 lg:px-16 py-8">
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{project.emoji}</span>
          </div>
          <h1
            className={`font-bold text-zinc-900 dark:text-zinc-100 ${
              project.isSmallText ? "text-2xl" : "text-4xl"
            }`}
          >
            {project.title}
          </h1>
        </div>

        {/* Rendered Content */}
        <div className={`${project.isSmallText ? "text-sm" : ""} overflow-x-auto`}>
          {blocks.map((block, index) => renderBlock(block, index))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Published with{" "}
            <a
              href="/"
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Camnova
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
