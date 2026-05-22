import { useState } from 'react';
import { destinations } from '../data';
import { SectionHeader } from './SectionHeader';

const defaultDestinationName = destinations.find((destination) => destination.featured)?.name ?? destinations[0]?.name ?? '';

export function DestinationsSection() {
  const [activeDestinationName, setActiveDestinationName] = useState(defaultDestinationName);

  return (
    <section className="destinations-section section-pad" id="destinos">
      <div className="container">
        <SectionHeader
          align="left"
          eyebrow="Inspiração para viajar"
          title="Destinos que despertam vontade de viajar"
          description="Inspire-se com alguns dos destinos mais buscados por quem acompanha oportunidades da Click To Fly."
        />

        <div className={`destinations-grid ${activeDestinationName ? 'has-active' : ''}`}>
          {destinations.map((destination) => {
            const isActive = destination.name === activeDestinationName;

            return (
              <button
                className={`destination-card reveal ${destination.featured ? 'is-featured' : ''} ${isActive ? 'is-active' : ''}`}
                key={destination.name}
                type="button"
                aria-label={`Destacar destino ${destination.name}`}
                aria-pressed={isActive}
                onClick={() => setActiveDestinationName(destination.name)}
                onFocus={() => setActiveDestinationName(destination.name)}
                onMouseEnter={() => setActiveDestinationName(destination.name)}
              >
                <img src={destination.image} alt={destination.imageAlt} />
                <div className="destination-overlay" />
                <div className="destination-copy">
                  <span>{destination.badge}</span>
                  <h3>{destination.name}</h3>
                  <p>{destination.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
