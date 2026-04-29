
import React, { useState, useMemo } from 'react';
import { Task, User, UserRole, TaskStatus, TaskPriority, ExecutionLog } from '../types';
import { ClipboardList, Download, CheckCircle2, Clock, AlertTriangle, BarChart2 } from 'lucide-react';

interface TaskReportProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  [TaskStatus.PENDIENTE]: 'Pendiente',
  [TaskStatus.EN_PROCESO]: 'En Proceso',
  [TaskStatus.DEMORADO]: 'Demorado',
  [TaskStatus.REVISION]: 'Revisión',
  [TaskStatus.COMPLETADO]: 'Completado',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.PENDIENTE]: 'bg-slate-100 text-slate-600',
  [TaskStatus.EN_PROCESO]: 'bg-blue-100 text-blue-700',
  [TaskStatus.DEMORADO]: 'bg-red-100 text-red-700',
  [TaskStatus.REVISION]: 'bg-amber-100 text-amber-700',
  [TaskStatus.COMPLETADO]: 'bg-emerald-100 text-emerald-700',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.BAJA]: 'bg-slate-200 text-slate-600',
  [TaskPriority.MEDIA]: 'bg-amber-100 text-amber-700',
  [TaskPriority.ALTA]: 'bg-orange-100 text-orange-700',
  [TaskPriority.CRITICA]: 'bg-red-100 text-red-700',
};

function getLastLog(task: Task, userId: string): ExecutionLog | null {
  const logs = (task.executionLogs || []).filter(l => l.userId === userId);
  if (logs.length === 0) return null;
  return [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
}

function getCellInfo(log: ExecutionLog | null): { label: string; color: string; ts: string } | null {
  if (!log) return null;
  const ts = (() => {
    const d = new Date(log.timestamp);
    const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    return `${time} ${date}`;
  })();

  const a = log.action.toUpperCase();
  if (a.includes('COMPLETADO')) return { label: 'Completó', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', ts };
  if (a.includes('EN_PROCESO') || a.includes('EN PROCESO')) return { label: 'En Proceso', color: 'bg-blue-100 text-blue-700 border-blue-200', ts };
  if (a.includes('DEMORADO')) return { label: 'Demorado', color: 'bg-red-100 text-red-700 border-red-200', ts };
  if (a.includes('REVISION') || a.includes('REVISIÓN')) return { label: 'Revisión', color: 'bg-amber-100 text-amber-700 border-amber-200', ts };
  if (a.startsWith('EJECUCIÓN') || a.includes('OPEN_EXE')) return { label: 'Ejecutó', color: 'bg-purple-100 text-purple-700 border-purple-200', ts };
  if (a.includes('CAMBIO')) return { label: 'Actualizó', color: 'bg-slate-100 text-slate-600 border-slate-200', ts };
  return { label: log.action.slice(0, 12), color: 'bg-slate-100 text-slate-500 border-slate-200', ts };
}

export const TaskReport: React.FC<TaskReportProps> = ({ tasks, users }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  const branches = useMemo(() => {
    return Array.from(new Set(users.map(u => u.branch).filter(Boolean))) as string[];
  }, [users]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
      if (dateFrom && task.dueDate && task.dueDate < dateFrom) return false;
      if (dateTo && task.dueDate && task.dueDate > dateTo) return false;
      if (branchFilter !== 'ALL') {
        const assignee = users.find(u => u.id === task.assigneeId);
        if (!assignee || assignee.branch !== branchFilter) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, dateFrom, dateTo, branchFilter, users]);

  const relevantUsers = useMemo(() => {
    const ids = new Set<string>();
    filteredTasks.forEach(task => {
      if (task.assigneeId) ids.add(task.assigneeId);
      (task.executionLogs || []).forEach(l => ids.add(l.userId));
    });
    return users.filter(u => ids.has(u.id));
  }, [filteredTasks, users]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === TaskStatus.COMPLETADO).length;
    const overdue = filteredTasks.filter(t => {
      if (t.status === TaskStatus.COMPLETADO || !t.dueDate) return false;
      return t.dueDate < new Date().toISOString().split('T')[0];
    }).length;
    const inProcess = filteredTasks.filter(t => t.status === TaskStatus.EN_PROCESO).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, overdue, inProcess, rate };
  }, [filteredTasks]);

  const exportCSV = () => {
    const headers = [
      'Tarea', 'Prioridad', 'Estado', 'Fecha Límite', 'Recurrencia', 'Asignado a',
      ...relevantUsers.map(u => u.name)
    ];
    const rows = filteredTasks.map(task => {
      const assignee = users.find(u => u.id === task.assigneeId);
      const userCols = relevantUsers.map(u => {
        const log = getLastLog(task, u.id);
        if (!log) return '';
        const d = new Date(log.timestamp);
        const ts = `${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        return `${log.action} - ${ts}`;
      });
      return [
        task.title,
        task.priority,
        STATUS_LABEL[task.status] || task.status,
        task.dueDate || 'Sin fecha',
        task.recurrence,
        assignee?.name || '-',
        ...userCols,
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_tareas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <ClipboardList size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Reporte de Ejecución de Tareas</h1>
            <p className="text-xs text-slate-500 font-medium">Trazabilidad completa por usuario · {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          disabled={filteredTasks.length === 0}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
            <BarChart2 size={16} className="text-slate-400" />
          </div>
          <p className="text-3xl font-black text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">tareas en período</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Completadas</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-600">{stats.completed}</p>
          <p className="text-xs text-slate-400 mt-1">{stats.rate}% de cumplimiento</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">En Proceso</span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <p className="text-3xl font-black text-blue-600">{stats.inProcess}</p>
          <p className="text-xs text-slate-400 mt-1">en ejecución</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Vencidas</span>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <p className="text-3xl font-black text-red-600">{stats.overdue}</p>
          <p className="text-xs text-slate-400 mt-1">sin completar</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estado</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
          >
            <option value="ALL">Todos</option>
            {Object.values(TaskStatus).map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        {branches.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sucursal</label>
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
            >
              <option value="ALL">Todas</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        )}
        {(dateFrom || dateTo || statusFilter !== 'ALL' || branchFilter !== 'ALL') && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter('ALL'); setBranchFilter('ALL'); }}
            className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 self-end"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
          <ClipboardList size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium">No hay tareas para los filtros seleccionados</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="sticky left-0 z-10 bg-slate-800 text-left px-4 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap min-w-[220px]">
                    Tarea
                  </th>
                  <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap">
                    Prioridad
                  </th>
                  <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap">
                    Estado
                  </th>
                  <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap">
                    Vence
                  </th>
                  <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap">
                    Asignado a
                  </th>
                  {relevantUsers.map(u => (
                    <th key={u.id} className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                      <div className="flex flex-col items-center space-y-1">
                        <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full border border-white/30 object-cover" />
                        <span className="text-[10px] leading-tight max-w-[100px] truncate">{u.name.split(' ')[0]}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, idx) => {
                  const assignee = users.find(u => u.id === task.assigneeId);
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={task.id}
                      className={`border-b border-slate-100 hover:bg-indigo-50/40 transition-colors ${isEven ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      {/* Tarea */}
                      <td className={`sticky left-0 z-10 px-4 py-3 font-semibold text-slate-800 whitespace-nowrap max-w-[220px] ${isEven ? 'bg-white' : 'bg-slate-50/80'} border-r border-slate-100`}>
                        <div className="truncate max-w-[200px]" title={task.title}>{task.title}</div>
                        {task.recurrence !== 'NINGUNA' && (
                          <span className="text-[9px] font-bold text-indigo-500 uppercase">{task.recurrence}</span>
                        )}
                      </td>
                      {/* Prioridad */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                      </td>
                      {/* Estado */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                          {STATUS_LABEL[task.status]}
                        </span>
                      </td>
                      {/* Vence */}
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-500 font-medium">
                        {task.dueDate
                          ? new Date(task.dueDate + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      {/* Asignado a */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {assignee ? (
                          <div className="flex items-center space-x-2">
                            <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                            <span className="text-xs text-slate-600 font-medium truncate max-w-[100px]">{assignee.name.split(' ')[0]}</span>
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      {/* Columnas por usuario */}
                      {relevantUsers.map(u => {
                        const log = getLastLog(task, u.id);
                        const cell = getCellInfo(log);
                        return (
                          <td key={u.id} className="px-3 py-3 text-center whitespace-nowrap">
                            {cell ? (
                              <div className="flex flex-col items-center space-y-0.5 group relative">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cell.color}`}>
                                  {cell.label}
                                </span>
                                <span className="text-[8px] text-slate-400 font-medium">{cell.ts}</span>
                              </div>
                            ) : (
                              <span className="text-slate-200 text-lg leading-none">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">
              {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''} · {relevantUsers.length} colaborador{relevantUsers.length !== 1 ? 'es' : ''} con actividad
            </p>
            <p className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">
              Generado {new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
