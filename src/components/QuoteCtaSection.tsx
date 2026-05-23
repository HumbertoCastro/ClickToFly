import { ArrowRight, CalendarCheck, Luggage, MapPinned, PlaneTakeoff } from 'lucide-react';
import { withBasePath } from '../lib/routing';
import { PrimaryButton, SecondaryButton } from './Buttons';

export function QuoteCtaSection() {
  return (
    <section className="quote-cta-section section-pad" id="orcamento">
      <div className="container quote-cta-panel">
        <div className="quote-cta-copy reveal">
          <span className="quote-cta-kicker">Pacote personalizado</span>
          <h2>Sua viagem sob medida começa em uma cotação guiada.</h2>
          <p>
            Conte origem, destino, datas e estilo de viagem em uma página dedicada. A equipe da
            Click To Fly usa esse briefing para buscar opções com atendimento consultivo.
          </p>
          <div className="quote-cta-actions">
            <PrimaryButton href={withBasePath('/orcamento')} icon={<ArrowRight />}>
              Montar meu pacote
            </PrimaryButton>
            <SecondaryButton href={withBasePath('/#promocoes')}>Ver promoções primeiro</SecondaryButton>
          </div>
        </div>

        <div className="quote-cta-visual reveal reveal-delay-1" aria-hidden="true">
          <div className="quote-plane-orbit">
            <span className="quote-plane-dot quote-plane-dot-one" />
            <span className="quote-plane-dot quote-plane-dot-two" />
            <span className="quote-plane-dot quote-plane-dot-three" />
            <span className="quote-plane-icon">
              <PlaneTakeoff />
            </span>
          </div>
          <div className="quote-mini-board">
            <span>
              <MapPinned />
              Destino
            </span>
            <span>
              <CalendarCheck />
              Datas
            </span>
            <span>
              <Luggage />
              Perfil
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
