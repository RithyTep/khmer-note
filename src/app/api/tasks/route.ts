import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tasks - Get tasks (optionally by projectId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const tasks = await prisma.task.findMany({
      where: projectId ? { projectId } : undefined,
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
