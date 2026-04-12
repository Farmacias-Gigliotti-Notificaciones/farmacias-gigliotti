import React, { useState } from 'react';
import { Branch } from '../types';
import { Building2, Plus, Edit2, Trash2, MapPin, Save, X } from 'lucide-react';

interface BranchManagementProps {
  branches: Branch[];
  onAddBranch: (branch: Branch) => void;
  onUpdateBranch: (branch: Branch) => void;
  onDeleteBranch: (id: string) => void;
}

export const BranchManagement: React.FC<BranchManagementProps> = ({ branches, onAddBranch, onUpdateBranch, onDeleteBranch }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<Partial<Branch>>({ name: '', address: '' });

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData(branch);
    } else {
      setEditingBranch(null);
      setFormData({ name: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingBranch) {
      onUpdateBranch({ ...editingBranch, ...formData } as Branch);
    } else {
      const newBranch: Branch = {
        id: `b${Date.now()}`,
        name: formData.name || '',
        address: formData.address || ''
      };
      onAddBranch(newBranch);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Gestión de Sucursales</h1>
           <p className="text-slate-500">Administra las ubicaciones y sedes de la empresa.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <Plus size={20} />
          <span>Nueva Sucursal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Building2 size={24} />
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(branch)} 
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => {
                    if(window.confirm('¿Eliminar esta sucursal?')) onDeleteBranch(branch.id);
                  }}
                  className="p-2 hover:bg-red-50 rounded-full text-red-500" title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">{branch.name}</h3>
            <div className="flex items-center text-slate-500 text-sm">
              <MapPin size={14} className="mr-1" />
              {branch.address || 'Sin dirección registrada'}
            </div>
          </div>
        ))}
        
        {/* Add Button Card */}
        <button 
          onClick={() => handleOpenModal()}
          className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors h-full min-h-[160px]"
        >
          <Plus size={32} className="mb-2" />
          <span className="font-medium">Agregar Sucursal</span>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">{editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Sucursal</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: Sede Central"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: Av. Libertador 1234"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Save size={18} className="mr-2" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};