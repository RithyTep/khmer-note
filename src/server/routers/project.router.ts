import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  getByIdSchema,
  createProjectSchema,
  updateProjectSchema,
  syncRequestSchema,
  createTaskSchema,
  updateTaskSchema,
  createKanbanCardSchema,
  updateKanbanCardSchema,
  patchContentSchema,
} from "../schema/project.schema";
import * as projectService from "../services/project.service";

export const projectRouter = router({
  // Get all projects
  getAll: protectedProcedure
    .input(z.object({ since: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return projectService.getProjects(ctx.user.id!, input?.since);
    }),

  // Get single project
  getById: protectedProcedure.input(getByIdSchema).query(async ({ ctx, input }) => {
    return projectService.getProjectById(input.id, ctx.user.id!);
  }),

  // Create project
  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      return projectService.createProject(ctx.user.id!, input);
    }),

  // Update project
  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return projectService.updateProject(id, ctx.user.id!, data);
    }),

  // Patch content (delta updates for large documents)
  patchContent: protectedProcedure
    .input(patchContentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return projectService.patchProjectContent(id, ctx.user.id!, data);
    }),

  // Delete project
  delete: protectedProcedure
    .input(getByIdSchema)
    .mutation(async ({ ctx, input }) => {
      return projectService.deleteProject(input.id, ctx.user.id!);
    }),

  // Toggle favorite
  toggleFavorite: protectedProcedure
    .input(getByIdSchema)
    .mutation(async ({ ctx, input }) => {
      return projectService.toggleFavorite(input.id, ctx.user.id!);
    }),

  // Sync projects (bulk operations)
  sync: protectedProcedure
    .input(syncRequestSchema)
    .mutation(async ({ ctx, input }) => {
      return projectService.syncProjects(ctx.user.id!, input);
    }),

  // Task operations
  createTask: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      return projectService.createTask(ctx.user.id!, input);
    }),

  updateTask: protectedProcedure
    .input(updateTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return projectService.updateTask(ctx.user.id!, id, data);
    }),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return projectService.deleteTask(ctx.user.id!, input.id);
    }),

  // Kanban card operations
  createKanbanCard: protectedProcedure
    .input(createKanbanCardSchema)
    .mutation(async ({ ctx, input }) => {
      return projectService.createKanbanCard(ctx.user.id!, input);
    }),

  updateKanbanCard: protectedProcedure
    .input(updateKanbanCardSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return projectService.updateKanbanCard(ctx.user.id!, id, data);
    }),

  deleteKanbanCard: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return projectService.deleteKanbanCard(ctx.user.id!, input.id);
    }),
});
