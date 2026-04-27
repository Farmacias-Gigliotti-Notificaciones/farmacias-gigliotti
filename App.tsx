
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { BranchManagement } from './components/BranchManagement';
import { UserAnalytics } from './components/UserAnalytics';
import { Settings } from './components/Settings';
import { GlobalChat } from './components/GlobalChat';
import { ProfileManagement } from './components/ProfileManagement';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS, MOCK_BRANCHES } from './constants';
import { Task, User, UserRole, Branch, Project, TaskStatus, Profile } from './types';
import { syncService } from './services/syncService';
import { notificationService } from './services/notificationService';
import { testFullSync } from './services/testSync';
import { runDiagnostic } from './services/diagnostic';
import { Cloud, RefreshCw } from 'lucide-react';

const STORAGE_KEYS = {
  USERS: 'farmacia_users_v2',
  TASKS: 'farmacia_tasks_v2',
  BRANCHES: 'farmacia_branches_v2',
  PROJECTS: 'farmacia_projects_v2',
  PROFILES: 'farmacia_profiles_v2',
  SESSION: 'farmacia_session_v2',
  TAB: 'farmacia_active_tab_v2',
  LAST_SEEN_MAP: 'farmacia_last_seen_per_user_v2',
  HIDDEN_CHATS: 'farmacia_hidden_chats_v2'
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('projects');
  
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [customProfiles, setCustomProfiles] = useState<Profile[]>([]);
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, Record<string, number>>>({});
  const [hiddenChats, setHiddenChats] = useState<string[]>([]);

  // Inicialización modo "Cloud"
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      const data = await syncService.loadAllData();
      
      setUsers(data.users.length ? data.users : MOCK_USERS);
      setTasks(data.tasks.length ? data.tasks : MOCK_TASKS);
      setBranches(data.branches.length ? data.branches : MOCK_BRANCHES);
      setProjects(data.projects.length ? data.projects : MOCK_PROJECTS);
      
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (session) setCurrentUser(JSON.parse(session));
      
      const tab = localStorage.getItem(STORAGE_KEYS.TAB);
      if (tab) setActiveTab(JSON.parse(tab));

      setCustomProfiles(JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]'));
      setLastSeenMap(JSON.parse(localStorage.getItem(STORAGE_KEYS.LAST_SEEN_MAP) || '{}'));
      setHiddenChats(JSON.parse(localStorage.getItem(STORAGE_KEYS.HIDDEN_CHATS) || '[]'));
      
      setIsLoading(false);
    };
    initApp();
  }, []);

  // Cola de sincronización con debounce: guarda local inmediato, agrupa llamadas a Supabase
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingKeys = useRef<Set<string>>(new Set<string>());

  const queueSync = useCallback((key: string, data: any) => {
    // Guardar localmente de forma inmediata — nunca se pierde nada
    localStorage.setItem(key, JSON.stringify(data));
    pendingKeys.current.add(key);

    // Reiniciar el timer: si hay cambios en cadena, espera 2s desde el último
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      const keys = Array.from(pendingKeys.current);
      pendingKeys.current.clear();
      setIsSyncing(true);
      for (const k of keys) {
        const stored = localStorage.getItem(k);
        if (stored) await syncService.syncDataToCloud(k, JSON.parse(stored));
      }
      setIsSyncing(false);
    }, 2000);
  }, []);

  useEffect(() => { if (!isLoading) queueSync(STORAGE_KEYS.USERS, users); }, [users, isLoading]);
  useEffect(() => { if (!isLoading) queueSync(STORAGE_KEYS.TASKS, tasks); }, [tasks, isLoading]);
  useEffect(() => { if (!isLoading) queueSync(STORAGE_KEYS.BRANCHES, branches); }, [branches, isLoading]);
  useEffect(() => { if (!isLoading) queueSync(STORAGE_KEYS.PROJECTS, projects); }, [projects, isLoading]);
  useEffect(() => { if (!isLoading) queueSync(STORAGE_KEYS.LAST_SEEN_MAP, lastSeenMap); }, [lastSeenMap, isLoading]);
  useEffect(() => { if (!isLoading) queueSync(STORAGE_KEYS.HIDDEN_CHATS, hiddenChats); }, [hiddenChats, isLoading]);
  useEffect(() => { if (!isLoading) queueSync(STORAGE_KEYS.PROFILES, customProfiles); }, [customProfiles, isLoading]);
  useEffect(() => { 
    if (currentUser) localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
    else localStorage.removeItem(STORAGE_KEYS.SESSION);
  }, [currentUser]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TAB, JSON.stringify(activeTab)); }, [activeTab]);

  const currentUserSeenRegistry = useMemo(() => {
    return currentUser ? (lastSeenMap[currentUser.id] || {}) : {};
  }, [lastSeenMap, currentUser]);

  const newMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    return tasks.reduce((total, task) => {
      if (hiddenChats.includes(task.id) || task.comments.length === 0) return total;
      
      let canAccess = false;
      if (currentUser.role === UserRole.ADMIN) {
          canAccess = true;
      } else if (currentUser.role === UserRole.USUARIO) {
          canAccess = task.assigneeId === currentUser.id || task.creatorId === currentUser.id;
      } else {
          const isRoleAllowed = task.allowedChatRoles && task.allowedChatRoles.includes(currentUser.role);
          if (isRoleAllowed) {
              if ([UserRole.ADMIN, UserRole.SOCIO, UserRole.GERENCIA, UserRole.RRHH, UserRole.SUPERVISOR].includes(currentUser.role)) {
                  canAccess = true;
              } else {
                  const assignee = users.find(u => u.id === task.assigneeId);
                  const creator = users.find(u => u.id === task.creatorId);
                  canAccess = assignee?.branch === currentUser.branch || creator?.branch === currentUser.branch;
              }
          }
      }
      if (!canAccess) return total;
      const lastSeen = currentUserSeenRegistry[task.id] || 0;
      const unreadMsgs = task.comments.filter(c => {
        return new Date(c.timestamp).getTime() > lastSeen && c.userId !== currentUser.id;
      }).length;
      return total + unreadMsgs;
    }, 0);
  }, [tasks, currentUserSeenRegistry, currentUser, hiddenChats, users]);

  const handleMarkChannelAsRead = useCallback((taskId: string) => {
    if (!currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    const latestMsgTime = task && task.comments.length > 0 
      ? Math.max(...task.comments.map(c => new Date(c.timestamp).getTime()))
      : Date.now();

    setLastSeenMap(prev => {
        const userRegistry = prev[currentUser.id] || {};
        return {
            ...prev,
            [currentUser.id]: {
                ...userRegistry,
                [taskId]: latestMsgTime + 1 
            }
        };
    });
  }, [tasks, currentUser]);

  const handleUpdateTask = useCallback(async (updatedTask: Task) => {
    // Actualizar estado local - el useEffect automático se encargará de sincronizar a Supabase
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    
    const lastMsg = updatedTask.comments[updatedTask.comments.length - 1];
    if (lastMsg && lastMsg.userId === currentUser?.id) {
        handleMarkChannelAsRead(updatedTask.id);
    }
  }, [currentUser?.id, handleMarkChannelAsRead]);

  const handleAddTask = async (newTask: Task) => { 
    // Agregar al estado local - el useEffect automático se encargará de sincronizar a Supabase
    setTasks(prev => [...prev, newTask]);
  };

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const canDelete = [UserRole.ADMIN, UserRole.SOCIO, UserRole.GERENCIA, UserRole.RRHH, UserRole.SUPERVISOR, UserRole.ENCARGADO].includes(currentUser!.role);
    
    if (!canDelete) {
      alert("No tienes permisos de auditoría para eliminar tareas.");
      return;
    }

    if (window.confirm('¿Confirmas la eliminación definitiva de esta tarea en el servidor?')) {
      const success = await syncService.deleteItem('tasks', taskId);
      if (success) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    }
  }, [currentUser]);

  const handleClearChat = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      handleUpdateTask({ ...task, comments: [] });
      handleMarkChannelAsRead(taskId);
    }
  };

  const handleUpdateBranch = useCallback(async (updatedBranch: Branch) => {
    const oldBranch = branches.find(b => b.id === updatedBranch.id);
    
    // Actualización segura por ID único en Supabase
    const success = await syncService.updateItem('branches', updatedBranch.id, updatedBranch);
    if (success) {
      setBranches(prev => prev.map(b => b.id === updatedBranch.id ? updatedBranch : b));
      
      // Propagación de integridad: Si el nombre cambió, actualizamos los usuarios vinculados
      if (oldBranch && oldBranch.name !== updatedBranch.name) {
        setUsers(prev => prev.map(u => u.branch === oldBranch.name ? { ...u, branch: updatedBranch.name } : u));
      }
    }
  }, [branches]);

  const handleAddBranch = useCallback(async (newBranch: Branch) => {
    setBranches(prev => [...prev, newBranch]);
    await syncService.createItem('branches', newBranch);
  }, []);

  const handleAssignMultipleTasks = useCallback(async (userId: string, taskIds: string[]) => {
    const updatedTasks = tasks.map(t => 
      taskIds.includes(t.id) ? { ...t, assigneeId: userId } : t
    );
    setTasks(updatedTasks);

    // Sincronización con la nube para cada tarea reasignada
    await Promise.all(taskIds.map(taskId => {
      const task = tasks.find(t => t.id === taskId);
      if (task) return syncService.updateItem('tasks', taskId, { ...task, assigneeId: userId });
      return Promise.resolve(true);
    }));
  }, [tasks]);

  const handleDeleteBranch = useCallback(async (branchId: string) => {
    if (window.confirm('¿Eliminar esta sucursal del servidor?')) {
      const success = await syncService.deleteItem('branches', branchId);
      if (success) {
        setBranches(prev => prev.filter(b => b.id !== branchId));
      }
    }
  }, []);

  const handleHideChat = (taskId: string) => {
    setHiddenChats(prev => [...new Set([...prev, taskId])]);
  };

  const handleLogin = (user: User) => {
    const updatedUser = { ...user, lastLogin: new Date().toISOString() };
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setActiveTab(['ADMIN', 'ENCARGADO', 'GERENCIA', 'SOCIO', 'SUPERVISOR', 'RRHH'].includes(user.role) ? 'dashboard' : 'projects');
    notificationService.requestPermission();
  };

  const handleLogout = () => { setCurrentUser(null); setActiveTab('projects'); };

  // Notificaciones: chequear tareas vencidas y nuevas asignaciones
  useEffect(() => {
    if (!currentUser || tasks.length === 0) return;
    notificationService.checkOverdue(tasks, currentUser.id, currentUser.name);
    notificationService.checkNewAssignments(tasks, currentUser.id);
    const interval = setInterval(() => {
      notificationService.checkOverdue(tasks, currentUser.id, currentUser.name);
      notificationService.checkNewAssignments(tasks, currentUser.id);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser, tasks]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="relative w-24 h-24 mb-8">
            <RefreshCw size={96} className="text-brand-500 animate-spin opacity-20" />
            <Cloud size={48} className="absolute inset-0 m-auto text-brand-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black tracking-tighter mb-2">Conectando con Servidor Central</h2>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Farmacias Gigliotti | Cloud Sync</p>
      </div>
    );
  }

  if (!currentUser) return <Login users={users} branches={branches} onLogin={handleLogin} />;

  const renderContent = () => {
    const visibleUsers = (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.GERENCIA || currentUser.role === UserRole.SOCIO) ? users : users.filter(u => u.role !== UserRole.SOCIO);
    switch (activeTab) {
      case 'dashboard': return <Dashboard projects={projects} tasks={tasks} role={currentUser.role} users={visibleUsers} currentUser={currentUser} />;
      case 'projects': return <TaskList tasks={tasks} users={visibleUsers} currentUser={currentUser} onUpdateTask={handleUpdateTask} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} />;
      case 'chat': return (
        <GlobalChat 
          tasks={tasks} 
          currentUser={currentUser} 
          onUpdateTask={handleUpdateTask} 
          lastSeenByChannel={currentUserSeenRegistry}
          hiddenChats={hiddenChats}
          onMarkAsRead={handleMarkChannelAsRead}
          onClearChat={handleClearChat}
          onHideChat={handleHideChat}
          allUsers={users}
        />
      );
      case 'team':
      case 'users': return (
        <UserManagement
          users={visibleUsers}
          branches={branches}
          tasks={tasks}
          currentUser={currentUser}
          profiles={customProfiles}
          onAddUser={async u => {
            setUsers([...users, u]);
            await syncService.createItem('users', u);
          }}
          onUpdateUser={async u => {
            setUsers(users.map(x => x.id === u.id ? u : x));
            await syncService.updateItem('users', u.id, u);
          }}
          onDeleteUser={async id => {
            if (await syncService.deleteItem('users', id)) {
              setUsers(users.filter(x => x.id !== id));
            }
          }}
          onAssignMultipleTasks={handleAssignMultipleTasks}
        />
      );
      case 'profiles': return (
        <ProfileManagement
          profiles={customProfiles}
          users={users}
          onAddProfile={p => setCustomProfiles(prev => [...prev, p])}
          onUpdateProfile={p => setCustomProfiles(prev => prev.map(x => x.id === p.id ? p : x))}
          onDeleteProfile={id => {
            setCustomProfiles(prev => prev.filter(x => x.id !== id));
            setUsers(prev => prev.map(u => ({ ...u, profiles: u.profiles?.filter(pid => pid !== id) })));
          }}
        />
      );
      case 'branches': return <BranchManagement branches={branches} onAddBranch={handleAddBranch} onUpdateBranch={handleUpdateBranch} onDeleteBranch={handleDeleteBranch} />;
      case 'activity': return <UserAnalytics users={visibleUsers} />;
      case 'settings': return <Settings currentUser={currentUser} onUpdateUser={u => setUsers(users.map(x => x.id === u.id ? u : x))} />;
      default: return <div className="p-8 text-center text-slate-400">Sección en construcción</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-indigo-50 font-sans">
      <Sidebar 
        currentUser={currentUser} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        newMessagesCount={newMessagesCount} 
        isSyncing={isSyncing}
      />
      <main className="flex-1 ml-64 bg-indigo-50 min-h-screen relative">
        {isSyncing && (
          <div className="fixed top-4 right-4 z-[100] flex items-center space-x-2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-brand-100 animate-fade-in">
             <RefreshCw size={14} className="text-brand-500 animate-spin" />
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Nube Sincronizada</span>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
