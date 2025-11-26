import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKanbanCardsByProjectCached } from "@/lib/cache";
import { revalidateKanban } from "@/lib/revalidate";
import { KanbanColumn, Priority } from "@prisma/client";

// GET /api/kanban - Get kanban cards (optionally by projectId, cached)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      // Use cached query
      const cards = await getKanbanCardsByProjectCached(projectId);
      return NextResponse.json(cards);
    }

    // Non-cached for all cards
    const cards = await prisma.kanbanCard.findMany({
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
  try {
    const body = await request.json();
    const { text, column, priority, projectId } = body;

    if (!text || !projectId) {
      return NextResponse.json(
        { error: "Text and projectId are required" },
        { status: 400 }
      );
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
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
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
