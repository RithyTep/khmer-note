import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTasksByProjectCached } from "@/lib/cache";
import { revalidateTasks } from "@/lib/revalidate";
import { rateLimit, getClientId, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

// GET /api/tasks - Get tasks (optionally by projectId, cached)
export async function GET(request: Request) {
  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`tasks:get:${clientId}`, RATE_LIMITS.read);
  if (!result.success) return rateLimitResponse(result);

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      // Use cached query
      const tasks = await getTasksByProjectCached(projectId);
      return NextResponse.json(tasks);
    }

    // Non-cached for all tasks
    const tasks = await prisma.task.findMany({
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
