import { destinations } from '../data';
import { SectionHeader } from './SectionHeader';

export function DestinationsSection() {
  return (
    <section className="destinations-section section-pad" id="destinos">
      <div className="container">
        <SectionHeader
          align="left"
          eyebrow="Inspiracao para viajar"
          title="Destinos que despertam vontade de viajar"
          description="Inspire-se com alguns dos destinos mais buscados por quem acompanha oportunidades da Click To Fly."
        />

        <div className="destinations-grid">
          {destinations.map((destination) => (
            <article
              className={`destination-card reveal ${destination.featured ? 'is-featured' : ''}`}
              key={destination.name}
            >
              <img src={destination.image} alt={destination.imageAlt} />
              <div className="destination-overlay" />
              <div className="destination-copy">
                <span>{destination.badge}</span>
                <h3>{destination.name}</h3>
                <p>{destination.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
