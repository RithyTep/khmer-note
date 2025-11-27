import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidateKanban } from "@/lib/revalidate";
import { rateLimit, getClientId, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { KanbanColumn, Priority } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to verify card ownership through project
async function verifyCardOwnership(cardId: string, userId: string) {
  const card = await prisma.kanbanCard.findUnique({
    where: { id: cardId },
    include: { project: { select: { userId: true } } },
  });
  return { card, isOwner: card?.project.userId === userId };
}

// GET /api/kanban/[id] - Get a single kanban card
export async function GET(request: Request, { params }: RouteParams) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`kanban-card:get:${clientId}`, RATE_LIMITS.read);
  if (!result.success) return rateLimitResponse(result);

  try {
    const { id } = await params;

    const { card, isOwner } = await verifyCardOwnership(id, session.user.id);

    if (!card) {
      return NextResponse.json(
        { error: "Kanban card not found" },
        { status: 404 }
      );
    }

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Failed to fetch kanban card:", error);
    return NextResponse.json(
      { error: "Failed to fetch kanban card" },
      { status: 500 }
    );
  }
}

// PATCH /api/kanban/[id] - Update a kanban card
export async function PATCH(request: Request, { params }: RouteParams) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`kanban-card:patch:${clientId}`, RATE_LIMITS.write);
  if (!result.success) return rateLimitResponse(result);

  try {
    const { id } = await params;

    const { card: existingCard, isOwner } = await verifyCardOwnership(id, session.user.id);

    if (!existingCard) {
      return NextResponse.json(
        { error: "Kanban card not found" },
        { status: 404 }
      );
    }

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { text, column, priority, order } = body;

    const updateData: Record<string, unknown> = {};

    if (text !== undefined) updateData.text = text;
    if (column !== undefined) updateData.column = column as KanbanColumn;
    if (priority !== undefined) {
      updateData.priority = priority ? (priority as Priority) : null;
    }
    if (order !== undefined) updateData.order = order;

    const card = await prisma.kanbanCard.update({
      where: { id },
      data: updateData,
    });

    // Revalidate cache
    revalidateKanban(card.projectId);

    return NextResponse.json(card);
  } catch (error) {
    console.error("Failed to update kanban card:", error);
    return NextResponse.json(
      { error: "Failed to update kanban card" },
      { status: 500 }
    );
  }
}

// DELETE /api/kanban/[id] - Delete a kanban card
export async function DELETE(request: Request, { params }: RouteParams) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`kanban-card:delete:${clientId}`, RATE_LIMITS.write);
  if (!result.success) return rateLimitResponse(result);

  try {
    const { id } = await params;

    const { card: existingCard, isOwner } = await verifyCardOwnership(id, session.user.id);

    if (!existingCard) {
      return NextResponse.json(
        { error: "Kanban card not found" },
        { status: 404 }
      );
    }

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const card = await prisma.kanbanCard.delete({
      where: { id },
    });

    // Revalidate cache
    revalidateKanban(card.projectId);

    return NextResponse.json({ message: "Kanban card deleted successfully" });
  } catch (error) {
    console.error("Failed to delete kanban card:", error);
    return NextResponse.json(
      { error: "Failed to delete kanban card" },
      { status: 500 }
    );
  }
}
