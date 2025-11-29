// Project hooks
export { useProject, useProjects, useAllProjects, getLastProjectId, setLastProjectId } from "./useProject";
export {
  useProjectSync,
  useProjectsQuery,
  useProjectQuery,
  useCreateProject,
  useUpdateProject,
  useDeleteProject
} from "./useProjectSync";

// Utility hooks
export { useClickOutside, useEscapeKey, useKeyboardShortcut } from "./useClickOutside";
