import './Skeleton.css';

// Cajas grises con la forma del contenido que se está cargando

function Bar({ width = '100%', height = 14, className = '' }: { width?: string | number; height?: number; className?: string }) {
  return <span className={'skeleton ' + className} style={{ width, height }} />;
}

// Anuncio horizontal del listado
export function PropertyCardSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <span className="skeleton skeleton-card-photo" />
      <div className="skeleton-card-body">
        <Bar width="40%" height={26} />
        <Bar width="70%" height={18} />
        <Bar width="50%" />
        <div className="skeleton-row">
          <Bar width={56} height={24} />
          <Bar width={64} height={24} />
          <Bar width={72} height={24} />
        </div>
        <Bar />
        <Bar width="85%" />
      </div>
    </div>
  );
}

export function PropertyListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="properties-list" role="status" aria-label="Cargando casas">
      {Array.from({ length: count }, (_, i) => <PropertyCardSkeleton key={i} />)}
    </div>
  );
}

// Tarjeta vertical del inicio
export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="home-grid" role="status" aria-label="Cargando casas">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-tile" aria-hidden="true">
          <span className="skeleton skeleton-tile-photo" />
          <div className="skeleton-tile-body">
            <Bar width="45%" height={24} />
            <Bar width="35%" />
            <Bar width="80%" height={16} />
            <Bar width="50%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Ficha de una casa
export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Cargando la casa">
      <span className="skeleton skeleton-detail-photo" aria-hidden="true" />
      <div className="skeleton-detail" aria-hidden="true">
        <div className="skeleton-stack">
          <Bar width="60%" height={36} />
          <Bar width="40%" />
          <Bar width="30%" height={34} />
          <Bar height={80} className="skeleton-gap" />
          <Bar />
          <Bar width="92%" />
          <Bar width="75%" />
        </div>
        <Bar height={260} />
      </div>
    </div>
  );
}

// Filas de una tabla
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-table" role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-table-row" aria-hidden="true">
          <Bar width={64} />
          <Bar width="40%" />
          <Bar width="15%" />
          <Bar width={80} height={22} />
        </div>
      ))}
    </div>
  );
}
