import { projectSchema, type Project } from "@/engine/model";
import { robotics } from "./robotics";
export const cleanup = projectSchema.parse({
  id: "neighborhood-cleanup",
  name: "A cleaner park. A closer neighborhood.",
  brief:
    "Fictional neighbors organize a park cleanup and sort collected materials. One collection volunteer arrives too late and the parallel teams share too few litter grabbers.",
  date: "2026-11-22",
  timezone: "America/New_York",
  audience: 30,
  budgetCents: 20000,
  resources: [
    {
      id: "grabbers",
      name: "Litter grabbers",
      kind: "reusable",
      quantity: 6,
      unitCostCents: 1000,
    },
    {
      id: "bags",
      name: "Collection bags",
      kind: "consumable",
      quantity: 30,
      unitCostCents: 100,
    },
  ],
  tasks: [
    {
      id: "briefing",
      name: "Safety & route briefing",
      start: 540,
      end: 570,
      dependencies: [],
      roles: [
        {
          id: "lead",
          name: "Crew lead",
          count: 1,
          skills: ["coordination"],
          qualifications: ["safety_briefing"],
        },
      ],
      resources: [],
      costCents: 2000,
    },
    {
      id: "east",
      name: "East trail collection",
      start: 570,
      end: 660,
      dependencies: ["briefing"],
      roles: [
        {
          id: "collector",
          name: "Collection volunteer",
          count: 1,
          skills: ["collection"],
          qualifications: [],
        },
      ],
      resources: [
        { resourceId: "grabbers", quantity: 4 },
        { resourceId: "bags", quantity: 10 },
      ],
      costCents: 3000,
    },
    {
      id: "west",
      name: "West trail collection",
      start: 570,
      end: 660,
      dependencies: ["briefing"],
      roles: [
        {
          id: "collector",
          name: "Collection volunteer",
          count: 1,
          skills: ["collection"],
          qualifications: [],
        },
      ],
      resources: [
        { resourceId: "grabbers", quantity: 4 },
        { resourceId: "bags", quantity: 10 },
      ],
      costCents: 3000,
    },
    {
      id: "sort",
      name: "Sort & recycle together",
      start: 660,
      end: 720,
      dependencies: ["east", "west"],
      roles: [
        {
          id: "sorter",
          name: "Recycling lead",
          count: 1,
          skills: ["sorting"],
          qualifications: [],
        },
      ],
      resources: [],
      costCents: 2000,
    },
    {
      id: "reflection",
      name: "Optional community reflection",
      start: 720,
      end: 750,
      dependencies: ["sort"],
      roles: [
        {
          id: "lead",
          name: "Crew lead",
          count: 1,
          skills: ["coordination"],
          qualifications: [],
        },
      ],
      resources: [],
      costCents: 0,
      optional: true,
    },
  ],
  volunteers: [
    {
      id: "riley",
      name: "Riley Park",
      skills: ["coordination"],
      qualifications: ["safety_briefing"],
      availability: [{ start: 540, end: 750 }],
      maxMinutes: 120,
    },
    {
      id: "devon",
      name: "Devon Brooks",
      skills: ["collection"],
      qualifications: [],
      availability: [{ start: 570, end: 660 }],
      maxMinutes: 90,
    },
    {
      id: "priya",
      name: "Priya Shah",
      skills: ["collection"],
      qualifications: [],
      availability: [{ start: 600, end: 690 }],
      maxMinutes: 120,
    },
    {
      id: "noah",
      name: "Noah Kim",
      skills: ["sorting"],
      qualifications: [],
      availability: [{ start: 660, end: 720 }],
      maxMinutes: 60,
    },
  ],
});
export const donation = projectSchema.parse({
  id: "community-donation-drive",
  name: "Good things deserve a second chapter.",
  brief:
    "A fictional donation drive collects, sorts, and delivers useful supplies. The initial roster covers every role. Withdraw Taylor to discover the delivery bottleneck.",
  date: "2026-11-28",
  timezone: "America/New_York",
  audience: 40,
  budgetCents: 30000,
  resources: [
    {
      id: "boxes",
      name: "Donation boxes",
      kind: "consumable",
      quantity: 20,
      unitCostCents: 200,
    },
    { id: "van", name: "Delivery van", kind: "reusable", quantity: 1 },
  ],
  tasks: [
    {
      id: "intake",
      name: "Welcome & collect",
      start: 540,
      end: 600,
      dependencies: [],
      roles: [
        {
          id: "welcome",
          name: "Intake host",
          count: 1,
          skills: ["hosting"],
          qualifications: [],
        },
      ],
      resources: [],
      costCents: 2000,
    },
    {
      id: "sorting",
      name: "Sort useful donations",
      start: 600,
      end: 690,
      dependencies: ["intake"],
      roles: [
        {
          id: "sorter",
          name: "Sorting volunteer",
          count: 2,
          skills: ["sorting"],
          qualifications: [],
        },
      ],
      resources: [{ resourceId: "boxes", quantity: 20 }],
      costCents: 4000,
    },
    {
      id: "delivery",
      name: "Deliver to the community hub",
      start: 690,
      end: 750,
      dependencies: ["sorting"],
      roles: [
        {
          id: "driver",
          name: "Qualified driver",
          count: 1,
          skills: ["driving"],
          qualifications: ["driving_license"],
        },
      ],
      resources: [{ resourceId: "van", quantity: 1 }],
      costCents: 6000,
    },
  ],
  volunteers: [
    {
      id: "jamie",
      name: "Jamie Flores",
      skills: ["hosting", "sorting"],
      qualifications: [],
      availability: [{ start: 540, end: 690 }],
      maxMinutes: 150,
    },
    {
      id: "morgan",
      name: "Morgan Ellis",
      skills: ["sorting"],
      qualifications: [],
      availability: [{ start: 600, end: 690 }],
      maxMinutes: 90,
    },
    {
      id: "taylor",
      name: "Taylor Reed",
      skills: ["driving"],
      qualifications: ["driving_license"],
      availability: [{ start: 690, end: 750 }],
      maxMinutes: 60,
    },
  ],
});
export const scenarios = [
  {
    project: robotics,
    label: "Robotics workshop",
    theme: "School & community",
    description: "One missing instructor. One turning point.",
  },
  {
    project: cleanup,
    label: "Neighborhood cleanup",
    theme: "Environment & neighbors",
    description: "Availability, shared supplies, and a combined repair.",
  },
  {
    project: donation,
    label: "Community donation drive",
    theme: "Giving & mutual support",
    description: "A ready plan. Then a driver withdraws.",
  },
];
export const scenarioFor = (id: string) =>
  scenarios.find((s) => s.project.id === id);
export const freshScenario = (id: string): Project =>
  structuredClone(scenarioFor(id)?.project ?? robotics);
