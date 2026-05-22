import { CheckCircle2, PlaneTakeoff, ShieldCheck } from 'lucide-react';
import { trustCards } from '../data';
import { Badge } from './Badge';

export function TrustSection() {
  return (
    <section className="trust-section section-pad">
      <div className="container trust-layout">
        <div className="trust-visual reveal" aria-hidden="true">
          <div className="trust-signal-card">
            <span className="trust-signal-icon">
              <ShieldCheck />
            </span>
            <span className="trust-signal-label">Curadoria segura</span>
            <h3>Condições revisadas antes de você decidir.</h3>

            <div className="trust-route-line">
              <span>Oferta</span>
              <em />
              <PlaneTakeoff />
              <em />
              <span>Viagem</span>
            </div>

            <div className="trust-signal-checks">
              <span>
                <CheckCircle2 />
                Regras claras
              </span>
              <span>
                <CheckCircle2 />
                Atendimento humano
              </span>
            </div>
          </div>
        </div>

        <div className="trust-copy reveal reveal-delay-1">
          <Badge variant="dark">Confiança e segurança</Badge>
          <h2>Mais do que promoções: segurança para planejar sua viagem</h2>
          <p>
            A Click To Fly combina curadoria de oportunidades com atendimento humano para ajudar
            você a tomar decisões com clareza antes de viajar.
          </p>
          <div className="trust-list">
            {trustCards.map((card) => (
              <article className="trust-proof-card" key={card.title}>
                <span className="trust-icon">{card.icon}</span>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
