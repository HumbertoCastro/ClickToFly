import { ArrowRight, FileCheck2, LockKeyhole, MessageCircle, ShieldCheck } from "lucide-react";

import { commercialFlow, complianceItems, contact } from "../data/analitica";
import { whatsappHref } from "../lib/contact";
import { assetPath, withBasePath, type NavigateHandler } from "../lib/navigation";
import { Button } from "./ui/button";

type ComplianceSectionProps = {
  onNavigate?: NavigateHandler;
};

const controlledProductMessage =
  "Olá, equipe Analítica. Preciso consultar um produto controlado e validar documentação, disponibilidade e aplicação.";

export function ComplianceSection({ onNavigate }: ComplianceSectionProps) {
  return (
    <section id="controlados" className="overflow-hidden bg-primary text-primary-foreground">
      <div className="container grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-24">
        <div className="page-stagger flex max-w-2xl flex-col gap-7">
          <div className="flex w-fit items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/78 ring-1 ring-white/15">
            <LockKeyhole className="size-4" aria-hidden="true" />
            Produtos químicos controlados
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold leading-tight text-white sm:text-5xl">
              Controle, documentação e atendimento antes da cotação.
            </h2>
            <p className="max-w-xl text-base leading-8 text-white/78">
              Produtos controlados por Polícia Federal, Exército e Polícia Civil exigem rigor no
              repasse, cuidado nos mapas de controle e retorno comercial transparente.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {["Documentação", "Aplicação", "Disponibilidade"].map((item, index) => (
              <div
                key={item}
                className="page-stagger rounded-xl bg-white/10 p-4 ring-1 ring-white/15"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <ShieldCheck className="mb-5 size-5 text-accent" aria-hidden="true" />
                <p className="text-sm font-semibold leading-5 text-white">{item}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row">
            <Button
              asChild
              className="bg-white text-primary transition-transform hover:bg-white/90 active:scale-[0.96]"
              size="lg"
            >
              <a href={whatsappHref(controlledProductMessage)} target="_blank" rel="noreferrer">
                <MessageCircle data-icon="inline-start" />
                Consultar produto controlado
              </a>
            </Button>
            <Button
              asChild
              className="border-white/30 bg-transparent text-white transition-transform hover:bg-white/10 active:scale-[0.96]"
              size="lg"
              variant="outline"
            >
              <a
                href={withBasePath("/produtos-quimicos-controlados")}
                onClick={
                  onNavigate
                    ? (event) => onNavigate("/produtos-quimicos-controlados", event)
                    : undefined
                }
              >
                Ver página completa
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
          </div>

          <div className="grid gap-3 pt-2">
            {complianceItems.map((item) => (
              <div key={item} className="flex gap-3 text-sm leading-6 text-white/76">
                <FileCheck2 className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
            <a
              className="text-sm font-semibold text-white underline decoration-white/35 underline-offset-4 hover:decoration-white"
              href={contact.qualityEmailHref}
            >
              Dúvidas sobre lançamentos e mapas: {contact.qualityEmail}
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="page-stagger relative overflow-hidden rounded-2xl bg-white p-5 text-foreground shadow-soft">
            <img
              className="h-64 w-full rounded-xl object-cover"
              src={assetPath("/assets/site-controlados.jpg")}
              alt="Trabalhadora fazendo anotações em armazém"
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {commercialFlow.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.title}
                    className="page-stagger rounded-xl bg-secondary/70 p-5"
                    style={{ animationDelay: `${index * 90 + 120}ms` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex size-11 items-center justify-center rounded-lg bg-white text-primary shadow-line">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="tabular-nums text-sm font-semibold text-muted-foreground">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 text-base font-semibold leading-6">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
