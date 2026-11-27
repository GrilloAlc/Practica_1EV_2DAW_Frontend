import { api, USE_FAKE_DATA } from './client';
import { fakeProperties, fakeTickets, fakeUsers } from '../data/fakeData';

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

export async function getDashboard(): Promise<Dashboard> {
  if (USE_FAKE_DATA) {
    return {
      users: { active: fakeUsers.filter((u) => u.isActive).length, inactive: fakeUsers.filter((u) => !u.isActive).length },
      properties: { active: fakeProperties.filter((p) => p.isActive).length, inactive: fakeProperties.filter((p) => !p.isActive).length },
      sinAsignar: fakeTickets.filter((t) => !t.agent).length,
      recentActivity: { messages: [] },
    };
  }

  return api.get('/stats/dashboard');
}

export async function getTicketsByAgent(): Promise<AgentLoad[]> {
  if (USE_FAKE_DATA) return [];

  const list = await api.get('/stats/tickets/by-agent');
  return Array.isArray(list) ? list : [];
}
