import { CloudConfig } from '../types';

export const syncService = {
  getCloudConfig(): CloudConfig {
    const saved = localStorage.getItem('farmacia_cloud_config_v2');
    return saved ? JSON.parse(saved) : { apiUrl: '', apiKey: '', active: false };
  },

  async testConnection(config: CloudConfig): Promise<boolean> {
    if (!config.apiUrl || !config.apiKey) return false;
    
    // Limpiamos la URL por si tiene una "/" al final
    const cleanUrl = config.apiUrl.replace(/\/$/, '');
    
    try {
      const res = await fetch(`${cleanUrl}/rest/v1/users?select=count`, {
        method: 'GET',
        headers: { 
          'apikey': config.apiKey, 
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        alert("✅ ¡Conectado correctamente a la nube Gigliotti!");
        return true;
      } else {
        const errorData = await res.json();
        alert(`❌ Error de Supabase: ${errorData.message || 'Verificá las llaves'}`);
        return false;
      }
    } catch (e) {
      alert("❌ ERROR DE RED: No se pudo llegar a la dirección. Revisá que la URL sea correcta.");
      return false;
    }
  },

  async loadAllData() {
    const config = this.getCloudConfig();
    const cleanUrl = config.apiUrl?.replace(/\/$/, '');
    
    if (config.active && cleanUrl && config.apiKey) {
      try {
        const fetchTable = async (table: string) => {
          const res = await fetch(`${cleanUrl}/rest/v1/${table}?select=*`, {
            headers: { 'apikey': config.apiKey, 'Authorization': `Bearer ${config.apiKey}` }
          });
          return await res.json();
        };
        return {
          users: await fetchTable('users'),
          tasks: await fetchTable('tasks'),
          branches: await fetchTable('branches'),
          projects: await fetchTable('projects')
        };
      } catch (e) { console.error("Error Sync."); }
    }
    return {
      users: JSON.parse(localStorage.getItem('farmacia_users_v2') || '[]'),
      tasks: JSON.parse(localStorage.getItem('farmacia_tasks_v2') || '[]'),
      branches: JSON.parse(localStorage.getItem('farmacia_branches_v2') || '[]'),
      projects: JSON.parse(localStorage.getItem('farmacia_projects_v2') || '[]')
    };
  }
};