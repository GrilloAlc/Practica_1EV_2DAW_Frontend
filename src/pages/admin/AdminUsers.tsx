import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { changeRole, createUser, getUser, getUsersPage, passwordProblem, setUserActive, setUserPassword, updateUser } from '../../api/users';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/useAuth';
import { ROLES, formatNumber, roleLabels } from '../../utils/labels';
import { TableSkeleton } from '../../components/Skeleton';
import { useConfirm } from '../../components/useConfirm';
import FormDialog from '../../components/FormDialog';
import type { Page, User } from '../../types';

const PER_PAGE = 20;
const PHONE_PATTERN = /^[+\d][\d\s-]{5,19}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Qué ventana está abierta: crear, editar o cambiar la contraseña de un usuario
type Dialog = { kind: 'create' } | { kind: 'edit'; user: User } | { kind: 'password'; user: User } | null;

function AdminUsers() {
  const { user: me } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<{ key: string; page: Page<User> } | null>(null);
  const [changes, setChanges] = useState<Record<string, Partial<User>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState(searchParams.get('correo') || searchParams.get('nombre') || '');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reload, setReload] = useState(0);
  const [confirm, confirmDialog] = useConfirm();

  const key = searchParams.toString() + '|' + reload;
  const role = searchParams.get('rol') || '';
  const order = searchParams.get('orden') === 'antiguos' ? 'asc' : 'desc';
  const page = Math.max(1, Math.floor(Number(searchParams.get('pagina'))) || 1);

  useEffect(() => {
    let current = true;
    getUsersPage({
      role: searchParams.get('rol') || undefined,
      name: searchParams.get('nombre') || undefined,
      email: searchParams.get('correo') || undefined,
      order: searchParams.get('orden') === 'antiguos' ? 'asc' : undefined,
      page: Math.max(1, Math.floor(Number(searchParams.get('pagina'))) || 1),
      limit: PER_PAGE,
    }).then(
      (res) => {
        if (!current) return;
        setResult({ key: searchParams.toString() + '|' + reload, page: res });
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
  }, [searchParams, reload]);

  function changeUrl(values: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    for (const k in values) {
      if (values[k]) params.set(k, values[k]);
      else params.delete(k);
    }
    setSearchParams(params, { replace: true });
  }

  // Con @ se busca por correo; si no, por nombre
  function applySearch(text: string) {
    const value = text.trim();
    const byEmail = value.includes('@');
    changeUrl({ nombre: byEmail ? '' : value, correo: byEmail ? value : '', pagina: '' });
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

  // GET /users/:id antes de editar, para partir de los datos actuales y no de los de la lista
  async function openEdit(u: User) {
    setBusy(u._id);
    try {
      setDialog({ kind: 'edit', user: await getUser(u._id) });
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
  const searching = Boolean(searchParams.get('nombre') || searchParams.get('correo'));

  return (
    <main className="page">
      <title>Usuarios · Administración · CataHome</title>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios y roles</h1>
          <p className="page-subtitle">Crea cuentas de agentes y administradores, cambia roles, datos y contraseñas, o desactiva una cuenta.</p>
        </div>
        <button type="button" className="btn" onClick={() => setDialog({ kind: 'create' })}>Nuevo usuario</button>
      </div>

      {error && <p className="field-error" role="alert">{error}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}
      {confirmDialog}

      {dialog?.kind === 'create' && (
        <CreateUserDialog
          onClose={() => setDialog(null)}
          onDone={(name) => {
            setDialog(null);
            setNotice(`Cuenta de ${name} creada.`);
            setReload((r) => r + 1);
          }}
        />
      )}
      {dialog?.kind === 'edit' && (
        <EditUserDialog
          user={dialog.user}
          onClose={() => setDialog(null)}
          onDone={(updated) => {
            setDialog(null);
            setChanges((c) => ({ ...c, [updated._id]: { ...c[updated._id], name: updated.name, phone: updated.phone } }));
            setNotice(`Datos de ${updated.name} guardados.`);
          }}
        />
      )}
      {dialog?.kind === 'password' && (
        <PasswordDialog
          user={dialog.user}
          onClose={() => setDialog(null)}
          onDone={() => {
            setNotice(`Contraseña de ${dialog.user.name} cambiada. Díselo por un canal seguro.`);
            setDialog(null);
          }}
        />
      )}

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
          <div className="admin-filters">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applySearch(search);
              }}
            >
              <input
                className="table-search"
                type="search"
                aria-label="Buscar por nombre o correo"
                placeholder="Nombre o correo y Enter"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (!e.target.value) applySearch('');
                }}
              />
            </form>
            <select aria-label="Ordenar usuarios" value={order} onChange={(e) => changeUrl({ orden: e.target.value === 'asc' ? 'antiguos' : '', pagina: '' })}>
              <option value="desc">Altas más recientes</option>
              <option value="asc">Altas más antiguas</option>
            </select>
          </div>
        </div>

        {!result && !error ? (
          <TableSkeleton />
        ) : users.length === 0 ? (
          <div className="empty">
            <strong>Ningún usuario coincide</strong>
            {searching ? 'Revisa el nombre o el correo que buscas.' : 'Cambia el rol que filtras.'}
          </div>
        ) : (
          <table className={loading ? 'table admin-loading' : 'table'} aria-busy={loading} aria-label="Usuarios">
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
                        <Link to="/perfil">Tu cuenta, en tu perfil</Link>
                      ) : (
                        <span className="admin-actions">
                          <button className="link-button" disabled={busy === u._id} onClick={() => openEdit(u)}>Editar</button>
                          <button className="link-button" disabled={busy === u._id} onClick={() => setDialog({ kind: 'password', user: u })}>Contraseña</button>
                          <button className="link-button" disabled={busy === u._id} onClick={() => toggleActive(u)}>
                            {busy === u._id ? 'Guardando…' : u.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                        </span>
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

// POST /users: cuenta nueva con el rol elegido (por defecto, agente)
function CreateUserDialog({ onClose, onDone }: { onClose: () => void; onDone: (name: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('AGENTE');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name.trim()) return setError('Escribe el nombre.');
    if (!EMAIL_PATTERN.test(email.trim())) return setError('Revisa el correo: tiene que ser del tipo nombre@dominio.es.');
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) return setError('Revisa el teléfono: solo números, espacios y, si quieres, el prefijo con +.');
    const problem = passwordProblem(password, repeat);
    if (problem) return setError(problem);

    setBusy(true);
    try {
      await createUser({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() || undefined, role, password });
      onDone(name.trim());
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <FormDialog
      title="Nuevo usuario"
      intro={<p>Para dar de alta agentes y administradores. Los clientes se registran ellos mismos desde la web.</p>}
      submitLabel="Crear la cuenta"
      busy={busy}
      error={error}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <label className="field">
        Nombre
        <input required autoComplete="off" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field">
        Correo electrónico
        <input type="email" required autoComplete="off" spellCheck={false} autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <div className="form-row">
        <label className="field">
          Teléfono (opcional)
          <input type="tel" autoComplete="off" placeholder="600 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="field">
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{roleLabels[r]}</option>
            ))}
          </select>
        </label>
      </div>
      <PasswordFields password={password} repeat={repeat} onPassword={setPassword} onRepeat={setRepeat} />
    </FormDialog>
  );
}

// PUT /users/:id: nombre y teléfono de otra persona
function EditUserDialog({ user, onClose, onDone }: { user: User; onClose: () => void; onDone: (user: User) => void }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name.trim()) return setError('El nombre no puede quedar vacío.');
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) return setError('Revisa el teléfono: solo números, espacios y, si quieres, el prefijo con +.');
    setBusy(true);
    try {
      onDone(await updateUser(user._id, { name: name.trim(), phone: phone.trim() }));
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <FormDialog
      title={`Editar a ${user.name}`}
      intro={<p>{roleLabels[user.role]} · {user.email}. El correo no se puede cambiar; el rol, desde la lista.</p>}
      submitLabel="Guardar cambios"
      busy={busy}
      error={error}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <label className="field">
        Nombre
        <input required autoComplete="off" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field">
        Teléfono
        <input type="tel" autoComplete="off" placeholder="600 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
    </FormDialog>
  );
}

// PUT /users/:id/password: contraseña nueva para otra persona (o para el propio admin, desde su perfil)
export function PasswordDialog({ user, own, onClose, onDone }: { user: Pick<User, '_id' | 'name'>; own?: boolean; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    const problem = passwordProblem(password, repeat);
    if (problem) return setError(problem);
    setBusy(true);
    try {
      await setUserPassword(user._id, password);
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <FormDialog
      title={own ? 'Cambiar tu contraseña' : `Contraseña de ${user.name}`}
      intro={<p>{own ? 'La próxima vez que entres tendrás que usar la nueva.' : 'La contraseña actual deja de valer al momento. Comunícale la nueva por un canal seguro.'}</p>}
      submitLabel="Cambiar la contraseña"
      busy={busy}
      error={error}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <PasswordFields password={password} repeat={repeat} onPassword={setPassword} onRepeat={setRepeat} />
    </FormDialog>
  );
}

function PasswordFields({ password, repeat, onPassword, onRepeat }: { password: string; repeat: string; onPassword: (v: string) => void; onRepeat: (v: string) => void }) {
  return (
    <>
      <label className="field">
        Contraseña nueva
        <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => onPassword(e.target.value)} aria-describedby="password-help" />
        <span id="password-help" className="field-help">Al menos 8 caracteres.</span>
      </label>
      <label className="field">
        Repite la contraseña
        <input type="password" required minLength={8} autoComplete="new-password" value={repeat} onChange={(e) => onRepeat(e.target.value)} />
      </label>
    </>
  );
}

export default AdminUsers;
