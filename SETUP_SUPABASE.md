# 🚀 Setup de Supabase para Farmacias Gigliotti

## 📋 Índice
1. [Crear Tablas](#crear-tablas)
2. [Configuración de RLS](#configuración-de-rls)
3. [Ejecutar Tests](#ejecutar-tests)
4. [Troubleshooting](#troubleshooting)

---

## 🔧 Crear Tablas

### Opción A: Usando Supabase Dashboard (Recomendado para principiantes)

1. **Acceder a Supabase**:
   - Ve a https://supabase.com
   - Login a tu proyecto
   - Click en "SQL Editor" en el menu lateral

2. **Copiar y ejecutar SQL**:

```sql
-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  branch TEXT,
  avatar TEXT,
  password TEXT,
  "lastLogin" TIMESTAMP WITH TIME ZONE,
  "usageStats" JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: branches
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  budget NUMERIC,
  spent NUMERIC,
  "startDate" DATE,
  "endDate" DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  "assigneeId" UUID,
  "creatorId" UUID NOT NULL,
  "creatorName" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "targetRoles" JSONB,
  "projectId" UUID,
  rating INTEGER,
  feedback TEXT,
  "startDate" DATE,
  "startTime" TEXT,
  "dueDate" DATE NOT NULL,
  "offerEndDate" DATE,
  comments JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  "executionLogs" JSONB DEFAULT '[]'::jsonb,
  FOREIGN KEY ("assigneeId") REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY ("creatorId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("projectId") REFERENCES projects(id) ON DELETE SET NULL
);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks("assigneeId");
CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks("creatorId");
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks("projectId");
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

3. **Ejecutar**:
   - Click en "Run" o `Ctrl+Enter`
   - Deberías ver "Success" en cada CREATE TABLE

4. **Verificar Tablas**:
   - Ve a "Table Editor" en el menu lateral
   - Deberías ver: `users`, `branches`, `projects`, `tasks`

### Opción B: Usando pgAdmin (para usuarios avanzados)

1. Accede a pgAdmin desde Supabase Dashboard
2. Copia el SQL de arriba en una nueva query
3. Ejecuta

---

## 🔐 Configuración de RLS (Row Level Security)

### IMPORTANTE: Tipos de Configuración

#### Opción 1: RLS DESHABILITADO (Desarrollo Rápido)
**Recomendado para MVP/desarrollo**

1. Ve a "Authentication" → "Policies" en Supabase Dashboard
2. Para cada tabla (users, tasks, branches, projects):
   - Click en el nombre de la tabla
   - Toggle "Enable RLS" → **APAGADO**
3. Resultado: Cualquiera puede leer/escribir con la API Key

**⚠️ Nota**: No usar en producción. La API Key expuesta en código es un riesgo.

#### Opción 2: RLS HABILITADO (Producción)
**Recomendado para producción**

Si habilitas RLS, necesitarás Supabase Auth. Por ahora, saltamos esto ya que usamos anon key.

---

## 🧪 Ejecutar Tests

### Test 1: Validar Configuración (Settings.tsx)

1. **Inicia la app**: `npm run dev`
2. **Ve a Settings** (ícono de engranaje)
3. **Ingresa credenciales**:
   - **URL**: `https://[TU-PROYECTO].supabase.co`
   - **API Key**: Copia de Supabase Dashboard → Settings → API Keys → `anon` key
4. **Click "Vincular a la Red"**
5. **Resultado esperado**: 
   - ✅ Verde si todo está bien
   - ❌ Rojo con error específico si falta algo

### Test 2: Suite Completa (Consola del Navegador)

1. **Abre la consola**: F12 → Console
2. **Ejecuta**: `window.testSync()`
3. **Resultado esperado**:
```
✅ Configuración - Cloud activo
✅ Conectividad - Todas las tablas accesibles
✅ Estructura - Todas columnas presentes
✅ Sincronización - N items sincronizados
✅ Crear Item - test-branch-[timestamp]
✅ localStorage - Item presente
✅ Actualizar Item - Actualización exitosa
✅ Eliminar Item - Eliminación exitosa

📊 Total: 8 OK, 0 ADVERTENCIAS, 0 ERRORES
🎉 ¡TODAS LAS PRUEBAS PASARON!
```

### Test 3: End-to-End Manual

1. **Crea un usuario** desde UserManagement
   - Deberías verlo en Supabase Dashboard → Table Editor → `users`
   - Debería estar en localStorage también

2. **Crea una tarea** desde TaskList
   - Deberría estar en Supabase y localStorage

3. **Refresca la página** (F5)
   - Los datos deberían persistir (cargados desde Supabase)

4. **Edita una sucursal**
   - Click "Reintenttar Sincronización" en Settings
   - Deberías ver la sucursal en la lista de resultados

---

## 🔍 Troubleshooting

### ❌ Error: "Credenciales vacías"
**Causa**: No ingresaste URL o API Key en Settings

**Solución**: 
1. Ve a Settings
2. Ingresa URL y API Key
3. Click "Vincular a la Red"

---

### ❌ Error: "API Key inválida o sin permisos"
**Causa**: La API Key es incorrecta o no tiene permisos

**Solución**:
1. Copia la `anon` key correcta de:
   - Supabase Dashboard → Settings → API Keys → Copy `anon` public key
2. NO copies la `service_role` key (solo para servidor)
3. Vuelve a ingresar en Settings

---

### ❌ Error: "Tabla 'users' no existe"
**Causa**: No creaste las tablas en Supabase

**Solución**:
1. Ve a Supabase Dashboard → SQL Editor
2. Copia el SQL de [Crear Tablas](#crear-tablas)
3. Ejecuta
4. Vuelve a intentar test

---

### ❌ Error: "Error 403" (Forbidden)
**Causa**: RLS está habilitado pero no tienes política configurada

**Solución A** (Rápida - Desarrollo):
- Ve a Supabase Dashboard → Authentication → Policies
- Para cada tabla, toggle "Enable RLS" → APAGADO

**Solución B** (Segura - Producción):
- Habilita Supabase Auth
- Configura políticas RLS
- (Esto requiere cambios en el código de la app)

---

### ⚠️ Los datos se sincronizaron a localStorage pero NO a Supabase
**Causa**: Probablemente cloud está inactivo (config.active = false)

**Solución**:
1. Ve a Settings
2. Click "Vincular a la Red"
3. Espera mensaje de éxito verde
4. Haz cambios en la app nuevamente

---

### ⚠️ Refresco la página y los datos desaparecen
**Causa**: Los datos no se guardaron en Supabase (solo localStorage)

**Verificación**:
1. Abre Supabase Dashboard → Table Editor
2. Mira la tabla correspondiente
3. Si está vacía, la sincronización falló

**Solución**:
1. Copia el error de la consola (F12)
2. Verifica que Supabase tenga las tablas correctas
3. Valida que no hay errores de RLS
4. Ejecuta nuevamente `window.testSync()`

---

## 📊 Estructura de Datos Esperada

### users
```json
{
  "id": "uuid",
  "name": "Juan Pérez",
  "role": "GERENCIA",
  "branch": "Centro",
  "avatar": "url",
  "password": "hash",
  "lastLogin": "2026-04-19T15:00:00Z",
  "usageStats": {"week": 10, "month": 50, "year": 500}
}
```

### tasks
```json
{
  "id": "uuid",
  "title": "Auditar Caja",
  "description": "Revisar caja del día",
  "status": "PENDIENTE",
  "priority": "ALTA",
  "assigneeId": "uuid",
  "creatorId": "uuid",
  "createdAt": "2026-04-19T15:00:00Z",
  "dueDate": "2026-04-20",
  "comments": [],
  "attachments": [],
  "executionLogs": []
}
```

### branches
```json
{
  "id": "uuid",
  "name": "Sucursal Centro",
  "address": "Calle Principal 123"
}
```

### projects
```json
{
  "id": "uuid",
  "name": "Proyecto Implementación",
  "description": "Implementar nuevo sistema",
  "status": "EN_PROGRESO",
  "budget": 50000,
  "spent": 25000,
  "startDate": "2026-04-01",
  "endDate": "2026-06-01"
}
```

---

## ✅ Checklist Final

- [ ] Tablas creadas en Supabase (users, tasks, branches, projects)
- [ ] URL de Supabase copiada correctamente
- [ ] `anon` API Key copiada correctamente (NO service_role)
- [ ] RLS deshabilitado en las 4 tablas (para desarrollo)
- [ ] Settings: Vinculada a la Red (botón muestra ✅)
- [ ] `window.testSync()` ejecutado con éxito
- [ ] Test manual: crear usuario, verificar en Supabase Dashboard
- [ ] Test manual: refresco página, datos persisten

---

## 🎯 Próximos Pasos

1. **Desarrollo**: Continúa con las funcionalidades de negocio
2. **Producción**: Implementa Supabase Auth + RLS
3. **Optimización**: Refactor a `@supabase/supabase-js`
4. **Offline**: Implementa Service Workers para sincronización offline

---

**¿Preguntas?** Revisa [TROUBLESHOOTING](#troubleshooting) o ve a la consola y ejecuta `window.testSync()` para diagnóstico automático.
