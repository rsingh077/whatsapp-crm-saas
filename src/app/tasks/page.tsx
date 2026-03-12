"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Task, TaskPriority, TaskStatus, Contact } from "@/types";
import Badge from "@/components/Badge";

const priorityVariant: Record<TaskPriority, "danger" | "warning" | "default"> =
  { high: "danger", medium: "warning", low: "default" };

const statusVariant: Record<TaskStatus, "warning" | "info" | "success"> = {
  pending: "warning",
  in_progress: "info",
  completed: "success",
};

const statusIcon: Record<TaskStatus, string> = {
  pending: "⏳",
  in_progress: "🔄",
  completed: "✅",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">(
    "all"
  );
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    contact_id: "",
    due_date: "",
    priority: "medium" as TaskPriority,
    status: "pending" as TaskStatus,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tasksRes, contactsRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("*, contact:contacts(id,name)")
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("contacts").select("id, name").order("name"),
    ]);
    setTasks((tasksRes.data ?? []) as Task[]);
    setContacts((contactsRes.data ?? []) as Contact[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setEditTask(null);
    setForm({
      title: "",
      description: "",
      contact_id: "",
      due_date: "",
      priority: "medium",
      status: "pending",
    });
    setError("");
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      contact_id: task.contact_id ?? "",
      due_date: task.due_date ?? "",
      priority: task.priority,
      status: task.status,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      contact_id: form.contact_id || null,
      due_date: form.due_date || null,
      priority: form.priority,
      status: form.status,
    };

    let err;
    if (editTask) {
      ({ error: err } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", editTask.id));
    } else {
      ({ error: err } = await supabase.from("tasks").insert([payload]));
    }

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setShowModal(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await supabase.from("tasks").delete().eq("id", id);
    fetchData();
  };

  const toggleStatus = async (task: Task) => {
    const next: Record<TaskStatus, TaskStatus> = {
      pending: "in_progress",
      in_progress: "completed",
      completed: "pending",
    };
    await supabase
      .from("tasks")
      .update({ status: next[task.status] })
      .eq("id", task.id);
    fetchData();
  };

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === "completed") return false;
    return new Date(task.due_date) < new Date();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">{tasks.length} total tasks</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div>
          <label className="text-xs font-medium text-gray-600 mr-2">
            Status:
          </label>
          {(["all", "pending", "in_progress", "completed"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`mr-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterStatus === s
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? "All" : s.replace("_", " ")}
              </button>
            )
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mr-2">
            Priority:
          </label>
          {(["all", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`mr-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterPriority === p
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-400">No tasks found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4 ${
                isOverdue(task) ? "border-red-200" : "border-gray-100"
              }`}
            >
              {/* Status toggle button */}
              <button
                onClick={() => toggleStatus(task)}
                className="mt-0.5 text-xl flex-shrink-0"
                title={`Status: ${task.status} — click to advance`}
              >
                {statusIcon[task.status]}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`font-semibold text-gray-900 ${
                      task.status === "completed"
                        ? "line-through text-gray-400"
                        : ""
                    }`}
                  >
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      label={task.priority}
                      variant={priorityVariant[task.priority]}
                    />
                    <Badge
                      label={task.status.replace("_", " ")}
                      variant={statusVariant[task.status]}
                    />
                  </div>
                </div>
                {task.description && (
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  {task.due_date && (
                    <span
                      className={isOverdue(task) ? "text-red-500 font-medium" : ""}
                    >
                      📅 Due: {new Date(task.due_date).toLocaleDateString()}
                      {isOverdue(task) && " (overdue)"}
                    </span>
                  )}
                  {task.contact?.name && (
                    <span>👤 {task.contact.name}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(task)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editTask ? "Edit Task" : "Add Task"}
            </h2>
            {error && (
              <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact
                </label>
                <select
                  value={form.contact_id}
                  onChange={(e) =>
                    setForm({ ...form, contact_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">— None —</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm({ ...form, due_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as TaskStatus,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
