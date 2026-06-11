import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { toAppHref } from "@/lib/routing";

export function NotFoundPage() {
  return (
    <section className="simple-hero" aria-labelledby="not-found-title">
      <Reveal>
        <h1 id="not-found-title">Página não encontrada</h1>
        <p>O caminho solicitado não existe no projeto DGΔD.</p>
        <Button asChild size="lg" variant="outline" className="h-12 w-fit">
          <a href={toAppHref("/")}>
            <ArrowLeft data-icon="inline-start" />
            Voltar para o início
          </a>
        </Button>
      </Reveal>
    </section>
  );
}
