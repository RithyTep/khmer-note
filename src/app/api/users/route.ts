import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsersCached } from "@/lib/cache";
import { revalidateUsers } from "@/lib/revalidate";
import { rateLimit, getClientId, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

// GET /api/users - Get all users (cached)
export async function GET(request: Request) {
  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`users:get:${clientId}`, RATE_LIMITS.read);
  if (!result.success) return rateLimitResponse(result);

  try {
    // Use cached query - users rarely change
    const users = await getUsersCached();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
  // Rate limit check
  const clientId = getClientId(request);
  const result = rateLimit(`users:post:${clientId}`, RATE_LIMITS.heavy);
  if (!result.success) return rateLimitResponse(result);

  try {
    const body = await request.json();
    const { name, avatar } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        avatar:
          avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    // Revalidate cache
    revalidateUsers();

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
