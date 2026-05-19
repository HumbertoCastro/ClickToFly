import { ArrowRight } from 'lucide-react';
import { steps } from '../data';
import { Badge } from './Badge';
import { SecondaryButton } from './Buttons';

export function HowItWorksSection() {
  return (
    <section className="how-section section-pad" id="como-funciona">
      <div className="container how-grid">
        <div className="how-copy reveal">
          <Badge>Como funciona</Badge>
          <h2>Como a Click To Fly encontra a melhor oportunidade para voce</h2>
          <p>
            Unimos monitoramento de tarifas, curadoria humana e atendimento consultivo para transformar
            uma promocao em uma decisao segura de viagem.
          </p>
          <SecondaryButton href="#orcamento" icon={<ArrowRight />}>
            Planejar agora
          </SecondaryButton>
        </div>

        <div className="timeline-grid">
          {steps.map((step, index) => (
            <article className="timeline-card reveal" key={step.title}>
              <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="feature-icon">{step.icon}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
