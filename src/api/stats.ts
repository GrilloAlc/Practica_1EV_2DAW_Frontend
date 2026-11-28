import { api, USE_FAKE_DATA } from './client';
import { fakeProperties, fakeTickets, fakeUsers } from '../data/fakeData';
import type { Page } from '../types';

// GET /api/stats/dashboard (ADMIN): usuarios y casas activos e inactivos, y la actividad reciente
export interface Dashboard {
  users: { active: number; inactive: number };
  properties: { active: number; inactive: number };
  sinAsignar: number;
  recentActivity: {
    messages: {
      _id: string;
      body: string;
      createdAt: string;
      author: { _id: string; name: string; role?: string } | null;
      ticket: { _id: string; code: string; subject: string } | null;
    }[];
  };
}

// GET /api/stats/tickets/by-agent (ADMIN): carga de trabajo de cada agente
export interface AgentLoad {
  agentId: string;
  name: string;
  email: string;
  total: number;
  abiertos: number;
  resueltos: number;
  cerrados: number;
}

// Rango de fechas de las estadísticas (fechas del calendario, "2026-11-01"). El backend lo aplica a la
// fecha de creación de tickets y casas
export interface StatsRange {
  from?: string;
  to?: string;
}

// Convierte el rango del calendario en la hora exacta: desde las 00:00 del primer día hasta las 23:59 del último
export function rangeParams(range: StatsRange = {}) {
  return {
    from: range.from ? new Date(range.from + 'T00:00:00').toISOString() : undefined,
    to: range.to ? new Date(range.to + 'T23:59:59.999').toISOString() : undefined,
  };
}

// GET /api/stats/properties (ADMIN): casas activas, inactivas, vendidas, alquiladas y reservadas
export interface PropertyStats {
  active: number;
  inactive: number;
  vendidas: number;
  alquiladas: number;
  reservadas: number;
}

// GET /api/stats/users (ADMIN): usuarios por rol, activos e inactivos
export interface UserStats {
  roles: { _id: string; total: number }[];
  active: number;
  inactive: number;
}

export async function getPropertyStats(range: StatsRange = {}): Promise<PropertyStats> {
  if (USE_FAKE_DATA) {
    const count = (status: string) => fakeProperties.filter((p) => p.status === status).length;
    return {
      active: fakeProperties.filter((p) => p.isActive).length,
      inactive: fakeProperties.filter((p) => !p.isActive).length,
      vendidas: count('Vendida'),
      alquiladas: count('Alquilada'),
      reservadas: count('Reservada'),
    };
  }

  return api.get('/stats/properties', rangeParams(range));
}

export async function getUserStats(): Promise<UserStats> {
  if (USE_FAKE_DATA) {
    const roles = ['CLIENTE', 'AGENTE', 'ADMIN'].map((r) => ({ _id: r, total: fakeUsers.filter((u) => u.role === r).length }));
    return { roles, active: fakeUsers.filter((u) => u.isActive).length, inactive: fakeUsers.filter((u) => !u.isActive).length };
  }

  return api.get('/stats/users');
}

// GET /api/ticket-history (ADMIN): todos los cambios de estado, del más reciente al más antiguo, paginados.
// Cada cambio llega con su ticket completo y con quién lo hizo
export interface ActivityEntry {
  _id: string;
  oldStatus: string | null;
  newStatus: string;
  changedAt?: string;
  createdAt?: string;
  ticket: { _id: string; code: string; subject: string } | null;
  changedBy: { _id: string; name: string; role?: string } | null;
}

export async function getActivityPage(page = 1, limit = 25): Promise<Page<ActivityEntry>> {
  if (USE_FAKE_DATA) {
    return { data: [], pagesData: { page: 1, limit, total: 0, totalPages: 1 } };
  }

  return api.get('/ticket-history', { page, limit });
}

export async function getDashboard(range: StatsRange = {}): Promise<Dashboard> {
  if (USE_FAKE_DATA) {
    return {
      users: { active: fakeUsers.filter((u) => u.isActive).length, inactive: fakeUsers.filter((u) => !u.isActive).length },
      properties: { active: fakeProperties.filter((p) => p.isActive).length, inactive: fakeProperties.filter((p) => !p.isActive).length },
      sinAsignar: fakeTickets.filter((t) => !t.agent).length,
      recentActivity: { messages: [] },
    };
  }

  return api.get('/stats/dashboard', rangeParams(range));
}

export async function getTicketsByAgent(range: StatsRange = {}): Promise<AgentLoad[]> {
  if (USE_FAKE_DATA) return [];

  return api.get('/stats/tickets/by-agent', rangeParams(range));
}
