import { TICKET_CATEGORIES, categoryLabels } from '../../utils/labels';

// Las categorías son fijas en el backend, aquí solo se muestran
function AdminCategories() {
  return (
    <main className="page">
      <h1 className="page-title">Categorías</h1>
      <p className="page-subtitle">Tipos de solicitud que pueden elegir los clientes.</p>

      <div className="table-box">
        <table className="table">
          <thead>
            <tr><th>Categoría</th><th>Código</th></tr>
          </thead>
          <tbody>
            {TICKET_CATEGORIES.map((c) => (
              <tr key={c}>
                <td>{categoryLabels[c]}</td>
                <td className="cell-muted cell-code">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default AdminCategories;
