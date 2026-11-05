import React, { useState, useEffect } from 'react';
import {
  X,
  GripVertical,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  CalendarDays,
  Inbox,
  ArrowRightLeft,
  Clock,
  Lock,
} from 'lucide-react';
import { getPriorityMeta, formatTimeRange, formatTime24 } from '../../utils/calendarLayout';

const ArrangeDrawer = ({
  isOpen,
  onClose,
  unscheduledTasks,
  selectedDate,
  selectedDayTasks = [],
  decryptedTitles,
  onCreateTask,
  onToggleTask,
  onDeleteTask,
  onUnscheduleTask,
}) => {
  const [activeTab, setActiveTab] = useState('selected'); // 'selected' | 'backlog'
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Auto-switch to 'selected' tab if selectedDate is clicked and has tasks (or if user selects a day)
  useEffect(() => {
    if (selectedDate) {
      setActiveTab('selected');
    }
  }, [selectedDate]);

  if (!isOpen) return null;

  const handleDragStart = (e, task) => {
    if (task.status) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    const durationMinutes =
      task.dueDate && task.startDate
        ? Math.max(
            15,
            Math.round(
              (new Date(task.dueDate).getTime() - new Date(task.startDate).getTime()) / 60000
            )
          )
        : 30;

    const displayTitle = decryptedTitles?.[task._id] || task.title || 'Untitled Task';

    const payload = {
      type: task.startDate ? 'calendar_event' : 'unscheduled',
      taskId: task._id,
      durationMinutes,
      title: displayTitle,
      priority: task.priority,
      originalDate: task.startDate,
    };

    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (activeTab === 'selected') {
      const targetDate = selectedDate || new Date();
      // Schedule directly on the target date at 09:00 AM
      const start = new Date(targetDate);
      start.setHours(9, 0, 0, 0);
      const due = new Date(start.getTime() + 60 * 60000);

      onCreateTask({
        title: newTitle.trim(),
        priority: Number(newPriority),
        startDate: start.toISOString(),
        dueDate: due.toISOString(),
        isAllDay: false,
      });
    } else {
      // Create unscheduled backlog item
      onCreateTask({
        title: newTitle.trim(),
        priority: Number(newPriority),
        startDate: null,
        dueDate: null,
      });
    }

    setNewTitle('');
    setIsAdding(false);
  };

  const currentList = activeTab === 'selected' ? selectedDayTasks : unscheduledTasks;

  const filteredTasks = currentList.filter((t) => {
    const title = decryptedTitles?.[t._id] || t.title || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedDateLabel = selectedDate
    ? new Date(selectedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Selected Day';

  const selectedDateFull = selectedDate
    ? new Date(selectedDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <aside className="w-80 md:w-88 shrink-0 border-l border-[#38383A] bg-[#1A1A1C] flex flex-col h-full z-40 transition-all select-none shadow-2xl">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#38383A] bg-[#1E1E1E]">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-white tracking-wide">
            Arrange Tasks
          </h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-[#0A84FF] border border-blue-500/20">
            {activeTab === 'selected' ? selectedDayTasks.length : unscheduledTasks.length}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          title="Close drawer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs: Selected Day vs Backlog */}
      <div className="flex p-1.5 bg-[#141416] border-b border-[#38383A] gap-1">
        <button
          onClick={() => setActiveTab('selected')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12px] font-bold transition-all ${
            activeTab === 'selected'
              ? 'bg-[#2C2C2E] text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <CalendarDays size={13} />
          <span className="truncate">{selectedDateLabel}</span>
          <span className="text-[10px] opacity-70">({selectedDayTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backlog')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12px] font-bold transition-all ${
            activeTab === 'backlog'
              ? 'bg-[#2C2C2E] text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Inbox size={13} />
          <span>Backlog</span>
          <span className="text-[10px] opacity-70">({unscheduledTasks.length})</span>
        </button>
      </div>

      {/* Subheader / Search & Quick Add */}
      <div className="p-3 border-b border-[#38383A]/60 flex flex-col gap-2">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'selected' ? 'day' : 'backlog'} tasks...`}
            className="w-full bg-[#121212] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-white placeholder-neutral-500 outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Quick Add Toggle / Form */}
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-white/[0.12] hover:border-blue-500/60 bg-white/[0.02] hover:bg-blue-500/10 text-neutral-300 hover:text-blue-400 text-[12px] font-medium transition-all"
          >
            <Plus size={14} />
            <span>
              {activeTab === 'selected'
                ? `Add Task for ${selectedDateLabel}`
                : 'Add Unscheduled Task'}
            </span>
          </button>
        ) : (
          <form
            onSubmit={handleCreateSubmit}
            className="flex flex-col gap-2 p-2.5 rounded-lg bg-[#242426] border border-white/[0.08] shadow-inner"
          >
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-transparent text-[13px] text-white font-medium outline-none placeholder-neutral-500"
            />

            <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
              {/* Priority Selector */}
              <div className="flex items-center gap-1">
                {[
                  { p: 0, label: 'None', color: '#9CA3AF' },
                  { p: 1, label: 'Low', color: '#3B82F6' },
                  { p: 3, label: 'Med', color: '#F59E0B' },
                  { p: 5, label: 'High', color: '#EF4444' },
                ].map((item) => (
                  <button
                    key={item.p}
                    type="button"
                    onClick={() => setNewPriority(item.p)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                      newPriority === item.p
                        ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/40'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    style={{ color: newPriority === item.p ? item.color : undefined }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded bg-[#0A84FF] hover:bg-blue-500 text-white text-[11px] font-bold shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-neutral-500 px-4">
            <span className="text-[13px] font-medium">
              {activeTab === 'selected'
                ? `No tasks on ${selectedDateFull || 'this day'}`
                : 'No unscheduled tasks'}
            </span>
            <span className="text-[11px] mt-1 text-neutral-400">
              {activeTab === 'selected'
                ? 'Click on any date in Month or Year view, or drag tasks onto it.'
                : 'Drag tasks from here into any calendar slot or date.'}
            </span>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const priorityMeta = getPriorityMeta(task.priority);
            const isCompleted = Boolean(task.status);
            const timeText = task.startDate
              ? formatTimeRange(task.startDate, task.dueDate)
              : null;

            return (
              <div
                key={task._id}
                draggable={!isCompleted}
                onDragStart={(e) => handleDragStart(e, task)}
                className={`group relative flex items-center justify-between p-2.5 rounded-lg border transition-all select-none ${
                  isCompleted
                    ? 'bg-[#1E1E21] border-white/[0.05] opacity-85 cursor-default'
                    : 'bg-[#242426] hover:bg-[#2C2C2E] border-white/[0.06] hover:border-white/[0.12] shadow-sm cursor-grab active:cursor-grabbing'
                }`}
              >
                {/* Priority Left Indicator Bar */}
                <div
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r"
                  style={{ backgroundColor: isCompleted ? '#A1A1AA' : priorityMeta.color }}
                />

                <div className="flex items-center gap-2 min-w-0 pl-1.5 flex-1">
                  {isCompleted ? (
                    <div
                      className="text-neutral-500 shrink-0"
                      title="Completed task (cannot be moved)"
                    >
                      <Lock size={13} />
                    </div>
                  ) : (
                    <div
                      className="text-neutral-500 group-hover:text-neutral-300 transition-colors shrink-0"
                      title="Drag to rearrange to another date"
                    >
                      <GripVertical size={14} />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleTask && onToggleTask(task)}
                    className="text-neutral-400 hover:text-white shrink-0 transition-colors"
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <Circle size={14} />
                    )}
                  </button>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className={`text-[12px] font-medium truncate leading-snug ${
                        isCompleted ? 'line-through text-neutral-300 decoration-neutral-500/80' : 'text-white/90'
                      }`}
                    >
                      {decryptedTitles?.[task._id] || task.title || 'Untitled Task'}
                    </span>

                    {activeTab === 'backlog' ? (
                      task.startDate ? (
                        <span className="text-[10px] text-amber-400/90 flex items-center gap-1 mt-0.5 font-medium">
                          <Clock size={9} className="shrink-0" />
                          <span>
                            Overdue •{' '}
                            {new Date(task.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5 font-medium">
                          No date
                        </span>
                      )
                    ) : (
                      timeText && (
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5 font-medium">
                          <Clock size={9} className="shrink-0" />
                          {timeText}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1.5">
                  {task.priority > 0 && (
                    <span
                      className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${priorityMeta.badgeClass}`}
                    >
                      {priorityMeta.label}
                    </span>
                  )}

                  {/* Move to Backlog (Unschedule) button if scheduled and not completed */}
                  {task.startDate && !isCompleted && onUnscheduleTask && (
                    <button
                      type="button"
                      onClick={() => onUnscheduleTask(task._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-blue-400 transition-opacity"
                      title="Move to Backlog (Unschedule)"
                    >
                      <ArrowRightLeft size={13} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteTask && onDeleteTask(task._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 transition-opacity"
                    title="Delete task"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer Tip */}
      <div className="p-3 border-t border-[#38383A] bg-[#1E1E1E] text-center">
        <p className="text-[11px] text-neutral-400">
          💡 Drag any task directly onto another date cell to rearrange it!
        </p>
      </div>
    </aside>
  );
};

export default React.memo(ArrangeDrawer);
