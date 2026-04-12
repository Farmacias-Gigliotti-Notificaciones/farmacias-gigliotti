
import { Branch, Project, Task, TaskPriority, TaskStatus, User, UserRole } from "./types";

const getRelativeDate = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
}

const today = getRelativeDate(0);
const tomorrow = getRelativeDate(1);
const yesterday = getRelativeDate(-1);
const lastWeek = getRelativeDate(-7);
const nextMonth = getRelativeDate(30);

export const MOCK_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Casa Central', address: 'Av. Principal 100' },
  { id: 'b2', name: 'Sucursal Norte', address: 'Calle Norte 45' },
  { id: 'b3', name: 'Sucursal Sur', address: 'Ruta Sur Km 10' },
  { id: 'b4', name: 'Global', address: 'Oficina Virtual' },
];

export const MOCK_USERS: User[] = [
  { 
    id: 'u1', name: 'Ana Lopez', role: UserRole.USUARIO, branch: 'Sucursal Norte', avatar: 'https://picsum.photos/id/101/100/100', password: '1234',
    lastLogin: `${today}T09:00:00`, usageStats: { week: 35, month: 140, year: 1200 }
  },
  { 
    id: 'u2', name: 'Carlos Ruiz', role: UserRole.ENCARGADO, branch: 'Sucursal Norte', avatar: 'https://picsum.photos/id/102/100/100', password: '1234',
    lastLogin: `${today}T08:30:00`, usageStats: { week: 42, month: 165, year: 1500 }
  },
  { 
    id: 'u3', name: 'Elena Gomez', role: UserRole.SUPERVISOR, branch: 'Casa Central', avatar: 'https://picsum.photos/id/103/100/100', password: '1234',
    lastLogin: `${yesterday}T18:00:00`, usageStats: { week: 28, month: 110, year: 980 }
  },
  { 
    id: 'u4', name: 'Roberto Diaz', role: UserRole.GERENCIA, branch: 'Casa Central', avatar: 'https://picsum.photos/id/104/100/100', password: '1234',
    lastLogin: `${today}T10:15:00`, usageStats: { week: 15, month: 60, year: 700 }
  },
  { 
    id: 'u5', name: 'Sofia Marti', role: UserRole.SOCIO, branch: 'Global', avatar: 'https://picsum.photos/id/105/100/100', password: '1234',
    lastLogin: `${lastWeek}T14:00:00`, usageStats: { week: 5, month: 20, year: 250 }
  },
  { 
    id: 'u6', name: 'Laura RRHH', role: UserRole.RRHH, branch: 'Casa Central', avatar: 'https://picsum.photos/id/106/100/100', password: '1234',
    lastLogin: `${today}T08:00:00`, usageStats: { week: 40, month: 160, year: 1000 }
  },
  // NUEVOS USUARIOS DE PRUEBA - SUCURSAL NORTE
  { 
    id: 'u7', name: 'Juan Pérez', role: UserRole.USUARIO, branch: 'Sucursal Norte', avatar: 'https://picsum.photos/id/64/100/100', password: '1234',
    lastLogin: null, usageStats: { week: 0, month: 0, year: 0 }
  },
  { 
    id: 'u8', name: 'María García', role: UserRole.USUARIO, branch: 'Sucursal Norte', avatar: 'https://picsum.photos/id/65/100/100', password: '1234',
    lastLogin: null, usageStats: { week: 0, month: 0, year: 0 }
  },
  { 
    id: 'u9', name: 'Ricardo Torres', role: UserRole.ENCARGADO, branch: 'Sucursal Norte', avatar: 'https://picsum.photos/id/66/100/100', password: '1234',
    lastLogin: null, usageStats: { week: 0, month: 0, year: 0 }
  },
  { 
    id: 'u10', name: 'Silvia Pardo', role: UserRole.ENCARGADO, branch: 'Sucursal Norte', avatar: 'https://picsum.photos/id/67/100/100', password: '1234',
    lastLogin: null, usageStats: { week: 0, month: 0, year: 0 }
  },
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Migración Cloud', description: 'Migración de servidores on-premise a AWS', status: 'ACTIVO', budget: 50000, spent: 32000, startDate: lastWeek, endDate: nextMonth },
  { id: 'p2', name: 'App Móvil v2', description: 'Rediseño completo de la app de clientes', status: 'ACTIVO', budget: 120000, spent: 45000, startDate: today, endDate: getRelativeDate(90) },
  { id: 'p3', name: 'Auditoría Q3', description: 'Auditoría interna de procesos', status: 'FINALIZADO', budget: 15000, spent: 14800, startDate: getRelativeDate(-60), endDate: getRelativeDate(-30) },
];

export const MOCK_TASKS: Task[] = [
  { 
    id: 't1', title: 'Configurar VPC', description: 'Establecer subredes y security groups', 
    status: TaskStatus.COMPLETADO, priority: TaskPriority.ALTA, 
    assigneeId: 'u1', creatorId: 'u4', 
    // Added missing audit properties
    creatorName: 'Roberto Diaz', createdAt: lastWeek, targetRoles: [UserRole.USUARIO], executionLogs: [],
    projectId: 'p1', rating: 4, feedback: 'Buen trabajo, pero documentación escasa.', 
    startDate: lastWeek, dueDate: yesterday, comments: [],
    recurrence: 'NINGUNA', attachments: [],
    allowedChatRoles: [UserRole.ENCARGADO, UserRole.SUPERVISOR, UserRole.GERENCIA]
  },
  { 
    id: 't2', title: 'Diseñar UI Login', description: 'Mockups en Figma para pantalla de acceso', 
    status: TaskStatus.REVISION, priority: TaskPriority.MEDIA, 
    assigneeId: 'u1', creatorId: 'u3', 
    // Added missing audit properties
    creatorName: 'Elena Gomez', createdAt: today, targetRoles: [UserRole.USUARIO], executionLogs: [],
    projectId: 'p2', 
    startDate: today, dueDate: getRelativeDate(7), 
    comments: [
      { id: 'c1', userId: 'u1', userName: 'Ana Lopez', text: '¿Debemos incluir login social?', timestamp: `${today}T10:00:00` },
      { id: 'c2', userId: 'u3', userName: 'Elena Gomez', text: 'Sí, Google y Microsoft.', timestamp: `${today}T14:00:00` }
    ],
    recurrence: 'NINGUNA', attachments: [],
    allowedChatRoles: [UserRole.USUARIO, UserRole.ENCARGADO, UserRole.SUPERVISOR]
  },
  { 
    id: 't3', title: 'API Gateway Setup', description: 'Configurar endpoints principales', 
    status: TaskStatus.EN_PROCESO, priority: TaskPriority.CRITICA, 
    assigneeId: 'u2', creatorId: 'u4', 
    // Added missing audit properties
    creatorName: 'Roberto Diaz', createdAt: yesterday, targetRoles: [UserRole.ENCARGADO], executionLogs: [],
    projectId: 'p1', 
    startDate: yesterday, dueDate: getRelativeDate(7), comments: [],
    recurrence: 'SEMANAL', attachments: [],
    allowedChatRoles: [UserRole.ENCARGADO, UserRole.GERENCIA, UserRole.SOCIO]
  },
  { 
    id: 't4', title: 'Revisión de Stock Norte', description: 'Verificar inventario de medicamentos controlados.', 
    status: TaskStatus.PENDIENTE, priority: TaskPriority.ALTA, 
    assigneeId: 'u7', creatorId: 'u9', 
    // Added missing audit properties
    creatorName: 'Ricardo Torres', createdAt: today, targetRoles: [UserRole.USUARIO], executionLogs: [],
    startDate: today, dueDate: tomorrow, comments: [],
    recurrence: 'DIARIA', attachments: [],
    allowedChatRoles: [UserRole.USUARIO, UserRole.ENCARGADO]
  },
  { 
    id: 't5', title: 'Limpieza de Estanterías', description: 'Mantenimiento preventivo de área de ventas.', 
    status: TaskStatus.PENDIENTE, priority: TaskPriority.BAJA, 
    assigneeId: 'u8', creatorId: 'u10', 
    // Added missing audit properties
    creatorName: 'Silvia Pardo', createdAt: today, targetRoles: [UserRole.USUARIO], executionLogs: [],
    startDate: today, dueDate: tomorrow, comments: [],
    recurrence: 'SEMANAL', attachments: [],
    allowedChatRoles: [UserRole.USUARIO, UserRole.ENCARGADO]
  },
];