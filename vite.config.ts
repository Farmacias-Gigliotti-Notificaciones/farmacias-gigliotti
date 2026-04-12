import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 'base' asegura que los archivos se carguen bien en github.io/tu-repositorio/
  base: './',
  define: {
    // Definimos explícitamente solo la variable necesaria para evitar el error de "Path"
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});