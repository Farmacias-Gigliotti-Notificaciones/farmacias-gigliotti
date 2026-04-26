import React, { useState } from 'react';
import { Profile, User } from '../types';
import { Plus, Edit2, Trash2, X, Save, Tag, Users } from 'lucide-react';

interface ProfileManagementProps {
  profiles: Profile[];
  users: User[];
  onAddProfile: (profile: Profile) => void;
  onUpdateProfile: (profile: Profile) => void;
  onDeleteProfile: (profileId: string) => void;
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#64748b',
];

const emptyForm = (): Partial<Profile> => ({
  name: '',
  description: '',
  color: PRESET_COLORS[0],
});

export const ProfileManagement: React.FC<ProfileManagementProps> = ({
  profiles, users, onAddProfile, onUpdateProfile, onDeleteProfile,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<Partial<Profile>>(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const usersWithProfile = (profileId: string) =>
    users.filter(u => u.profiles?.includes(profileId));

  const handleOpen = (profile?: Profile) => {
    if (profile) {
      setEditingProfile(profile);
      setFormData({ ...profile });
    } else {
      setEditingProfile(null);
      setFormData(emptyForm());
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    if (editingProfile) {
      onUpdateProfile({ ...editingProfile, ...formData } as Profile);
    } else {
      onAddProfile({
        id: `prof_${Date.now()}`,
        name: formData.name!.trim(),
        description: formData.description?.trim() || '',
        color: formData.color || PRESET_COLORS[0],
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (profileId: string) => {
    onDeleteProfile(profileId);
    setDeleteConfirm(null);
  };

  return (
    <div className="p-8 space-y-8 bg-indigo-50 min-h-screen">
      <div className="flex justify-between items-end border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Gestión de Perfiles</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Definí perfiles personalizados y asignalos a los usuarios.
          </p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl flex items-center space-x-3 shadow-xl hover:bg-slate-800 transition-all font-black text-sm active:scale-95"
        >
          <Plus size={20} />
          <span>Nuevo Perfil</span>
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Tag size={40} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold text-sm">No hay perfiles definidos.</p>
          <p className="text-[10px] text-slate-300 uppercase mt-1">Creá el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => {
            const assigned = usersWithProfile(profile.id);
            return (
              <div key={profile.id} className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-2" style={{ backgroundColor: profile.color }} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: profile.color + '20' }}>
                        <Tag size={20} style={{ color: profile.color }} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-sm tracking-tight">{profile.name}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: profile.color }}>Perfil</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => handleOpen(profile)} className="p-2 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setDeleteConfirm(profile.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {profile.description && (
                    <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">{profile.description}</p>
                  )}
                  <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-500">
                      {assigned.length === 0
                        ? 'Sin usuarios asignados'
                        : `${assigned.length} usuario${assigned.length > 1 ? 's' : ''}: ${assigned.slice(0, 3).map(u => u.name).join(', ')}${assigned.length > 3 ? '...' : ''}`}
                    </span>
                  </div>
                </div>

                {deleteConfirm === profile.id && (
                  <div className="px-6 pb-6">
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                      <p className="text-xs font-bold text-red-700 mb-3">
                        {assigned.length > 0
                          ? `⚠️ Este perfil está asignado a ${assigned.length} usuario(s). ¿Eliminarlo igual?`
                          : '¿Confirmás la eliminación?'}
                      </p>
                      <div className="flex space-x-2">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
                          Cancelar
                        </button>
                        <button onClick={() => handleDelete(profile.id)} className="flex-1 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md border border-white/20 overflow-hidden">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
                  {editingProfile ? 'Editar Perfil' : 'Nuevo Perfil'}
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-widest">
                  {editingProfile ? 'Modificar datos del perfil' : 'Definir nuevo perfil de usuario'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-all">
                <X />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Nombre del Perfil
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: FARMACEUTICO"
                  autoFocus
                  required
                  className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-brand-500/10 outline-none transition-all uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe brevemente este perfil..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-brand-500/10 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                  Color
                </label>
                <div className="flex space-x-3 flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className="w-8 h-8 rounded-xl transition-all hover:scale-110 active:scale-95"
                      style={{
                        backgroundColor: color,
                        outline: formData.color === color ? `3px solid ${color}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-4 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3.5 text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs uppercase tracking-widest border border-slate-200 rounded-2xl">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-slate-900 text-white px-6 py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-xl hover:bg-slate-800 transition-all font-black text-sm active:scale-95">
                  <Save size={16} />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
