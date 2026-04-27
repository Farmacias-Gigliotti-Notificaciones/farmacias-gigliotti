import React, { useState } from 'react';
import { User, Branch } from '../types';
import { Lock, User as UserIcon, ArrowRight } from 'lucide-react';

interface LoginProps {
  users: User[];
  branches: Branch[];
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Por favor ingrese su usuario');
      return;
    }
    const user = users.find(u =>
      (u.username ? u.username.toLowerCase() : u.name.toLowerCase()) === username.trim().toLowerCase()
    );
    if (user && user.password === password) {
      onLogin(user);
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col justify-center items-center p-4">

      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden">

        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-500 to-secondary-500"></div>

        <div className="flex flex-col items-center mb-8 mt-2">
          <div className="w-32 h-32 flex items-center justify-center mb-4 transform transition-transform hover:scale-105 duration-500">
            <img src="logo_gigliotti.png" alt="Farmacia Gigliotti" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Farmacias Gigliotti</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Portal de Gestión Interna</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Usuario</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon size={18} className="text-brand-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                autoFocus
                className="block w-full pl-10 pr-3 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50 hover:bg-white transition-all font-medium text-slate-700 placeholder-slate-400"
                placeholder="Ingrese su usuario"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-brand-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="block w-full pl-10 pr-3 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50 hover:bg-white transition-all font-medium text-slate-700 placeholder-slate-400"
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
            disabled={!username || !password}
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
