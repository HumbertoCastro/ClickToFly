import { ArrowRight, MessageCircle, Radio } from 'lucide-react';
import { whatsappBenefits, whatsappMessage, whatsappNumber } from '../data';
import { Badge } from './Badge';
import { PrimaryButton } from './Buttons';

const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

export function WhatsAppGroupSection() {
  return (
    <section className="whatsapp-section" id="contato">
      <div className="container whatsapp-panel">
        <div className="whatsapp-copy reveal">
          <Badge variant="dark" icon={<Radio />}>Grupo de promocoes</Badge>
          <h2>Receba promocoes selecionadas direto no WhatsApp</h2>
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
            Entrar no grupo de promocoes
          </PrimaryButton>
        </div>

        <div className="chat-mockup reveal reveal-delay-1" aria-label="Simulacao de mensagens de promocao">
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
            <small>Promocao encontrada</small>
            <strong>Sao Paulo -&gt; Lisboa</strong>
            <p>a partir de R$ 2.980</p>
          </div>
          <div className="chat-bubble is-highlight">
            <small>Oferta internacional</small>
            <strong>Rio -&gt; Buenos Aires</strong>
            <p>economia estimada de R$ 740</p>
          </div>
          <div className="chat-bubble">
            <small>Alerta Click To Fly</small>
            <strong>Tarifa especial disponivel por tempo limitado</strong>
            <p>Curadoria revisada antes do envio.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
