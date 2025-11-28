import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAuthAndRateLimit, RATE_LIMITS } from "@/lib/request-guard";
import { internalErrorResponse } from "@/lib/api-response";

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
    const blob = await put(filename, request.body, {
      access: "public",
    });

    return NextResponse.json(blob);
  } catch (error) {
    return internalErrorResponse("upload", "file", error) as NextResponse;
  }
}
