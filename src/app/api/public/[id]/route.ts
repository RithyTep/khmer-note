import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await db.project.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        emoji: true,
        cover: true,
        isSmallText: true,
        isFullWidth: true,
        isPublished: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (!project.isPublished) {
      return NextResponse.json(
        { error: "Project is not published" },
        { status: 403 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching public project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
