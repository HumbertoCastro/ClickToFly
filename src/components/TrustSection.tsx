import { ShieldCheck } from 'lucide-react';
import { trustCards } from '../data';
import { Badge } from './Badge';
import { TrustCard } from './TrustCard';

export function TrustSection() {
  return (
    <section className="trust-section section-pad">
      <div className="container trust-layout">
        <div className="trust-visual reveal" aria-hidden="true">
          <div className="trust-map">
            <img
              src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1100&q=85"
              alt=""
            />
            <span className="map-pin pin-one" />
            <span className="map-pin pin-two" />
            <span className="map-pin pin-three" />
            <svg viewBox="0 0 520 360">
              <path d="M70 260C150 96 335 284 452 82" fill="none" stroke="#42D6CF" strokeWidth="10" strokeLinecap="round" strokeDasharray="18 24" />
              <path d="M98 294C188 218 296 290 414 226" fill="none" stroke="#0F2430" strokeOpacity="0.12" strokeWidth="3" />
            </svg>
            <div className="trust-floating">
              <ShieldCheck />
              <strong>Curadoria segura</strong>
              <span>condicoes revisadas com clareza</span>
            </div>
          </div>
        </div>

        <div className="trust-copy">
          <Badge>Confianca e seguranca</Badge>
          <h2>Mais do que promocoes: seguranca para planejar sua viagem</h2>
          <p>
            A Click To Fly combina curadoria de oportunidades com atendimento humano para ajudar
            voce a tomar decisoes com clareza antes de viajar.
          </p>
          <div className="trust-list">
          {trustCards.map((card) => (
            <TrustCard card={card} key={card.title} />
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
