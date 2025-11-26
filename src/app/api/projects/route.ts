import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProjectsCached } from "@/lib/cache";
import { revalidateProjects } from "@/lib/revalidate";
import { rateLimit, getClientId, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { Status } from "@prisma/client";

// GET /api/projects - Get all projects (cached)
export async function GET(request: Request) {
  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`projects:get:${clientId}`, RATE_LIMITS.read);
  if (!result.success) return rateLimitResponse(result);

  try {
    const { searchParams } = new URL(request.url);
    const favoritesOnly = searchParams.get("favorites") === "true";

    // Use cached query for all projects
    if (!favoritesOnly) {
      const projects = await getProjectsCached();
      return NextResponse.json(projects);
    }

    // Non-cached query for filtered results
    const projects = await prisma.project.findMany({
      where: { isFavorite: true },
      include: {
        assignee: true,
        tasks: { orderBy: { order: "asc" } },
        kanbanCards: { orderBy: { order: "asc" } },
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
  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`projects:post:${clientId}`, RATE_LIMITS.write);
  if (!result.success) return rateLimitResponse(result);

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

    // Revalidate cache
    revalidateProjects();

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
