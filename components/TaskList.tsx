
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, UserRole, User, RecurrenceType, Attachment, Comment, ExecutionLog } from '../types';
import { 
  Clock, MessageSquare, Calendar, Send, Plus, Paperclip, FileText, 
  Repeat, Users, Save, X, Infinity, Activity, Trash2, Check, 
  BellRing, Hash, ExternalLink, Edit3, ChevronRight, Rocket, 
  Maximize2, Terminal, Cpu, Monitor, History, ShieldCheck, Database,
  FileUp, Image as ImageIcon, Video as VideoIcon, Trash, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS_OF_DAY = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', 
  '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', 
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', 
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];
const MONTHS_OF_YEAR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const HOURLY_INTERVALS = ['1h', '2h', '4h', '6h', '8h', '12h'];

const ALL_ROLES = Object.values(UserRole);

const columns = [
  { title: 'Pendientes', status: TaskStatus.PENDIENTE, color: 'border-t-slate-300', bg: 'bg-slate-50' },
  { title: 'En Proceso', status: TaskStatus.EN_PROCESO, color: 'border-t-emerald-500', bg: 'bg-emerald-50/30' },
  { title: 'En Revisión', status: TaskStatus.REVISION, color: 'border-t-amber-500', bg: 'bg-amber-50/30' },
  { title: 'Demoradas', status: TaskStatus.DEMORADO, color: 'border-t-red-500', bg: 'bg-red-50/30' },
  { title: 'Completadas', status: TaskStatus.COMPLETADO, color: 'border-t-blue-500', bg: 'bg-blue-50/30' },
];

interface TaskListProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onUpdateTask: (task: Task) => void;
  onAddTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, users, currentUser, onUpdateTask, onAddTask, onDeleteTask }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [newMessage, setNewMessage] = useState('');
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  
  const [executingFile, setExecutingFile] = useState<Attachment | null>(null);
  const [execStatus, setExecStatus] = useState<'BOOTING' | 'RUNNING'>('BOOTING');
  const [zoomLevel, setZoomLevel] = useState(1);

  const initialTaskState: Partial<Task> = {
    title: '', description: '', startDate: new Date().toISOString().split('T')[0], startTime: '09:00',
    dueDate: '', priority: TaskPriority.BAJA, recurrence: 'NINGUNA',
    attachments: [], recurrenceDays: [], recurrenceMonths: [], recurrenceHours: [], 
    allowedChatRoles: [UserRole.USUARIO, UserRole.ENCARGADO, UserRole.SUPERVISOR],
    executionLogs: []
  };

  const [formData, setFormData] = useState<Partial<Task>>(initialTaskState);
  const [noDueDateNew, setNoDueDateNew] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<'ALL' | string>(currentUser.branch || 'ALL');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  const exeInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  const isSuperior = [UserRole.ENCARGADO, UserRole.SUPERVISOR, UserRole.GERENCIA, UserRole.SOCIO, UserRole.RRHH].includes(currentUser.role);
  const canSeeAudit = [UserRole.ENCARGADO, UserRole.SUPERVISOR, UserRole.GERENCIA, UserRole.SOCIO, UserRole.RRHH].includes(currentUser.role);

  const filteredTasks = useMemo(() => {
    if (currentUser.role === UserRole.USUARIO) return tasks.filter(t => t.assigneeId === currentUser.id);
    return tasks;
  }, [tasks, currentUser]);

  const visibleUsersForSelection = useMemo(() => {
    let list = users;
    if (assigneeFilter !== 'ALL') list = users.filter(u => u.branch === assigneeFilter);
    return list;
  }, [users, assigneeFilter]);

  const areAllVisibleSelected = useMemo(() => {
    if (visibleUsersForSelection.length === 0) return false;
    return visibleUsersForSelection.every(u => selectedAssigneeIds.includes(u.id));
  }, [visibleUsersForSelection, selectedAssigneeIds]);

  const handleToggleSelectAll = () => {
    if (areAllVisibleSelected) {
      const visibleIds = visibleUsersForSelection.map(u => u.id);
      setSelectedAssigneeIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const visibleIds = visibleUsersForSelection.map(u => u.id);
      setSelectedAssigneeIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleExecuteFile = (file: Attachment) => {
    if (!selectedTask) return;
    const log: ExecutionLog = {
        id: `log-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        timestamp: new Date().toISOString(),
        action: `EJECUCIÓN: ${file.name} (${file.type})`
    };
    const updatedTask = { ...selectedTask, executionLogs: [...(selectedTask.executionLogs || []), log], status: selectedTask.status === TaskStatus.PENDIENTE ? TaskStatus.EN_PROCESO : selectedTask.status };
    onUpdateTask(updatedTask);
    setSelectedTask(updatedTask);
    setExecutingFile(file);
    setExecStatus('BOOTING');
    setZoomLevel(1);
    setTimeout(() => setExecStatus('RUNNING'), 1800);
  };

  const handleStatusUpdate = useCallback((task: Task, newStatus: TaskStatus) => {
    const log: ExecutionLog = { id: `log-st-${Date.now()}`, userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, timestamp: new Date().toISOString(), action: `CAMBIO DE ESTADO A: ${newStatus}` };
    const updated = { ...task, status: newStatus, executionLogs: [...(task.executionLogs || []), log] };
    onUpdateTask(updated);
    if (newStatus === TaskStatus.COMPLETADO) setSelectedTask(null);
    else if (selectedTask?.id === task.id) setSelectedTask(updated);
  }, [onUpdateTask, selectedTask, currentUser]);

  const handleSendNovedad = () => {
    if (!newMessage.trim() || !selectedTask) return;
    const comment: Comment = { id: `c${Date.now()}`, userId: currentUser.id, userName: currentUser.name, text: newMessage.trim(), timestamp: new Date().toISOString() };
    const updated = { ...selectedTask, comments: [...(selectedTask.comments || []), comment] };
    onUpdateTask(updated);
    setSelectedTask(updated);
    setNewMessage('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'EXE' | 'ATTACH') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const attachment: Attachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: file.name,
      type: type === 'EXE' ? 'EXECUTABLE' : (file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : 'DOCUMENT'),
      url: URL.createObjectURL(file),
      mimeType: file.type || 'application/octet-stream'
    };
    if (type === 'EXE') setFormData(prev => ({ ...prev, executableFile: attachment }));
    else setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), attachment] }));
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setFormData(prev => ({ ...prev, attachments: (prev.attachments || []).filter(a => a.id !== id) }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || selectedAssigneeIds.length === 0) return;
    if (formMode === 'CREATE') {
      // Crear una sola tarea con el PRIMER usuario seleccionado
      const uid = selectedAssigneeIds[0];
      const targetUser = users.find(u => u.id === uid);
      const targetRole = targetUser ? targetUser.role : UserRole.USUARIO;
      const taskId = crypto.randomUUID();
      onAddTask({ ...formData, id: taskId, status: TaskStatus.PENDIENTE, assigneeId: uid, creatorId: currentUser.id, creatorName: currentUser.name, createdAt: new Date().toISOString(), targetRoles: [targetRole], dueDate: noDueDateNew ? '' : (formData.dueDate || ''), comments: [], executionLogs: [], attachments: formData.attachments || [], executableFile: formData.executableFile, allowedChatRoles: formData.allowedChatRoles || [] } as Task);
    } else if (formMode === 'EDIT' && selectedTask) {
      const updatedOriginal = { ...selectedTask, ...formData, dueDate: noDueDateNew ? '' : (formData.dueDate || ''), assigneeId: selectedAssigneeIds[0] } as Task;
      onUpdateTask(updatedOriginal);
      setSelectedTask(updatedOriginal);
    }
    setIsFormModalOpen(false);
  };

  const toggleRecurrenceItem = (type: 'days' | 'months' | 'hours', item: string) => {
    const key = type === 'days' ? 'recurrenceDays' : type === 'months' ? 'recurrenceMonths' : 'recurrenceHours';
    const current = (formData[key] as string[]) || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    setFormData(prev => ({ ...prev, [key]: updated }));
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(0.5, prev + delta), 4));
  };

  return (
    <div className="p-4 h-full bg-indigo-50 flex flex-col overflow-hidden relative">
      
      {/* 🖥️ VISOR DE ARCHIVOS MAXIMIZADO GIGLIOTTI */}
      {executingFile && (
        <div className="fixed inset-0 z-[250] bg-black flex flex-col items-center justify-center animate-fade-in backdrop-blur-xl">
            <div className="w-full h-full flex flex-col relative">
                {/* Header Visor */}
                <div className="bg-slate-900/90 backdrop-blur px-8 py-4 flex justify-between items-center border-b border-white/10 shrink-0 z-50">
                    <div className="flex items-center space-x-6">
                        <div className="p-2 bg-brand-500 rounded-lg text-white">
                            {executingFile.type === 'IMAGE' ? <ImageIcon size={20}/> : executingFile.type === 'VIDEO' ? <VideoIcon size={20}/> : <Monitor size={20}/>}
                        </div>
                        <div>
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em] block">Visor de Auditoría Gigliotti</span>
                            <span className="text-lg font-black text-white tracking-tight">{executingFile.name}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                        {executingFile.type === 'IMAGE' && (
                            <div className="flex bg-slate-800 rounded-2xl p-1 border border-white/5">
                                <button onClick={() => handleZoom(-0.25)} className="p-3 text-white hover:bg-slate-700 rounded-xl transition-all" title="Alejar"><ZoomOut size={20}/></button>
                                <div className="px-4 flex items-center border-x border-white/5">
                                    <span className="text-[10px] font-black text-emerald-500 font-mono w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                                </div>
                                <button onClick={() => handleZoom(0.25)} className="p-3 text-white hover:bg-slate-700 rounded-xl transition-all" title="Acercar"><ZoomIn size={20}/></button>
                                <button onClick={() => setZoomLevel(1)} className="p-3 text-white hover:bg-slate-700 rounded-xl transition-all ml-1" title="Restablecer"><RotateCcw size={20}/></button>
                            </div>
                        )}
                        <button onClick={() => setExecutingFile(null)} className="bg-red-600/20 hover:bg-red-600 p-4 text-red-500 hover:text-white rounded-2xl transition-all border border-red-600/30 group">
                            <X size={24} className="group-hover:rotate-90 transition-transform"/>
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/40">
                    {execStatus === 'BOOTING' ? (
                        <div className="flex flex-col items-center justify-center space-y-10 animate-pulse">
                            <Cpu size={100} className="text-emerald-500" />
                            <div className="w-96 space-y-4 text-center">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em] block">Procesando Binario de Auditoría...</span>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 animate-[loading_1.8s_ease-in-out]"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full relative overflow-auto flex items-center justify-center custom-scrollbar">
                            {executingFile.type === 'VIDEO' ? (
                                <div className="w-full h-full flex items-center justify-center p-4">
                                    <video controls autoPlay className="max-w-full max-h-full rounded-[2rem] shadow-2xl border border-white/10">
                                        <source src={executingFile.url} type="video/mp4" />
                                    </video>
                                </div>
                            ) : executingFile.type === 'IMAGE' ? (
                                <div 
                                  className="w-full h-full flex items-center justify-center p-10 cursor-move"
                                  style={{ minHeight: '100%' }}
                                >
                                    <img 
                                      src={executingFile.url} 
                                      className="transition-transform duration-200 ease-out shadow-2xl rounded-xl"
                                      style={{ 
                                        transform: `scale(${zoomLevel})`,
                                        maxWidth: zoomLevel > 1 ? 'none' : '90%',
                                        maxHeight: zoomLevel > 1 ? 'none' : '90%',
                                        objectFit: 'contain'
                                      }} 
                                      alt="" 
                                    />
                                </div>
                            ) : (
                                <div className="w-full max-w-4xl p-12 bg-slate-900/60 rounded-[3rem] border border-emerald-500/20 shadow-2xl text-center">
                                    <div className="flex flex-col items-center space-y-10">
                                        <FileText size={100} className="text-emerald-500/50" />
                                        <div className="space-y-4">
                                            <h4 className="text-4xl font-black text-white tracking-tighter uppercase italic">ARCHIVO DE DOCUMENTACIÓN</h4>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold">Este archivo requiere descarga para su edición</p>
                                        </div>
                                        <button 
                                          onClick={() => { const link = document.createElement('a'); link.href = executingFile.url; link.download = executingFile.name; link.click(); }} 
                                          className="px-16 py-6 bg-emerald-600 text-black font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-400 transition-all shadow-2xl active:scale-95"
                                        >
                                            Descargar Documento
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Header Tablero */}
      <div className="flex justify-between items-center mb-4 shrink-0 px-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tighter">Panel Operativo</h2>
          <div className="flex items-center space-x-3 mt-0.5">
            <p className="text-slate-400 font-bold uppercase text-[8px] tracking-widest">Gigliotti Pharma</p>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Auditoría On</span>
          </div>
        </div>
        {isSuperior && (
          <button onClick={() => { setFormData(initialTaskState); setSelectedAssigneeIds([]); setNoDueDateNew(false); setFormMode('CREATE'); setIsFormModalOpen(true); }} className="bg-brand-600 text-white px-5 py-2.5 rounded-xl hover:bg-brand-700 flex items-center shadow-lg transition-all active:scale-95 font-black text-[9px] uppercase tracking-widest">
            <Plus size={14} className="mr-2"/> Lanzar Operación
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex space-x-4 overflow-x-auto pb-4 h-full custom-scrollbar items-start px-2">
        {columns.map(col => (
          <div key={col.status} className={`w-72 flex-shrink-0 ${col.bg} rounded-[2rem] border-t-4 ${col.color} p-4 flex flex-col max-h-full shadow-sm`}>
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-black text-slate-500 uppercase text-[9px] tracking-widest">{col.title}</h3>
                <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-400 font-black text-[9px]">
                    {filteredTasks.filter(t => t.status === col.status).length}
                </span>
            </div>
            <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar-thin flex-1 pb-2">
              {filteredTasks.filter(t => t.status === col.status).map(task => (
                <div key={task.id} onClick={() => { setSelectedTask(task); setShowAuditLogs(false); }} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-brand-500 transition-all cursor-pointer group relative">
                   <div className="flex justify-between items-start mb-2">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-tighter ${task.priority === 'CRITICA' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{task.priority}</span>
                      <div className="flex items-center space-x-2">
                        {canSeeAudit && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Borrar Tarea"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                        {task.executionLogs?.length > 0 && <ShieldCheck size={10} className="text-emerald-500" />}
                        {task.executableFile && <Rocket size={10} className="text-brand-500 animate-pulse" />}
                      </div>
                   </div>
                   <h4 className="font-black text-slate-800 text-xs mb-2 leading-tight group-hover:text-brand-600">{task.title}</h4>
                   <div className="pt-2 mt-2 border-t border-slate-50 flex items-center justify-between text-[8px] font-bold text-slate-400">
                      <span className="flex items-center"><Calendar size={10} className="mr-1"/>{task.startDate}</span>
                      <span className={`flex items-center font-black ${task.dueDate ? 'text-red-400' : 'text-blue-500'}`}>
                        {task.dueDate ? <><Clock size={10} className="mr-1"/>{task.dueDate}</> : <><Infinity size={10} className="mr-1"/>PERMANENTE</>}
                      </span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL NUEVA OPERACIÓN */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[100] p-2">
            <form onSubmit={handleFormSubmit} className="bg-white rounded-[3rem] w-full max-w-[95vw] shadow-2xl flex flex-col max-h-[96vh] overflow-hidden border border-white/20">
                <div className="px-8 py-5 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-black text-brand-700 uppercase tracking-tighter">Nueva Operación Gigliotti</h2>
                    <button type="button" onClick={() => setIsFormModalOpen(false)} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 hover:text-red-500 transition-all active:scale-90"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-4 gap-4 p-5 bg-white">
                    {/* PANEL 1: OPERATIVA */}
                    <div className="bg-slate-50/80 p-5 rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center mb-3"><FileText size={16} className="mr-2 text-brand-500"/> Operativa</h4>
                        <div className="flex-1 overflow-y-auto custom-scrollbar-thin space-y-3 pr-1">
                            <input required type="text" className="w-full border border-slate-200 rounded-xl p-3 text-xs font-black outline-none shadow-sm focus:ring-4 focus:ring-brand-500/10" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Título de la Orden" />
                            <textarea className="w-full border border-slate-200 rounded-xl p-3 text-[10px] h-44 resize-none outline-none shadow-sm focus:ring-4 focus:ring-brand-500/10" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descripción técnica y pasos detallados..." />
                            <select className="w-full border border-slate-200 rounded-xl p-3 text-[10px] font-black outline-none bg-white shadow-sm" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}>
                                {Object.values(TaskPriority).map(p => <option key={p} value={p}>Prioridad {p}</option>)}
                            </select>
                            
                            <div className="pt-3 border-t border-slate-200 space-y-2">
                                <label className="block text-[9px] font-black text-brand-600 uppercase ml-1">Material y Binarios</label>
                                <div className="space-y-1.5">
                                    <button type="button" onClick={() => exeInputRef.current?.click()} className="w-full border-2 border-brand-100 bg-white rounded-2xl py-2 text-[9px] font-black text-brand-600 hover:bg-brand-50 transition-all flex items-center justify-center group">
                                        <Rocket size={14} className="mr-2" /> {formData.executableFile ? 'Software Listo' : 'Software (.EXE)'}
                                    </button>
                                    <input type="file" ref={exeInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'EXE')} />

                                    <button type="button" onClick={() => attachInputRef.current?.click()} className="w-full border-2 border-slate-200 bg-white rounded-2xl py-2 text-[9px] font-black text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center group">
                                        <FileUp size={14} className="mr-2 text-brand-500" /> Multimedia / PDF
                                    </button>
                                    <input type="file" ref={attachInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'ATTACH')} multiple />
                                </div>

                                <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar-thin">
                                    {formData.attachments?.map(att => (
                                        <div key={att.id} className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm animate-fade-in">
                                            <div className="flex items-center space-x-2 overflow-hidden">
                                                {att.type === 'IMAGE' ? <ImageIcon size={10} className="text-brand-500"/> : att.type === 'VIDEO' ? <VideoIcon size={10} className="text-amber-500"/> : <FileText size={10} className="text-blue-500"/>}
                                                <span className="text-[8px] font-bold text-slate-600 truncate">{att.name}</span>
                                            </div>
                                            <button type="button" onClick={() => removeAttachment(att.id)} className="text-red-300 hover:text-red-500 p-1"><Trash size={12}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL 2: CRONOGRAMA + AUTOMATIZACIÓN */}
                    <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden shadow-sm">
                        <div className="space-y-5 flex flex-col h-full overflow-hidden">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Calendar size={16} className="mr-2 text-brand-500"/> Cronograma</h4>
                                <div className="space-y-2">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase ml-1">Fecha de Inicio</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="date" required className="w-full border border-slate-200 rounded-xl p-2.5 text-[10px] font-black outline-none" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                                        <input type="time" className="w-full border border-slate-200 rounded-xl p-2.5 text-[10px] font-black outline-none" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase ml-1">Vencimiento</label>
                                    <input required type="date" disabled={noDueDateNew} className="w-full border border-slate-200 rounded-xl p-3 text-[10px] font-black outline-none disabled:opacity-20" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                                    <label className="flex items-center text-[10px] font-black text-brand-600 mt-1 cursor-pointer">
                                        <input type="checkbox" checked={noDueDateNew} onChange={e => setNoDueDateNew(e.target.checked)} className="mr-2 w-4 h-4 rounded border-brand-300 text-brand-600" /> Permanente
                                    </label>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col pt-4 border-t border-slate-100 overflow-hidden">
                                <h4 className="text-[10px] font-black text-brand-800 uppercase tracking-widest flex items-center mb-3 shrink-0"><Repeat size={16} className="mr-2"/> Automatización</h4>
                                <select className="w-full bg-brand-50 border border-brand-100 rounded-xl p-2.5 text-[9px] font-black text-brand-600 outline-none mb-3 shrink-0" value={formData.recurrence} onChange={e => setFormData({...formData, recurrence: e.target.value as RecurrenceType, recurrenceDays:[], recurrenceHours:[], recurrenceMonths:[]})}>
                                    <option value="NINGUNA">Única</option>
                                    <option value="HORA">Intervalo</option>
                                    <option value="DIARIA">Diaria</option>
                                    <option value="SEMANAL">Semanal</option>
                                    <option value="MENSUAL">Mensual</option>
                                </select>
                                <div className="flex-1 overflow-y-auto custom-scrollbar-thin bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    {formData.recurrence === 'HORA' && <div className="grid grid-cols-2 gap-2">{HOURLY_INTERVALS.map(h => (<button key={h} type="button" onClick={() => toggleRecurrenceItem('hours', h)} className={`py-2 text-[8px] font-black rounded-lg border transition-all ${formData.recurrenceHours?.includes(h) ? 'bg-brand-600 border-brand-500 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>{h}</button>))}</div>}
                                    {formData.recurrence === 'DIARIA' && <div className="grid grid-cols-3 gap-1.5">{HOURS_OF_DAY.map(h => (<button key={h} type="button" onClick={() => toggleRecurrenceItem('hours', h)} className={`py-1.5 text-[8px] font-black rounded-lg border transition-all ${formData.recurrenceHours?.includes(h) ? 'bg-brand-600 border-brand-500 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>{h}</button>))}</div>}
                                    {formData.recurrence === 'SEMANAL' && <div className="grid grid-cols-2 gap-2">{DAYS_OF_WEEK.map(d => (<button key={d} type="button" onClick={() => toggleRecurrenceItem('days', d)} className={`py-2 text-[8px] font-black rounded-lg border transition-all ${formData.recurrenceDays?.includes(d) ? 'bg-brand-600 border-brand-500 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>{d}</button>))}</div>}
                                    {formData.recurrence === 'MENSUAL' && <div className="grid grid-cols-3 gap-1.5">{MONTHS_OF_YEAR.map(m => (<button key={m} type="button" onClick={() => toggleRecurrenceItem('months', m)} className={`py-1.5 text-[8px] font-black rounded-lg border transition-all ${formData.recurrenceMonths?.includes(m) ? 'bg-brand-600 border-brand-500 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>{m}</button>))}</div>}
                                    {formData.recurrence === 'NINGUNA' && <div className="h-full flex flex-col items-center justify-center opacity-20"><BellRing size={24} className="mb-2"/><p className="text-[8px] font-black uppercase">Fija</p></div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL 3: REPORTAR A ROLES */}
                    <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-800 flex flex-col overflow-hidden">
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] flex items-center mb-5 shrink-0"><MessageSquare size={16} className="mr-2" /> Reportar a Roles</h4>
                        <div className="flex-1 overflow-y-auto custom-scrollbar-thin pr-1">
                            <div className="grid grid-cols-1 gap-1.5 content-start">
                                {ALL_ROLES.map(role => {
                                    const isSelected = formData.allowedChatRoles?.includes(role);
                                    return (
                                        <button 
                                            key={role} 
                                            type="button" 
                                            onClick={() => { 
                                                const current = formData.allowedChatRoles || []; 
                                                const updated = current.includes(role) ? current.filter(r => r !== role) : [...current, role]; 
                                                setFormData(prev => ({ ...prev, allowedChatRoles: updated })); 
                                            }} 
                                            className={`px-3 py-2.5 rounded-xl text-[9px] font-black transition-all border flex items-center justify-between ${isSelected ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
                                        >
                                            <span className="truncate">{role}</span>
                                            {isSelected && <Check size={12} className="shrink-0 ml-2" strokeWidth={4}/>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* PANEL 4: PERSONAL CLOUD */}
                    <div className="bg-slate-50 p-5 rounded-[2.5rem] border border-slate-200 flex flex-col h-full shadow-inner overflow-hidden">
                        <div className="flex flex-col mb-4 shrink-0 gap-2">
                            <h4 className="text-[11px] font-black text-slate-800 uppercase flex items-center tracking-tighter"><Users size={18} className="mr-2 text-brand-600"/> Personal Cloud</h4>
                            <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[9px] font-black text-slate-600 outline-none shadow-sm focus:ring-4 focus:ring-brand-500/10">
                                <option value="ALL">Todas las Sedes</option>
                                {Array.from(new Set(users.map(u => u.branch))).filter(b => !!b).map(b => <option key={b} value={b!}>{b}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            <button 
                              type="button" 
                              onClick={handleToggleSelectAll}
                              className={`w-full flex items-center p-3 rounded-2xl border transition-all text-left ${areAllVisibleSelected ? 'border-brand-600 bg-brand-50 shadow-sm' : 'border-brand-100 bg-white hover:border-brand-300'}`}
                            >
                                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center mr-3 transition-all ${areAllVisibleSelected ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-brand-200'}`}>
                                    {areAllVisibleSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                                </div>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-tight ${areAllVisibleSelected ? 'text-brand-900' : 'text-slate-700'}`}>Marcar Todos</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Asignación Masiva</p>
                                </div>
                            </button>

                            <div className="h-[1px] bg-slate-200 mx-2 my-1" />

                            {visibleUsersForSelection.map(u => {
                                const isSelected = selectedAssigneeIds.includes(u.id);
                                return (
                                    <button key={u.id} type="button" onClick={() => setSelectedAssigneeIds(prev => prev.includes(u.id) ? prev.filter(x => x !== u.id) : [...prev, u.id])} className={`w-full flex items-center p-3 rounded-2xl border transition-all text-left bg-white ${isSelected ? 'border-brand-500 shadow-sm' : 'border-slate-100 hover:border-brand-200'}`}>
                                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center mr-3 transition-all ${isSelected ? 'bg-brand-600 border-brand-600 text-white shadow-md' : 'bg-white border-slate-200'}`}>{isSelected && <Check size={12} className="text-white" strokeWidth={4} />}</div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className={`text-[10px] font-black truncate ${isSelected ? 'text-brand-900' : 'text-slate-700'}`}>{u.name}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{u.role}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 border-t bg-slate-50/50 flex justify-end items-center space-x-6 shrink-0">
                    <button type="button" onClick={() => setIsFormModalOpen(false)} className="text-slate-400 font-black hover:text-slate-700 transition-colors text-[10px] uppercase tracking-widest">Descartar</button>
                    <button type="submit" disabled={selectedAssigneeIds.length === 0 || !formData.title} className="px-12 py-4 bg-brand-600 text-white rounded-2xl font-black shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all text-[11px] uppercase tracking-[0.3em] flex items-center disabled:opacity-40 active:scale-95">
                        <Save size={18} className="mr-3"/> Lanzar Operación Masiva
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* DETALLE DE TAREA */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[90] p-2" onClick={() => setSelectedTask(null)}>
            <div className="bg-white rounded-[3rem] w-full max-w-[96vw] h-[96vh] shadow-[0_0_120px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-10 py-6 border-b flex justify-between items-center bg-slate-50/80 shrink-0">
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-4 mb-2">
                            <span className={`text-[10px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${selectedTask.priority === 'CRITICA' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>Prioridad {selectedTask.priority}</span>
                            <span className="text-[10px] font-black px-5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 uppercase tracking-widest flex items-center">
                                <Activity size={14} className="mr-2" /> {selectedTask.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{selectedTask.title}</h3>
                    </div>
                    <div className="flex items-center space-x-4">
                        {canSeeAudit && (
                            <button onClick={() => setShowAuditLogs(!showAuditLogs)} className={`flex items-center space-x-3 px-8 py-4 border rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${showAuditLogs ? 'bg-emerald-600 border-emerald-500 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-500 hover:text-emerald-600'}`}>
                                <History size={20}/> <span>Bitácora Auditoría</span>
                            </button>
                        )}
                        <button onClick={() => setSelectedTask(null)} className="p-5 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-full shadow-xl transition-all"><X size={28}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden bg-white flex relative">
                    {showAuditLogs && (
                        <div className="absolute top-0 right-0 w-[450px] h-full bg-[#0d1117] z-50 shadow-2xl border-l border-white/5 flex flex-col p-10 animate-slide-left">
                            <h4 className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-10 flex items-center">
                                <ShieldCheck size={24} className="mr-4"/> Historial Forense
                            </h4>
                            <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar-thin">
                                <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem]">
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-3">Origen</p>
                                    <div className="space-y-2">
                                        <p className="text-[11px] text-white font-black">Emisor: <span className="font-medium text-slate-400">{selectedTask.creatorName}</span></p>
                                        <p className="text-[11px] text-white font-black">Fecha: <span className="font-mono text-emerald-500/80">{new Date(selectedTask.createdAt).toLocaleString()}</span></p>
                                    </div>
                                </div>
                                <div className="space-y-5 pt-5 border-t border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase">Ejecuciones Registradas</p>
                                    {selectedTask.executionLogs?.length === 0 ? (
                                        <div className="py-10 text-center">
                                            <Database size={32} className="mx-auto text-slate-800 mb-4 opacity-20"/>
                                            <p className="text-[11px] text-slate-600 italic">Sin actividad registrada.</p>
                                        </div>
                                    ) : (
                                        selectedTask.executionLogs.map(log => (
                                            <div key={log.id} className="p-5 bg-white/5 rounded-2xl border-l-4 border-emerald-500 group">
                                                <p className="text-[11px] text-white font-black">{log.action}</p>
                                                <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">{log.userName} • {log.userRole}</p>
                                                <p className="text-[9px] text-emerald-500/50 font-mono mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-10 pb-5 shrink-0" style={{ height: '50%' }}>
                            <div className="h-full bg-slate-50 p-10 rounded-[4rem] border border-slate-200 shadow-inner border-l-[20px] border-l-brand-600 overflow-hidden relative flex flex-col">
                                {selectedTask.executableFile && (
                                    <button onClick={() => handleExecuteFile(selectedTask.executableFile!)} className="mb-8 w-full py-10 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-[3rem] shadow-2xl flex items-center justify-center space-x-8 hover:scale-[1.01] transition-all group overflow-hidden relative">
                                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                        <Rocket size={48} className="animate-pulse" />
                                        <div className="text-left">
                                            <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-80 mb-2">Protocolo Activo</p>
                                            <p className="text-4xl font-black tracking-tighter uppercase italic">ABRIR SOFTWARE: {selectedTask.executableFile.name}</p>
                                        </div>
                                        <Maximize2 size={32} className="ml-6 opacity-40" />
                                    </button>
                                )}
                                <div className="flex-1 overflow-y-auto custom-scrollbar-thin text-5xl font-black text-slate-800 leading-[1.2] italic px-6">
                                    {selectedTask.description || 'Sin instrucciones.'}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex p-10 pt-5 space-x-10 overflow-hidden">
                            <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
                                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center px-4">
                                    <Paperclip size={24} className="mr-4 text-brand-600" /> Material de Apoyo
                                </h4>
                                <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-8 pr-4 custom-scrollbar-thin">
                                    {selectedTask.attachments?.map(att => (
                                        <div key={att.id} onClick={() => handleExecuteFile(att)} className="group cursor-pointer bg-slate-50 border-2 border-slate-200 rounded-[3rem] overflow-hidden hover:border-brand-500 transition-all flex flex-col aspect-video">
                                            <div className="flex-1 flex items-center justify-center bg-white p-6 overflow-hidden">
                                                {att.type === 'IMAGE' ? <img src={att.url} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt="" /> : <FileText size={70} className="text-slate-200" />}
                                            </div>
                                            <div className="p-5 border-t bg-white flex justify-between items-center shrink-0">
                                                <div className="overflow-hidden">
                                                  <p className="text-[11px] font-black truncate text-slate-900 uppercase">{att.name}</p>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{att.type}</p>
                                                </div>
                                                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                                  <Maximize2 size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col space-y-8 overflow-hidden">
                                <div className="flex-1 flex flex-col bg-slate-900 rounded-[4rem] overflow-hidden shadow-2xl border border-white/10">
                                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar-thin">
                                        {selectedTask.comments.map(c => (
                                            <div key={c.id} className={`flex flex-col ${c.userId === currentUser.id ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[90%] p-5 rounded-[2rem] text-sm font-medium shadow-xl ${c.userId === currentUser.id ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                                                    <div className="flex justify-between items-center mb-2 opacity-50">
                                                        <span className="text-[10px] font-black">{c.userName}</span>
                                                        <span className="text-[9px]">{new Date(c.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                    <p className="text-xs leading-relaxed">{c.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-6 bg-white/5 flex gap-4 border-t border-white/5">
                                        <input type="text" className="flex-1 bg-slate-800 border border-slate-700 rounded-3xl px-8 py-5 text-sm font-bold text-white outline-none" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendNovedad()} placeholder="Reportar novedad..." />
                                        <button onClick={handleSendNovedad} className="bg-brand-600 text-white p-5 rounded-[1.5rem] shadow-2xl hover:bg-brand-500 transition-all"><Send size={28}/></button>
                                    </div>
                                </div>
                                <div className="bg-slate-900 p-8 rounded-[4rem] shadow-2xl border border-white/10 grid grid-cols-5 gap-4 shrink-0">
                                    {Object.values(TaskStatus).map(status => (
                                        <button key={status} onClick={() => handleStatusUpdate(selectedTask, status)} className={`py-4 rounded-[2rem] text-[10px] font-black transition-all border-2 ${selectedTask.status === status ? 'bg-brand-600 text-white border-brand-500 shadow-xl' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                                            <span className="tracking-[0.1em]">{status.replace('_', ' ')}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
