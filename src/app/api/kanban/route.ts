import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getKanbanCardsByProjectCached } from "@/lib/cache";
import { revalidateKanban } from "@/lib/revalidate";
import { rateLimit, getClientId, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { KanbanColumn, Priority } from "@prisma/client";

// Helper to verify project ownership
async function verifyProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  return project?.userId === userId;
}

// GET /api/kanban - Get kanban cards (must belong to user's project)
export async function GET(request: Request) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`kanban:get:${clientId}`, RATE_LIMITS.read);
  if (!result.success) return rateLimitResponse(result);

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      // Verify ownership
      if (!(await verifyProjectOwnership(projectId, session.user.id))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const cards = await getKanbanCardsByProjectCached(projectId);
      return NextResponse.json(cards);
    }

    // Get all cards for user's projects
    const cards = await prisma.kanbanCard.findMany({
      where: {
        project: { userId: session.user.id },
      },
      orderBy: [{ column: "asc" }, { order: "asc" }],
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Failed to fetch kanban cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch kanban cards" },
      { status: 500 }
    );
  }
}

// POST /api/kanban - Create a new kanban card
export async function POST(request: Request) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`kanban:post:${clientId}`, RATE_LIMITS.write);
  if (!result.success) return rateLimitResponse(result);

  try {
    const body = await request.json();
    const { text, column, priority, projectId } = body;

    if (!text || !projectId) {
      return NextResponse.json(
        { error: "Text and projectId are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyProjectOwnership(projectId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetColumn = (column as KanbanColumn) || KanbanColumn.TODO;

    // Get the max order for this column
    const maxOrderCard = await prisma.kanbanCard.findFirst({
      where: { projectId, column: targetColumn },
      orderBy: { order: "desc" },
    });

    const card = await prisma.kanbanCard.create({
      data: {
        text,
        column: targetColumn,
        priority: priority ? (priority as Priority) : null,
        projectId,
        order: (maxOrderCard?.order ?? -1) + 1,
      },
    });

    // Revalidate cache
    revalidateKanban(projectId);

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("Failed to create kanban card:", error);
    return NextResponse.json(
      { error: "Failed to create kanban card" },
      { status: 500 }
    );
  }
}

// DELETE /api/kanban?projectId=xxx - Delete all kanban cards for a project (reset)
export async function DELETE(request: Request) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`kanban:delete:${clientId}`, RATE_LIMITS.heavy);
  if (!result.success) return rateLimitResponse(result);

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyProjectOwnership(projectId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.kanbanCard.deleteMany({
      where: { projectId },
    });

    // Revalidate cache
    revalidateKanban(projectId);

    return NextResponse.json({ message: "Kanban board reset successfully" });
  } catch (error) {
    console.error("Failed to reset kanban board:", error);
    return NextResponse.json(
      { error: "Failed to reset kanban board" },
      { status: 500 }
    );
  }
}
