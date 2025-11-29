import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers";
import { createContext } from "@/server/trpc";
import { logger } from "@/lib/logger";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      logger.error(`tRPC failed on ${path ?? "<no-path>"}`, error);
    },
  });

export { handler as GET, handler as POST };
