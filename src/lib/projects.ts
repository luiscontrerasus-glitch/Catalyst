import { projectSchema, type Project } from "@/engine/model";
import { z } from "zod";
export function blankProject(id: string): Project {
  return {
    id,
    name: "My community project",
    brief: "",
    date: new Date().toLocaleDateString("en-CA"),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    audience: 1,
    budgetCents: 0,
    tasks: [],
    volunteers: [],
    resources: [],
  };
}
export function nextId(prefix: string, existing: { id: string }[]): string {
  let n = 1;
  while (existing.some((x) => x.id === `${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}
export const tokens = (text: string): string[] => [
  ...new Set(
    text
      .split(",")
      .map((s) =>
        s
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]+/g, "_"),
      )
      .filter(Boolean),
  ),
];
export function removeTask(project: Project, id: string): Project {
  return {
    ...project,
    tasks: project.tasks
      .filter((t) => t.id !== id)
      .map((t) => ({
        ...t,
        dependencies: t.dependencies.filter((d) => d !== id),
      })),
  };
}
export function removeResource(project: Project, id: string): Project {
  return {
    ...project,
    resources: project.resources.filter((r) => r.id !== id),
    tasks: project.tasks.map((t) => ({
      ...t,
      resources: t.resources.filter((r) => r.resourceId !== id),
    })),
  };
}
export function validationMessages(error: z.ZodError): string[] {
  return error.issues.map(
    (i) => `${i.path.join(" › ") || "Project"}: ${i.message}`,
  );
}
export function approveProjectDraft(
  input: unknown,
  confirmed: boolean,
): Project {
  if (!confirmed)
    throw new Error("Review and confirm the requirements before analysis.");
  return projectSchema.parse(input);
}
