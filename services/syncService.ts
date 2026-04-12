
import { CloudConfig } from '../types';

export const syncService = {
  getCloudConfig(): CloudConfig {
    const saved = localStorage.getItem('farmacia_cloud_config_v2');
    return saved ? JSON.parse(saved) : { apiUrl: '', apiKey: '', active: false };
  },

  async testConnection(config: CloudConfig): Promise<boolean> {
    if (!config.apiUrl || !config.apiKey) {
      alert("Por favor, completá la URL y la Key de Supabase.");
      return false;
    }
    try {
      const res = await fetch(`${config.apiUrl}/users?select=count`, {
        headers: { 
          'apikey': config.apiKey, 
          'Authorization': `Bearer ${config.apiKey}` 
        }
      });
      
      if (res.ok) {
        // LA LEYENDA DEL NAVEGADOR
        alert("✅ ¡Conectado correctamente a la nube Gigliotti!");
        return true;
      } else {
        alert("❌ Error de conexión: Verificá que las llaves sean correctas.");
        return false;
      }
    } catch (e) {
      alert("❌ No se pudo conectar a la red. Revisá tu conexión a internet.");
      return false;
    }
  },

  // ... El resto de loadAllData y saveData queda igual al original ...
};