
import { GoogleGenAI } from "@google/genai";
import { Project, Task, User, Branch } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateExecutiveReport = async (projects: Project[], tasks: Task[], users: User[], branches: Branch[]): Promise<string> => {
  try {
    const now = new Date();
    
    // Agrupar métricas por sucursal
    const branchMetrics = branches.map(b => {
      const branchUsers = users.filter(u => u.branch === b.name).map(u => u.id);
      const branchTasks = tasks.filter(t => branchUsers.includes(t.assigneeId));
      const completed = branchTasks.filter(t => t.status === 'COMPLETADO').length;
      const delayed = branchTasks.filter(t => t.status !== 'COMPLETADO' && t.dueDate && new Date(t.dueDate) < now).length;
      const efficiency = branchTasks.length ? Math.round((completed / branchTasks.length) * 100) : 0;
      
      return {
        name: b.name,
        total: branchTasks.length,
        completed,
        delayed,
        efficiency
      };
    });

    // Detectar personal con bajo desempeño
    const underperformers = users.map(u => {
      const userTasks = tasks.filter(t => t.assigneeId === u.id);
      const delayed = userTasks.filter(t => t.status !== 'COMPLETADO' && t.dueDate && new Date(t.dueDate) < now).length;
      return { name: u.name, branch: u.branch, delayed };
    }).filter(u => u.delayed > 0).sort((a, b) => b.delayed - a.delayed).slice(0, 5);

    const prompt = `
      Actúa como Auditor Senior de Farmacias Gigliotti. Genera un INFORME DE RENDIMIENTO INTER-SUCURSAL en Español HTML (solo el contenido del body, sin etiquetas html/body).
      
      DATOS PARA ANALIZAR:
      1. Comparativa por Sedes:
      ${branchMetrics.map(m => `- ${m.name}: ${m.efficiency}% efectividad, ${m.delayed} demoras de ${m.total} tareas.`).join('\n')}

      2. Top 5 Personal con Incumplimientos (Exposición):
      ${underperformers.map(u => `- ${u.name} (${u.branch}): ${u.delayed} tareas fuera de término.`).join('\n')}

      ESTRUCTURA DEL INFORME:
      - Título: AUDITORÍA EJECUTIVA DE EFECTIVIDAD OPERATIVA.
      - Sección 1: Ranking de Sedes (Identificar la mejor y la peor).
      - Sección 2: Análisis de Incumplimiento Individual (Exponer nombres y sucursales con métricas de demora).
      - Sección 3: Riesgo Operativo (Impacto anual proyectado si no se corrigen las demoras).
      - Sección 4: Plan de Acción Inmediato para Gerencia.

      Estilo: Directo, corporativo, punitivo cuando sea necesario para señalar ineficiencia, pero constructivo en la recomendación.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "<p>No se pudo generar el reporte de auditoría.</p>";
  } catch (error) {
    console.error("Error generating report:", error);
    return "<p>Error al conectar con el motor de auditoría IA.</p>";
  }
};
