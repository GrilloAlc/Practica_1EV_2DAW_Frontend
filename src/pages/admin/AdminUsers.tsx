import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { changeRole, getUsersPage, setUserActive } from '../../api/users';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/useAuth';
import { ROLES, formatNumber, roleLabels } from '../../utils/labels';
import { TableSkeleton } from '../../components/Skeleton';
import { useConfirm } from '../../components/useConfirm';
import type { Page, User } from '../../types';

const PER_PAGE = 20;

function AdminUsers() {
  const { user: me } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<{ key: string; page: Page<User> } | null>(null);
  const [changes, setChanges] = useState<Record<string, Partial<User>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState(searchParams.get('nombre') || '');
  const [confirm, confirmDialog] = useConfirm();

  const key = searchParams.toString();
  const role = searchParams.get('rol') || '';
  const page = Math.max(1, Math.floor(Number(searchParams.get('pagina'))) || 1);

  useEffect(() => {
    let current = true;
    getUsersPage({
      role: searchParams.get('rol') || undefined,
      name: searchParams.get('nombre') || undefined,
      page: Math.max(1, Math.floor(Number(searchParams.get('pagina'))) || 1),
      limit: PER_PAGE,
    }).then(
      (res) => {
        if (!current) return;
        setResult({ key: searchParams.toString(), page: res });
        setChanges({});
        setError('');
      },
      (err) => {
        if (current) setError(getErrorMessage(err));
      },
    );
    return () => {
      current = false;
    };
  }, [searchParams]);

  function changeUrl(values: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    for (const k in values) {
      if (values[k]) params.set(k, values[k]);
      else params.delete(k);
    }
    setSearchParams(params, { replace: true });
  }

  // PUT /users/:id/role, con confirmación: un rol nuevo cambia lo que esa persona puede ver y hacer
  async function updateRole(u: User, newRole: string) {
    const ok = await confirm({
      title: `¿Cambiar el rol de ${u.name}?`,
      message: <p>Pasará de {roleLabels[u.role]} a {roleLabels[newRole]}. Lo notará la próxima vez que entre.</p>,
      confirmLabel: 'Cambiar el rol',
    });
    if (!ok) return;
    setBusy(u._id);
    try {
      await changeRole(u._id, newRole);
      setChanges((c) => ({ ...c, [u._id]: { ...c[u._id], role: newRole } }));
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusy(null);
  }

  // PUT /users/:id/activate o /deactivate. Desactivar pide confirmación
  async function toggleActive(u: User) {
    if (u.isActive) {
      const ok = await confirm({
        title: `¿Desactivar a ${u.name}?`,
        message: <p>No podrá entrar con su cuenta hasta que la vuelvas a activar. Sus consultas no se borran.</p>,
        confirmLabel: 'Desactivar',
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(u._id);
    try {
      await setUserActive(u._id, !u.isActive);
      setChanges((c) => ({ ...c, [u._id]: { ...c[u._id], isActive: !u.isActive } }));
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusy(null);
  }

  const loading = result?.key !== key && !error;
  const users = (result?.page.data || []).map((u) => ({ ...u, ...changes[u._id] }));
  const total = result?.page.pagesData.total ?? 0;
  const totalPages = Math.max(1, result?.page.pagesData.totalPages || 1);

  return (
    <main className="page">
      <title>Usuarios · Administración · CataHome</title>
      <h1 className="page-title">Usuarios y roles</h1>
      <p className="page-subtitle">Cambia el rol de cada usuario o desactiva su cuenta. Tu propia cuenta no se puede cambiar desde aquí.</p>

      {error && <p className="field-error" role="alert">{error}</p>}
      {confirmDialog}

      <div className="table-box">
        <div className="table-tools">
          <div className="tabs" role="group" aria-label="Filtrar por rol">
            <button className={role === '' ? 'tab tab-active' : 'tab'} aria-pressed={role === ''} onClick={() => changeUrl({ rol: '', pagina: '' })}>Todos</button>
            {ROLES.map((r) => (
              <button key={r} className={role === r ? 'tab tab-active' : 'tab'} aria-pressed={role === r} onClick={() => changeUrl({ rol: r, pagina: '' })}>
                {roleLabels[r]}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              changeUrl({ nombre: name.trim(), pagina: '' });
            }}
          >
            <input
              className="table-search"
              type="search"
              aria-label="Buscar por nombre"
              placeholder="Buscar por nombre y Enter"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!e.target.value) changeUrl({ nombre: '', pagina: '' });
              }}
            />
          </form>
        </div>

        {!result && !error ? (
          <TableSkeleton />
        ) : users.length === 0 ? (
          <div className="empty"><strong>Ningún usuario coincide</strong>Cambia el rol o el nombre que buscas.</div>
        ) : (
          <table className={loading ? 'table admin-loading' : 'table'} aria-busy={loading}>
            <thead>
              <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u._id === me?._id;
                return (
                  <tr key={u._id} className={u.isActive ? '' : 'admin-inactive'}>
                    <td className="cell-title">
                      <span className="admin-user">
                        <span className="avatar" aria-hidden="true">{u.name.charAt(0).toUpperCase()}</span>
                        <strong>{u.name}{isMe ? ' (tú)' : ''}</strong>
                      </span>
                    </td>
                    <td data-label="Correo" className="cell-muted">{u.email}</td>
                    <td data-label="Rol">
                      {isMe ? (
                        roleLabels[u.role]
                      ) : (
                        <select aria-label={`Rol de ${u.name}`} value={u.role} disabled={busy === u._id} onChange={(e) => updateRole(u, e.target.value)}>
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{roleLabels[r]}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td data-label="Estado"><span className={u.isActive ? 'status-badge status-on' : 'status-badge status-off'}>{u.isActive ? 'Activo' : 'Inactivo'}</span></td>
                    <td data-label="Acciones">
                      {isMe ? (
                        <span className="cell-muted">Tu cuenta</span>
                      ) : (
                        <button className="link-button" disabled={busy === u._id} onClick={() => toggleActive(u)}>
                          {busy === u._id ? 'Guardando…' : u.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="table-foot">
        <p>{formatNumber(total)} {total === 1 ? 'usuario' : 'usuarios'}</p>
        {totalPages > 1 && (
          <div className="pager">
            <button className="btn btn-outline" disabled={page <= 1} onClick={() => changeUrl({ pagina: page === 2 ? '' : String(page - 1) })}>Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => changeUrl({ pagina: String(page + 1) })}>Siguiente</button>
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminUsers;
