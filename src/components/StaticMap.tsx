import './StaticMap.css';

const TILE = 256;
const ZOOM = 16;

// Posición en píxeles del mapa mundial de OpenStreetMap a un zoom dado (proyección Mercator)
function toPixels(lat: number, lng: number, zoom: number) {
  const scale = TILE * 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;
  return {
    x: ((lng + 180) / 360) * scale,
    y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale,
  };
}

// Mapa pequeño de la zona, hecho con las teselas de OpenStreetMap (sin librerías ni claves).
// Se pintan 5 x 3 teselas alrededor del punto y el punto queda en el centro. Al pulsarlo se abre el mapa completo
function StaticMap({ lat, lng, href, label }: { lat: number; lng: number; href: string; label: string }) {
  const center = toPixels(lat, lng, ZOOM);
  const centerTileX = Math.floor(center.x / TILE);
  const centerTileY = Math.floor(center.y / TILE);
  const tiles = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = centerTileX + dx;
      const y = centerTileY + dy;
      tiles.push({
        key: `${x}-${y}`,
        src: `https://tile.openstreetmap.org/${ZOOM}/${x}/${y}.png`,
        left: x * TILE - center.x,
        top: y * TILE - center.y,
      });
    }
  }

  return (
    <div className="static-map">
      <a className="static-map-link" href={href} target="_blank" rel="noreferrer" aria-label={label}>
        <span className="static-map-tiles" aria-hidden="true">
          {tiles.map((t) => (
            <img
              key={t.key}
              src={t.src}
              alt=""
              width={TILE}
              height={TILE}
              loading="lazy"
              style={{ left: `calc(50% + ${t.left}px)`, top: `calc(50% + ${t.top}px)` }}
            />
          ))}
        </span>
        <span className="static-map-pin" aria-hidden="true" />
      </a>
      <a className="static-map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
        © OpenStreetMap
      </a>
    </div>
  );
}

export default StaticMap;
