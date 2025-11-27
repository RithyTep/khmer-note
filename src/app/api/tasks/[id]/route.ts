import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidateTasks } from "@/lib/revalidate";
import { rateLimit, getClientId, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to verify task ownership through project
async function verifyTaskOwnership(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { userId: true } } },
  });
  return { task, isOwner: task?.project.userId === userId };
}

// GET /api/tasks/[id] - Get a single task
export async function GET(request: Request, { params }: RouteParams) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`task:get:${clientId}`, RATE_LIMITS.read);
  if (!result.success) return rateLimitResponse(result);

  try {
    const { id } = await params;

    const { task, isOwner } = await verifyTaskOwnership(id, session.user.id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(request: Request, { params }: RouteParams) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`task:patch:${clientId}`, RATE_LIMITS.write);
  if (!result.success) return rateLimitResponse(result);

  try {
    const { id } = await params;

    const { task: existingTask, isOwner } = await verifyTaskOwnership(id, session.user.id);

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { text, tag, checked, order } = body;

    const updateData: Record<string, unknown> = {};

    if (text !== undefined) updateData.text = text;
    if (tag !== undefined) updateData.tag = tag;
    if (checked !== undefined) updateData.checked = checked;
    if (order !== undefined) updateData.order = order;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    // Revalidate cache
    revalidateTasks(task.projectId);

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(request: Request, { params }: RouteParams) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`task:delete:${clientId}`, RATE_LIMITS.write);
  if (!result.success) return rateLimitResponse(result);

  try {
    const { id } = await params;

    const { task: existingTask, isOwner } = await verifyTaskOwnership(id, session.user.id);

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const task = await prisma.task.delete({
      where: { id },
    });

    // Revalidate cache
    revalidateTasks(task.projectId);

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
