import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  MessageCircle,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  TicketPercent,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { useMemo, useRef, useState } from 'react';
import heroPlaneImage from '../../MainImage.png';
import ctaCloudSkyImage from '../assets/cta-cloud-sky.png';
import {
  clickAdvantages,
  deals,
  destinations,
  testimonials,
  whatsappMessage,
  whatsappNumber,
} from '../data';
import { withBasePath } from '../lib/routing';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { TasteFlightScene } from './TasteFlightScene';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
const revealSentence =
  'A Click To Fly transforma alerta em critério: rota, janela, regra e atendimento aparecem juntos para você decidir sem pressa artificial.';
const portraitSeeds = ['mariana-airport', 'rafael-family-flight', 'camila-travel-planner'];

const bentoCards = [
  {
    className: 'taste-bento-card-large',
    icon: Search,
    title: 'Radar de oportunidade com leitura humana.',
    text:
      'Monitoramos rotas e datas sem despejar volume. A oferta só vira destaque quando existe chance clara de economia e regra compreensível.',
    image: deals[0].image,
  },
  {
    icon: BadgeCheck,
    title: 'Regra antes do impulso.',
    text: 'Disponibilidade, bagagem, conexões e janela de compra aparecem antes da decisão.',
  },
  {
    icon: BellRing,
    title: 'Alerta no timing certo.',
    text: 'O WhatsApp recebe poucos avisos, direto ao ponto, quando a janela realmente importa.',
  },
  {
    icon: TicketPercent,
    title: 'Economia verificável.',
    text: 'Comparamos preço encontrado, média e período para evitar promessa vaga.',
  },
  {
    icon: ShieldCheck,
    title: 'Pacote com pós-venda.',
    text: 'Depois da promoção, a equipe monta hospedagem, seguro e extras com critério.',
  },
];

export function TasteLandingPage() {
  const rootRef = useRef<HTMLElement | null>(null);
  const desireRef = useRef<HTMLElement | null>(null);
  const activeJourneyRef = useRef(0);
  const [activeDestination, setActiveDestination] = useState(0);
  const [activeJourneyStep, setActiveJourneyStep] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const revealWords = useMemo(() => revealSentence.split(' '), []);
  const journeySteps = useMemo(() => clickAdvantages.slice(0, 4), []);
  const activeJourney = journeySteps[activeJourneyStep];
  const activeQuote = testimonials[activeTestimonial];

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion) {
        return;
      }

      gsap
        .timeline({ defaults: { duration: 0.9, ease: 'power3.out' } })
        .from('.taste-hero-word', { y: 72, opacity: 0, stagger: 0.08 })
        .from('.taste-hero-copy p, .taste-hero-actions', { y: 28, opacity: 0, stagger: 0.12 }, '-=0.35')
        .from('.taste-hero-panel', { y: 44, opacity: 0, scale: 0.94 }, '-=0.45');

      gsap.from('.taste-bento-card', {
        y: 76,
        opacity: 0,
        stagger: 0.09,
        duration: 0.95,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.taste-bento-grid',
          start: 'top 72%',
        },
      });

      gsap.fromTo(
        '.taste-destination-card img',
        { scale: 0.82, opacity: 0.38 },
        {
          scale: 1,
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: {
            trigger: '.taste-accordion',
            start: 'top 82%',
            end: 'bottom 42%',
            scrub: true,
          },
        },
      );

      const journeyTrigger = ScrollTrigger.create({
        trigger: '.taste-desire',
        start: 'top top',
        end: 'bottom bottom',
        pin: '.taste-desire-stage',
        pinSpacing: false,
        onUpdate: (self) => {
          const nextStep = Math.min(
            journeySteps.length - 1,
            Math.floor(self.progress * journeySteps.length),
          );

          if (activeJourneyRef.current !== nextStep) {
            activeJourneyRef.current = nextStep;
            setActiveJourneyStep(nextStep);
          }
        },
      });

      gsap.to('.taste-scrub-word', {
        opacity: 1,
        y: 0,
        stagger: 0.08,
        ease: 'none',
        scrollTrigger: {
          trigger: '.taste-text-reveal',
          start: 'top 62%',
          end: 'bottom 28%',
          scrub: true,
        },
      });

      return () => journeyTrigger.kill();
    },
    { dependencies: [journeySteps.length], scope: rootRef },
  );

  const goToQuote = (direction: number) => {
    setActiveTestimonial((current) => (current + direction + testimonials.length) % testimonials.length);
  };

  const scrollToJourneyStep = (index: number) => {
    const section = desireRef.current;

    if (!section) {
      return;
    }

    const sectionTop = window.scrollY + section.getBoundingClientRect().top;
    const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
    const target = sectionTop + scrollable * (index / Math.max(1, journeySteps.length - 1));

    window.scrollTo({ behavior: 'smooth', top: target });
  };

  return (
    <main className="taste-main" ref={rootRef}>
      <section className="taste-hero" id="inicio">
        <div className="taste-hero-media" style={{ backgroundImage: `url(${heroPlaneImage})` }} aria-hidden="true" />
        <div className="taste-hero-wash" aria-hidden="true" />

        <div className="container taste-hero-inner">
          <div className="taste-hero-copy">
            <h1 aria-label="Viagens raras no momento certo.">
              <span className="taste-hero-word">Viagens raras</span>
              <span className="taste-hero-word">no momento certo.</span>
            </h1>
            <p>
              Curadoria de tarifas, pacotes e atendimento humano para transformar uma boa
              oportunidade em uma viagem decidida com clareza.
            </p>
            <div className="taste-hero-actions" aria-label="Ações principais">
              <PrimaryButton href={whatsappHref} target="_blank" rel="noreferrer" icon={<MessageCircle />}>
                Entrar no grupo
              </PrimaryButton>
              <SecondaryButton href={withBasePath('/orcamento')} icon={<ArrowRight />}>
                Planejar viagem
              </SecondaryButton>
            </div>
          </div>

          <div className="taste-hero-panel" aria-label="Fluxo de curadoria Click To Fly">
            <span>
              <Sparkles />
              Curadoria ativa
            </span>
            <strong>{deals[1].origin} para {deals[1].destination}</strong>
            <p>Preço encontrado, período e economia analisados antes de chegar até você.</p>
            <div>
              <em>{deals[1].foundPrice}</em>
              <small>janela acompanhada pela equipe</small>
            </div>
          </div>
        </div>
      </section>

      <section className="taste-interest" id="promocoes">
        <div className="container">
          <div className="taste-section-heading taste-section-heading-wide">
            <h2>Menos feed de oferta. Mais critério antes de comprar.</h2>
            <p>
              A página anterior repetia cards e selos em excesso. Aqui, cada bloco ocupa uma
              função: descobrir, validar, avisar, comparar e montar o pacote.
            </p>
          </div>

          <div className="taste-bento-grid" aria-label="Sistema de curadoria Click To Fly">
            {bentoCards.map((card) => {
              const Icon = card.icon;

              return (
                <article className={`taste-bento-card ${card.className ?? ''}`} key={card.title}>
                  {card.image ? (
                    <div className="taste-bento-image" aria-hidden="true">
                      <img src={card.image} alt="" />
                    </div>
                  ) : null}
                  <div className="taste-bento-copy">
                    <span className="taste-bento-icon">
                      <Icon />
                    </span>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="taste-destinations" id="destinos">
        <div className="container">
          <div className="taste-section-heading">
            <h2>Destinos com presença, não uma vitrine genérica.</h2>
            <p>
              Passe pelas imagens: cada destino abre espaço como uma página editorial, com a foto
              carregando a decisão visual.
            </p>
          </div>

          <div className="taste-accordion" aria-label="Destinos em destaque">
            {destinations.map((destination, index) => (
              <button
                className={`taste-destination-card ${index === activeDestination ? 'is-active' : ''}`}
                key={destination.name}
                type="button"
                onClick={() => setActiveDestination(index)}
                onFocus={() => setActiveDestination(index)}
                onMouseEnter={() => setActiveDestination(index)}
              >
                <img src={destination.image} alt={destination.imageAlt} />
                <span className="taste-destination-shade" aria-hidden="true" />
                <span className="taste-destination-copy">
                  <strong>{destination.name}</strong>
                  <small>{destination.description}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section
        className="taste-desire"
        id="como-funciona"
        ref={desireRef}
        style={{ '--journey-steps': journeySteps.length } as CSSProperties & { '--journey-steps': number }}
      >
        <div className="container taste-desire-stage">
          <TasteFlightScene />
          <aside className="taste-desire-pin">
            <span className="taste-journey-count">
              {String(activeJourneyStep + 1).padStart(2, '0')} / {String(journeySteps.length).padStart(2, '0')}
            </span>
            <h2>Do alerta ao embarque, a decisão fica limpa.</h2>
            <strong className="taste-active-step-title">{activeJourney.title}</strong>
            <p className="taste-text-reveal">
              {revealWords.map((word, index) => (
                <span className="taste-scrub-word" key={`${word}-${index}`}>
                  {word}
                </span>
              ))}
            </p>
            <div className="taste-step-dots" aria-label="Etapas da curadoria">
              {journeySteps.map((step, index) => (
                <button
                  aria-current={activeJourneyStep === index ? 'step' : undefined}
                  aria-label={`Ir para ${step.title}`}
                  className={activeJourneyStep === index ? 'is-active' : ''}
                  key={step.title}
                  onClick={() => scrollToJourneyStep(index)}
                  type="button"
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="taste-stack" aria-label="Etapas de atendimento">
            {journeySteps.map((advantage, index) => (
              <article
                aria-hidden={activeJourneyStep !== index}
                className={`taste-stack-card ${activeJourneyStep === index ? 'is-active' : ''}`}
                key={advantage.title}
              >
                <span className="taste-stack-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="taste-stack-icon">{advantage.icon}</span>
                <h3>{advantage.title}</h3>
                <p>{advantage.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="taste-social-proof">
        <div className="container taste-proof-layout">
          <div className="taste-proof-copy">
            <h2>Atendimento com rosto, contexto e continuidade.</h2>
            <p>
              O grupo abre a oportunidade. A conversa individual transforma a oferta em plano real,
              com rota, perfil, hospedagem e serviços alinhados.
            </p>
            <div className="taste-proof-metrics" aria-label="Indicadores operacionais">
              <span>
                <CircleDollarSign />
                economia comparada
              </span>
              <span>
                <Plane />
                rotas acompanhadas
              </span>
            </div>
          </div>

          <div className="taste-carousel" aria-live="polite">
            <div
              className="taste-carousel-portrait"
              style={
                {
                  '--portrait-image': `url(https://picsum.photos/seed/${portraitSeeds[activeTestimonial]}/420/520)`,
                } as CSSProperties & Record<'--portrait-image', string>
              }
              aria-hidden="true"
            />
            <blockquote>
              <p>{activeQuote.quote}</p>
              <footer>
                <strong>{activeQuote.name}</strong>
                <span>{activeQuote.detail}</span>
              </footer>
            </blockquote>
            <div className="taste-carousel-actions">
              <button type="button" aria-label="Depoimento anterior" onClick={() => goToQuote(-1)}>
                <ChevronLeft />
              </button>
              <button type="button" aria-label="Próximo depoimento" onClick={() => goToQuote(1)}>
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="taste-action" id="contato">
        <div
          className="container taste-action-panel"
          style={
            {
              '--taste-action-image': `url(${ctaCloudSkyImage})`,
            } as CSSProperties & Record<'--taste-action-image', string>
          }
        >
          <div>
            <h2>Receba o próximo achado antes que vire arrependimento.</h2>
            <p>
              Entre no grupo para acompanhar oportunidades selecionadas ou envie um briefing para a
              equipe montar uma viagem sob medida.
            </p>
          </div>
          <div className="taste-action-buttons">
            <PrimaryButton href={whatsappHref} target="_blank" rel="noreferrer" icon={<MessageCircle />}>
              Receber ofertas
            </PrimaryButton>
            <SecondaryButton href={withBasePath('/orcamento')} icon={<ArrowRight />}>
              Fazer orçamento
            </SecondaryButton>
          </div>
        </div>
      </section>
    </main>
  );
}
