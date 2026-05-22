import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import quoteHeroGlobe from '../assets/quote-hero-globe-cutout.png';
import { whatsappMessage, whatsappNumber } from '../data';
import { BudgetFormSection } from './BudgetFormSection';
import { PrimaryButton, SecondaryButton } from './Buttons';

const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

export function BudgetQuotePage() {
  return (
    <main className="quote-page-main">
      <section className="quote-page-hero" id="inicio">
        <div className="container quote-page-hero-grid">
          <div className="quote-page-hero-copy reveal">
            <a className="quote-back-link" href="/#orcamento">
              <ArrowLeft />
              Voltar para a página inicial
            </a>
            <span className="quote-cta-kicker">Atendimento consultivo</span>
            <h1>Monte seu pacote com mais contexto.</h1>
            <p>
              Esta etapa coleta o briefing da sua viagem para a equipe comparar datas, bagagem,
              hospedagem e serviços adicionais com mais clareza antes do contato.
            </p>
            <div className="quote-cta-actions">
              <PrimaryButton href="#orcamento" icon={<ArrowRight />}>
                Começar cotação
              </PrimaryButton>
              <SecondaryButton href={whatsappHref} target="_blank" rel="noreferrer" icon={<MessageCircle />}>
                Falar no WhatsApp
              </SecondaryButton>
            </div>
          </div>

          <div className="quote-page-hero-visual reveal reveal-delay-1">
            <img
              className="quote-page-hero-image"
              src={quoteHeroGlobe}
              alt="Globo 3D com avião representando uma viagem personalizada"
            />
            <div className="quote-page-route">
              <span>Origem</span>
              <em />
              <span>Destino</span>
            </div>
          </div>
        </div>
      </section>

      <BudgetFormSection variant="page" />
    </main>
  );
}
