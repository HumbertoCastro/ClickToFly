import { ArrowRight, Triangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { offer } from "@/data/site";

export function LandingFinalCta() {
  return (
    <section className="final-cta" aria-labelledby="final-title">
      <Reveal>
        <Triangle aria-hidden="true" />
        <h2 id="final-title">Seu futuro não muda sozinho.</h2>
        <p>Disciplina gera destino.</p>
        <Button asChild size="lg" className="cta-button h-12 px-5 active:scale-[0.96]">
          <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
            Comprar a coleção completa
            <ArrowRight data-icon="inline-end" />
          </a>
        </Button>
      </Reveal>
    </section>
  );
}
