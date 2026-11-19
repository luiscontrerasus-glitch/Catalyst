import { projectSchema, type Project } from "@/engine/model";
import { freshRobotics } from "@/data/robotics";
const key = "catalyst:robotics:v1";
export function loadProject(): { project: Project | null; error?: string } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { project: null };
    const parsed = projectSchema.safeParse(JSON.parse(raw));
    return parsed.success && parsed.data.id === "robotics-workshop"
      ? { project: parsed.data }
      : {
          project: null,
          error:
            "Saved scenario was invalid. The original demo has been restored.",
        };
  } catch {
    return {
      project: null,
      error:
        "Local storage is unavailable or unreadable. This session still works.",
    };
  }
}
export function saveProject(project: Project): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(project));
    return true;
  } catch {
    return false;
  }
}

type Snapshot = {
  project: Project;
  storage: "loading" | "saved" | "session";
  error?: string;
};
const serverSnapshot: Snapshot = {
  project: freshRobotics(),
  storage: "loading",
};
let snapshot = serverSnapshot;
let initialized = false;
const listeners = new Set<() => void>();
export const getProjectSnapshot = () => snapshot;
export const getServerSnapshot = () => serverSnapshot;
export function subscribeProject(listener: () => void) {
  listeners.add(listener);
  // React subscribes after hydration. Read browser-only state once and notify
  // through the external-store contract rather than cascading React effects.
  if (!initialized) {
    initialized = true;
    const restored = loadProject(),
      project = restored.project ?? freshRobotics();
    const saved = saveProject(project);
    snapshot = {
      project,
      storage: saved ? "saved" : "session",
      error:
        restored.error ??
        (!saved
          ? "Local storage is unavailable. Changes remain active for this session."
          : undefined),
    };
    listeners.forEach((l) => l());
  }
  return () => {
    listeners.delete(listener);
  };
}
export function persistProject(project: Project) {
  const saved = saveProject(project);
  snapshot = {
    project,
    storage: saved ? "saved" : "session",
    error: !saved
      ? "Local storage is unavailable. Changes remain active for this session."
      : undefined,
  };
  listeners.forEach((l) => l());
}
