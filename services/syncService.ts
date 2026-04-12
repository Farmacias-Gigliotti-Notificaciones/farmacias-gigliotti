import { Task, User, Branch, Project } from '../types';

export interface CloudConfig {
  apiUrl: string;
  apiKey: string;
  active: boolean;
}

export const syncService = {
  getCloudConfig(): CloudConfig {
    const saved = localStorage.getItem('farmacia_cloud_config_v2');
    return saved ? JSON.parse(saved) : { apiUrl: '', apiKey: '', active: false };
  },

  async testConnection(config: CloudConfig): Promise<boolean> {
    if (!config.apiUrl || !config.apiKey) {
      alert("Faltan datos de URL o API Key.");
      return false;
    }
    try {
      const res = await fetch(`${config.apiUrl}/users?select=count`, {
        headers: { 'apikey': config.apiKey, 'Authorization': `Bearer ${config.apiKey}` }
      });
      
      if (res.ok) {
        alert("✅ ¡Conectado correctamente a la nube Gigliotti!");
        return true;
      } else {
        alert("❌ Error de conexión: Revisá la URL y la Key.");
        return false;
      }
    } catch (e) {
      alert("❌ Error de red: No se pudo alcanzar Supabase.");
      return false;
    }
  },

  async loadAllData() {
    const config = this.getCloudConfig();
    if (config.active && config.apiUrl && config.apiKey) {
      try {
        const fetchTable = async (table: string) => {
            const res = await fetch(`${config.apiUrl}/${table}?select=*`, {
                headers: { 'apikey': config.apiKey, 'Authorization': `Bearer ${config.apiKey}` }
            });
            return await res.json();
        };
        return {
          users: await fetchTable('users'),
          tasks: await fetchTable('tasks'),
          branches: await fetchTable('branches'),
          projects: await fetchTable('projects'),
        };
      } catch (e) { console.error("Error de carga."); }
    }
    return {
      users: JSON.parse(localStorage.getItem('farmacia_users_v2') || '[]'),
      tasks: JSON.parse(localStorage.getItem('farmacia_tasks_v2') || '[]'),
      branches: JSON.parse(localStorage.getItem('farmacia_branches_v2') || '[]'),
      projects: JSON.parse(localStorage.getItem('farmacia_projects_v2') || '[]'),
    };
  },

  async saveData(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
    const config = this.getCloudConfig();
    if (config.active && config.apiUrl && config.apiKey) {
      try {
        const table = key.split('_')[1]; 
        await fetch(`${config.apiUrl}/${table}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'apikey': config.apiKey,
            'Authorization': `Bearer ${config.apiKey}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(data)
        });
      } catch (e) { console.warn("Error de guardado."); }
    }
    return { success: true };
  }
};