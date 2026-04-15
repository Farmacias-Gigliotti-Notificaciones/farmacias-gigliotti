import { CloudConfig } from '../types';

export const syncService = {
  getCloudConfig(): CloudConfig {
    // Prioridad 1: Variables de Entorno (.env)
    const envUrl = process.env.SUPABASE_URL;
    const envKey = process.env.SUPABASE_KEY;

    if (envUrl && envKey && envUrl !== 'undefined' && envKey !== 'undefined') {
      return { apiUrl: envUrl, apiKey: envKey, active: true };
    }

    // Prioridad 2: Configuración manual guardada (LocalStorage)
    const saved = localStorage.getItem('farmacia_cloud_config_v2');
    return saved ? JSON.parse(saved) : { apiUrl: '', apiKey: '', active: false };
  },

  async saveData(key: string, data: any) {
    // Sincronización local persistente
    localStorage.setItem(key, JSON.stringify(data));
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
  },

  async createItem(table: string, data: any): Promise<boolean> {
    const config = this.getCloudConfig();
    const cleanUrl = config.apiUrl?.replace(/\/$/, '');
    if (!config.active || !cleanUrl || !config.apiKey) return true;

    try {
      const res = await fetch(`${cleanUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': config.apiKey,
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        console.error(`Error Supabase POST [${table}]:`, err);
      }
      return res.ok;
    } catch (e) {
      console.error(`Error creando en ${table}:`, e);
      return false;
    }
  },

  async updateItem(table: string, id: string, data: any): Promise<boolean> {
    const config = this.getCloudConfig();
    const cleanUrl = config.apiUrl?.replace(/\/$/, '');
    if (!config.active || !cleanUrl || !config.apiKey) {
      // Fallback local: Actualizar en LocalStorage si no hay red activa
      console.warn(`Sincronización inactiva. El cambio en ${table} (ID: ${id}) solo es local.`);
      return true; 
    }

    try {
      const res = await fetch(`${cleanUrl}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': config.apiKey,
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch (e) {
      console.error(`Error actualizando ${table}:`, e);
      return false;
    }
  },

  async deleteItem(table: string, id: string): Promise<boolean> {
    const config = this.getCloudConfig();
    const cleanUrl = config.apiUrl?.replace(/\/$/, '');
    if (!config.active || !cleanUrl || !config.apiKey) return false;

    try {
      const res = await fetch(`${cleanUrl}/rest/v1/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': config.apiKey,
          'Authorization': `Bearer ${config.apiKey}`
        }
      });
      return res.ok;
    } catch (e) {
      console.error(`Error eliminando de ${table}:`, e);
      return false;
    }
  }
};