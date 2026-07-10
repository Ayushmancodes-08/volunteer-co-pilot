'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext.jsx';

export default function VolunteerProfile({ profile, onUpdate, loading }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [gate, setGate] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [tasks, setTasks] = useState([]);
  
  // Timer state for remaining shift
  const [timeLeft, setTimeLeft] = useState('07:59:59');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setRole(profile.role);
      setGate(profile.gate);
      setTasks(profile.tasks || []);
    }
  }, [profile]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const parts = prev.split(':').map(Number);
        let s = parts[2], m = parts[1], h = parts[0];
        s--;
        if (s < 0) {
          s = 59;
          m--;
          if (m < 0) {
            m = 59;
            h--;
            if (h < 0) {
              clearInterval(interval);
              return '00:00:00';
            }
          }
        }
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ name, role, gate, tasks });
  };

  const toggleTask = (taskId) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    onUpdate({ name, role, gate, tasks: updated });
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    setNewTaskText('');
    onUpdate({ name, role, gate, tasks: updated });
  };

  const deleteTask = (taskId) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    onUpdate({ name, role, gate, tasks: updated });
  };

  const roles = [
    'Gate Monitor',
    'Medical First Aid',
    'Language Assist',
    'Crowd Control',
    'Stadium Host'
  ];

  const gates = ['A', 'B', 'C', 'D', 'E', 'F'];

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      {/* Profile Info Form Card */}
      <section className="lg:col-span-1 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {t('profile.title')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{t('profile.name')}</label>
              <input
                id="prof-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="prof-role" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{t('profile.role')}</label>
              <select
                id="prof-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm transition-all"
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="prof-gate" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{t('profile.gate')}</label>
              <select
                id="prof-gate"
                value={gate}
                onChange={(e) => setGate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm transition-all"
              >
                {gates.map(g => <option key={g} value={g}>Gate {g}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-2.5 text-sm font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {loading ? '...' : t('profile.save')}
            </button>
          </form>
        </div>

        {/* Shift Details (Streak & Countdown) */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
          <div className="flex justify-between items-center bg-blue-50/50 rounded-xl p-3 border border-blue-100/40">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{t('profile.streak')}</span>
              <span className="text-xl font-bold text-blue-900">4 Shift Days</span>
            </div>
            <div className="text-3xl" aria-hidden="true">🔥</div>
          </div>

          <div className="flex justify-between items-center bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/40">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{t('profile.duration')}</span>
              <span className="text-xl font-mono font-bold text-indigo-900" aria-label={`Time remaining: ${timeLeft}`}>{timeLeft}</span>
            </div>
            <div className="text-3xl" aria-hidden="true">⏱️</div>
          </div>
        </div>
      </section>

      {/* Task Checklist Card */}
      <section className="lg:col-span-2 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {t('profile.tasks')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Stay organized and log field tasks instantly.</p>
            </div>

            {/* Task completion indicator */}
            <div className="flex items-center gap-3" aria-label={`${completedCount} of ${tasks.length} tasks completed (${progressPercent}%)`}>
              <span className="text-sm font-bold text-slate-600" aria-hidden="true">{completedCount}/{tasks.length} ({progressPercent}%)</span>
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Task completion progress">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Task Add Form */}
          <form onSubmit={addTask} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder={t('profile.taskPlaceholder')}
              aria-label={t('profile.taskPlaceholder')}
              className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl px-4 py-2 text-sm transition-all"
            />
            <button
              type="submit"
              className="bg-slate-900 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              {t('profile.addTask')}
            </button>
          </form>

          {/* Task list */}
          <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-1" aria-label="Task checklist">
            {tasks.map(task => (
              <li
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  task.completed 
                    ? 'bg-slate-50/50 border-slate-100 text-slate-400 line-through' 
                    : 'bg-white border-slate-200/50 text-slate-700 shadow-sm hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    aria-label={`${task.completed ? 'Mark incomplete' : 'Mark complete'}: ${task.text}`}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium cursor-pointer" onClick={() => toggleTask(task.id)}>{task.text}</span>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                  aria-label={`Delete task: ${task.text}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                <span className="text-3xl block mb-2" aria-hidden="true">📋</span>
                <span className="text-sm font-medium text-slate-400">All caught up! Add a custom task to start.</span>
              </div>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
