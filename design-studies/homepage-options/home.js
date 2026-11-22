import { project } from "./project-data.js";

const controls = [...document.querySelectorAll("[data-task]")];
const canvas = document.querySelector(".project-canvas");
const connections = document.querySelector(".connections");
const lines = document.querySelector("#dependency-lines");

function connectTasks() {
  const frame = canvas.getBoundingClientRect();
  connections.setAttribute("viewBox", `0 0 ${frame.width} ${frame.height}`);
  lines.replaceChildren();
  for (const task of project.tasks) {
    const destination = controls.find((button) => button.dataset.task === task.id).getBoundingClientRect();
    for (const dependency of task.dependencies) {
      const source = controls.find((button) => button.dataset.task === dependency).getBoundingClientRect();
      const x1 = source.x + source.width / 2 - frame.x;
      const y1 = source.bottom - frame.y;
      const x2 = destination.x + destination.width / 2 - frame.x;
      const y2 = destination.top - frame.y - 3;
      const middle = (y1 + y2) / 2;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
      line.setAttribute("d", `M${x1} ${y1} C${x1} ${middle} ${x2} ${middle} ${x2} ${y2}`);
      line.setAttribute("marker-end", "url(#arrow)");
      lines.append(line);
    }
  }
}
new ResizeObserver(connectTasks).observe(canvas);
document.fonts.ready.then(connectTasks);

for (const button of controls) {
  button.addEventListener("click", () => {
    const task = project.tasks.find((item) => item.id === button.dataset.task);
    if (!task) return;
    for (const control of controls) {
      const selected = control === button;
      control.classList.toggle("selected", selected);
      control.setAttribute("aria-pressed", String(selected));
    }
    document.querySelector(".detail-title").textContent = task.roles;
    document.querySelector(".detail-supplies").textContent = task.supplies;
  });
}
