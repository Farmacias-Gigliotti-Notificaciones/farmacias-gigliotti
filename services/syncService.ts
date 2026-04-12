
import { Task, User, Branch, Project } from '../types';

/**
 * SERVICIO DE SINCRONIZACIÓN GIGLIOTTI CLOUD v2.5
 * Soporta configuración dinámica desde el panel de Settings.
 */

export interface CloudConfig {
  apiUrl: string;
  apiKey: string;
  active: boolean;
}

const STORAGE_KEYS = {
  CONFIG: 'farmacia_cloud_config_v2',
  USERS: 'farmacia_users_v2',
  TASKS: 'farmacia_tasks_v2',
  BRANCHES: 'farmacia_branches_v2',
  PROJECTS: 'farmacia_projects_v2',
};

export const syncService = {
  getCloudConfig(): CloudConfig {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : { apiUrl: '', apiKey: '', active: false };
  },

  async testConnection(config: CloudConfig): Promise<boolean> {
    if (!config.apiUrl || !config.apiKey) return false;
    try {
      const res = await fetch(`${config.apiUrl}/users?select=count`, {
        headers: { 'apikey': config.apiKey, 'Authorization': `Bearer ${config.apiKey}` }
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async loadAllData() {
    console.log("Gigliotti Cloud: Iniciando sincronización de red...");
    const config = this.getCloudConfig();
    
    if (config.active && config.apiUrl && config.apiKey) {
      try {
        const fetchTable = async (table: string) => {
            const res = await fetch(`${config.apiUrl}/${table}?select=*`, {
                headers: { 'apikey': config.apiKey, 'Authorization': `Bearer ${config.apiKey}` }
            });
            if (!res.ok) throw new Error(`Error en tabla ${table}`);
            return await res.json();
        };

        return {
          users: await fetchTable('users'),
          tasks: await fetchTable('tasks'),
          branches: await fetchTable('branches'),
          projects: await fetchTable('projects'),
        };
      } catch (e) {
        console.error("Fallo de red. Usando base de datos local de respaldo.");
      }
    }

    return {
      users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
      tasks: JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]'),
      branches: JSON.parse(localStorage.getItem(STORAGE_KEYS.BRANCHES) || '[]'),
      projects: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]'),
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
      } catch (e) {
        console.warn(`Error de persistencia en red [${key}]`);
      }
    }
    return { success: true };
  }
};
