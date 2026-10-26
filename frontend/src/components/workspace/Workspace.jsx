import React, { useState, useEffect } from "react";
import { apiFetch } from "../../apiClient";
import { Plus, Check, Trash2, Calendar, CheckCircle2, Circle, Flame } from "lucide-react";

export default function Workspace() {
  const [days, setDays] = useState([]);
  const [tasksByDay, setTasksByDay] = useState({});
  const [loading, setLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState({});
  const [newDayTitle, setNewDayTitle] = useState("");
  const [isCreatingDay, setIsCreatingDay] = useState(false);

  // 1. Fetch All Day Sessions
  const fetchDays = async () => {
    try {
      const res = await apiFetch("/api/session/day/all");
      if (res.ok) {
        const data = await res.json();
        setDays(data);
        // Har day ke tasks load karo
        data.forEach((day) => fetchTasks(day._id));
      }
    } catch (err) {
      console.error("Error fetching days:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Tasks for a specific day
  const fetchTasks = async (daySessionId) => {
    try {
      const res = await apiFetch(`/api/task/gettask/${daySessionId}`);
      if (res.ok) {
        const tasks = await res.json();
        setTasksByDay((prev) => ({ ...prev, [daySessionId]: tasks }));
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchDays();
  }, []);

  // 3. Create a New Day Box
  const handleCreateDay = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const title = newDayTitle.trim() || `Today's Focus (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;

    try {
      const res = await apiFetch("/api/session/day/add", {
        method: "POST",
        body: JSON.stringify({
          title,
          date: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        const newDay = await res.json();
        setDays((prev) => [newDay, ...prev.filter((d) => d._id !== newDay._id)]);
        setNewDayTitle("");
        setIsCreatingDay(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Failed to create Day Box. Please try logging in again.");
      }
    } catch (err) {
      console.error("Failed to add day:", err);
      alert("Network error: Could not reach backend server.");
    }
  };

  // 4. Add Task into a Day Box
  const handleAddTask = async (daySessionId) => {
    const text = newTaskText[daySessionId]?.trim();
    if (!text) return;

    try {
      const res = await apiFetch("/api/task/addtask", {
        method: "POST",
        body: JSON.stringify({
          daySessionId,
          title: text,
          encryptedDescription: text, // Compatibility
        }),
      });

      if (res.ok) {
        setNewTaskText((prev) => ({ ...prev, [daySessionId]: "" }));
        fetchTasks(daySessionId);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Failed to add task. Please check server connection.");
      }
    } catch (err) {
      console.error("Failed to add task:", err);
      alert("Network error while adding task.");
    }
  };

  // 5. Toggle Task Complete
  const handleToggleTask = async (daySessionId, taskId, currentStatus) => {
    // Optimistic UI update
    setTasksByDay((prev) => ({
      ...prev,
      [daySessionId]: prev[daySessionId].map((t) =>
        t._id === taskId ? { ...t, status: !currentStatus } : t
      ),
    }));

    try {
      await apiFetch(`/api/task/patchtask/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: !currentStatus }),
      });
      fetchTasks(daySessionId);
    } catch (err) {
      console.error("Failed to toggle task:", err);
      fetchTasks(daySessionId); // Rollback on error
    }
  };

  // 6. Delete Task
  const handleDeleteTask = async (daySessionId, taskId) => {
    setTasksByDay((prev) => ({
      ...prev,
      [daySessionId]: prev[daySessionId].filter((t) => t._id !== taskId),
    }));

    try {
      await apiFetch(`/api/task/deletetask/${taskId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete task:", err);
      fetchTasks(daySessionId);
    }
  };

  // 7. Delete Entire Day Box
  const handleDeleteDay = async (daySessionId) => {
    if (!window.confirm("Are you sure you want to delete this Day focus box?")) return;
    try {
      await apiFetch(`/api/session/day/${daySessionId}`, { method: "DELETE" });
      setDays((prev) => prev.filter((d) => d._id !== daySessionId));
    } catch (err) {
      console.error("Failed to delete day:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen text-zinc-500 font-mono text-sm">
        Loading workspace focus boxes...
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Today's Focus Workspace</h1>
            <p className="text-xs text-zinc-400 mt-1">Organize your daily deep-work boxes and lock in</p>
          </div>

          <button
            onClick={() => setIsCreatingDay(!isCreatingDay)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/20 w-fit"
          >
            <Plus size={16} />
            <span>Create Day Box</span>
          </button>
        </div>

        {/* Create Day Inline Form */}
        {isCreatingDay && (
          <form
            onSubmit={handleCreateDay}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-3 items-center animate-fadeIn"
          >
            <input
              type="text"
              autoFocus
              value={newDayTitle}
              onChange={(e) => setNewDayTitle(e.target.value)}
              placeholder="e.g. Day 1: System Architecture & Algorithms"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
            >
              Add Day
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingDay(false)}
              className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-2"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Empty State */}
        {days.length === 0 && !isCreatingDay && (
          <div className="text-center py-16 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-8 max-w-md mx-auto">
            <Calendar size={40} className="mx-auto text-zinc-600 mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">No focus days created yet</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-5">
              Create your day's focus box to start adding your daily targets & tasks.
            </p>
            <button
              onClick={() => handleCreateDay()}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/20"
            >
              <Plus size={16} />
              <span>Create Today's Box</span>
            </button>
          </div>
        )}

        {/* Day Focus Boxes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {days.map((day) => {
            const tasks = tasksByDay[day._id] || [];
            const completedCount = tasks.filter((t) => t.status).length;
            const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

            return (
              <div
                key={day._id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl space-y-4 hover:border-zinc-700/80 transition-all"
              >
                {/* Day Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">{day.title}</h2>
                    <button
                      onClick={() => handleDeleteDay(day._id)}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded-lg transition-colors"
                      title="Delete Day Box"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-500">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>

                  {/* Progress Bar */}
                  {tasks.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                        <span>Progress</span>
                        <span>{progress}% ({completedCount}/{tasks.length})</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Task List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
                        task.status
                          ? "bg-zinc-950/40 border-zinc-800/60 text-zinc-500 line-through"
                          : "bg-zinc-950 border-zinc-800 text-zinc-200"
                      }`}
                    >
                      <button
                        onClick={() => handleToggleTask(day._id, task._id, task.status)}
                        className="flex items-center gap-2.5 flex-1 text-left"
                      >
                        {task.status ? (
                          <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                        ) : (
                          <Circle size={16} className="text-zinc-600 hover:text-zinc-400 shrink-0" />
                        )}
                        <span className="truncate">{task.title || task.encryptedDescription}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTask(day._id, task._id)}
                        className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Task Input */}
                <div className="flex gap-2 pt-2 border-t border-zinc-800/60">
                  <input
                    type="text"
                    value={newTaskText[day._id] || ""}
                    onChange={(e) =>
                      setNewTaskText((prev) => ({ ...prev, [day._id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask(day._id)}
                    placeholder="Add a task..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleAddTask(day._id)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-xl transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}