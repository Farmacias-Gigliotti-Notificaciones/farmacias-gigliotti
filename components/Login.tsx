import React, { useState, useEffect } from 'react';
import { User, Branch } from '../types';
import { Lock, User as UserIcon, ArrowRight, Building2 } from 'lucide-react';

interface LoginProps {
  users: User[];
  branches: Branch[];
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ users, branches, onLogin }) => {
  const [selectedBranchName, setSelectedBranchName] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Filter users based on selected branch
  const filteredUsers = selectedBranchName 
    ? users.filter(u => u.branch === selectedBranchName)
    : [];

  useEffect(() => {
    setSelectedUserId('');
  }, [selectedBranchName]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
        setError('Por favor seleccione un usuario');
        return;
    }
    const user = users.find(u => u.id === selectedUserId);
    if (user && user.password === password) {
      onLogin(user);
    } else {
      setError('Contraseña incorrecta');
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col justify-center items-center p-4">
      
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden">
        
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-500 to-secondary-500"></div>

        <div className="flex flex-col items-center mb-8 mt-2">
            <div className="w-32 h-32 flex items-center justify-center mb-4 transform transition-transform hover:scale-105 duration-500">
                <img src="logo_gigliotti.png" alt="Farmacia Gigliotti" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Farmacias Gigliotti</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Portal de Gestión Interna</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
            {/* 1. Select Branch */}
            <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">1. Sucursal</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 size={18} className="text-brand-500" />
                    </div>
                    <select 
                        value={selectedBranchName}
                        onChange={(e) => { setSelectedBranchName(e.target.value); setError(''); }}
                        className="block w-full pl-10 pr-3 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50 hover:bg-white transition-all cursor-pointer text-slate-700 font-medium"
                    >
                        <option value="">Seleccione ubicación...</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 2. Select User */}
            <div className={`transition-all duration-300 ${!selectedBranchName ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">2. Usuario</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon size={18} className="text-brand-500" />
                    </div>
                    <select 
                        value={selectedUserId}
                        onChange={(e) => { setSelectedUserId(e.target.value); setError(''); }}
                        disabled={!selectedBranchName}
                        className="block w-full pl-10 pr-3 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50 hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100 text-slate-700 font-medium"
                    >
                        <option value="">
                            {selectedBranchName ? 'Seleccione su perfil...' : 'Esperando selección...'}
                        </option>
                        {filteredUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.name} - {u.role}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 3. Password */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">3. Clave de Acceso</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock size={18} className="text-brand-500" />
                    </div>
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        disabled={!selectedUserId}
                        className="block w-full pl-10 pr-3 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder-slate-400 disabled:bg-slate-100 transition-all font-medium text-slate-700"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            {error && (
                <div className="text-red-600 text-xs font-medium flex items-center justify-center bg-red-50 p-3 rounded-lg border border-red-100 animate-pulse">
                    {error}
                </div>
            )}

            <button 
                type="submit"
                disabled={!selectedUserId || !password}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-600 to-secondary-600 text-white py-4 rounded-xl hover:from-brand-700 hover:to-secondary-700 transition-all font-bold shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transform active:scale-95"
            >
                <span>Acceder al Sistema</span>
                <ArrowRight size={20} className="ml-1" />
            </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-400">Acceso seguro para personal autorizado</p>
            <p className="text-[10px] text-slate-300 mt-2">© {new Date().getFullYear()} Farmacias Gigliotti</p>
        </div>
      </div>
    </div>
  );
};