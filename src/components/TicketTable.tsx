import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { statuses, priorities } from '../data/tickets';
import type { Ticket } from '../data/tickets';

interface TicketTableProps {
  tickets: Ticket[];
  basePath: string;
  showClient?: boolean;
  showAgent?: boolean;
}

function TicketTable({ tickets, basePath, showClient, showAgent }: TicketTableProps) {
  const [status, setStatus] = useState('Todos');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');

  const visible = tickets
    .filter((t) => status === 'Todos' || t.status === status)
    .filter((t) => !priority || t.priority === priority)
    .filter((t) => (t.id + t.subject + t.client + t.agent).toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="table-box">
        <div className="table-tools">
          <div className="tabs">
            {['Todos', ...statuses].map((s) => (
              <button key={s} className={status === s ? 'tab tab-active' : 'tab'} onClick={() => setStatus(s)}>
                {s}
              </button>
            ))}
          </div>
          <div className="tabs">
            <select className="table-search" aria-label="Filtrar por prioridad" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">Toda prioridad</option>
              {priorities.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <input
              className="table-search"
              type="search"
              aria-label="Buscar ticket"
              placeholder="Buscar ticket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            <strong>Sin resultados</strong>
            No hay tickets que coincidan con esa búsqueda.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Asunto</th>
                {showClient && <th>Cliente</th>}
                <th>Categoría</th>
                <th>Prioridad</th>
                <th>Estado</th>
                {showAgent && <th>Agente</th>}
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id}>
                  <td><Link to={`${basePath}/${t.id}`}>#{t.id}</Link></td>
                  <td>{t.subject}</td>
                  {showClient && <td>{t.client}</td>}
                  <td>{t.category}</td>
                  <td>{t.priority}</td>
                  <td><StatusBadge status={t.status} /></td>
                  {showAgent && <td>{t.agent}</td>}
                  <td>{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="table-foot">Mostrando {visible.length} de {tickets.length} tickets</p>
    </>
  );
}

export default TicketTable;
