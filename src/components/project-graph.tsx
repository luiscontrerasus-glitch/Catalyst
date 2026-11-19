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
const positions: Record<string, { x: number; y: number }> = {
  setup: { x: 0, y: 120 },
  welcome: { x: 235, y: 120 },
  "lab-a": { x: 470, y: 35 },
  "lab-b": { x: 470, y: 215 },
  showcase: { x: 705, y: 120 },
  pack: { x: 940, y: 120 },
};
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
