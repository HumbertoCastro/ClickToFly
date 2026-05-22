import { ArrowRight, MessageCircle, Radio } from 'lucide-react';
import { deals, whatsappBenefits, whatsappMessage, whatsappNumber } from '../data';
import { Badge } from './Badge';
import { PrimaryButton } from './Buttons';

const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
const primaryDeal = deals[0];
const secondaryDeal = deals[1] ?? deals[0];

export function WhatsAppGroupSection() {
  return (
    <section className="whatsapp-section" id="contato">
      <div className="container whatsapp-panel">
        <div className="whatsapp-copy reveal">
          <Badge variant="dark" icon={<Radio />}>Grupo de promoções</Badge>
          <h2>Receba promoções selecionadas direto no WhatsApp</h2>
          <p>
            Entre no grupo da Click To Fly e acompanhe oportunidades nacionais e internacionais
            escolhidas com curadoria.
          </p>
          <div className="benefit-list">
            {whatsappBenefits.map((benefit) => (
              <span key={benefit.text}>
                {benefit.icon}
                {benefit.text}
              </span>
            ))}
          </div>
          <PrimaryButton href={whatsappHref} target="_blank" rel="noreferrer" icon={<ArrowRight />}>
            Entrar no grupo
          </PrimaryButton>
        </div>

        <div className="chat-mockup reveal reveal-delay-1" aria-label="Simulação de mensagens de promoção">
          <div className="chat-header">
            <span>
              <MessageCircle />
            </span>
            <div>
              <strong>Click To Fly VIP</strong>
              <small>Ofertas selecionadas</small>
            </div>
          </div>
          <div className="chat-bubble">
            <small>Promoção encontrada</small>
            <strong>{primaryDeal.origin} -&gt; {primaryDeal.destination}</strong>
            <p>a partir de {primaryDeal.foundPrice}</p>
          </div>
          <div className="chat-bubble is-highlight">
            <small>Oferta internacional</small>
            <strong>{secondaryDeal.origin} -&gt; {secondaryDeal.destination}</strong>
            <p>economia estimada de {secondaryDeal.savings}</p>
          </div>
          <div className="chat-bubble">
            <small>Alerta Click To Fly</small>
            <strong>Tarifa especial disponível por tempo limitado</strong>
            <p>Curadoria revisada antes do envio.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
