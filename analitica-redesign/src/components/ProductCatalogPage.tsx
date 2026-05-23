import { ArrowLeft, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";

import { defaultQuoteMessage, whatsappHref } from "../lib/contact";
import { withBasePath, type NavigateHandler } from "../lib/navigation";
import { BrandStrip } from "./BrandStrip";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

type ProductCatalogPageProps = {
  onNavigate: NavigateHandler;
};

export function ProductCatalogPage({ onNavigate }: ProductCatalogPageProps) {
  return (
    <main className="page-shell">
      <section className="overflow-hidden border-b border-border bg-white">
        <div className="surface-grid">
          <div className="container grid gap-10 py-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-end lg:py-20">
            <div className="flex flex-col gap-6">
              <Badge className="w-fit" variant="accent">
                Produtos
              </Badge>
              <div className="flex flex-col gap-4">
                <h1 className="max-w-3xl text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
                  Conheça as marcas e linhas do portfólio Analítica.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                  A página de produtos reúne as marcas apresentadas no site original e transforma
                  cada item em uma área expandida com conteúdo técnico reestruturado.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="outline">
                  <a href={withBasePath("/")} onClick={(event) => onNavigate("/", event)}>
                    <ArrowLeft data-icon="inline-start" />
                    Voltar para a home
                  </a>
                </Button>
                <Button asChild variant="whatsapp">
                  <a href={whatsappHref(defaultQuoteMessage)} target="_blank" rel="noreferrer">
                    <MessageCircle data-icon="inline-start" />
                    Falar com especialista
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {["Cotação consultiva", "Produtos certificados", "Validação técnica"].map(
                (item, index) => (
                  <div
                    key={item}
                    className="page-stagger rounded-xl border border-border bg-background/92 p-4 shadow-line"
                    style={{ animationDelay: `${index * 90 + 120}ms` }}
                  >
                    {index === 1 ? (
                      <ShieldCheck className="mb-5 size-5 text-accent" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="mb-5 size-5 text-accent" aria-hidden="true" />
                    )}
                    <p className="text-sm font-semibold leading-5 text-foreground">{item}</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Solicitação por WhatsApp, telefone ou e-mail comercial.
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <BrandStrip />
    </main>
  );
}
