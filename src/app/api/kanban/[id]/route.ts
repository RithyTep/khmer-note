import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { KanbanColumn, Priority } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/kanban/[id] - Get a single kanban card
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const card = await prisma.kanbanCard.findUnique({
      where: { id },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Kanban card not found" },
        { status: 404 }
      );
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
  try {
    const { id } = await params;
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
  try {
    const { id } = await params;

    await prisma.kanbanCard.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Kanban card deleted successfully" });
  } catch (error) {
    console.error("Failed to delete kanban card:", error);
    return NextResponse.json(
      { error: "Failed to delete kanban card" },
      { status: 500 }
    );
  }
}
