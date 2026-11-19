import { z } from "zod";

const id = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "IDs use letters, digits, underscores, and hyphens",
  );
const minute = z.number().int().min(0).max(1440);
export const windowSchema = z
  .object({ start: minute, end: minute })
  .refine((w) => w.start < w.end, "End must follow start");
export const volunteerSchema = z.object({
  id,
  name: z.string().min(1).max(80),
  skills: z.array(id).max(20),
  qualifications: z.array(id).max(20),
  availability: z.array(windowSchema).min(1).max(10),
  maxMinutes: z.number().int().min(0).max(1440),
  simulated: z.boolean().optional(),
});
export const roleSchema = z.object({
  id,
  name: z.string().min(1),
  count: z.number().int().min(1).max(8),
  skills: z.array(id),
  qualifications: z.array(id),
});
export const taskSchema = z
  .object({
    id,
    name: z.string().min(1),
    start: minute,
    end: minute,
    dependencies: z.array(id),
    roles: z.array(roleSchema).min(1),
    resources: z.array(
      z.object({
        resourceId: id,
        quantity: z.number().int().positive().max(10000),
      }),
    ),
    costCents: z.number().int().nonnegative().max(100000000),
  })
  .refine((t) => t.start < t.end, "Task end must follow start");
export const projectSchema = z
  .object({
    id,
    name: z.string().min(1),
    brief: z.string(),
    date: z.string(),
    timezone: z.string(),
    audience: z.number().int().positive(),
    budgetCents: z.number().int().nonnegative().max(100000000),
    tasks: z.array(taskSchema).min(1).max(16),
    volunteers: z.array(volunteerSchema).max(24),
    resources: z
      .array(
        z.object({
          id,
          name: z.string(),
          quantity: z.number().int().nonnegative().max(10000),
          kind: z.enum(["reusable", "consumable"]),
        }),
      )
      .max(30),
  })
  .superRefine((p, ctx) => {
    const unique = (ids: string[], label: string) => {
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({ code: "custom", message: `Duplicate ${label} IDs` });
    };
    unique(
      p.tasks.map((t) => t.id),
      "task",
    );
    unique(
      p.volunteers.map((v) => v.id),
      "volunteer",
    );
    unique(
      p.resources.map((r) => r.id),
      "resource",
    );
    for (const t of p.tasks) {
      unique(
        t.roles.map((r) => r.id),
        "role",
      );
      unique(
        t.resources.map((r) => r.resourceId),
        "task resource",
      );
      unique(t.dependencies, "dependency");
      for (const d of t.dependencies)
        if (!p.tasks.some((x) => x.id === d))
          ctx.addIssue({ code: "custom", message: `Unknown dependency ${d}` });
      for (const r of t.resources)
        if (!p.resources.some((x) => x.id === r.resourceId))
          ctx.addIssue({
            code: "custom",
            message: `Unknown resource ${r.resourceId}`,
          });
    }
    if (
      p.tasks.reduce(
        (n, t) => n + t.roles.reduce((k, r) => k + r.count, 0),
        0,
      ) > 32
    )
      ctx.addIssue({
        code: "custom",
        message: "Demo supports at most 32 role slots",
      });
  });

export type Project = z.infer<typeof projectSchema>;
export type Volunteer = z.infer<typeof volunteerSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Slot = { id: string; task: Task; role: Role; index: number };
export type Assignment = { slotId: string; volunteerId: string };
export type Issue = {
  kind: "model" | "budget" | "resource" | "dependency" | "staffing";
  message: string;
  taskIds: string[];
  slotId?: string;
  resourceId?: string;
  shortfall?: number;
};
export type SolveResult = {
  status: "feasible" | "infeasible" | "unknown" | "invalid";
  assignments: Assignment[];
  issues: Issue[];
  totalSlots: number;
  filledSlots: number;
  exploredNodes: number;
  exhaustive: boolean;
  costCents: number;
};
export const slotsFor = (p: Project): Slot[] =>
  p.tasks.flatMap((task) =>
    task.roles.flatMap((role) =>
      Array.from({ length: role.count }, (_, index) => ({
        id: `${task.id}/${role.id}/${index}`,
        task,
        role,
        index,
      })),
    ),
  );
export const overlaps = (
  a: { start: number; end: number },
  b: { start: number; end: number },
) => a.start < b.end && b.start < a.end;
export const qualified = (v: Volunteer, r: Role) =>
  r.skills.every((s) => v.skills.includes(s)) &&
  r.qualifications.every((q) => v.qualifications.includes(q));
export const available = (v: Volunteer, t: Task) =>
  v.availability.some((w) => w.start <= t.start && w.end >= t.end);
export const formatTime = (m: number) =>
  `${Math.floor(m / 60)
    .toString()
    .padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
