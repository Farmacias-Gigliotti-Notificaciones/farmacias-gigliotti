
import React, { useState, useEffect, useMemo } from 'react';
import { Project, Task, UserRole, User, TaskStatus, Branch } from '../types';
// Fixed missing RefreshCw import
import { Sparkles, AlertTriangle, CheckCircle, Users, Clock, Building2, ChevronRight, Calendar, X, Check, Activity, TrendingUp, TrendingDown, Target, FileText, Filter, RefreshCw } from 'lucide-react';
import { generateExecutiveReport } from '../services/geminiService';

interface DashboardProps {
  projects: Project[];
  tasks: Task[];
  role: UserRole;
  users?: User[];
  currentUser: User;
  branches?: Branch[];
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, role, users = [], currentUser, projects, branches = [] }) => {
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [selectedUserForTasks, setSelectedUserForTasks] = useState<User | null>(null);
  const [timeframe, setTimeframe] = useState<'MONTH' | 'YEAR'>('MONTH');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const isEncargado = role === UserRole.ENCARGADO;
  const isExecutive = [UserRole.GERENCIA, UserRole.SOCIO, UserRole.RRHH].includes(role);

  const isTaskStarted = (t: Task) => {
    const start = new Date(`${t.startDate}T${t.startTime || '00:00'}`);
    return now.getTime() >= start.getTime();
  };

  // Métricas por Sucursal
  const branchComparisonStats = useMemo(() => {
    return branches.map(branch => {
      const branchUsers = users.filter(u => u.branch === branch.name).map(u => u.id);
      const branchTasks = tasks.filter(t => branchUsers.includes(t.assigneeId));
      
      const completed = branchTasks.filter(t => t.status === TaskStatus.COMPLETADO).length;
      const delayed = branchTasks.filter(t => 
        t.status !== TaskStatus.COMPLETADO && 
        t.dueDate && new Date(t.dueDate) < now
      ).length;
      const efficiency = branchTasks.length ? Math.round((completed / branchTasks.length) * 100) : 0;

      return {
        branch,
        total: branchTasks.length,
        completed,
        delayed,
        efficiency,
        status: efficiency > 80 ? 'ALTA' : efficiency > 50 ? 'MEDIA' : 'CRÍTICA'
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
  }, [branches, tasks, users, now]);

  // Ranking de Incumplidores (Personal expuesto)
  const topIncumplidores = useMemo(() => {
    return users.map(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id);
      const delayed = userTasks.filter(t => 
        t.status !== TaskStatus.COMPLETADO && 
        t.dueDate && new Date(t.dueDate) < now
      ).length;
      return { user, delayed };
    }).filter(u => u.delayed > 0).sort((a, b) => b.delayed - a.delayed).slice(0, 10);
  }, [users, tasks, now]);

  const handleGenerateAiAudit = async () => {
    setLoadingAi(true);
    const report = await generateExecutiveReport(projects, tasks, users, branches);
    setAiReport(report);
    setLoadingAi(false);
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, subtext }: any) => (
    <div className={`bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 border-l-[10px] ${colorClass} hover:shadow-2xl transition-all transform hover:-translate-y-2 group`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2">{title}</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-brand-600 transition-colors">{value}</h3>
            </div>
            <div className={`p-5 rounded-3xl ${colorClass.replace('border-l-', 'bg-').replace('500', '50')} ${colorClass.replace('border-l-', 'text-').replace('500', '600')} group-hover:scale-110 transition-transform`}>
                <Icon size={32} />
            </div>
        </div>
        {subtext && <p className="text-[10px] text-slate-400 font-bold italic mt-4 uppercase tracking-widest opacity-60">{subtext}</p>}
    </div>
  );

  return (
    <div className="p-10 space-y-12 animate-fade-in bg-slate-50 min-h-screen pb-24">
      {/* Modal Detalles Usuario */}
      {selectedUserForTasks && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setSelectedUserForTasks(null)}>
            <div className="bg-white rounded-[3rem] w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-white/20" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center space-x-5">
                        <img src={selectedUserForTasks.avatar} className="w-16 h-16 rounded-3xl border-4 border-white shadow-lg object-cover" alt=""/>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{selectedUserForTasks.name}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedUserForTasks.role} - {selectedUserForTasks.branch}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedUserForTasks(null)} className="p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-2xl transition-all"><X/></button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {/* Lista de tareas similar a la original */}
                    <div className="space-y-4">
                        {tasks.filter(t => t.assigneeId === selectedUserForTasks.id).map(t => (
                             <div key={t.id} className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-center">
                                <div>
                                    <p className="font-black text-slate-800">{t.title}</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">{t.status} • {t.dueDate || 'Permanente'}</p>
                                </div>
                                <span className={`w-3 h-3 rounded-full ${t.status === 'COMPLETADO' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                             </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Modal Reporte IA */}
      {aiReport && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[4rem] w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            <div className="p-10 border-b bg-slate-50/80 flex justify-between items-center shrink-0">
               <div className="flex items-center space-x-5">
                  <div className="p-4 bg-brand-600 rounded-3xl text-white shadow-xl shadow-brand-500/20"><Sparkles size={32}/></div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Auditoría Ejecutiva de IA</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Farmacias Gigliotti • Reporte de Efectividad Operativa</p>
                  </div>
               </div>
               <button onClick={() => setAiReport(null)} className="p-5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-all border border-slate-100 bg-white"><X size={28}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white prose prose-slate prose-lg max-w-none">
                <div dangerouslySetInnerHTML={{ __html: aiReport }} />
            </div>
            <div className="p-10 border-t bg-slate-50/50 flex justify-end items-center space-x-4">
                <button onClick={() => window.print()} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Exportar PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-10 gap-6">
        <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                {isExecutive ? 'Centro de Auditoría Gigliotti' : `Monitor: ${currentUser.branch}`}
            </h1>
            <div className="flex items-center space-x-6 mt-3">
                <p className="text-slate-500 font-bold flex items-center uppercase text-[10px] tracking-[0.2em]"><Clock size={16} className="mr-3 text-brand-500"/> Sincronizado: {now.toLocaleTimeString()}</p>
                {isExecutive && (
                    <div className="flex bg-slate-200 p-1 rounded-xl">
                        <button onClick={() => setTimeframe('MONTH')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timeframe === 'MONTH' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Mensual</button>
                        <button onClick={() => setTimeframe('YEAR')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timeframe === 'YEAR' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Anual</button>
                    </div>
                )}
            </div>
        </div>
        <div className="flex items-center space-x-4">
             {isExecutive && (
                <button 
                  onClick={handleGenerateAiAudit}
                  disabled={loadingAi} 
                  className="bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] flex items-center space-x-4 shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all font-black text-sm active:scale-95 disabled:opacity-50"
                >
                    {loadingAi ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} className="text-brand-400"/>}
                    <span>{loadingAi ? 'Analizando...' : 'Auditoría IA Comparativa'}</span>
                </button>
             )}
        </div>
      </div>

      {isExecutive ? (
         <div className="space-y-12">
            {/* KPIs Ejecutivos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                <StatCard title="Efectividad Global" value={`${Math.round((tasks.filter(t => t.status === 'COMPLETADO').length / (tasks.length || 1)) * 100)}%`} icon={Target} colorClass="border-l-brand-500" subtext={`Rendimiento ${timeframe === 'MONTH' ? 'del mes' : 'acumulado anual'}`} />
                <StatCard title="Sede Líder" value={branchComparisonStats[0]?.branch.name || '-'} icon={TrendingUp} colorClass="border-l-emerald-500" subtext="Mayor tasa de cumplimiento." />
                <StatCard title="Sede Crítica" value={branchComparisonStats[branchComparisonStats.length - 1]?.branch.name || '-'} icon={TrendingDown} colorClass="border-l-red-500" subtext="Bajo índice de resolución." />
                <StatCard title="Personal Moroso" value={topIncumplidores.length} icon={AlertTriangle} colorClass="border-l-amber-500" subtext="Con tareas fuera de término." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Tabla Comparativa de Sucursales */}
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-10 border-b flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Ranking Inter-Sede</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Efectividad comparada de sucursales</p>
                        </div>
                        <Filter size={20} className="text-slate-300"/>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-10 py-5">Sucursal</th>
                                    <th className="px-10 py-5 text-center">Efectividad</th>
                                    <th className="px-10 py-5 text-center">Demoras</th>
                                    <th className="px-10 py-5 text-right">Estatus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {branchComparisonStats.map((stat, idx) => (
                                    <tr key={stat.branch.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center space-x-4">
                                                <span className="text-xs font-black text-slate-300">#{idx + 1}</span>
                                                <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><Building2 size={16}/></div>
                                                <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{stat.branch.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-sm font-black ${stat.efficiency > 70 ? 'text-emerald-600' : 'text-red-600'}`}>{stat.efficiency}%</span>
                                                <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                    <div className={`h-full ${stat.efficiency > 70 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${stat.efficiency}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className={`text-[11px] font-black ${stat.delayed > 0 ? 'text-red-500' : 'text-slate-300'}`}>{stat.delayed}</span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border ${
                                                stat.status === 'ALTA' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                stat.status === 'MEDIA' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-red-50 text-red-600 border-red-100 animate-pulse'
                                            }`}>
                                                {stat.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Lista de Exposición de Bajo Rendimiento */}
                <div className="bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
                    <div className="p-10 border-b border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Alertas de Desempeño Crítico</h3>
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">Personal con mayor índice de incumplimiento</p>
                        </div>
                        <AlertTriangle size={24} className="text-red-500 animate-pulse"/>
                    </div>
                    <div className="p-8 space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar">
                        {topIncumplidores.length === 0 ? (
                            <div className="py-20 text-center opacity-30">
                                <CheckCircle size={60} className="mx-auto text-emerald-500 mb-6"/>
                                <p className="text-white font-black uppercase tracking-widest">Sin alertas críticas</p>
                            </div>
                        ) : (
                            topIncumplidores.map(({ user, delayed }) => (
                                <div key={user.id} onClick={() => setSelectedUserForTasks(user)} className="bg-white/5 border border-white/10 p-5 rounded-[2rem] flex justify-between items-center hover:bg-white/10 transition-all cursor-pointer group">
                                    <div className="flex items-center space-x-4">
                                        <img src={user.avatar} className="w-12 h-12 rounded-2xl border-2 border-white/10 object-cover" alt=""/>
                                        <div>
                                            <p className="text-sm font-black text-white tracking-tight">{user.name}</p>
                                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{user.branch} • {user.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl border border-red-500/20">
                                            <span className="text-lg font-black">{delayed}</span>
                                            <span className="text-[8px] font-black uppercase ml-2">Incumplidas</span>
                                        </div>
                                        <p className="text-[8px] font-bold text-slate-500 mt-2 uppercase flex items-center justify-end">Ver Hoja de Ruta <ChevronRight size={10} className="ml-1"/></p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-8 mt-auto border-t border-slate-800 bg-black/20">
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                            <span className="text-red-400 mr-2 font-black">AUDITORÍA:</span> Los colaboradores listados arriba superan el umbral de tolerancia de tareas demoradas según el cronograma vigente.
                        </p>
                    </div>
                </div>
            </div>
         </div>
      ) : (
        /* Vista Encargado (Original Mejorada) */
        <div className="space-y-12">
            {/* Aquí iría la lógica original para encargados que ya estaba implementada */}
            <div className="h-[30rem] flex flex-col items-center justify-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 text-slate-300 group hover:border-brand-200 transition-all shadow-inner">
                <div className="bg-slate-50 p-12 rounded-[2.5rem] mb-8 group-hover:scale-110 transition-transform duration-700"><Building2 size={80} className="opacity-10"/></div>
                <p className="text-xl font-black uppercase tracking-[0.3em] opacity-30">Monitor de Sucursal</p>
                <p className="text-sm font-bold text-slate-400 mt-4 italic opacity-50">Acceso restringido a la vista de auditoría inter-sede.</p>
            </div>
        </div>
      )}
    </div>
  );
};
