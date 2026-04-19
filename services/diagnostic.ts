/**
 * SCRIPT DE DIAGNÓSTICO PARA SUPABASE
 * Ejecutar en consola: window.runDiagnostic()
 * Identifica exactamente qué está fallando
 */

export async function runDiagnostic() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE SUPABASE...\n');

  const results: any[] = [];

  try {
    // 1. Verificar variables de entorno
    console.log('1️⃣  Verificando variables de entorno...');
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!envUrl) {
      console.error('❌ VITE_SUPABASE_URL no está definido en .env');
      results.push({ step: 'Env URL', status: 'FAIL', message: 'No VITE_SUPABASE_URL en .env' });
      return results;
    }
    if (!envKey) {
      console.error('❌ VITE_SUPABASE_ANON_KEY no está definido en .env');
      results.push({ step: 'Env Key', status: 'FAIL', message: 'No VITE_SUPABASE_ANON_KEY en .env' });
      return results;
    }

    console.log(`✅ URL: ${envUrl}`);
    console.log(`✅ Key: ${envKey.substring(0, 20)}...`);
    results.push({ step: 'Env Variables', status: 'OK', message: `URL y Key encontradas` });

    // 2. Verificar conectividad básica
    console.log('\n2️⃣  Verificando conectividad con Supabase...');
    const connRes = await fetch(`${envUrl}/rest/v1/`, {
      headers: {
        'apikey': envKey,
        'Authorization': `Bearer ${envKey}`,
        'Content-Type': 'application/json'
      },
      method: 'GET'
    });

    console.log(`Status: ${connRes.status} ${connRes.statusText}`);

    if (connRes.status === 401 || connRes.status === 403) {
      console.error('❌ ERROR 401/403: API Key inválida o sin permisos');
      results.push({ step: 'Conectividad', status: 'FAIL', message: `Error ${connRes.status}: API Key inválida` });
      return results;
    }

    if (!connRes.ok) {
      console.error(`❌ Error de conectividad: ${connRes.status}`);
      results.push({ step: 'Conectividad', status: 'FAIL', message: `Error ${connRes.status}` });
      return results;
    }

    console.log('✅ Conectividad OK');
    results.push({ step: 'Conectividad', status: 'OK', message: 'Conexión establecida' });

    // 3. Verificar que las tablas existan
    console.log('\n3️⃣  Verificando tablas...');
    const tables = ['users', 'tasks', 'branches', 'projects'];
    const tableStatus: any = {};

    for (const table of tables) {
      try {
        const res = await fetch(`${envUrl}/rest/v1/${table}?limit=1`, {
          headers: {
            'apikey': envKey,
            'Authorization': `Bearer ${envKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.status === 404) {
          console.error(`❌ Tabla "${table}" NO EXISTE en Supabase`);
          tableStatus[table] = 'NOT_FOUND';
        } else if (res.status === 401 || res.status === 403) {
          console.error(`❌ Tabla "${table}": Permiso denegado (RLS activado?)`);
          tableStatus[table] = 'PERMISSION_DENIED';
        } else if (res.ok) {
          console.log(`✅ Tabla "${table}" existe`);
          const data = await res.json();
          tableStatus[table] = `OK (${data.length} rows)`;
        } else {
          console.error(`❌ Tabla "${table}": Error ${res.status}`);
          tableStatus[table] = `ERROR_${res.status}`;
        }
      } catch (e) {
        console.error(`❌ Tabla "${table}": ${String(e)}`);
        tableStatus[table] = String(e);
      }
    }

    results.push({ step: 'Tablas', status: 'OK', data: tableStatus });

    // 4. Verificar RLS (Row Level Security)
    console.log('\n4️⃣  Verificando RLS...');
    const usersRes = await fetch(`${envUrl}/rest/v1/users?limit=1`, {
      headers: {
        'apikey': envKey,
        'Authorization': `Bearer ${envKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (usersRes.status === 403) {
      console.warn('⚠️  RLS probablemente está HABILITADO (devuelve 403)');
      console.warn('   💡 Solución: Ve a Supabase Dashboard → Tabla "users" → RLS → Desactiva para desarrollo');
      results.push({ step: 'RLS', status: 'WARN', message: 'RLS habilitado - desactiva para desarrollo' });
    } else {
      console.log('✅ RLS no es un problema');
      results.push({ step: 'RLS', status: 'OK', message: 'RLS no bloquea acceso' });
    }

    // 5. Intentar crear un item de prueba
    console.log('\n5️⃣  Intentando crear item de prueba...');
    const testId = 'test-' + Date.now();
    const testUser = {
      id: testId,
      name: 'Test User',
      role: 'USUARIO',
      avatar: 'default',
      branch: 'Test Branch'
    };

    const createRes = await fetch(`${envUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': envKey,
        'Authorization': `Bearer ${envKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(testUser)
    });

    console.log(`Status: ${createRes.status} ${createRes.statusText}`);

    if (createRes.ok) {
      console.log('✅ Item creado exitosamente');
      results.push({ step: 'Create Test', status: 'OK', message: `Item ${testId} creado` });

      // Intentar leerlo
      const readRes = await fetch(`${envUrl}/rest/v1/users?id=eq.${testId}`, {
        headers: {
          'apikey': envKey,
          'Authorization': `Bearer ${envKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (readRes.ok) {
        const data = await readRes.json();
        if (data.length > 0) {
          console.log('✅ Item leído exitosamente');
          results.push({ step: 'Read Test', status: 'OK', message: `Item recuperado` });

          // Limpiar: eliminar item de prueba
          await fetch(`${envUrl}/rest/v1/users?id=eq.${testId}`, {
            method: 'DELETE',
            headers: {
              'apikey': envKey,
              'Authorization': `Bearer ${envKey}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ Item de prueba eliminado');
        } else {
          console.error('❌ Item creado pero no se puede leer');
          results.push({ step: 'Read Test', status: 'FAIL', message: `Item no encontrado después de crear` });
        }
      } else {
        console.error(`❌ Error al leer item: ${readRes.status}`);
        results.push({ step: 'Read Test', status: 'FAIL', message: `Error ${readRes.status}` });
      }
    } else {
      const errText = await createRes.text();
      console.error(`❌ Error al crear: ${createRes.status}`);
      console.error(`Respuesta: ${errText}`);
      results.push({ step: 'Create Test', status: 'FAIL', message: `Error ${createRes.status}: ${errText}` });
    }

  } catch (e) {
    console.error('❌ ERROR GENERAL:', String(e));
    results.push({ step: 'General', status: 'FAIL', message: String(e) });
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DEL DIAGNÓSTICO:');
  console.log('='.repeat(60));
  results.forEach(r => {
    const icon = r.status === 'OK' ? '✅' : r.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} ${r.step}: ${r.message}`);
  });

  const hasErrors = results.some(r => r.status === 'FAIL');
  if (hasErrors) {
    console.log('\n🔴 HAY ERRORES. Revisa el mensaje arriba y sigue las soluciones propuestas.');
  } else {
    console.log('\n🟢 TODOS LOS TESTS PASARON. El problema está en otro lado.');
  }

  return results;
}

// Exponer globalmente
(window as any).runDiagnostic = runDiagnostic;
