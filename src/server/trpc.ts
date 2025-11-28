import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { db } from "./db/client";

/**
 * Context types
 */
export interface CreateContextOptions {
  session: Session | null;
}

/**
 * Inner context - doesn't depend on request
 */
const createInnerContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    db,
  };
};

/**
 * Context for tRPC - created per request
 */
export const createContext = async () => {
  const session = await auth();
  return createInnerContext({ session });
};

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Router & Procedure exports
 */
export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * Middleware
 */
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === "development") {
    console.log(`[tRPC] ${type} ${path} - ${duration}ms`);
  }

  return result;
});

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

/**
 * Procedures
 */

// Public procedure - no auth required
export const publicProcedure = t.procedure.use(loggerMiddleware);

// Protected procedure - requires authenticated user
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceUserIsAuthed);
