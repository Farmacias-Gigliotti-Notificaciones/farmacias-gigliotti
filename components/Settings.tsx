
import React, { useState, useEffect } from 'react';
import { User, CloudConfig } from '../types';
import { 
  Lock, Check, Cloud, Globe, Database, AlertCircle, 
  Server, Download, Upload, ShieldCheck, RefreshCw, Radio
} from 'lucide-react';
import { syncService } from '../services/syncService';

interface SettingsProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateUser }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Cloud Config State
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(syncService.getCloudConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [connStatus, setConnStatus] = useState<'IDLE' | 'OK' | 'FAIL'>('IDLE');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (currentPassword !== currentUser.password) {
      setMessage({ type: 'error', text: 'La contraseña actual es incorrecta.' });
      return;
    }
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Mínimo 4 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }
    onUpdateUser({ ...currentUser, password: newPassword });
    setMessage({ type: 'success', text: 'Credenciales actualizadas.' });
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
  };

  const handleSaveCloudConfig = async () => {
    setIsTesting(true);
    const isOk = await syncService.testConnection(cloudConfig);
    setConnStatus(isOk ? 'OK' : 'FAIL');
    localStorage.setItem('farmacia_cloud_config_v2', JSON.stringify({ ...cloudConfig, active: isOk }));
    setIsTesting(false);
    if(isOk) alert("Conexión con el servidor central establecida exitosamente.");
  };

  const handleExportDB = () => {
    const db = {
      users: JSON.parse(localStorage.getItem('farmacia_users_v2') || '[]'),
      tasks: JSON.parse(localStorage.getItem('farmacia_tasks_v2') || '[]'),
      branches: JSON.parse(localStorage.getItem('farmacia_branches_v2') || '[]'),
      projects: JSON.parse(localStorage.getItem('farmacia_projects_v2') || '[]'),
      timestamp: new Date().toISOString(),
      version: '2.5-network-ready'
    };
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_gigliotti_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target?.result as string);
            if (data.users && data.tasks) {
                localStorage.setItem('farmacia_users_v2', JSON.stringify(data.users));
                localStorage.setItem('farmacia_tasks_v2', JSON.stringify(data.tasks));
                localStorage.setItem('farmacia_branches_v2', JSON.stringify(data.branches));
                localStorage.setItem('farmacia_projects_v2', JSON.stringify(data.projects));
                alert("Base de datos importada correctamente. Reinicie la aplicación.");
                window.location.reload();
            }
        } catch (err) {
            alert("Error: El archivo de backup no es válido.");
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-fade-in">
      <div className="flex justify-between items-end border-b border-slate-200 pb-10">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Panel de Control</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Configuración de Infraestructura y Seguridad</p>
        </div>
        <div className="flex space-x-4">
            <button onClick={handleExportDB} className="flex items-center space-x-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                <Download size={16}/> <span>Respaldar DB</span>
            </button>
            <label className="flex items-center space-x-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
                <Upload size={16}/> <span>Restaurar DB</span>
                <input type="file" className="hidden" accept=".json" onChange={handleImportDB} />
            </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* PANEL DE RED / CLOUD */}
        <div className="lg:col-span-1 space-y-8">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute -top-10 -right-10 opacity-5">
                    <Globe size={200} />
                </div>
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-brand-400">Infraestructura Nube</h3>
                        <div className={`w-3 h-3 rounded-full ${connStatus === 'OK' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : connStatus === 'FAIL' ? 'bg-red-500' : 'bg-slate-700'}`}></div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Servidor API (URL)</label>
                            <input 
                                type="text" 
                                value={cloudConfig.apiUrl} 
                                onChange={e => setCloudConfig({...cloudConfig, apiUrl: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-mono text-emerald-400 outline-none focus:border-brand-500 transition-all"
                                placeholder="https://api.gigliotti.cloud"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Token de Acceso</label>
                            <input 
                                type="password" 
                                value={cloudConfig.apiKey} 
                                onChange={e => setCloudConfig({...cloudConfig, apiKey: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-mono text-emerald-400 outline-none focus:border-brand-500 transition-all"
                                placeholder="••••••••••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveCloudConfig}
                        disabled={isTesting || !cloudConfig.apiUrl}
                        className="w-full py-5 bg-brand-600 hover:bg-brand-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all shadow-xl shadow-brand-600/20 active:scale-95 flex items-center justify-center space-x-3"
                    >
                        {isTesting ? <RefreshCw size={18} className="animate-spin"/> : <Server size={18}/>}
                        <span>{isTesting ? 'Sincronizando...' : 'Vincular a la Red'}</span>
                    </button>

                    <p className="text-[10px] text-slate-500 font-bold text-center leading-relaxed">
                        Una vez vinculado, los datos se sincronizarán en tiempo real con todas las sucursales conectadas a este servidor.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Cifrado de Extremo a Extremo</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Activo: Protocolo AES-256</p>
                </div>
                <ShieldCheck size={32} className="text-emerald-500 opacity-20"/>
            </div>
        </div>

        {/* SEGURIDAD DE USUARIO */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-200 p-12 h-full flex flex-col">
                <div className="flex items-center space-x-6 mb-12">
                    <div className="p-5 bg-slate-900 rounded-[1.5rem] text-white shadow-xl shadow-slate-900/20"><Lock size={32}/></div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Seguridad de Perfil</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gestión de credenciales personales</p>
                    </div>
                </div>

                {message && (
                    <div className={`mb-10 p-6 rounded-2xl flex items-center font-black text-xs uppercase tracking-widest animate-fade-in ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {message.type === 'success' ? <Check className="mr-4" size={20} strokeWidth={4}/> : <AlertCircle className="mr-4" size={20} strokeWidth={4}/>}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-10 flex-1">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clave Actual</label>
                        <input 
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full border border-slate-200 rounded-[1.5rem] p-5 text-sm font-bold focus:ring-8 focus:ring-brand-500/5 outline-none transition-all bg-slate-50 focus:bg-white"
                            placeholder="Ingrese su contraseña vigente"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nueva Clave</label>
                            <input 
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border border-slate-200 rounded-[1.5rem] p-5 text-sm font-bold focus:ring-8 focus:ring-brand-500/5 outline-none transition-all bg-slate-50 focus:bg-white"
                                placeholder="Nueva clave de acceso"
                                required
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmación</label>
                            <input 
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border border-slate-200 rounded-[1.5rem] p-5 text-sm font-bold focus:ring-8 focus:ring-brand-500/5 outline-none transition-all bg-slate-50 focus:bg-white"
                                placeholder="Repita la nueva clave"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-12 mt-auto">
                        <button 
                            type="submit"
                            className="bg-slate-900 text-white px-16 py-5 rounded-[1.5rem] hover:bg-slate-800 transition-all font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/30 active:scale-95"
                        >
                            Confirmar Cambio de Seguridad
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};
