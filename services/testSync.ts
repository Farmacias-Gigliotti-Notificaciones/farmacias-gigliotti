import { syncService } from './syncService';
import { User, Task, Branch } from '../types';

/**
 * Test Suite para validar sincronización Supabase
 * Uso: En consola del navegador ejecutar: window.testSync()
 */

export async function testFullSync() {
  console.clear();
  console.log('🧪 INICIANDO SUITE DE PRUEBAS DE SINCRONIZACIÓN');
  console.log('============================================\n');

  const results: any[] = [];

  try {
    // TEST 1: Validar Configuración
    console.log('📋 TEST 1: Validando configuración...');
    const config = syncService.getCloudConfig();
    
    if (!config.active) {
      console.warn('⚠️  Cloud no está activo. Asegúrate de configurar URL y API Key en Settings.');
      results.push({ test: 'Configuración', status: 'FAIL', message: 'Cloud inactivo' });
      return { success: false, results };
    }
    
    console.log('✅ Config activa:', { url: config.apiUrl?.substring(0, 30) + '...', keyPresent: !!config.apiKey });
    results.push({ test: 'Configuración', status: 'OK', message: 'Cloud activo' });

    // TEST 2: Validar Conectividad
    console.log('\n🔗 TEST 2: Validando conectividad con Supabase...');
    const connResult = await syncService.testConnection(config);
    
    if (!connResult.success) {
      console.error('❌ Error de conectividad:', connResult.message);
      results.push({ test: 'Conectividad', status: 'FAIL', message: connResult.message });
      return { success: false, results };
    }
    
    console.log('✅', connResult.message);
    results.push({ test: 'Conectividad', status: 'OK', message: 'Todas las tablas accesibles' });

    // TEST 3: Validar Estructura de Tablas
    console.log('\n🏗️  TEST 3: Validando estructura de tablas...');
    const schemaResult = await syncService.validateTablesSchema(config);
    
    if (!schemaResult.valid) {
      console.warn('⚠️  Problemas en esquema:', schemaResult.issues);
      results.push({ test: 'Estructura', status: 'WARN', message: schemaResult.issues.join('; ') });
    } else {
      console.log('✅ Estructura de todas las tablas válida');
      results.push({ test: 'Estructura', status: 'OK', message: 'Todas columnas presentes' });
    }

    // TEST 4: Sincronización de Datos Locales
    console.log('\n📤 TEST 4: Validando sincronización de datos locales...');
    const retryResult = await syncService.retrySync();
    
    console.log(`📊 Resultados de sincronización:`);
    retryResult.results.forEach((r: any) => {
      const status = r.errors === 0 ? '✅' : '⚠️ ';
      console.log(`${status} ${r.table}: ${r.synced} OK${r.errors > 0 ? ` / ${r.errors} errores` : ''}`);
    });
    
    results.push({ 
      test: 'Sincronización', 
      status: retryResult.totalErrors === 0 ? 'OK' : 'WARN', 
      message: `${retryResult.totalSynced} items sincronizados, ${retryResult.totalErrors} errores`
    });

    // TEST 5: Crear Item de Prueba
    console.log('\n✏️  TEST 5: Creando item de prueba...');
    const testBranch: Branch = {
      id: `test-branch-${Date.now()}`,
      name: `Sucursal Test ${new Date().toLocaleTimeString()}`,
      address: 'Calle de Prueba 123'
    };

    const createResult = await syncService.createItem('branches', testBranch);
    
    if (!createResult) {
      console.error('❌ Error creando item de prueba');
      results.push({ test: 'Crear Item', status: 'FAIL', message: 'No se pudo crear' });
    } else {
      console.log('✅ Item de prueba creado:', testBranch.id);
      results.push({ test: 'Crear Item', status: 'OK', message: testBranch.id });

      // TEST 6: Validar Item en localStorage
      console.log('\n💾 TEST 6: Validando item en localStorage...');
      const storedBranches = JSON.parse(localStorage.getItem('farmacia_branches_v2') || '[]');
      const foundLocal = storedBranches.some((b: any) => b.id === testBranch.id);
      
      if (foundLocal) {
        console.log('✅ Item encontrado en localStorage');
        results.push({ test: 'localStorage', status: 'OK', message: 'Item presente' });
      } else {
        console.warn('⚠️  Item NO encontrado en localStorage (podría ser normal si no se guardó aún)');
        results.push({ test: 'localStorage', status: 'WARN', message: 'Item no presente' });
      }

      // TEST 7: Actualizar Item
      console.log('\n✏️  TEST 7: Actualizando item de prueba...');
      const updatedBranch = { ...testBranch, address: 'Calle Actualizada 456' };
      const updateResult = await syncService.updateItem('branches', testBranch.id, updatedBranch);
      
      if (updateResult) {
        console.log('✅ Item actualizado correctamente');
        results.push({ test: 'Actualizar Item', status: 'OK', message: 'Actualización exitosa' });
      } else {
        console.error('❌ Error actualizando item');
        results.push({ test: 'Actualizar Item', status: 'FAIL', message: 'Fallo en actualización' });
      }

      // TEST 8: Eliminar Item
      console.log('\n🗑️  TEST 8: Eliminando item de prueba...');
      const deleteResult = await syncService.deleteItem('branches', testBranch.id);
      
      if (deleteResult) {
        console.log('✅ Item eliminado correctamente');
        results.push({ test: 'Eliminar Item', status: 'OK', message: 'Eliminación exitosa' });
      } else {
        console.error('❌ Error eliminando item');
        results.push({ test: 'Eliminar Item', status: 'FAIL', message: 'Fallo en eliminación' });
      }
    }

  } catch (e) {
    console.error('❌ Error inesperado:', e);
    results.push({ test: 'Suite', status: 'ERROR', message: String(e) });
  }

  // RESUMEN FINAL
  console.log('\n============================================');
  console.log('📈 RESUMEN DE PRUEBAS');
  console.log('============================================\n');
  
  const okCount = results.filter(r => r.status === 'OK').length;
  const warnCount = results.filter(r => r.status === 'WARN').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  
  results.forEach(r => {
    const icon = r.status === 'OK' ? '✅' : r.status === 'WARN' ? '⚠️ ' : '❌';
    console.log(`${icon} ${r.test.padEnd(20)} - ${r.message}`);
  });

  console.log(`\n📊 Total: ${okCount} OK, ${warnCount} ADVERTENCIAS, ${failCount} ERRORES`);
  
  const allGood = failCount === 0;
  console.log(`\n${allGood ? '🎉 ¡TODAS LAS PRUEBAS PASARON!' : '⚠️  REVISA LOS ERRORES ARRIBA'}\n`);

  return { success: allGood, results, summary: { ok: okCount, warn: warnCount, fail: failCount } };
}

// Exportar para consola global
if (typeof window !== 'undefined') {
  (window as any).testSync = testFullSync;
  console.log('💡 Función de prueba disponible: window.testSync()');
}

export default testFullSync;
