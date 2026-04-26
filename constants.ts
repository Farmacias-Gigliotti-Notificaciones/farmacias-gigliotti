
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
  { id: '660e8400-e29b-41d4-a716-446655440001', name: 'Casa Central', address: 'Av. Principal 100' },
  { id: '660e8400-e29b-41d4-a716-446655440002', name: 'Sucursal Norte', address: 'Calle Norte 45' },
  { id: '660e8400-e29b-41d4-a716-446655440003', name: 'Sucursal Sur', address: 'Ruta Sur Km 10' },
  { id: '660e8400-e29b-41d4-a716-446655440004', name: 'Global', address: 'Oficina Virtual' },
];

export const MOCK_USERS: User[] = [
  { 
    id: '550e8400-e29b-41d4-a716-446655440000', name: 'admin', role: UserRole.ADMIN, branch: 'Global', avatar: 'https://picsum.photos/id/100/100/100', password: 'admin123',
    lastLogin: null, usageStats: { week: 0, month: 0, year: 0 }
  },
  { 
    id: '550e8400-e29b-41d4-a716-446655440001', name: 'Ana Lopez', role: UserRole.USUARIO, branch: 'Sucursal Norte', avatar: 'https://picsum.photos/id/101/100/100', password: '1234',
    lastLogin: `${today}T09:00:00`, usageStats: { week: 35, month: 140, year: 1200 }
  },
  { 
    id: '550e8400-e29b-41d4-a716-446655440002', name: 'Carlos Ruiz', role: UserRole.ENCARGADO, branch: 'Sucursal Norte', avatar: 'https://picsum.photos/id/102/100/100', password: '1234',
    lastLogin: `${today}T08:30:00`, usageStats: { week: 42, month: 165, year: 1500 }
  },
  { 
    id: '550e8400-e29b-41d4-a716-446655440003', name: 'Elena Gomez', role: UserRole.SUPERVISOR, branch: 'Casa Central', avatar: 'https://picsum.photos/id/103/100/100', password: '1234',
    lastLogin: `${yesterday}T18:00:00`, usageStats: { week: 28, month: 110, year: 980 }
  },
  { 
    id: '550e8400-e29b-41d4-a716-446655440004', name: 'Roberto Diaz', role: UserRole.GERENCIA, branch: 'Casa Central', avatar: 'https://picsum.photos/id/104/100/100', password: '1234',
    lastLogin: `${today}T10:15:00`, usageStats: { week: 15, month: 60, year: 700 }
  },
  { 
    id: '550e8400-e29b-41d4-a716-446655440005', name: 'Sofia Marti', role: UserRole.SOCIO, branch: 'Global', avatar: 'https://picsum.photos/id/105/100/100', password: '1234',
    lastLogin: `${lastWeek}T14:00:00`, usageStats: { week: 5, month: 20, year: 250 }
  },
  { 
    id: '550e8400-e29b-41d4-a716-446655440006', name: 'Laura RRHH', role: UserRole.RRHH, branch: 'Casa Central', avatar: 'https://picsum.photos/id/106/100/100', password: '1234',
    lastLogin: `${today}T08:00:00`, usageStats: { week: 40, month: 160, year: 1000 }
  },
  { 
    id: '550e8400-e29b-41d4-a716-446655440007', name: 'Juan Pérez', role: UserRole.USUARIO, branch: 'Sucursal Norte', avatar: 'https://picsum.photos/id/64/100/100', password: '1234',
    lastLogin: null, usageStats: { week: 0, month: 0, year: 0 }
  },
  { 
    id: '550e8400-e29b-41d4-a716-446655440008', name: 'María García', role: UserRole.USUARIO, branch: 'Sucursal Norte', avatar: 'https://picsum.photos/id/65/100/100', password: '1234',
    lastLogin: null, usageStats: { week: 0, month: 0, year: 0 }
  },
  { 
    id: '550e8400-e29b-41d4-a716-446655440009', name: 'Ricardo Torres', role: UserRole.ENCARGADO, branch: 'Sucursal Norte', avatar: 'https://picsum.photos/id/66/100/100', password: '1234',
    lastLogin: null, usageStats: { week: 0, month: 0, year: 0 }
  },
  { 
    id: '550e8400-e29b-41d4-a716-44665544000a', name: 'Silvia Pardo', role: UserRole.ENCARGADO, branch: 'Sucursal Norte', avatar: 'https://picsum.photos/id/67/100/100', password: '1234',
    lastLogin: null, usageStats: { week: 0, month: 0, year: 0 }
  },
];

export const MOCK_PROJECTS: Project[] = [
  { id: '770e8400-e29b-41d4-a716-446655440001', name: 'Migración Cloud', description: 'Migración de servidores on-premise a AWS', status: 'ACTIVO', budget: 50000, spent: 32000, startDate: lastWeek, endDate: nextMonth },
  { id: '770e8400-e29b-41d4-a716-446655440002', name: 'App Móvil v2', description: 'Rediseño completo de la app de clientes', status: 'ACTIVO', budget: 120000, spent: 45000, startDate: today, endDate: getRelativeDate(90) },
  { id: '770e8400-e29b-41d4-a716-446655440003', name: 'Auditoría Q3', description: 'Auditoría interna de procesos', status: 'FINALIZADO', budget: 15000, spent: 14800, startDate: getRelativeDate(-60), endDate: getRelativeDate(-30) },
];

export const MOCK_TASKS: Task[] = [
  { 
    id: '880e8400-e29b-41d4-a716-446655440001', title: 'Configurar VPC', description: 'Establecer subredes y security groups', 
    status: TaskStatus.COMPLETADO, priority: TaskPriority.ALTA, 
    assigneeId: '550e8400-e29b-41d4-a716-446655440001', creatorId: '550e8400-e29b-41d4-a716-446655440004', 
    creatorName: 'Roberto Diaz', createdAt: lastWeek, targetRoles: [UserRole.USUARIO], executionLogs: [],
    projectId: '770e8400-e29b-41d4-a716-446655440001', rating: 4, feedback: 'Buen trabajo, pero documentación escasa.', 
    startDate: lastWeek, dueDate: yesterday, comments: [],
    recurrence: 'NINGUNA', attachments: [],
    allowedChatRoles: [UserRole.ENCARGADO, UserRole.SUPERVISOR, UserRole.GERENCIA]
  },
  { 
    id: '880e8400-e29b-41d4-a716-446655440002', title: 'Diseñar UI Login', description: 'Mockups en Figma para pantalla de acceso', 
    status: TaskStatus.REVISION, priority: TaskPriority.MEDIA, 
    assigneeId: '550e8400-e29b-41d4-a716-446655440001', creatorId: '550e8400-e29b-41d4-a716-446655440003', 
    creatorName: 'Elena Gomez', createdAt: today, targetRoles: [UserRole.USUARIO], executionLogs: [],
    projectId: '770e8400-e29b-41d4-a716-446655440002', 
    startDate: today, dueDate: getRelativeDate(7), 
    comments: [
      { id: '990e8400-e29b-41d4-a716-446655440001', userId: '550e8400-e29b-41d4-a716-446655440001', userName: 'Ana Lopez', text: '¿Debemos incluir login social?', timestamp: `${today}T10:00:00` },
      { id: '990e8400-e29b-41d4-a716-446655440002', userId: '550e8400-e29b-41d4-a716-446655440003', userName: 'Elena Gomez', text: 'Sí, Google y Microsoft.', timestamp: `${today}T14:00:00` }
    ],
    recurrence: 'NINGUNA', attachments: [],
    allowedChatRoles: [UserRole.USUARIO, UserRole.ENCARGADO, UserRole.SUPERVISOR]
  },
  { 
    id: '880e8400-e29b-41d4-a716-446655440003', title: 'API Gateway Setup', description: 'Configurar endpoints principales', 
    status: TaskStatus.EN_PROCESO, priority: TaskPriority.CRITICA, 
    assigneeId: '550e8400-e29b-41d4-a716-446655440002', creatorId: '550e8400-e29b-41d4-a716-446655440004', 
    creatorName: 'Roberto Diaz', createdAt: yesterday, targetRoles: [UserRole.ENCARGADO], executionLogs: [],
    projectId: '770e8400-e29b-41d4-a716-446655440001', 
    startDate: yesterday, dueDate: getRelativeDate(7), comments: [],
    recurrence: 'SEMANAL', attachments: [],
    allowedChatRoles: [UserRole.ENCARGADO, UserRole.GERENCIA, UserRole.SOCIO]
  },
  { 
    id: '880e8400-e29b-41d4-a716-446655440004', title: 'Revisión de Stock Norte', description: 'Verificar inventario de medicamentos controlados.', 
    status: TaskStatus.PENDIENTE, priority: TaskPriority.ALTA, 
    assigneeId: '550e8400-e29b-41d4-a716-446655440007', creatorId: '550e8400-e29b-41d4-a716-446655440009', 
    creatorName: 'Ricardo Torres', createdAt: today, targetRoles: [UserRole.USUARIO], executionLogs: [],
    startDate: today, dueDate: tomorrow, comments: [],
    recurrence: 'DIARIA', attachments: [],
    allowedChatRoles: [UserRole.USUARIO, UserRole.ENCARGADO]
  },
  { 
    id: '880e8400-e29b-41d4-a716-446655440005', title: 'Limpieza de Estanterías', description: 'Mantenimiento preventivo de área de ventas.', 
    status: TaskStatus.PENDIENTE, priority: TaskPriority.BAJA, 
    assigneeId: '550e8400-e29b-41d4-a716-446655440008', creatorId: '550e8400-e29b-41d4-a716-44665544000a', 
    creatorName: 'Silvia Pardo', createdAt: today, targetRoles: [UserRole.USUARIO], executionLogs: [],
    startDate: today, dueDate: tomorrow, comments: [],
    recurrence: 'SEMANAL', attachments: [],
    allowedChatRoles: [UserRole.USUARIO, UserRole.ENCARGADO]
  },
];