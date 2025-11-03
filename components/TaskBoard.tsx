"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "planned" | "in-progress" | "blocked" | "complete";
type Priority = "low" | "medium" | "high";

interface Task {
  id: string;
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  status: Status;
  priority: Priority;
  tags: string[];
  createdAt: string;
}

interface TaskGroup {
  id: string;
  name: string;
  mission: string;
  tasks: Task[];
}

interface NewTaskDraft {
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  priority: Priority;
  tags: string;
}

const STORAGE_KEY = "agentic-task-board";

const defaultGroups: TaskGroup[] = [
  {
    id: "party-a",
    name: "Party A",
    mission: "Launch marketing sprints and client deliverables.",
    tasks: [
      {
        id: "task-a1",
        title: "Finalize Q3 Campaign Brief",
        description: "Align with creative on tone, budgets, and release timeline.",
        owner: "Riya",
        dueDate: new Date().toISOString().split("T")[0],
        status: "in-progress",
        priority: "high",
        tags: ["campaign", "client"],
        createdAt: new Date().toISOString()
      },
      {
        id: "task-a2",
        title: "Review Social Assets",
        description: "Approve round two assets before hand-off to media buying.",
        owner: "Marco",
        dueDate: addDays(3),
        status: "planned",
        priority: "medium",
        tags: ["creative"],
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: "party-b",
    name: "Party B",
    mission: "Keep product launches on schedule and smooth.",
    tasks: [
      {
        id: "task-b1",
        title: "Prototype Feedback Loop",
        description: "Synthesize usability notes from last Friday's testing.",
        owner: "Leah",
        dueDate: addDays(1),
        status: "blocked",
        priority: "high",
        tags: ["ux", "research"],
        createdAt: new Date().toISOString()
      },
      {
        id: "task-b2",
        title: "Docs Refresh",
        description: "Update onboarding flow documentation for release v2.4.",
        owner: "Devon",
        dueDate: addDays(5),
        status: "planned",
        priority: "low",
        tags: ["documentation"],
        createdAt: new Date().toISOString()
      }
    ]
  }
];

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  } catch {
    return value;
  }
}

function getStatusBadge(status: Status) {
  const base = "px-2 py-1 rounded-full text-xs font-medium capitalize border";
  switch (status) {
    case "planned":
      return `${base} border-cyan-400/50 bg-cyan-400/10 text-cyan-200`;
    case "in-progress":
      return `${base} border-amber-400/50 bg-amber-400/10 text-amber-200`;
    case "blocked":
      return `${base} border-rose-400/50 bg-rose-400/10 text-rose-200`;
    case "complete":
      return `${base} border-emerald-400/50 bg-emerald-400/10 text-emerald-200`;
    default:
      return base;
  }
}

function getPriorityAccent(priority: Priority) {
  switch (priority) {
    case "high":
      return "text-rose-300 border-rose-500/40 bg-rose-500/10";
    case "medium":
      return "text-amber-300 border-amber-500/40 bg-amber-500/10";
    case "low":
      return "text-emerald-300 border-emerald-500/40 bg-emerald-500/10";
    default:
      return "text-slate-200 border-slate-500/40 bg-slate-500/10";
  }
}

function getStorageSnapshot(): TaskGroup[] | null {
  if (typeof window === "undefined") {
    return null;
  }
  const snapshot = window.localStorage.getItem(STORAGE_KEY);
  if (!snapshot) {
    return null;
  }
  try {
    const parsed: TaskGroup[] = JSON.parse(snapshot);
    return parsed;
  } catch {
    return null;
  }
}

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function TaskBoard() {
  const [groups, setGroups] = useState<TaskGroup[]>(() => getStorageSnapshot() ?? defaultGroups);
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGroupForm, setActiveGroupForm] = useState<Record<string, NewTaskDraft>>(() =>
    Object.fromEntries(
      (getStorageSnapshot() ?? defaultGroups).map((group) => [
        group.id,
        {
          title: "",
          description: "",
          owner: "",
          dueDate: "",
          priority: "medium",
          tags: ""
        }
      ])
    )
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    const snapshot = getStorageSnapshot();
    if (snapshot) {
      setGroups(snapshot);
    }
  }, []);

  const boardStats = useMemo(() => {
    const total = groups.reduce((sum, group) => sum + group.tasks.length, 0);
    const complete = groups.reduce(
      (sum, group) => sum + group.tasks.filter((task) => task.status === "complete").length,
      0
    );
    const urgent = groups.reduce(
      (sum, group) => sum + group.tasks.filter((task) => task.priority === "high").length,
      0
    );
    return { total, complete, urgent };
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const statuses = new Set(selectedStatuses);
    const term = searchTerm.trim().toLowerCase();
    return groups.map((group) => ({
      ...group,
      tasks: group.tasks.filter((task) => {
        const matchesStatus = statuses.size === 0 || statuses.has(task.status);
        const matchesTerm =
          term.length === 0 ||
          [task.title, task.description, task.owner, ...task.tags]
            .filter(Boolean)
            .some((entry) => entry.toLowerCase().includes(term));
        return matchesStatus && matchesTerm;
      })
    }));
  }, [groups, searchTerm, selectedStatuses]);

  const updateTaskStatus = (groupId: string, taskId: string, status: Status) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: group.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      status
                    }
                  : task
              )
            }
          : group
      )
    );
  };

  const handleCompleteToggle = (groupId: string, taskId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: group.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      status: task.status === "complete" ? "planned" : "complete"
                    }
                  : task
              )
            }
          : group
      )
    );
  };

  const handleDraftChange = (groupId: string, partial: Partial<NewTaskDraft>) => {
    setActiveGroupForm((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        ...partial
      }
    }));
  };

  const handleCreateTask = (groupId: string) => {
    const draft = activeGroupForm[groupId];
    if (!draft || draft.title.trim().length === 0 || draft.owner.trim().length === 0) {
      return;
    }
    const newTask: Task = {
      id: generateId(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      owner: draft.owner.trim(),
      dueDate: draft.dueDate || addDays(2),
      status: "planned",
      priority: draft.priority,
      tags: draft.tags
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString()
    };
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: [newTask, ...group.tasks]
            }
          : group
      )
    );
    handleDraftChange(groupId, {
      title: "",
      description: "",
      owner: "",
      dueDate: "",
      priority: "medium",
      tags: ""
    });
  };

  const handleDeleteTask = (groupId: string, taskId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: group.tasks.filter((task) => task.id !== taskId)
            }
          : group
      )
    );
  };

  const toggleStatusFilter = (status: Status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status]
    );
  };

  return (
    <div className="min-h-screen w-full px-6 pb-16 pt-12 text-white lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-floating backdrop-blur-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.4em] text-white/60">Task HQ</p>
              <h1 className="font-display text-4xl font-semibold text-white lg:text-5xl">
                Party-based Productivity HQ
              </h1>
              <p className="text-white/70 lg:max-w-xl">
                Run Party A and Party B like elite strike teams. Assign, track, and celebrate the
                work that matters with an aesthetic, responsive workspace.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 self-start rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center text-sm font-medium text-white/80">
              <div className="flex flex-col gap-1 rounded-xl bg-white/[0.06] p-3">
                <span className="text-xs uppercase tracking-widest text-white/50">Total</span>
                <span className="text-2xl font-semibold text-white">{boardStats.total}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl bg-white/[0.06] p-3">
                <span className="text-xs uppercase tracking-widest text-white/50">Done</span>
                <span className="text-2xl font-semibold text-emerald-300">{boardStats.complete}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl bg-white/[0.06] p-3">
                <span className="text-xs uppercase tracking-widest text-white/50">Urgent</span>
                <span className="text-2xl font-semibold text-rose-300">{boardStats.urgent}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 lg:w-1/2">
                <svg
                  className="h-5 w-5 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                  />
                </svg>
                <input
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="Search across parties, owners, tags, and tasks..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["planned", "in-progress", "blocked", "complete"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleStatusFilter(status)}
                    className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
                      selectedStatuses.includes(status)
                        ? "border border-accent bg-accent/20 text-accent"
                        : "border border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    {status.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredGroups.map((group) => (
            <section
              key={group.id}
              className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-card-bg/60 p-6 shadow-floating backdrop-blur-xl"
            >
              <header className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold text-white">{group.name}</h2>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {group.tasks.length} tasks
                  </span>
                </div>
                <p className="text-sm text-white/60">{group.mission}</p>
              </header>

              <div className="flex flex-col gap-4">
                {group.tasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-white/50">
                    No tasks match the current filters. Add a new one below.
                  </div>
                ) : (
                  group.tasks.map((task) => (
                    <article
                      key={task.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-card-bg/80 p-5 transition hover:border-accent hover:shadow-floating"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                      <div className="relative flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(group.id, task.id)}
                              className="rounded-full border border-white/5 bg-white/[0.03] p-2 text-white/40 transition hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-200"
                              aria-label="Delete task"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                              </svg>
                            </button>
                          </div>
                          {task.description && (
                            <p className="text-sm text-white/70">{task.description}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
                            Owner: <span className="font-medium text-white/80">{task.owner}</span>
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 ${getPriorityAccent(
                              task.priority
                            )}`}
                          >
                            Priority: {task.priority}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
                            Due {formatDate(task.dueDate)}
                          </span>
                          <span className={getStatusBadge(task.status)}>{task.status}</span>
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-accent"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <footer className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/60">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v6l2.5 2.5M3.75 6A.75.75 0 0 1 4.5 5.25h15a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75V6Z"
                              />
                            </svg>
                            Added on {formatDate(task.createdAt)}
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            {(["planned", "in-progress", "blocked", "complete"] as const).map(
                              (status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => updateTaskStatus(group.id, task.id, status)}
                                  className={`rounded-full px-3 py-1 text-xs transition ${
                                    task.status === status
                                      ? "bg-accent text-slate-900"
                                      : "border border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/80"
                                  }`}
                                >
                                  {status.replace("-", " ")}
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              onClick={() => handleCompleteToggle(group.id, task.id)}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                task.status === "complete"
                                  ? "bg-emerald-400 text-slate-900"
                                  : "border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:border-emerald-300/60 hover:bg-emerald-400/20"
                              }`}
                            >
                              Mark Done
                            </button>
                          </div>
                        </footer>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
                  Add Task to {group.name}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-wider text-white/50">Title</label>
                    <input
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
                      placeholder="What needs to ship?"
                      value={activeGroupForm[group.id]?.title ?? ""}
                      onChange={(event) =>
                        handleDraftChange(group.id, { title: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-wider text-white/50">
                      Description
                    </label>
                    <textarea
                      className="min-h-[96px] rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
                      placeholder="Context for teammates..."
                      value={activeGroupForm[group.id]?.description ?? ""}
                      onChange={(event) =>
                        handleDraftChange(group.id, { description: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2 lg:grid-cols-3 lg:gap-3">
                    <div className="grid gap-2">
                      <label className="text-xs uppercase tracking-wider text-white/50">Owner</label>
                      <input
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
                        placeholder="Who leads it?"
                        value={activeGroupForm[group.id]?.owner ?? ""}
                        onChange={(event) =>
                          handleDraftChange(group.id, { owner: event.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs uppercase tracking-wider text-white/50">
                        Due Date
                      </label>
                      <input
                        type="date"
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
                        value={activeGroupForm[group.id]?.dueDate ?? ""}
                        onChange={(event) =>
                          handleDraftChange(group.id, { dueDate: event.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs uppercase tracking-wider text-white/50">
                        Priority
                      </label>
                      <select
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-accent focus:outline-none"
                        value={activeGroupForm[group.id]?.priority ?? "medium"}
                        onChange={(event) =>
                          handleDraftChange(group.id, { priority: event.target.value as Priority })
                        }
                      >
                        <option value="low" className="bg-card-bg">
                          Low
                        </option>
                        <option value="medium" className="bg-card-bg">
                          Medium
                        </option>
                        <option value="high" className="bg-card-bg">
                          High
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-wider text-white/50">Tags</label>
                    <input
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
                      placeholder="Comma separated like design,retro,sprint"
                      value={activeGroupForm[group.id]?.tags ?? ""}
                      onChange={(event) =>
                        handleDraftChange(group.id, { tags: event.target.value })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateTask(group.id)}
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200/70"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                    </svg>
                    Add Task
                  </button>
                </div>
              </div>
            </section>
          ))}
        </main>

        <aside className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/60">
          <p className="font-medium text-white/80">Workflow Tips</p>
          <ul className="mt-3 grid gap-2 text-white/60 lg:grid-cols-3">
            <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              Use party filters to create sprint-ready views for exec updates.
            </li>
            <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              Switch owners quickly by editing in place, keeping squads aligned.
            </li>
            <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              Let the color-coded statuses highlight bottlenecks automatically.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
