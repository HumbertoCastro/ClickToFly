import { ArrowRight, BadgeCheck, HeartHandshake, MessageCircle, Plane, Sparkles, TrendingDown, WalletCards } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import heroPlaneImage from '../../MainImage.png';
import { deals, whatsappMessage, whatsappNumber } from '../data';
import { PrimaryButton, SecondaryButton } from './Buttons';

const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

type PromoExample = {
  route: string;
  savings: string;
  price: string;
  label: string;
};

const promoExamples = deals.map((deal) => ({
  route: `${deal.origin} -> ${deal.destination}`,
  savings: deal.savings,
  price: deal.foundPrice,
  label: 'Economia estimada',
}));

const secondaryPromoExamples: PromoExample[] = [
  {
    route: 'Curitiba -> Santiago',
    savings: 'R$ 620',
    price: 'R$ 1.240',
    label: 'Janela econômica',
  },
  {
    route: 'Porto Alegre -> Buenos Aires',
    savings: 'R$ 420',
    price: 'R$ 790',
    label: 'Escapada regional',
  },
  {
    route: 'Recife -> Orlando',
    savings: 'R$ 980',
    price: 'R$ 2.640',
    label: 'Férias em família',
  },
  {
    route: 'Brasília -> Roma',
    savings: 'R$ 1.180',
    price: 'R$ 3.220',
    label: 'Europa em baixa',
  },
];

const heroBackgroundStyle = {
  '--hero-background': `url(${heroPlaneImage})`,
} as CSSProperties & Record<'--hero-background', string>;

type HeroPromoCardProps = {
  className?: string;
  index: number;
  live?: boolean;
  promo: PromoExample;
  total: number;
};

function HeroPromoCard({ className = '', index, live = false, promo, total }: HeroPromoCardProps) {
  return (
    <article className={`hero-promo-rotator ${className}`} aria-live={live ? 'polite' : undefined}>
      <div className="promo-orbit" aria-hidden="true">
        {Array.from({ length: total }, (_, dotIndex) => (
          <span
            key={`${promo.route}-${dotIndex}`}
            className={dotIndex === index ? 'is-active' : ''}
          />
        ))}
      </div>
      <span className="hero-promo-icon">
        <TrendingDown />
      </span>
      <div className="hero-promo-copy" key={promo.route}>
        <small>{promo.route}</small>
        <strong>{promo.label}</strong>
        <em>{promo.savings}</em>
        <span>
          <Plane />
          encontrado por {promo.price}
        </span>
      </div>
    </article>
  );
}

export function HeroSection() {
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const activePromo = promoExamples[activePromoIndex];
  const activeSecondaryPromoIndex = (activePromoIndex + 1) % secondaryPromoExamples.length;
  const activeSecondaryPromo = secondaryPromoExamples[activeSecondaryPromoIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActivePromoIndex((current) => (current + 1) % promoExamples.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="hero-shell" id="inicio" style={heroBackgroundStyle}>
      <div className="container hero-panel">
        <div className="hero-content reveal">
          <span className="hero-kicker">
            <Sparkles />
            Curadoria humana de tarifas e pacotes
          </span>
          <h1>Promoções relâmpago, viagem sob medida.</h1>
          <p>
            Monitoramos tarifas, filtramos oportunidades reais e montamos pacotes personalizados
            com atendimento humano para você decidir com clareza.
          </p>
          <div className="hero-actions">
            <PrimaryButton href={whatsappHref} target="_blank" rel="noreferrer" icon={<MessageCircle />}>
              Entrar no grupo
            </PrimaryButton>
            <SecondaryButton href="#orcamento" icon={<ArrowRight />}>
              Planejar viagem personalizada
            </SecondaryButton>
          </div>
          <div className="hero-proofline" aria-label="Diferenciais da Click To Fly">
            <span>
              <HeartHandshake /> Atendimento humano
            </span>
            <span>
              <WalletCards /> Economia real
            </span>
            <span>
              <BadgeCheck /> Curadoria especializada
            </span>
          </div>
        </div>

        <div className="hero-visual reveal reveal-delay-1" aria-label="Alerta de economia em destaque">
          <HeroPromoCard
            className="hero-promo-rotator-secondary"
            index={activeSecondaryPromoIndex}
            promo={activeSecondaryPromo}
            total={secondaryPromoExamples.length}
          />
          <HeroPromoCard
            className="hero-promo-rotator-primary"
            index={activePromoIndex}
            live
            promo={activePromo}
            total={promoExamples.length}
          />
        </div>
      </div>
    </section>
  );
}
