import { z } from "zod";
import { projectSchema, type Project } from "@/engine/model";
import { scenarios } from "@/data/scenarios";
export const STORAGE_KEY = "catalyst:workspace:v2";
export const workspaceSchema = z
  .object({
    activeId: z.string(),
    projects: z.array(projectSchema).min(1).max(30),
    baselines: z.record(z.string(), projectSchema),
  })
  .superRefine((w, ctx) => {
    if (
      new Set(w.projects.map((p) => p.id)).size !== w.projects.length ||
      !w.projects.some((p) => p.id === w.activeId) ||
      w.projects.some(
        (p) => !w.baselines[p.id] || w.baselines[p.id].id !== p.id,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Workspace project identities are inconsistent",
      });
  });
export type Workspace = z.infer<typeof workspaceSchema>;
export function freshWorkspace(): Workspace {
  const projects = scenarios.map((s) => structuredClone(s.project));
  return {
    activeId: projects[0].id,
    projects,
    baselines: Object.fromEntries(
      projects.map((p) => [p.id, structuredClone(p)]),
    ),
  };
}
export type WorkspaceAction =
  | { type: "select"; id: string }
  | { type: "update" | "approve"; project: Project }
  | { type: "reset" };
export function reduceWorkspace(
  w: Workspace,
  action: WorkspaceAction,
): Workspace {
  if (action.type === "select") {
    if (!w.projects.some((p) => p.id === action.id))
      throw new Error("Unknown project");
    return { ...w, activeId: action.id };
  }
  if (action.type === "reset")
    return {
      ...w,
      projects: w.projects.map((p) =>
        p.id === w.activeId ? structuredClone(w.baselines[p.id]) : p,
      ),
    };
  const project = projectSchema.parse(action.project),
    found = w.projects.some((p) => p.id === project.id);
  if (!found && action.type !== "approve")
    throw new Error("Approve a project before adding it to the workspace");
  return workspaceSchema.parse({
    ...w,
    activeId: project.id,
    projects: found
      ? w.projects.map((p) => (p.id === project.id ? project : p))
      : [...w.projects, project],
    baselines:
      action.type === "approve"
        ? { ...w.baselines, [project.id]: structuredClone(project) }
        : w.baselines,
  });
}
type StorageLike = Pick<Storage, "getItem" | "setItem">;
export function restoreWorkspace(storage: StorageLike): {
  workspace: Workspace;
  error?: string;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) return { workspace: workspaceSchema.parse(JSON.parse(raw)) };
    const old = storage.getItem("catalyst:robotics:v1"),
      w = freshWorkspace();
    if (old) {
      const p = projectSchema.parse(JSON.parse(old));
      if (p.id === w.activeId) w.projects[0] = p;
    }
    return { workspace: w };
  } catch {
    return {
      workspace: freshWorkspace(),
      error:
        "Saved workspace could not be read. Fictional scenarios were restored; this session still works.",
    };
  }
}
export function writeWorkspace(
  storage: StorageLike,
  workspace: Workspace,
): boolean {
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify(workspaceSchema.parse(workspace)),
    );
    return true;
  } catch {
    return false;
  }
}
type Snapshot = {
  workspace: Workspace;
  project: Project;
  storage: "loading" | "saved" | "session";
  error?: string;
};
const initial = freshWorkspace(),
  serverSnapshot: Snapshot = {
    workspace: initial,
    project: initial.projects[0],
    storage: "loading",
  };
let snapshot = serverSnapshot,
  initialized = false;
const listeners = new Set<() => void>();
export const getProjectSnapshot = () => snapshot;
export const getServerSnapshot = () => serverSnapshot;
function publish(workspace: Workspace, error?: string) {
  const saved = writeWorkspace(localStorage, workspace);
  snapshot = {
    workspace,
    project: workspace.projects.find((p) => p.id === workspace.activeId)!,
    storage: saved ? "saved" : "session",
    error:
      error ??
      (!saved
        ? "Local storage is unavailable. Changes remain active for this session."
        : undefined),
  };
  listeners.forEach((l) => l());
}
export function subscribeProject(listener: () => void) {
  listeners.add(listener);
  if (!initialized) {
    initialized = true;
    try {
      const restored = restoreWorkspace(localStorage);
      publish(restored.workspace, restored.error);
    } catch {
      snapshot = {
        ...serverSnapshot,
        storage: "session",
        error:
          "Local storage is unavailable. Changes remain active for this session.",
      };
      listeners.forEach((l) => l());
    }
  }
  return () => {
    listeners.delete(listener);
  };
}
export function dispatchWorkspace(action: WorkspaceAction) {
  const workspace = reduceWorkspace(snapshot.workspace, action);
  try {
    publish(workspace);
  } catch {
    snapshot = {
      workspace,
      project: workspace.projects.find((p) => p.id === workspace.activeId)!,
      storage: "session",
      error:
        "Local storage is unavailable. Changes remain active for this session.",
    };
    listeners.forEach((l) => l());
  }
}
export const persistProject = (project: Project) =>
  dispatchWorkspace({ type: "update", project });
