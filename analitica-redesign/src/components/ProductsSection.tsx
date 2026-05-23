import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";

import { whatsappHref } from "../lib/contact";
import { assetPath, withBasePath, type NavigateHandler } from "../lib/navigation";
import { Button } from "./ui/button";

type ProductsSectionProps = {
  onNavigate: NavigateHandler;
};

const previewProducts = [
  {
    name: "Thermo/Oxoid",
    image: assetPath("/assets/marca-thermo.png"),
    className: "left-4 top-8 rotate-[-3deg]",
  },
  {
    name: "Merck",
    image: assetPath("/assets/marca-merck.png"),
    className: "right-5 top-20 rotate-[3deg]",
  },
  {
    name: "Specsol",
    image: assetPath("/assets/marca-specsol.png"),
    className: "bottom-7 left-1/2 -translate-x-1/2",
  },
];

export function ProductsSection({ onNavigate }: ProductsSectionProps) {
  return (
    <section id="area-comercial" className="section-pad overflow-hidden bg-secondary/55">
      <div className="container grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div className="flex max-w-2xl flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Produtos
          </p>
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Do portfólio técnico à cotação, sem carrinho e sem venda automática.
            </h2>
            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              A Analítica trabalha com produtos de venda livre e controlados. Cada solicitação
              segue para atendimento comercial, validação técnica e retorno por WhatsApp ou e-mail.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Venda consultiva", "Marcas reconhecidas", "Validação técnica"].map((item) => (
              <div key={item} className="rounded-xl border border-border bg-white p-4 shadow-line">
                <CheckCircle2 className="mb-4 size-5 text-accent" aria-hidden="true" />
                <p className="text-sm font-semibold leading-5 text-foreground">{item}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href={withBasePath("/produtos")} onClick={(event) => onNavigate("/produtos", event)}>
                Abrir produtos
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a
                href={whatsappHref("Olá, equipe Analítica. Quero falar com o atendimento comercial.")}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle data-icon="inline-start" />
                Falar agora
              </a>
            </Button>
          </div>
        </div>

        <div className="commercial-entry relative min-h-[410px] overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-secondary to-transparent" />
          <div className="relative z-10 flex items-center justify-between gap-4 rounded-xl border border-border bg-background/95 p-4 shadow-line">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Conheça nossos produtos
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                Vitrine por marca e aplicação
              </p>
            </div>
            <ShieldCheck className="size-7 text-accent" aria-hidden="true" />
          </div>

          <div className="relative mt-7 h-[290px]">
            {previewProducts.map((product, index) => (
              <div
                key={product.name}
                className={`commercial-product absolute flex h-40 w-44 items-center justify-center rounded-xl border border-border bg-white p-4 shadow-soft ${product.className}`}
                style={{ animationDelay: `${index * 110}ms` }}
              >
                <img
                  className="max-h-28 w-full scale-110 object-contain"
                  src={product.image}
                  alt={product.name}
                />
              </div>
            ))}
            <div className="absolute bottom-0 right-0 max-w-[15rem] rounded-xl bg-primary p-5 text-primary-foreground shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                Atendimento
              </p>
              <p className="mt-3 text-lg font-semibold leading-6">
                A equipe confirma especificação, disponibilidade e prazo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
