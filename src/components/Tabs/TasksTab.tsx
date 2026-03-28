import React from "react";
import { Plus, ClipboardList } from "lucide-react";
import { Task } from "../../../types";

interface TasksTabProps {
  filteredTasks: Task[];
  taskFilters: {
    hauler: string;
    priority: string;
    dateRange: { start: string; end: string };
  };
  setTaskFilters: React.Dispatch<React.SetStateAction<{
    hauler: string;
    priority: string;
    dateRange: { start: string; end: string };
  }>>;
  handleAddTask: () => void;
}

/**
 * TasksTab Component
 * 
 * Displays a filtered list of tasks and provides controls for filtering and adding new tasks.
 * 
 * @param {TasksTabProps} props - Component props
 * @returns {JSX.Element} The rendered tasks tab
 * 
 * @example
 * <TasksTab filteredTasks={tasks} taskFilters={filters} setTaskFilters={setFilters} handleAddTask={onAdd} />
 */
const TasksTab: React.FC<TasksTabProps> = ({ 
  filteredTasks, 
  taskFilters, 
  setTaskFilters, 
  handleAddTask 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
          <ClipboardList size={20} className="text-indigo-500" /> Tasks
        </h3>
        <button 
          onClick={handleAddTask}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">New Task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Hauler</label>
            <input
              type="text"
              placeholder="Filter by hauler..."
              value={taskFilters.hauler}
              onChange={(e) => setTaskFilters(prev => ({ ...prev, hauler: e.target.value }))}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Priority</label>
            <select
              value={taskFilters.priority}
              onChange={(e) => setTaskFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Start Date</label>
            <input
              type="date"
              value={taskFilters.dateRange.start}
              onChange={(e) => setTaskFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">End Date</label>
            <input
              type="date"
              value={taskFilters.dateRange.end}
              onChange={(e) => setTaskFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-white/5">
            <p className="text-slate-500 text-sm font-bold">No tasks found matching your filters.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold">{task.title}</h4>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                  task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {task.priority}
                </span>
              </div>
              <p className="text-slate-400 text-xs">{task.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-indigo-400 text-[10px] uppercase font-black">{task.hauler || 'No Hauler'}</span>
                <span className="text-slate-600 text-[10px] font-bold uppercase">{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(TasksTab);
