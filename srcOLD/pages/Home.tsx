import './Home.css';
import PropertyCard from '../components/PropertyCard';

function Home() {
  return (
    <section>
      <h2>Propiedades destacadas</h2>
      <div className="home-grid">
        <PropertyCard operation="Venta" city="Madrid" title="Piso luminoso en el centro" price={325000} area={98} rooms={3} bathrooms={2} />
        <PropertyCard operation="Venta" city="Madrid" title="Casa con jardín privado" price={485000} area={176} rooms={4} bathrooms={3} />
      </div>
    </section>
  );
}

export default Home;