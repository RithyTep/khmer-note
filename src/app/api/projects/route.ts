import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Status } from "@prisma/client";

// GET /api/projects - Get all projects
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const favoritesOnly = searchParams.get("favorites") === "true";

    const projects = await prisma.project.findMany({
      where: favoritesOnly ? { isFavorite: true } : undefined,
      include: {
        assignee: true,
        tasks: {
          orderBy: { order: "asc" },
        },
        kanbanCards: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, emoji, status, dueDate, assigneeId, isFavorite } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        emoji: emoji || "📝",
        status: status ? (status as Status) : Status.NOT_STARTED,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId,
        isFavorite: isFavorite || false,
      },
      include: {
        assignee: true,
        tasks: true,
        kanbanCards: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
