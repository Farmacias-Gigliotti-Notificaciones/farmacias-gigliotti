import { CloudConfig } from '../types';

/**
 * ESTRUCTURA ESPERADA DE TABLAS EN SUPABASE:
 * 
 * **users** table:
 *   - id: uuid (PRIMARY KEY)
 *   - name: text
 *   - role: text (UserRole enum)
 *   - branch: text (optional)
 *   - avatar: text
 *   - password: text (optional)
 *   - lastLogin: timestamp with time zone (optional)
 *   - usageStats: jsonb (optional) {week, month, year}
 * 
 * **tasks** table:
 *   - id: uuid (PRIMARY KEY)
 *   - title: text
 *   - description: text
 *   - status: text (TaskStatus enum)
 *   - priority: text (TaskPriority enum)
 *   - assigneeId: uuid
 *   - creatorId: uuid
 *   - creatorName: text
 *   - createdAt: timestamp with time zone
 *   - targetRoles: jsonb (array of UserRole)
 *   - projectId: uuid (optional)
 *   - rating: integer (optional)
 *   - feedback: text (optional)
 *   - startDate: date
 *   - startTime: text (optional)
 *   - dueDate: date
 *   - offerEndDate: date (optional)
 *   - comments: jsonb (array of Comment objects)
 *   - attachments: jsonb (array of Attachment objects)
 *   - executionLogs: jsonb (array of ExecutionLog objects)
 * 
 * **branches** table:
 *   - id: uuid (PRIMARY KEY)
 *   - name: text
 *   - address: text
 * 
 * **projects** table:
 *   - id: uuid (PRIMARY KEY)
 *   - name: text
 *   - description: text
 *   - status: text
 *   - budget: numeric
 *   - spent: numeric
 *   - startDate: date
 *   - endDate: date
 */

const TASK_SYNC_FIELDS = [
  'id', 'title', 'description', 'status', 'priority', 'assigneeId', 'creatorId',
  'creatorName', 'createdAt', 'targetRoles', 'projectId', 'rating', 'feedback',
  'startDate', 'startTime', 'dueDate', 'offerEndDate', 'comments', 'attachments',
  'executionLogs', 'recurrence', 'recurrenceDays', 'recurrenceMonths', 'recurrenceHours',
  'allowedChatRoles'
];

export const syncService = {
  getCloudConfig(): CloudConfig {
    // Prioridad 1: Variables de Entorno (.env)
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (envUrl && envKey && envUrl !== 'undefined' && envKey !== 'undefined') {
      return { apiUrl: envUrl, apiKey: envKey, active: true };
    }

    // Prioridad 2: Configuración manual guardada (LocalStorage)
    const saved = localStorage.getItem('farmacia_cloud_config_v2');
    return saved ? JSON.parse(saved) : { apiUrl: '', apiKey: '', active: false };
  },

  async getHeaders(): Promise<HeadersInit> {
    const config = this.getCloudConfig();
    // Intentar obtener el token de sesión real de Supabase Auth si existe
    const sessionToken = localStorage.getItem('supabase_access_token') || config.apiKey;
    
    return {
      'apikey': config.apiKey,
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    };
  },

  async saveData(key: string, data: any) {
    // DEPRECATED: Usar syncDataToCloud() en su lugar
    // Mantiene compatibilidad hacia atrás
    localStorage.setItem(key, JSON.stringify(data));
  },

  async syncDataToCloud(tableKey: string, data: any): Promise<{ synced: number; errors: number; message: string }> {
    // Sincroniza datos desde localStorage a Supabase
    // Siempre guarda en localStorage (fallback local)
    // Si cloud está activo, sincroniza a Supabase

    // 1. Guardar siempre en localStorage (fallback local)
    localStorage.setItem(tableKey, JSON.stringify(data));

    const config = this.getCloudConfig();
    if (!config.active || !config.apiUrl || !config.apiKey) {
      return { synced: 0, errors: 0, message: 'Cloud inactivo. Datos guardados solo localmente.' };
    }

    // 2. Si cloud está activo, sincronizar
    try {
      const result = await this.bulkSync(tableKey, data);
      return result;
    } catch (e) {
      console.error(`Error en syncDataToCloud para ${tableKey}:`, e);
      return { synced: 0, errors: data.length || 0, message: `Error en sincronización: ${String(e)}` };
    }
  },

  async bulkSync(tableKey: string, data: any[]): Promise<{ synced: number; errors: number; message: string }> {
    // Sincroniza inteligentemente comparando localStorage con Supabase
    // Calcula diffs: crea nuevos, actualiza existentes, elimina no presentes
    
    if (!Array.isArray(data)) {
      return { synced: 0, errors: 0, message: 'Datos no son un array, sincronización omitida.' };
    }

    const config = this.getCloudConfig();
    const cleanUrl = config.apiUrl?.replace(/\/$/, '');
    if (!cleanUrl) return { synced: 0, errors: 0, message: 'URL no configurada' };

    // Mapear tableKey a nombre de tabla en Supabase
    const tableMap: Record<string, string> = {
      'farmacia_users_v2': 'users',
      'farmacia_tasks_v2': 'tasks',
      'farmacia_branches_v2': 'branches',
      'farmacia_projects_v2': 'projects',
      'farmacia_profiles_v2': 'profiles'
    };
    
    const tableName = tableMap[tableKey];
    if (!tableName) {
      return { synced: 0, errors: 0, message: `Tabla no reconocida: ${tableKey}` };
    }

    let synced = 0;
    let errors = 0;

    try {
      // Cargar datos actuales de Supabase
      const headers = await this.getHeaders();
      const cloudRes = await fetch(`${cleanUrl}/rest/v1/${tableName}?select=id`, { headers });
      
      if (!cloudRes.ok) {
        return { synced: 0, errors: data.length, message: `Error al cargar tabla ${tableName} desde Supabase` };
      }

      const cloudData = await cloudRes.json();
      const cloudIds = new Set((cloudData as any[]).map((item: any) => item.id));
      const localIds = new Set(data.filter((item: any) => item.id).map((item: any) => item.id));

      // Procesar cada item local
      for (const item of data) {
        if (!item.id) continue;

        try {
          if (cloudIds.has(item.id)) {
            // Item existe en Supabase → actualizar
            const updateSuccess = await this.updateItem(tableName, item.id, item);
            if (updateSuccess) {
              synced++;
            } else {
              errors++;
            }
          } else {
            // Item es nuevo → crear
            const createSuccess = await this.createItem(tableName, item);
            if (createSuccess) {
              synced++;
            } else {
              errors++;
              console.warn(`Error al crear ${item.id} en ${tableName}`);
            }
          }
        } catch (itemError) {
          console.error(`Error sincronizando ${item.id}:`, itemError);
          errors++;
        }
      }

      // Items en Supabase pero no en localStorage → eliminar (opcional)
      // Comentado por ahora para preservar datos
      /*
      for (const cloudId of cloudIds) {
        if (!localIds.has(cloudId)) {
          try {
            await this.deleteItem(tableName, cloudId);
            synced++;
          } catch (delError) {
            errors++;
          }
        }
      }
      */

      return { 
        synced, 
        errors, 
        message: `Sincronizado ${synced} items${errors > 0 ? `, ${errors} errores` : ''} a ${tableName}` 
      };
    } catch (e) {
      return { synced: 0, errors: data.length, message: `Error en bulkSync: ${String(e)}` };
    }
  },

  async retrySync(): Promise<{ totalSynced: number; totalErrors: number; results: any[] }> {
    // Reintenta sincronización manual de todos los datos
    // Usado cuando hay errores de red o para sincronización manual
    
    const config = this.getCloudConfig();
    if (!config.active) {
      return { totalSynced: 0, totalErrors: 0, results: [{ message: 'Cloud no está activo' }] };
    }

    const results = [];
    let totalSynced = 0;
    let totalErrors = 0;

    const tables = [
      { key: 'farmacia_users_v2', name: 'Usuarios' },
      { key: 'farmacia_tasks_v2', name: 'Tareas' },
      { key: 'farmacia_branches_v2', name: 'Sucursales' },
      { key: 'farmacia_projects_v2', name: 'Proyectos' },
      { key: 'farmacia_profiles_v2', name: 'Perfiles' }
    ];

    for (const table of tables) {
      try {
        const data = JSON.parse(localStorage.getItem(table.key) || '[]');
        const result = await this.bulkSync(table.key, data);
        totalSynced += result.synced;
        totalErrors += result.errors;
        results.push({
          table: table.name,
          synced: result.synced,
          errors: result.errors,
          message: result.message
        });
      } catch (e) {
        totalErrors++;
        results.push({
          table: table.name,
          synced: 0,
          errors: 1,
          message: String(e)
        });
      }
    }

    return { totalSynced, totalErrors, results };
  },

  async testConnection(config: CloudConfig): Promise<{ success: boolean; message: string }> {
    if (!config.apiUrl || !config.apiKey) {
      return { success: false, message: '❌ Credenciales vacías. Configurá URL y API Key.' };
    }
    
    const cleanUrl = config.apiUrl.replace(/\/$/, '');
    const headers = await this.getHeaders();
    const tables = ['users', 'tasks', 'branches', 'projects'];
    const errors: string[] = [];
    
    try {
      // Validar conectividad básica
      const connRes = await fetch(`${cleanUrl}/rest/v1/`, { headers, method: 'GET' });
      if (!connRes.ok) {
        if (connRes.status === 401 || connRes.status === 403) {
          return { success: false, message: '❌ Error de autenticación: API Key inválida o sin permisos.' };
        }
        return { success: false, message: `❌ Error de conectividad (${connRes.status}). Verificá la URL y API Key.` };
      }
      
      // Validar que cada tabla exista
      for (const table of tables) {
        try {
          const res = await fetch(`${cleanUrl}/rest/v1/${table}?limit=1`, { headers });
          if (res.status === 404) {
            errors.push(`- Tabla "${table}" no existe en Supabase`);
          } else if (!res.ok) {
            errors.push(`- Tabla "${table}": Error ${res.status}`);
          }
        } catch (e) {
          errors.push(`- Tabla "${table}": ${String(e)}`);
        }
      }
      
      if (errors.length > 0) {
        const msg = '❌ Problemas encontrados:\n' + errors.join('\n');
        return { success: false, message: msg };
      }
      
      return { success: true, message: '✅ ¡Conectado correctamente a Supabase! Todas las tablas están disponibles.' };
    } catch (e) {
      return { success: false, message: `❌ ERROR: ${String(e)}` };
    }
  },

  async validateTablesSchema(config: CloudConfig): Promise<{ valid: boolean; issues: string[] }> {
    // Valida que las tablas en Supabase tengan la estructura esperada (columnas principales)
    if (!config.active || !config.apiUrl || !config.apiKey) {
      return { valid: false, issues: ['Sincronización no está activa o mal configurada'] };
    }
    
    const cleanUrl = config.apiUrl.replace(/\/$/, '');
    const headers = await this.getHeaders();
    const issues: string[] = [];
    
    const expectedSchema = {
      users: ['id', 'name', 'role', 'avatar'],
      tasks: ['id', 'title', 'status', 'priority', 'assigneeId', 'creatorId', 'dueDate'],
      branches: ['id', 'name', 'address'],
      projects: ['id', 'name', 'status']
    };
    
    try {
      for (const [table, expectedColumns] of Object.entries(expectedSchema)) {
        const res = await fetch(`${cleanUrl}/rest/v1/${table}?limit=1`, { headers });
        
        if (res.status === 404) {
          issues.push(`Tabla "${table}" no existe`);
          continue;
        }
        
        if (!res.ok) {
          issues.push(`Error accediendo a tabla "${table}": ${res.status}`);
          continue;
        }
        
        const data = await res.json();
        if (data.length > 0) {
          const actualColumns = Object.keys(data[0]);
          const missing = expectedColumns.filter(col => !actualColumns.includes(col));
          if (missing.length > 0) {
            issues.push(`Tabla "${table}" falta columnas: ${missing.join(', ')}`);
          }
        }
      }
      
      return { valid: issues.length === 0, issues };
    } catch (e) {
      return { valid: false, issues: [String(e)] };
    }
  },

  async loadAllData() {
    const config = this.getCloudConfig();
    const cleanUrl = config.apiUrl?.replace(/\/$/, '');
    
    if (config.active && cleanUrl && config.apiKey) {
      try {
        const headers = await this.getHeaders();
        const fetchTable = async (table: string) => {
          const res = await fetch(`${cleanUrl}/rest/v1/${table}?select=*`, {
            headers
          });
          return await res.json();
        };
        return {
          users: await fetchTable('users'),
          tasks: await fetchTable('tasks'),
          branches: await fetchTable('branches'),
          projects: await fetchTable('projects'),
          profiles: await fetchTable('profiles')
        };
      } catch (e) { console.error("Error Sync."); }
    }
    return {
      users: JSON.parse(localStorage.getItem('farmacia_users_v2') || '[]'),
      tasks: JSON.parse(localStorage.getItem('farmacia_tasks_v2') || '[]'),
      branches: JSON.parse(localStorage.getItem('farmacia_branches_v2') || '[]'),
      projects: JSON.parse(localStorage.getItem('farmacia_projects_v2') || '[]'),
      profiles: JSON.parse(localStorage.getItem('farmacia_profiles_v2') || '[]')
    };
  },

  async createItem(table: string, data: any): Promise<boolean> {
    const config = this.getCloudConfig();
    const cleanUrl = config.apiUrl?.replace(/\/$/, '');
    if (!config.active || !cleanUrl || !config.apiKey) {
      console.log(`Cloud inactivo. Elemento no se creará en Supabase para la tabla: ${table}, ID: ${data.id}`);
      return true; // Retorna true porque el guardado local ya ocurrió
    }

    try {
      // Filtrar solo los campos que Supabase espera para cada tabla
      let cleanData = { ...data };
      
      if (table === 'tasks') {
        cleanData = Object.fromEntries(
          Object.entries(cleanData).filter(([key]) => TASK_SYNC_FIELDS.includes(key))
        );
      }

      const response = await fetch(`${cleanUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: { 
          ...(await this.getHeaders() as any),
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(cleanData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error al crear en Supabase [${table}] (ID: ${data.id}):`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          dataEnviado: cleanData
        });
        return false;
      }
      
      console.log(`✅ Elemento creado en Supabase [${table}]:`, data.id);
      return true;
    } catch (e) {
      console.error(`❌ Error creando en ${table} (ID: ${data.id}):`, e);
      return false;
    }
  },

  async updateItem(table: string, id: string, data: any): Promise<boolean> {
    const config = this.getCloudConfig();
    const cleanUrl = config.apiUrl?.replace(/\/$/, '');
    if (!config.active || !cleanUrl || !config.apiKey) {
      console.log(`Cloud inactivo. Cambio en ${table} (ID: ${id}) solo es local.`);
      return true; 
    }

    try {
      // Filtrar solo los campos que Supabase espera para cada tabla
      let cleanData = { ...data };
      
      if (table === 'tasks') {
        cleanData = Object.fromEntries(
          Object.entries(cleanData).filter(([key]) => TASK_SYNC_FIELDS.includes(key))
        );
      }

      const response = await fetch(`${cleanUrl}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 
          ...(await this.getHeaders() as any),
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(cleanData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error al actualizar en Supabase [${table}] (ID: ${id}):`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          dataEnviado: cleanData
        });
        return false;
      }
      
      console.log(`✅ Elemento actualizado en Supabase [${table}]:`, id);
      return true;
    } catch (e) {
      console.error(`❌ Error actualizando ${table} (ID: ${id}):`, e);
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
        headers: await this.getHeaders()
      });
      return res.ok;
    } catch (e) {
      console.error(`Error eliminando de ${table}:`, e);
      return false;
    }
  }
};