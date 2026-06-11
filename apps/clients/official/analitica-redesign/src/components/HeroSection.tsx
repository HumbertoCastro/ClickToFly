import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Headphones,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { contact } from "../data/analitica";
import { defaultQuoteMessage, whatsappHref } from "../lib/contact";
import { assetPath, withBasePath, type NavigateHandler } from "../lib/navigation";
import { Button } from "./ui/button";

type HeroSectionProps = {
  onNavigate: NavigateHandler;
};

const benefits = [
  { label: "Entrega rápida", icon: Truck },
  { label: "Produtos certificados", icon: ShieldCheck },
  { label: "Pronta entrega", icon: PackageCheck },
  { label: "Suporte técnico", icon: Headphones },
];

const heroTiles = [
  {
    title: "Kits para análise de água",
    description: "Visual e fotométrico",
    image: assetPath("/assets/produto-kit-agua.jpg"),
  },
  {
    title: "Filtros de seringa",
    description: "Filtração estéril e não estéril",
    image: assetPath("/assets/produto-filtros-seringa.jpg"),
  },
  {
    title: "Acetonitrila HPLC",
    description: "Alto grau de pureza",
    image: assetPath("/assets/produto-acetonitrila.jpg"),
  },
  {
    title: "Ácido Clorídrico",
    description: "Reagente essencial",
    image: assetPath("/assets/produto-acido-cloridrico.jpg"),
  },
  {
    title: "Extran",
    description: "Limpeza e desinfecção",
    image: assetPath("/assets/produto-extran.png"),
  },
  {
    title: "Fita pH Merck",
    description: "Alta precisão",
    image: assetPath("/assets/produto-fita-ph.jpg"),
  },
];

export function HeroSection({ onNavigate }: HeroSectionProps) {
  const carouselItems = [...heroTiles, ...heroTiles];

  return (
    <section id="topo" className="hero-lab">
      <div className="hero-stage">
        <div className="hero-shell-card">
          <div className="hero-benefit-row" aria-label="Diferenciais de atendimento">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="hero-benefit-item">
                  <Icon className="size-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="hero-nav-row">
            <a
              className="hero-logo-link"
              href={withBasePath("/")}
              onClick={(event) => onNavigate("/", event)}
              aria-label="Voltar ao início"
            >
              <img src={assetPath("/assets/logo-analitica.png")} alt="Analítica" />
            </a>

            <nav className="hero-nav-links" aria-label="Navegação principal">
              <a href={withBasePath("/produtos")} onClick={(event) => onNavigate("/produtos", event)}>
                Produtos
                <ChevronDown className="size-4" aria-hidden="true" />
              </a>
              <a href={withBasePath("/#solucoes")} onClick={(event) => onNavigate("/#solucoes", event)}>
                Soluções
                <ChevronDown className="size-4" aria-hidden="true" />
              </a>
              <a href={withBasePath("/#produtos")} onClick={(event) => onNavigate("/#produtos", event)}>
                Diferenciais
              </a>
              <a href={withBasePath("/contato")} onClick={(event) => onNavigate("/contato", event)}>
                Contato
              </a>
            </nav>

            <Button asChild className="hero-nav-cta">
              <a href={withBasePath("/orcamento")} onClick={(event) => onNavigate("/orcamento", event)}>
                <MessageCircle data-icon="inline-start" />
                Solicitar cotação
              </a>
            </Button>
          </div>

          <div className="hero-showcase">
            <div className="hero-copy-panel">
              <div className="hero-deadline-pill">
                <Clock3 className="size-5" aria-hidden="true" />
                Cotação em até 24h
              </div>

              <div className="text-reveal-stack">
                <h1>
                  <span>Insumos laboratoriais</span>
                  <span>com qualidade e pronta entrega.</span>
                </h1>
              </div>

              <p>
                Kits, reagentes, solventes e consumíveis para laboratórios, indústrias e análises
                com atendimento técnico especializado.
              </p>

              <div className="hero-bullets" aria-label="Principais garantias">
                {[
                  "Reagentes analíticos e suprimentos",
                  "Produtos de venda livre e controlados",
                  "Equipe técnica qualificada",
                ].map((item) => (
                  <span key={item}>
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>

              <Button asChild className="hero-primary-action" size="lg" variant="whatsapp">
                <a href={whatsappHref(defaultQuoteMessage)} target="_blank" rel="noreferrer">
                  <MessageCircle data-icon="inline-start" />
                  Falar com um especialista
                </a>
              </Button>

              <a className="hero-contact-line" href={contact.emailHref}>
                <MessageCircle className="size-5" aria-hidden="true" />
                Atendimento rápido via WhatsApp, telefone e e-mail
              </a>
            </div>

            <div className="hero-gallery" aria-label="Produtos em destaque">
              <div className="hero-gallery-mask">
                <div className="hero-gallery-column hero-gallery-track">
                  {carouselItems.map((item, index) => (
                    <article
                      key={`${item.title}-left-${index}`}
                      className="hero-product-tile"
                      aria-hidden={index >= heroTiles.length}
                    >
                      <img src={item.image} alt={item.title} />
                      <div>
                        <h2>{item.title}</h2>
                        <p>{item.description}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hero-gallery-column hero-gallery-track hero-gallery-track-reverse">
                  {carouselItems
                    .slice()
                    .reverse()
                    .map((item, index) => (
                      <article
                        key={`${item.title}-right-${index}`}
                        className="hero-product-tile"
                        aria-hidden={index >= heroTiles.length}
                      >
                        <img src={item.image} alt={item.title} />
                        <div>
                          <h2>{item.title}</h2>
                          <p>{item.description}</p>
                        </div>
                      </article>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
