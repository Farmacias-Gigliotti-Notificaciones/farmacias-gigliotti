# 🚀 Gestión Farmacia Gigliotti - Versión Repositorio

Esta versión está optimizada para ser alojada en **GitHub**.

## 🛠️ Cómo subir a GitHub (Tu primera vez)

1. **Crea un repositorio nuevo** en tu cuenta de GitHub (ej: `gestion-gigliotti`).
2. Abre una terminal en esta carpeta y ejecuta:
   ```bash
   git init
   git add .
   git commit -m "Migración a entorno GitHub"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```

## 🌐 Despliegue Automático
Una vez que subas el código, ve a la pestaña **Actions** en tu GitHub. Verás que se está "construyendo" la web. 
Al terminar:
1. Ve a **Settings > Pages**.
2. En "Build and deployment", asegúrate de que diga **"GitHub Actions"**.
3. ¡Listo! Tu web estará en `https://TU_USUARIO.github.io/TU_REPOSITORIO/`.

## 📋 Variables de Entorno
Para que la IA funcione en GitHub, debes ir a **Settings > Secrets and variables > Actions** y añadir un "New repository secret" llamado `API_KEY` con tu clave de Gemini.
