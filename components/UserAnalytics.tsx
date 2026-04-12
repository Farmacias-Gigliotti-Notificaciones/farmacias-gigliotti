import React, { useState } from 'react';
import { User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, Calendar } from 'lucide-react';

interface UserAnalyticsProps {
  users: User[];
}

export const UserAnalytics: React.FC<UserAnalyticsProps> = ({ users }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');

  const chartData = users.map(u => ({
    name: u.name,
    horas: u.usageStats ? u.usageStats[timeframe] : 0,
    role: u.role
  }));

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Métricas de Usuarios</h1>
        <p className="text-slate-500">Monitoreo de actividad y tiempos de conexión.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de Última Conexión */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 col-span-1 lg:col-span-1 overflow-hidden">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Clock className="mr-2 text-blue-500" size={20} />
            Última Actividad
          </h3>
          <div className="overflow-y-auto max-h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Usuario</th>
                  <th className="px-3 py-2 text-right">Último Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                         <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                         <div>
                            <p className="font-medium text-slate-700">{user.name}</p>
                            <p className="text-[10px] text-slate-400">{user.role}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {formatLastLogin(user.lastLogin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráfico de Horas de Uso */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 col-span-1 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Calendar className="mr-2 text-purple-500" size={20} />
              Horas de Uso
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['week', 'month', 'year'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    timeframe === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'week' ? 'Semana' : t === 'month' ? 'Mes' : 'Año'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="horas" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};