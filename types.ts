
export enum UserRole {
  ADMIN = 'ADMIN',
  USUARIO = 'USUARIO',
  ENCARGADO = 'ENCARGADO',
  SUPERVISOR = 'SUPERVISOR',
  GERENCIA = 'GERENCIA',
  SOCIO = 'SOCIO',
  RRHH = 'RRHH',
  CAJERO = 'CAJERO',
  AUDITORIA = 'AUDITORIA',
  ADMINISTRACION = 'ADMINISTRACION',
  TESORERIA = 'TESORERIA',
  DELIVERY = 'DELIVERY',
  MARKETING = 'MARKETING',
  COMPRAS = 'COMPRAS'
}

export enum TaskStatus {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  DEMORADO = 'DEMORADO',
  REVISION = 'REVISION',
  COMPLETADO = 'COMPLETADO'
}

export enum TaskPriority {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA'
}

export type RecurrenceType = 'NINGUNA' | 'HORA' | 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'ANUAL';

export interface Attachment {
  id: string;
  name: string;
  type: 'IMAGE' | 'DOCUMENT' | 'EXECUTABLE' | 'VIDEO';
  url: string;
  mimeType: string;
}

export interface ExecutionLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  action: string; // "OPEN_EXE", "VIEW_VIDEO", "STATUS_CHANGE", etc.
}

export interface Branch {
  id: string;
  name: string;
  address: string;
}

export interface UserUsageStats {
  week: number;
  month: number;
  year: number;
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  role: UserRole;
  branch?: string;
  avatar: string;
  password?: string;
  lastLogin?: string;
  usageStats?: UserUsageStats;
  profiles?: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  creatorId: string;
  creatorName: string; // Agregado para reportes
  createdAt: string; // ISO Date - Agregado para reportes
  targetRoles: UserRole[]; // Agregado para auditoría
  projectId?: string;
  rating?: number;
  feedback?: string;
  startDate: string;
  startTime?: string;
  dueDate: string;
  offerEndDate?: string;
  comments: Comment[];
  executionLogs: ExecutionLog[]; // Bitácora de ejecución central
  recurrence: RecurrenceType;
  recurrenceDays?: string[];
  recurrenceMonths?: string[];
  recurrenceHours?: string[];
  attachments: Attachment[];
  executableFile?: Attachment;
  allowedChatRoles: UserRole[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVO' | 'PAUSADO' | 'FINALIZADO' | 'DEMORADO';
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
}

export interface CloudConfig {
  apiUrl: string;
  apiKey: string;
  active: boolean;
}
