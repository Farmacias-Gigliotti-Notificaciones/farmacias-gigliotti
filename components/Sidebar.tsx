
import React from 'react';
import { UserRole, User } from '../types';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Settings, 
  LogOut,
  UserCog,
  BarChart2,
  Building2,
  MessageSquare,
  Cloud,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  newMessagesCount?: number;
  isSyncing?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeTab, setActiveTab, onLogout, newMessagesCount = 0, isSyncing = false }) => {
  const isAdmin = [UserRole.GERENCIA, UserRole.SOCIO, UserRole.RRHH].includes(currentUser.role);
  const isHighLevel = [UserRole.ENCARGADO, UserRole.SUPERVISOR, UserRole.GERENCIA, UserRole.SOCIO, UserRole.RRHH].includes(currentUser.role);
  const isManager = [UserRole.ENCARGADO, UserRole.SUPERVISOR, UserRole.GERENCIA, UserRole.SOCIO, UserRole.RRHH].includes(currentUser.role);
  const canManageBranches = [UserRole.GERENCIA, UserRole.SOCIO].includes(currentUser.role);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Operativo', icon: LayoutDashboard, show: isHighLevel },
    { id: 'projects', label: 'Tareas', icon: FolderKanban, show: true },
    { id: 'chat', label: 'Canales Novedades', icon: MessageSquare, show: true, badge: newMessagesCount },
    { id: 'team', label: 'Gestión Equipo', icon: Users, show: isManager },
    { divider: true, label: 'Corporativo', show: isAdmin },
    { id: 'users', label: 'Usuarios y Roles', icon: UserCog, show: isAdmin },
    { id: 'branches', label: 'Sucursales Gigliotti', icon: Building2, show: canManageBranches },
    { id: 'activity', label: 'Métricas de Uso', icon: BarChart2, show: isAdmin },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-2xl z-50">
      
      <div className="p-6 border-b border-slate-800/50 flex items-center space-x-3 bg-slate-900">
        <div className="w-10 h-10 bg-gradient-to-br from-white to-slate-100 rounded-xl flex items-center justify-center p-1 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                <linearGradient id="logoGradSmall" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" /> 
                    <stop offset="100%" stopColor="#0ea5e9" /> 
                </linearGradient>
                </defs>
                <path d="M 30 20 Q 0 50 30 80" stroke="url(#logoGradSmall)" strokeWidth="10" strokeLinecap="round" fill="none" />
                <path d="M 70 20 Q 100 50 70 80" stroke="url(#logoGradSmall)" strokeWidth="10" strokeLinecap="round" fill="none" />
                <path d="M 42 25 L 58 25 L 58 42 L 75 42 L 75 58 L 58 58 L 58 75 L 42 75 L 42 58 L 25 58 L 25 42 L 42 42 Z" fill="url(#logoGradSmall)" />
            </svg>
        </div>
        <div className="overflow-hidden">
            <span className="block text-lg font-bold tracking-tight leading-none text-white">Farmacias</span>
            <span className="block text-sm font-medium text-brand-400 leading-none mt-0.5">Gigliotti</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <img src={currentUser.avatar} alt="User" className="w-9 h-9 rounded-full border border-brand-500 object-cover" />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate text-slate-100">{currentUser.name}</p>
            <p className="text-[10px] text-brand-400 uppercase tracking-wider font-bold">{currentUser.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar-thin">
        {menuItems.map((item, idx) => {
          if (!item.show) return null;
          if (item.divider) return (
            <div key={`div-${idx}`} className="pt-4 pb-2 px-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
            </div>
          );
          const Icon = item.icon as React.ElementType;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id!)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-brand-400 transition-colors'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-lg animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Cloud Status Indicator */}
      <div className="p-4 mx-3 mb-2 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
             <div className="flex items-center space-x-2">
                <Cloud size={14} className={isSyncing ? 'text-brand-400 animate-pulse' : 'text-brand-500'} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Nube</span>
             </div>
             {isSyncing ? <RefreshCw size={12} className="text-brand-500 animate-spin" /> : <CheckCircle2 size={12} className="text-emerald-500" />}
          </div>
          <div className="flex items-center space-x-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
             <p className="text-[9px] font-bold text-slate-500 italic">Conectado a Central v2.1</p>
          </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-1">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors group ${
            activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Settings size={18} className="group-hover:text-brand-400 transition-colors" />
          <span className="text-sm font-medium">Configuración</span>
        </button>
        <button 
          onClick={onLogout}
          className="flex items-center space-x-3 text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors w-full px-3 py-2 rounded-lg group"
        >
          <LogOut size={18} className="group-hover:text-red-500 transition-colors" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};
