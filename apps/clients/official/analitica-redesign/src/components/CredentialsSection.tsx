import { CheckCircle2, ExternalLink, MapPin } from "lucide-react";

import { aboutHighlights, aboutPortfolio, contact } from "../data/analitica";
import { assetPath, withBasePath, type NavigateHandler } from "../lib/navigation";
import { Button } from "./ui/button";

type CredentialsSectionProps = {
  onNavigate?: NavigateHandler;
};

export function CredentialsSection({ onNavigate }: CredentialsSectionProps) {
  return (
    <section id="quem-somos" className="section-pad overflow-hidden bg-primary text-primary-foreground">
      <div className="container grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/68">
              Quem somos
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              Mais de 30 anos fornecendo soluções de excelência para laboratórios.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-white/78">
              Fundada em 1989, a Analítica LTDA comercializa reagentes analíticos e suprimentos
              para laboratórios. A empresa mantém sua história e avança com tecnologia,
              atendimento de excelência e equipe qualificada.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {aboutHighlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="page-stagger rounded-xl border border-white/14 bg-white/8 p-5"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <Icon className="size-6 text-accent" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-semibold leading-6">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{item.description}</p>
                </article>
              );
            })}
          </div>

          {onNavigate && (
            <Button asChild className="w-fit bg-white text-primary hover:bg-white/90" size="lg">
              <a
                href={withBasePath("/quem-somos")}
                onClick={(event) => onNavigate("/quem-somos", event)}
              >
                Ver página institucional
              </a>
            </Button>
          )}
        </div>

        <div className="relative flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/14 bg-white p-4 text-foreground shadow-soft">
            <img
              className="h-72 w-full rounded-xl object-cover sm:h-80"
              src={assetPath("/assets/site-quem-somos.png")}
              alt="Imagem institucional da Analítica"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {aboutPortfolio.slice(0, 6).map((item) => (
                <div key={item} className="flex gap-3 rounded-xl bg-secondary/65 p-3 text-sm leading-5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <article className="page-stagger overflow-hidden rounded-2xl border border-white/14 bg-white text-foreground shadow-soft">
            <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="flex flex-col justify-between gap-5 p-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    <MapPin className="size-4" aria-hidden="true" />
                    Onde estamos
                  </div>
                  <h3 className="mt-3 text-xl font-semibold leading-tight text-foreground">
                    Atendimento em Belo Horizonte com localização direta no Maps.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {contact.address}
                  </p>
                </div>
                <Button asChild className="w-fit" variant="outline">
                  <a href={contact.mapsHref} target="_blank" rel="noreferrer">
                    Abrir no Google Maps
                    <ExternalLink data-icon="inline-end" />
                  </a>
                </Button>
              </div>
              <div className="min-h-72 border-t border-border bg-secondary/55 lg:border-l lg:border-t-0">
                <iframe
                  className="h-full min-h-72 w-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={contact.mapsEmbedSrc}
                  title="Mapa da Analítica em Belo Horizonte"
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
