@echo off
title Servidor Farmacia Gigliotti - REPARACION
setlocal

echo ==========================================
echo   REPARANDO SISTEMA GESTION GIGLIOTTI
echo ==========================================
echo.

:: Limpieza de cache de Vite (Solucion pantalla blanca)
if exist "node_modules\.vite" (
    echo [1/2] Limpiando cache de optimizacion...
    rd /s /q "node_modules\.vite"
)

echo [2/2] Iniciando plataforma en puerto 3000...
echo.
echo IMPORTANTE: Si ve la pantalla blanca, presione CTRL + F5 en el navegador.
echo.

:: Ejecutar Vite directamente
call npx vite --host --port 3000 --force

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo iniciar. Pruebe ejecutar: npm install
    pause
)

endlocal