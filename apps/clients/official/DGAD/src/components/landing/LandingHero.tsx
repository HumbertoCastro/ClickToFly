import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { offer } from "@/data/site";

const heroSeals = ["Método LifeForce 360º", "7 e-books integrados", "Aplicação prática", "Acesso imediato"];

export function LandingHero() {
  return (
    <section className="lf-hero premium-hero" aria-labelledby="hero-title">
      <div className="lf-hero__wash" aria-hidden="true" />
      <div className="lf-hero__inner">
        <div className="lf-hero__copy">
          <p className="section-kicker">LifeForce 360º | Código do Guerreiro</p>
          <h1 id="hero-title" className="lf-hero__title">
            <span className="hero-title-line">Transforme disciplina</span>{" "}
            <span className="hero-title-line">em resultado real.</span>
          </h1>
          <p className="lf-hero__lead">
            Um sistema prático criado para quem cansou de começar e parar. Evolua saúde, família, finanças,
            trabalho e espiritualidade por meio do Delta Positivo.
          </p>
          <div className="lf-hero__actions">
            <Button asChild size="lg" className="cta-button h-12 px-5 active:scale-[0.96]">
              <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
                Comprar a coleção completa
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-5 active:scale-[0.96]">
              <a href="#metodo">
                Ver o método
                <ChevronRight data-icon="inline-end" />
              </a>
            </Button>
          </div>
          <ul className="lf-hero__seals" aria-label="Destaques do método">
            {heroSeals.map((seal) => (
              <li key={seal}>
                <CheckCircle2 aria-hidden="true" />
                {seal}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
}
