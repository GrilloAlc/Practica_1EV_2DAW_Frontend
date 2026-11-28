import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { deactivateProperty, getPropertiesPage, reactivateProperty, updatePropertyStatus } from '../../api/properties';
import { getErrorMessage } from '../../api/client';
import { PROPERTY_STATUSES, PROPERTY_TYPES, formatNumber, formatPrice } from '../../utils/labels';
import { coverPhoto, typeImage } from '../../utils/photos';
import { canonicalCity } from '../../utils/cities';
import Photo from '../../components/Photo';
import { TableSkeleton } from '../../components/Skeleton';
import { useConfirm } from '../../components/useConfirm';
import type { Page, Property } from '../../types';

const PER_PAGE = 50;

// Casas del catálogo para el admin. El backend solo lista las activas (50 por página) y filtra por estado,
// tipo y ciudad. Las que se desactivan aquí se quedan en la lista hasta recargar, para poder reactivarlas.
function AdminProperties() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<{ key: string; page: Page<Property> } | null>(null);
  const [deactivated, setDeactivated] = useState<Property[]>([]);
  // Estados cambiados desde la lista (vendida, reservada…), para no tener que volver a pedirla
  const [statusChanges, setStatusChanges] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState(searchParams.get('ciudad') || '');
  const [confirm, confirmDialog] = useConfirm();
  // Aviso que deja el formulario al guardar ("Casa guardada")
  const saved = (location.state as { saved?: string } | null)?.saved;

  const key = searchParams.toString();
  const status = searchParams.get('estado') || '';
  const type = searchParams.get('tipo') || '';
  const page = Math.max(1, Math.floor(Number(searchParams.get('pagina'))) || 1);

  useEffect(() => {
    let current = true;
    getPropertiesPage({
      status: searchParams.get('estado') || undefined,
      type: searchParams.get('tipo') || undefined,
      city: searchParams.get('ciudad') || undefined,
      page: Math.max(1, Math.floor(Number(searchParams.get('pagina'))) || 1),
      limit: PER_PAGE,
    }).then(
      (res) => {
        if (!current) return;
        setResult({ key: searchParams.toString(), page: res });
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

  function changeUrl(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    for (const k in changes) {
      if (changes[k]) params.set(k, changes[k]);
      else params.delete(k);
    }
    setSearchParams(params, { replace: true });
  }

  async function toggleActive(property: Property, active: boolean) {
    if (active) {
      const ok = await confirm({
        title: '¿Dejar de publicar esta casa?',
        message: <p>«{property.title}» dejará de verse en la web. Podrás volver a activarla mientras sigas en esta página.</p>,
        confirmLabel: 'Desactivar',
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(property._id);
    try {
      if (active) {
        await deactivateProperty(property._id);
        setDeactivated((list) => [{ ...property, isActive: false }, ...list.filter((p) => p._id !== property._id)]);
      } else {
        await reactivateProperty(property._id);
        setDeactivated((list) => list.filter((p) => p._id !== property._id));
      }
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusy(null);
  }

  // PUT /properties/:id/status: cambia solo el estado. Vendida y alquilada piden confirmación
  async function changeStatus(property: Property, newStatus: string) {
    if (newStatus === 'Vendida' || newStatus === 'Alquilada') {
      const ok = await confirm({
        title: `¿Marcar como ${newStatus.toLowerCase()}?`,
        message: <p>«{property.title}» seguirá en la web, pero se verá como {newStatus.toLowerCase()} y ya no se podrá preguntar por ella como disponible.</p>,
        confirmLabel: `Marcar como ${newStatus.toLowerCase()}`,
      });
      if (!ok) return;
    }
    setBusy(property._id);
    try {
      await updatePropertyStatus(property._id, newStatus);
      setStatusChanges((c) => ({ ...c, [property._id]: newStatus }));
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusy(null);
  }

  const loading = result?.key !== key && !error;
  const deactivatedIds = new Set(deactivated.map((p) => p._id));
  const list = (result?.page.data || [])
    .filter((p) => !deactivatedIds.has(p._id))
    .map((p) => (statusChanges[p._id] ? { ...p, status: statusChanges[p._id] } : p));
  const total = result?.page.pagesData.total ?? 0;
  const totalPages = Math.max(1, result?.page.pagesData.totalPages || 1);
  const text = search.trim().toLowerCase();
  const visible = text ? list.filter((p) => (p.title + ' ' + p.address.street + ' ' + p.address.city).toLowerCase().includes(text)) : list;

  return (
    <main className="page">
      <title>Propiedades · Administración · CataHome</title>
      <div className="page-header">
        <div>
          <h1 className="page-title">Propiedades</h1>
          <p className="page-subtitle">
            {result ? `${formatNumber(total)} casas publicadas${status || type || searchParams.get('ciudad') ? ' con estos filtros' : ''}.` : 'Administra el catálogo de casas.'}
          </p>
        </div>
        <Link to="/admin/propiedades/nueva" className="btn">Añadir propiedad</Link>
      </div>

      {saved && <p className="notice" role="status">{saved}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      {confirmDialog}

      {deactivated.length > 0 && (
        <section className="admin-block" aria-labelledby="admin-deactivated-title">
          <h2 id="admin-deactivated-title" className="admin-section-title admin-block-title">Desactivadas ahora</h2>
          <p className="page-subtitle">Las casas desactivadas dejan de aparecer en esta lista al salir de la página. Si te has equivocado, actívalas ahora.</p>
          <div className="table-box">
            <PropertyTable list={deactivated} busy={busy} onToggle={toggleActive} onStatus={changeStatus} />
          </div>
        </section>
      )}

      <div className="table-box">
        <div className="table-tools">
          <div className="admin-filters">
            <select aria-label="Filtrar por estado" value={status} onChange={(e) => changeUrl({ estado: e.target.value, pagina: '' })}>
              <option value="">Todos los estados</option>
              {PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select aria-label="Filtrar por tipo" value={type} onChange={(e) => changeUrl({ tipo: e.target.value, pagina: '' })}>
              <option value="">Todos los tipos</option>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = canonicalCity(city);
                setCity(name);
                changeUrl({ ciudad: name, pagina: '' });
              }}
            >
              <input className="table-search" type="search" aria-label="Filtrar por ciudad" placeholder="Ciudad y Enter" value={city} onChange={(e) => {
                setCity(e.target.value);
                if (!e.target.value) changeUrl({ ciudad: '', pagina: '' });
              }} />
            </form>
          </div>
          <input className="table-search" type="search" aria-label="Buscar en esta página" placeholder="Buscar por título o calle…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {!result && !error ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <div className="empty"><strong>Ninguna propiedad coincide</strong>Cambia los filtros o el texto de búsqueda.</div>
        ) : (
          <div className={loading ? 'admin-loading' : undefined} aria-busy={loading}>
            <PropertyTable list={visible} busy={busy} onToggle={toggleActive} onStatus={changeStatus} />
          </div>
        )}
      </div>

      <div className="table-foot">
        <p>{text ? `${visible.length} de ${list.length} en esta página · ` : ''}Página {page} de {totalPages}</p>
        {totalPages > 1 && (
          <div className="pager">
            <button className="btn btn-outline" disabled={page <= 1} onClick={() => changeUrl({ pagina: page === 2 ? '' : String(page - 1) })}>Anterior</button>
            <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => changeUrl({ pagina: String(page + 1) })}>Siguiente</button>
          </div>
        )}
      </div>
    </main>
  );
}

interface PropertyTableProps {
  list: Property[];
  busy: string | null;
  onToggle: (p: Property, active: boolean) => void;
  onStatus: (p: Property, status: string) => void;
}

function PropertyTable({ list, busy, onToggle, onStatus }: PropertyTableProps) {
  return (
    <table className="table">
      <thead>
        <tr><th>Propiedad</th><th>Tipo</th><th>Estado</th><th>Ciudad</th><th>Precio</th><th>Visible</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        {list.map((p) => (
          <tr key={p._id} className={p.isActive ? '' : 'admin-inactive'}>
            <td className="cell-title">
              <span className="admin-property">
                <Photo className="admin-thumb" src={coverPhoto(p)} fallback={typeImage(p.type)} pixels={240} alt="" width={72} height={54} loading="lazy" sizes="72px" />
                {p.isActive ? <Link to={`/propiedades/${p._id}`} state={{ property: p }}>{p.title}</Link> : <strong>{p.title}</strong>}
              </span>
            </td>
            <td data-label="Tipo">{p.type}</td>
            <td data-label="Estado">
              <select aria-label={`Estado de ${p.title}`} value={p.status} disabled={busy === p._id} onChange={(e) => onStatus(p, e.target.value)}>
                {PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </td>
            <td data-label="Ciudad">{p.address.city}</td>
            <td data-label="Precio" className="cell-code"><strong>{formatPrice(p)}</strong></td>
            <td data-label="Visible"><span className={p.isActive ? 'status-badge status-on' : 'status-badge status-off'}>{p.isActive ? 'Activa' : 'Inactiva'}</span></td>
            <td data-label="Acciones">
              <div className="admin-actions">
                {p.isActive && <Link to={`/admin/propiedades/${p._id}/editar`}>Editar</Link>}
                <button className="link-button" disabled={busy === p._id} onClick={() => onToggle(p, p.isActive)}>
                  {busy === p._id ? 'Guardando…' : p.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default AdminProperties;
