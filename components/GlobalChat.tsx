
import React, { useState, useMemo, useEffect } from 'react';
import { Task, User, Comment, UserRole } from '../types';
import { MessageSquare, Send, Search, Hash, Trash2, X, EyeOff, Trash, ShieldCheck } from 'lucide-react';

interface GlobalChatProps {
  tasks: Task[];
  currentUser: User;
  onUpdateTask: (task: Task) => void;
  lastSeenByChannel: Record<string, number>;
  hiddenChats: string[];
  onMarkAsRead: (taskId: string) => void;
  onClearChat: (taskId: string) => void;
  onHideChat: (taskId: string) => void;
  allUsers?: User[]; 
}

export const GlobalChat: React.FC<GlobalChatProps> = ({ 
  tasks, currentUser, onUpdateTask, lastSeenByChannel, hiddenChats, onMarkAsRead, onClearChat, onHideChat, allUsers = []
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Identificación crítica de moderadores (SUPERVISOR INCLUIDO)
  const isHighHierarchy = useMemo(() => {
    const highRoles = [
      UserRole.ADMIN,
      UserRole.SOCIO, 
      UserRole.GERENCIA, 
      UserRole.RRHH, 
      UserRole.SUPERVISOR
    ];
    return highRoles.includes(currentUser.role);
  }, [currentUser.role]);

  const canSeeTaskChat = (task: Task) => {
    if (isHighHierarchy) return true;

    if (currentUser.role === UserRole.USUARIO) {
        return task.assigneeId === currentUser.id || task.creatorId === currentUser.id;
    }

    const isRoleAllowed = task.allowedChatRoles && task.allowedChatRoles.includes(currentUser.role);
    if (isRoleAllowed) {
        if (task.assigneeId === currentUser.id || task.creatorId === currentUser.id) return true;
        const assignee = allUsers.find(u => u.id === task.assigneeId);
        const creator = allUsers.find(u => u.id === task.creatorId);
        return assignee?.branch === currentUser.branch || creator?.branch === currentUser.branch;
    }
    return false;
  };

  const chatChannels = useMemo(() => {
    return tasks
      .filter(t => !hiddenChats.includes(t.id))
      .filter(canSeeTaskChat)
      .filter(t => t.comments.length > 0)
      .map(t => {
        const lastComment = t.comments[t.comments.length - 1];
        const lastCommentTime = lastComment ? new Date(lastComment.timestamp).getTime() : 0;
        const lastSeen = lastSeenByChannel[t.id] || 0;
        
        const unreadCount = t.comments.filter(c => {
          return c.userId !== currentUser.id && new Date(c.timestamp).getTime() > lastSeen;
        }).length;
        
        return {
          ...t,
          lastActivity: lastCommentTime,
          lastMessage: lastComment?.text || 'Sin mensajes',
          unreadCount: selectedTaskId === t.id ? 0 : unreadCount
        };
      })
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }, [tasks, currentUser.id, lastSeenByChannel, hiddenChats, selectedTaskId, allUsers, isHighHierarchy]);

  const filteredChannels = chatChannels.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const activeTask = tasks.find(t => t.id === selectedTaskId);

  // Potestad de moderación si es de jerarquía alta
  const canModerate = useMemo(() => {
    return isHighHierarchy && !!activeTask;
  }, [activeTask, isHighHierarchy]);

  useEffect(() => {
    if (selectedTaskId) {
      onMarkAsRead(selectedTaskId);
    }
  }, [selectedTaskId, activeTask?.comments.length, onMarkAsRead]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeTask) return;
    const comment: Comment = {
      id: `c${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text: newMessage.trim(),
      timestamp: new Date().toISOString()
    };
    onUpdateTask({ ...activeTask, comments: [...activeTask.comments, comment] });
    setNewMessage('');
  };

  const handleDeleteIndividualMessage = (commentId: string) => {
    if (!activeTask || !canModerate) return;
    if (window.confirm('¿Deseas eliminar este registro de novedad de forma definitiva?')) {
        const updatedComments = activeTask.comments.filter(c => c.id !== commentId);
        onUpdateTask({ ...activeTask, comments: updatedComments });
    }
  };

  const handleClearFullChat = () => {
    if (!selectedTaskId || !canModerate) return;
    if (window.confirm('ATENCIÓN AUDITORÍA: ¿Confirmas el vaciado TOTAL de este canal? No se podrá recuperar el historial.')) {
        onClearChat(selectedTaskId);
        setSelectedTaskId(null);
    }
  };

  const handleHideCurrentChat = () => {
    if (!selectedTaskId) return;
    if (window.confirm('¿Ocultar este canal de tu vista personal?')) {
        onHideChat(selectedTaskId);
        setSelectedTaskId(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] m-4 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
      
      {/* Listado lateral */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6 bg-white border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900 tracking-tighter flex items-center">
            <MessageSquare className="mr-3 text-brand-600" size={24} />
            Mensajería
          </h2>
          <div className="mt-4 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar reporte o canal..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredChannels.length === 0 ? (
            <div className="p-10 text-center opacity-40">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Hash size={32} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sin canales activos</p>
            </div>
          ) : (
            filteredChannels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedTaskId(channel.id)}
                className={`w-full p-4 flex items-start space-x-3 transition-all border-b border-slate-50 relative ${
                  selectedTaskId === channel.id ? 'bg-white shadow-sm z-10' : 'hover:bg-slate-100/50'
                }`}
              >
                {selectedTaskId === channel.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-600 rounded-r-full" />
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedTaskId === channel.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'bg-white border border-slate-200 text-slate-400'
                }`}>
                  <Hash size={18} />
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className={`text-xs truncate ${channel.unreadCount > 0 ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                      {channel.title}
                    </p>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">
                      {new Date(channel.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-[10px] truncate leading-tight ${channel.unreadCount > 0 ? 'font-black text-slate-800' : 'font-medium text-slate-400'}`}>
                    {channel.lastMessage}
                  </p>
                </div>
                {channel.unreadCount > 0 && (
                  <div className="bg-brand-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center shadow-lg animate-pulse ml-1">
                    {channel.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Area de Chat */}
      <div className="flex-1 flex flex-col bg-white">
        {activeTask ? (
          <>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center">
                  <Hash size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">{activeTask.title}</h3>
                  <div className="flex items-center mt-1.5 space-x-2">
                    <p className="text-[9px] font-black text-brand-500 uppercase tracking-widest">
                      Personal: {allUsers.find(u => u.id === activeTask.assigneeId)?.name || 'Sin asignar'}
                    </p>
                    {canModerate && (
                        <span className="flex items-center text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase">
                           <ShieldCheck size={10} className="mr-1"/> Privilegios de {currentUser.role}
                        </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* BOTÓN VACIAR CANAL: Visible para Supervisor */}
                {canModerate && (
                    <button 
                        onClick={handleClearFullChat} 
                        className="flex items-center space-x-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100" 
                        title="Eliminar historial completo (Moderación)"
                    >
                        <Trash2 size={18}/>
                        <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Vaciar Canal</span>
                    </button>
                )}
                <button 
                  onClick={handleHideCurrentChat} 
                  className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all" 
                  title="Ocultar de mi vista"
                >
                  <EyeOff size={18}/>
                </button>
                <div className="h-6 w-[1px] bg-slate-100 mx-2" />
                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border bg-slate-100 text-slate-500 border-slate-200`}>
                  {activeTask.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 custom-scrollbar">
              {activeTask.comments.map((msg) => {
                const isMe = msg.userId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-slide-up relative`}>
                    <div className="flex items-center space-x-2 mb-1.5 px-2">
                      {!isMe && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{msg.userName}</span>}
                      <span className="text-[8px] font-bold text-slate-300">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 group/msg">
                        {/* ICONO PAPELERA INDIVIDUAL: Visible para Supervisor */}
                        {canModerate && (
                          <button 
                            onClick={() => handleDeleteIndividualMessage(msg.id)}
                            className={`opacity-0 group-hover/msg:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all ${isMe ? 'order-1' : 'order-3'}`}
                            title="Eliminar este mensaje"
                          >
                            <Trash size={16} />
                          </button>
                        )}

                        <div className={`p-4 rounded-3xl text-sm font-medium shadow-sm max-w-[400px] order-2 ${
                          isMe 
                            ? 'bg-brand-600 text-white rounded-tr-none shadow-brand-500/20' 
                            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-slate-200/50'
                        }`}>
                          <p className="leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-[1.5rem] border border-slate-100 focus-within:border-brand-500/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/5 transition-all">
                <input 
                  type="text" 
                  placeholder="Informar novedad operativa..." 
                  className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm font-bold text-slate-700 placeholder:text-slate-300" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                />
                <button 
                  onClick={handleSendMessage} 
                  disabled={!newMessage.trim()} 
                  className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-brand-700 active:scale-90 transition-all disabled:opacity-30"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-slate-50/10">
            <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-xl border border-slate-50 flex items-center justify-center mb-8 text-brand-500">
              <MessageSquare size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Buzón de Novedades</h3>
            <p className="text-slate-400 font-bold max-w-xs mt-3 leading-relaxed">
              Selecciona un reporte para auditar la operativa o informar novedades críticas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
