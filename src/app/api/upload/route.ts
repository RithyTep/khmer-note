import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAuthAndRateLimit, RATE_LIMITS } from "@/lib/request-guard";
import { internalErrorResponse, unauthorizedResponse } from "@/lib/api-response";

/**
 * POST /api/upload
 * 
 * Uploads a file to Vercel Blob storage.
 * Requires authentication and is rate-limited.
 * 
 * Query Params:
 * - filename: The name of the file to upload.
 * 
 * Body:
 * - The file content (binary).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const guard = await requireAuthAndRateLimit(request, "upload:post", RATE_LIMITS.write);
  if (!guard.success) return guard.response as NextResponse;

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ error: "File body is required" }, { status: 400 });
  }

  try {
    // Upload to Vercel Blob with public access
    const blob = await put(filename, request.body, {
      access: "public",
    });

    return NextResponse.json(blob);
  } catch (error) {
    return internalErrorResponse("upload", "file", error) as NextResponse;
  }
}
