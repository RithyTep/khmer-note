import { router } from "../trpc";
import { projectRouter } from "./project.router";

/**
 * Main application router
 * All sub-routers should be added here
 */
export const appRouter = router({
  project: projectRouter,
  // Add more routers here as needed:
  // ai: aiRouter,
  // user: userRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
