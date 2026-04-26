
import React, { useState, useRef } from 'react';
import { Branch, User, UserRole, Task, TaskStatus, Profile } from '../types';
import {
  Edit2, Plus, Save, X, Trash2, ShieldAlert, MapPin,
  CheckCircle2, ChevronRight, Check, Users, Camera, Image as ImageIcon, KeyRound, Tag
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  branches: Branch[];
  tasks: Task[];
  currentUser: User;
  profiles: Profile[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAssignMultipleTasks?: (userId: string, taskIds: string[]) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users, branches, tasks, currentUser, profiles, onAddUser, onUpdateUser, onDeleteUser, onAssignMultipleTasks
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<Partial<User>>({
    name: '', role: UserRole.USUARIO, password: '', branch: '', avatar: 'https://picsum.photos/200'
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const canManage = (targetUser?: User) => {
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.role === UserRole.RRHH) {
        if (!targetUser) return true;
        return [UserRole.USUARIO, UserRole.ENCARGADO, UserRole.SUPERVISOR].includes(targetUser.role);
    }
    if (currentUser.role === UserRole.SOCIO) return true;
    if (currentUser.role === UserRole.GERENCIA) {
      if (targetUser && targetUser.role === UserRole.SOCIO) return false;
      return true;
    }
    return false;
  };

  const handleOpenResetModal = (user: User) => {
    setUserToReset(user);
    setNewPassword('');
    setIsResetModalOpen(true);
  };

  const handleResetPassword = () => {
    if (userToReset && newPassword.trim()) {
      onUpdateUser({ ...userToReset, password: newPassword.trim() });
      setIsResetModalOpen(false);
      setUserToReset(null);
      setNewPassword('');
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      if (!canManage(user)) return alert("No tienes permisos suficientes.");
      setEditingUser(user);
      setFormData({ ...user });
      setStep(1);
    } else {
      setEditingUser(null);
      setFormData({
        name: '', role: UserRole.USUARIO, password: '', branch: '', avatar: `https://picsum.photos/id/${Math.floor(Math.random() * 200)}/100/100`, usageStats: { week: 0, month: 0, year: 0 }
      });
      setStep(1);
    }
    setSelectedTaskIds([]);
    setIsModalOpen(true);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.password) return;
    
    if (!formData.branch || editingUser) {
        handleFinalSubmit();
    } else {
        setStep(2);
    }
  };

  const handleFinalSubmit = () => {
    if (editingUser) {
      onUpdateUser({ ...editingUser, ...formData } as User);
    } else {
      const newUserId = `u${Date.now()}`;
      const newUser: User = { ...formData as User, id: newUserId };
      onAddUser(newUser);

      if (selectedTaskIds.length > 0 && onAssignMultipleTasks) {
          onAssignMultipleTasks(newUserId, selectedTaskIds);
      }
    }
    setIsModalOpen(false);
  };

  const confirmDelete = (user: User) => {
    if (!canManage(user)) return;
    if (user.id === currentUser.id) return;
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const getBranchTasks = () => {
    // Show all unique tasks from all branches
    const uniqueTasks: Task[] = [];
    const titlesSeen = new Set<string>();
    
    // Sort tasks to prioritize branch templates
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.assigneeId.startsWith('BRANCH:') && !b.assigneeId.startsWith('BRANCH:')) return -1;
        if (!a.assigneeId.startsWith('BRANCH:') && b.assigneeId.startsWith('BRANCH:')) return 1;
        return 0;
    });

    sortedTasks.forEach(t => {
      if (!titlesSeen.has(t.title)) {
        uniqueTasks.push(t);
        titlesSeen.add(t.title);
      }
    });
    return uniqueTasks;
  };

  const getTaskAssigneeLabel = (assigneeId: string) => {
    if (assigneeId.startsWith('BRANCH:')) {
        const branchName = assigneeId.replace('BRANCH:', '');
        return `Plantilla: ${branchName}`;
    }
    const user = users.find(u => u.id === assigneeId);
    if (user) return `De: ${user.name} (${user.branch || 'Global'})`;
    return 'Sistema';
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
        prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  return (
    <div className="p-8 space-y-8 bg-indigo-50 min-h-screen">
      <div className="flex justify-between items-end border-b border-slate-200 pb-8">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Gestión de Personal</h1>
           <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Control de accesos y jerarquías corporativas.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl flex items-center space-x-3 shadow-xl hover:bg-slate-800 transition-all font-black text-sm active:scale-95">
          <Plus size={20} />
          <span>Alta de Colaborador</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Perfil</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Jerarquía</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Destino / Sede</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-4">
                    <img className="h-12 w-12 rounded-2xl border-2 border-white shadow-sm object-cover" src={user.avatar} alt="" />
                    <div>
                      <div className="text-sm font-black text-slate-800">{user.name}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">ID: {user.id.slice(0, 8)}...</div>
                      {user.profiles && user.profiles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {user.profiles.map(pid => {
                            const prof = profiles.find(p => p.id === pid);
                            if (!prof) return null;
                            return (
                              <span key={pid} className="px-2 py-0.5 rounded-lg text-[9px] font-black text-white" style={{ backgroundColor: prof.color }}>
                                {prof.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-tighter border ${
                    user.role === UserRole.ADMIN ? 'bg-red-50 text-red-600 border-red-100' :
                    user.role === UserRole.SOCIO ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    user.role === UserRole.GERENCIA ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-slate-50 text-slate-500 border-slate-100'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <span className="text-[11px] font-bold text-slate-600 flex items-center">
                    {user.branch ? <><MapPin size={12} className="mr-2 text-brand-500"/> {user.branch}</> : <span className="text-slate-300 italic uppercase text-[9px]">Global / Sin Sede</span>}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  {canManage(user) ? (
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleOpenResetModal(user)} className="text-slate-300 hover:text-amber-600 p-2.5 rounded-xl transition-all hover:bg-amber-50" title="Cambiar contraseña">
                        <KeyRound size={20} />
                      </button>
                      <button onClick={() => handleOpenModal(user)} className="text-slate-300 hover:text-brand-600 p-2.5 rounded-xl transition-all hover:bg-brand-50" title="Editar">
                        <Edit2 size={20} />
                      </button>
                      {user.id !== currentUser.id && (
                        <button onClick={() => confirmDelete(user)} className="text-slate-300 hover:text-red-600 p-2.5 rounded-xl transition-all hover:bg-red-50" title="Eliminar">
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ) : <ShieldAlert size={18} className="text-slate-200 inline-block mr-3"/>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl animate-scale-in border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
                        {step === 1 ? (editingUser ? 'Actualizar Perfil' : 'Alta de Colaborador') : 'Tareas Detectadas en Sucursal'}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-widest">
                        {step === 1 ? 'Paso 1: Datos y Privilegios' : `Paso 2: Asignación Masiva - Todas las Sucursales`}
                    </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-all"><X/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {step === 1 ? (
                    <div className="max-w-lg mx-auto">
                        <div className="flex flex-col items-center mb-10">
                            <div className="relative group">
                                <img src={formData.avatar} className="w-32 h-32 rounded-[2.5rem] border-4 border-slate-100 shadow-2xl object-cover" alt="" />
                                <button 
                                    type="button" 
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 bg-brand-600 text-white p-3 rounded-2xl shadow-xl hover:bg-brand-700 transition-all transform hover:scale-110 active:scale-90 group-hover:rotate-6"
                                >
                                    <Camera size={20} />
                                </button>
                                <input 
                                    type="file" 
                                    ref={avatarInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleAvatarUpload} 
                                />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6">Avatar del Colaborador</p>
                            <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">Sugerido: 400x400px</p>
                        </div>

                        <form id="userForm" onSubmit={handleNextStep} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre y Apellido</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-brand-500/10 outline-none transition-all" required />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rol / Jerarquía</label>
                                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-brand-500/10 outline-none transition-all">
                                    {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
                                    <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-brand-500/10 outline-none transition-all" required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sucursal de Destino</label>
                                <select value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-brand-500/10 outline-none transition-all">
                                    <option value="">-- Sin Sucursal (Global) --</option>
                                    {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>

                            {profiles.length > 0 && (
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center space-x-2">
                                  <Tag size={12} className="inline mr-1" />
                                  Perfiles adicionales
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {profiles.map(profile => {
                                    const selected = (formData.profiles || []).includes(profile.id);
                                    return (
                                      <button
                                        key={profile.id}
                                        type="button"
                                        onClick={() => {
                                          const current = formData.profiles || [];
                                          setFormData({
                                            ...formData,
                                            profiles: selected
                                              ? current.filter(id => id !== profile.id)
                                              : [...current, profile.id]
                                          });
                                        }}
                                        className="px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all"
                                        style={{
                                          borderColor: profile.color,
                                          backgroundColor: selected ? profile.color : 'transparent',
                                          color: selected ? 'white' : profile.color,
                                        }}
                                      >
                                        {selected && <Check size={10} className="inline mr-1" />}
                                        {profile.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-brand-50 p-6 rounded-[2rem] border border-brand-100 flex items-center space-x-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-brand-600"><Users size={24}/></div>
                            <div>
                                <p className="text-sm font-black text-brand-900 tracking-tight">Carga Inicial de Tareas</p>
                                <p className="text-xs font-bold text-brand-700/70 leading-relaxed">
                                    Hemos detectado las siguientes tareas activas en <strong>todas las sucursales</strong>. <br/>Selecciona las que este nuevo colaborador debe heredar o realizar.
                                </p>
                            </div>
                        </div>
                        
                        <div className="border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm bg-white">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="w-16 px-6 py-4"></th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tarea Operativa</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsable Actual</th>
                                        <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Periodicidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {getBranchTasks().length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center">
                                                <ShieldAlert size={40} className="mx-auto text-slate-200 mb-3" />
                                                <p className="text-slate-400 font-bold text-sm">No hay tareas previas en el sistema.</p>
                                                <p className="text-[10px] text-slate-300 uppercase mt-1">El colaborador iniciará con el tablero vacío.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        getBranchTasks().map(task => {
                                            const isSelected = selectedTaskIds.includes(task.id);
                                            return (
                                                <tr 
                                                    key={task.id} 
                                                    onClick={() => toggleTaskSelection(task.id)}
                                                    className={`cursor-pointer transition-all group ${isSelected ? 'bg-brand-50/50' : 'hover:bg-slate-50'}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-600 border-brand-600 shadow-lg shadow-brand-500/20' : 'bg-white border-slate-200 group-hover:border-brand-300'}`}>
                                                            {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-black text-slate-800 tracking-tight">{task.title}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{task.status}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md inline-block w-fit ${task.assigneeId.startsWith('BRANCH') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                {getTaskAssigneeLabel(task.assigneeId)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-[10px] font-black text-slate-400 border border-slate-200 px-2 py-1 rounded-lg uppercase tracking-tighter">{task.recurrence}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-8 border-t bg-slate-50/50 flex justify-between items-center">
                {step === 2 ? (
                    <button onClick={() => setStep(1)} className="text-slate-500 font-black hover:text-slate-800 transition-colors text-xs uppercase tracking-widest flex items-center">
                        <X size={16} className="mr-2"/> Volver al Paso 1
                    </button>
                ) : <div></div>}
                
                <div className="flex space-x-4">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs uppercase tracking-widest">Cancelar</button>
                    <button 
                        form={step === 1 ? "userForm" : undefined}
                        onClick={step === 2 ? handleFinalSubmit : undefined}
                        type={step === 1 ? "submit" : "button"}
                        className="bg-slate-900 text-white px-12 py-4 rounded-2xl flex items-center space-x-3 shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all font-black text-sm active:scale-95"
                    >
                        <span>{step === 1 ? (editingUser || !formData.branch ? 'Guardar Cambios' : 'Siguiente Paso') : `Asignar ${selectedTaskIds.length} Tareas`}</span>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {isResetModalOpen && userToReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md animate-scale-in border border-white/20 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <KeyRound size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-1">Cambiar Contraseña</h3>
              <p className="text-slate-500 text-sm font-medium mb-6">
                Usuario: <strong className="text-slate-800">{userToReset.name}</strong>
              </p>
              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                placeholder="Nueva contraseña..."
                autoFocus
                className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-center tracking-widest"
              />
            </div>
            <div className="p-6 bg-slate-50 flex space-x-3">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 px-6 py-4 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!newPassword.trim()}
                className="flex-1 px-6 py-4 rounded-2xl bg-amber-500 text-white font-black text-xs uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md animate-scale-in border border-white/20 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">¿Eliminar Colaborador?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Estás a punto de eliminar a <strong className="text-slate-800">{userToDelete.name}</strong>. 
                Esta acción es irreversible y el usuario perderá acceso inmediato a la plataforma.
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex space-x-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-6 py-4 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-6 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
