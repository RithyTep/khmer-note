import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTasksByProjectCached } from "@/lib/cache";
import { revalidateTasks } from "@/lib/revalidate";
import { rateLimit, getClientId, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

// Helper to verify project ownership
async function verifyProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  return project?.userId === userId;
}

// GET /api/tasks - Get tasks (must belong to user's project)
export async function GET(request: Request) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`tasks:get:${clientId}`, RATE_LIMITS.read);
  if (!result.success) return rateLimitResponse(result);

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      // Verify ownership
      if (!(await verifyProjectOwnership(projectId, session.user.id))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const tasks = await getTasksByProjectCached(projectId);
      return NextResponse.json(tasks);
    }

    // Get all tasks for user's projects
    const tasks = await prisma.task.findMany({
      where: {
        project: { userId: session.user.id },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: Request) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`tasks:post:${clientId}`, RATE_LIMITS.write);
  if (!result.success) return rateLimitResponse(result);

  try {
    const body = await request.json();
    const { text, tag, projectId } = body;

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

    // Get the max order for this project
    const maxOrderTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
    });

    const task = await prisma.task.create({
      data: {
        text,
        tag: tag || "New",
        projectId,
        order: (maxOrderTask?.order ?? -1) + 1,
      },
    });

    // Revalidate cache
    revalidateTasks(projectId);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
