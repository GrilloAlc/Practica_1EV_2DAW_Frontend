import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function Profile() {
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    setSaved(true);
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <p className="label">Área de cliente</p>
        <h1 className="page-title">Mi perfil</h1>
        <p className="page-subtitle">Actualiza tus datos básicos.</p>

        <form className="form-box" onSubmit={handleSubmit} onChange={() => setSaved(false)}>
          <label className="field">
            Nombre
            <input name="nombre" required defaultValue="María Ruiz" />
          </label>
          <label className="field">
            Correo electrónico
            <input name="email" type="email" required defaultValue="maria@correo.com" />
          </label>
          <label className="field">
            Teléfono
            <input name="telefono" type="tel" defaultValue="600 000 000" />
          </label>
          <button type="submit" className="btn">Guardar cambios</button>
          {saved && <p role="status">Cambios guardados.</p>}
        </form>
      </main>
      <Footer />
    </>
  );
}

export default Profile;
