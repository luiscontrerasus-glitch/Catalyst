"use client";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import { Check, CircleAlert, Clock3, Users } from "lucide-react";
import {
  formatTime,
  slotsFor,
  type Project,
  type SolveResult,
} from "@/engine/model";
import "@xyflow/react/dist/style.css";

type TaskNode = Node<
  {
    title: string;
    time: string;
    filled: number;
    total: number;
    blocked: boolean;
    selected: boolean;
  },
  "task"
>;
function TaskCard({ data }: NodeProps<TaskNode>) {
  return (
    <div
      className={`task-node ${data.blocked ? "blocked" : ""} ${data.selected ? "selected" : ""}`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="node-top">
        <span>{data.blocked ? "NEEDS SUPPORT" : "ROLES COVERED"}</span>
        {data.blocked ? <CircleAlert size={15} /> : <Check size={15} />}
      </div>
      <strong>{data.title}</strong>
      <div className="node-bottom">
        <span>
          <Clock3 size={13} />
          {data.time}
        </span>
        <span>
          <Users size={13} />
          {data.filled}/{data.total}
        </span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { task: TaskCard };
export function layoutTasks(
  project: Project,
): Record<string, { x: number; y: number }> {
  const ranks = new Map<string, number>();
  function rank(id: string, path: Set<string>): number {
    if (ranks.has(id)) return ranks.get(id)!;
    if (path.has(id)) return 0;
    const task = project.tasks.find((t) => t.id === id);
    if (!task) return 0;
    const next = new Set([...path, id]);
    const value = task.dependencies.length
      ? 1 + Math.max(...task.dependencies.map((d) => rank(d, next)))
      : 0;
    ranks.set(id, value);
    return value;
  }
  project.tasks.forEach((t) => rank(t.id, new Set()));
  const groups = new Map<number, string[]>();
  for (const t of project.tasks) {
    const r = ranks.get(t.id)!;
    groups.set(r, [...(groups.get(r) ?? []), t.id]);
  }
  return Object.fromEntries(
    project.tasks.map((t) => {
      const r = ranks.get(t.id)!,
        group = groups.get(r)!;
      return [
        t.id,
        {
          x: r * 235,
          y: 120 + (group.indexOf(t.id) - (group.length - 1) / 2) * 180,
        },
      ];
    }),
  );
}
export function ProjectGraph({
  project,
  result,
  selectedTask,
  onSelect,
}: {
  project: Project;
  result: SolveResult;
  selectedTask: string;
  onSelect: (id: string) => void;
}) {
  const slots = slotsFor(project);
  const positions = layoutTasks(project);
  const nodes: TaskNode[] = project.tasks.map((t) => {
    const taskSlots = slots.filter((s) => s.task.id === t.id),
      filled = taskSlots.filter((s) =>
        result.assignments.some((a) => a.slotId === s.id),
      ).length;
    return {
      id: t.id,
      type: "task",
      position: positions[t.id] ?? { x: 0, y: 0 },
      data: {
        title: t.name,
        time: `${formatTime(t.start)}–${formatTime(t.end)}`,
        filled,
        total: taskSlots.length,
        blocked:
          filled < taskSlots.length ||
          result.issues.some(
            (i) => i.taskIds.includes(t.id) && i.kind !== "staffing",
          ),
        selected: selectedTask === t.id,
      },
      ariaLabel: `${t.name}, ${filled} of ${taskSlots.length} roles covered`,
      focusable: true,
    };
  });
  const edges = project.tasks.flatMap((t) =>
    t.dependencies.map((d) => ({
      id: `${d}-${t.id}`,
      source: d,
      target: t.id,
      type: "smoothstep",
      style: { stroke: "#b7c6c0", strokeWidth: 1.5 },
    })),
  );
  return (
    <div className="graph-canvas" aria-label="Project task dependency graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.09 }}
        nodesDraggable={false}
        nodesConnectable={false}
        onNodeClick={(_, node) => onSelect(node.id)}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: false }}
      >
        <Background color="#cfdbd5" gap={19} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
