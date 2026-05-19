import { ArrowRight, Plane, Sparkles, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { whatsappMessage, whatsappNumber } from '../data';
import heroPlaneImage from '../../MainImage.png';
import { Badge } from './Badge';
import { PrimaryButton, SecondaryButton } from './Buttons';

const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

const promoExamples = [
  { route: 'Sao Paulo -> Lisboa', savings: 'R$ 1.240', price: 'R$ 3.180' },
  { route: 'Rio -> Buenos Aires', savings: 'R$ 740', price: 'R$ 890' },
  { route: 'BH -> Cancun', savings: 'R$ 1.350', price: 'R$ 2.750' },
  { route: 'Sao Paulo -> Paris', savings: 'R$ 1.410', price: 'R$ 2.890' },
  { route: 'Brasilia -> Roma', savings: 'R$ 1.180', price: 'R$ 3.220' },
  { route: 'Recife -> Orlando', savings: 'R$ 980', price: 'R$ 2.640' },
];

export function HeroSection() {
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const activePromo = promoExamples[activePromoIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActivePromoIndex((current) => (current + 1) % promoExamples.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="hero-shell" id="inicio">
      <div className="hero-panel">
          <div className="hero-visual reveal reveal-delay-1" aria-label="Aviao sobre nuvens em destaque">
            <div className="hero-image-frame">
              <img src={heroPlaneImage} alt="Aviao sobre nuvens em ceu claro" />
            </div>
            <article className="hero-promo-rotator" aria-live="polite">
              <div className="promo-orbit" aria-hidden="true">
                {promoExamples.map((promo, index) => (
                  <span
                    key={promo.route}
                    className={index === activePromoIndex ? 'is-active' : ''}
                  />
                ))}
              </div>
              <span className="hero-promo-icon">
                <TrendingDown />
              </span>
              <div className="hero-promo-copy" key={activePromo.route}>
                <small>{activePromo.route}</small>
                <strong>Economia estimada</strong>
                <em>{activePromo.savings}</em>
                <span>
                  <Plane />
                  encontrado por {activePromo.price}
                </span>
              </div>
            </article>
          </div>

          <div className="hero-content reveal">
            <Badge icon={<Sparkles />}>Promocoes aereas selecionadas por especialistas</Badge>
            <h1>Click To Fly</h1>
            <p>
              Curadoria de promocoes aereas com envio pelo WhatsApp e atendimento humano para
              planejar sua proxima viagem com seguranca.
            </p>
            <div className="hero-actions">
              <PrimaryButton href={whatsappHref} target="_blank" rel="noreferrer" icon={<ArrowRight />}>
                Entrar no grupo
              </PrimaryButton>
              <SecondaryButton href="#orcamento">Planejar viagem</SecondaryButton>
            </div>
          </div>
        </div>
    </section>
  );
}
