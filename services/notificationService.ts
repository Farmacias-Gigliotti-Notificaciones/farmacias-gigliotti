import { Task, TaskStatus } from '../types';

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  send(title: string, body: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification(title, {
      body,
      icon: '/farmacias-gigliotti/logo_gigliotti.png',
    });
    n.onclick = () => window.focus();
    setTimeout(() => n.close(), 8000);
  },

  checkOverdue(tasks: Task[], userId: string, userName: string) {
    const key = `notified_overdue_${userId}`;
    const notified = new Set<string>(JSON.parse(localStorage.getItem(key) || '[]'));
    const today = new Date().toISOString().split('T')[0];

    const overdue = tasks.filter(t =>
      t.assigneeId === userId &&
      t.dueDate && t.dueDate < today &&
      t.status !== TaskStatus.COMPLETADO &&
      !notified.has(t.id)
    );

    if (overdue.length > 0) {
      this.send(
        `⚠️ Tareas vencidas — ${userName}`,
        `Tenés ${overdue.length} tarea${overdue.length > 1 ? 's' : ''} vencida${overdue.length > 1 ? 's' : ''}: ${overdue[0].title}${overdue.length > 1 ? ' y más...' : ''}`
      );
      overdue.forEach(t => notified.add(t.id));
      localStorage.setItem(key, JSON.stringify(Array.from(notified)));
    }
  },

  checkNewAssignments(tasks: Task[], userId: string) {
    const key = `seen_tasks_${userId}`;
    const seen = new Set<string>(JSON.parse(localStorage.getItem(key) || '[]'));
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    tasks
      .filter(t =>
        t.assigneeId === userId &&
        t.status === TaskStatus.PENDIENTE &&
        t.createdAt >= tenMinAgo &&
        !seen.has(t.id)
      )
      .forEach(t => {
        this.send(`📋 Nueva tarea asignada`, `${t.title} — Prioridad: ${t.priority}`);
        seen.add(t.id);
      });

    tasks.filter(t => t.assigneeId === userId).forEach(t => seen.add(t.id));
    localStorage.setItem(key, JSON.stringify(Array.from(seen)));
  },
};
