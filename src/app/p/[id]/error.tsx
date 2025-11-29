"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Project error", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 text-6xl">📄</div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          មិនអាចផ្ទុកគម្រោងបាន
        </h1>
        <p className="mb-6 text-muted-foreground">
          សូមអភ័យទោស គម្រោងនេះមិនអាចផ្ទុកបានទេ។ វាអាចត្រូវបានលុប ឬអ្នកមិនមានសិទ្ធិចូលមើល។
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            ព្យាយាមម្តងទៀត
          </button>
          <Link
            href="/"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            ត្រឡប់ទៅគម្រោងរបស់ខ្ញុំ
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
