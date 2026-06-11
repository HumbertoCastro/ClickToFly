import { ArrowRight, Shield, Triangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OfferPanel } from "@/components/OfferPanel";
import { Reveal } from "@/components/Reveal";
import { contactInfo, mediaAssets, offer, pillars } from "@/data/site";

export function AboutPage() {
  return (
    <>
      <section className="simple-hero" aria-labelledby="about-title">
        <Reveal>
          <h1 id="about-title">Sobre o DGΔD</h1>
          <p>
            O DGΔD nasceu de uma ideia simples: a vida muda quando existe direção. Não é sobre motivação momentânea. É
            sobre disciplina aplicada todos os dias.
          </p>
        </Reveal>
      </section>

      <section className="creator-section" aria-labelledby="about-creator-title">
        <div className="creator-media">
          <img src={mediaAssets.creator.portrait} alt="Paulo Matos, criador do DGΔD" />
        </div>
        <Reveal className="creator-copy">
          <p className="section-kicker">Criador</p>
          <h2 id="about-creator-title">Paulo Matos</h2>
          <p>
            Empresário, pai de família, faixa preta de Jiu-Jitsu, formado em Marketing e pós-graduado em Vendas e
            Negociação pela FAAP, Fundação Armando Álvares Penteado, Paulo Matos criou o projeto após anos estudando
            performance, equilíbrio pessoal e desenvolvimento humano na prática.
          </p>
          <p>
            O método une princípios de disciplina, execução e responsabilidade pessoal para ajudar pessoas a
            organizarem a própria vida com mais clareza, força mental e direção.
          </p>
        </Reveal>
      </section>

      <section className="section-shell" aria-labelledby="about-pillars-title">
        <Reveal className="section-heading">
          <p className="section-kicker">Ecossistema</p>
          <h2 id="about-pillars-title">LifeForce 360º trabalha pilares fundamentais da vida.</h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map((pillar) => (
            <Reveal key={pillar.id}>
              <a
                className="about-pillar-link"
                href={pillar.referenceUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`${pillar.title}: abrir livro de referência ${pillar.referenceTitle}`}
              >
                <Card className="about-pillar-card">
                  <CardContent>
                    <Triangle aria-hidden="true" />
                    <h3>{pillar.title}</h3>
                    <p>{pillar.description}</p>
                    <span className="about-pillar-link__label">
                      Ver livro de referência
                      <ArrowRight aria-hidden="true" />
                    </span>
                  </CardContent>
                </Card>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-shell philosophy-section" aria-labelledby="philosophy-title">
        <Reveal>
          <Shield aria-hidden="true" />
          <h2 id="philosophy-title">Pequenas evoluções constantes criam grandes transformações.</h2>
          <p>
            O símbolo Δ representa evolução contínua. O DGΔD não foi criado apenas para inspirar. Foi criado para ser
            aplicado no dia a dia.
          </p>
          <p>Contato: {contactInfo.whatsapp}</p>
          <Button asChild size="lg" className="cta-button h-12">
            <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
              Conhecer o Código Completo
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        </Reveal>
      </section>

      <section className="section-shell" aria-labelledby="about-offer-title">
        <Reveal className="section-heading">
          <p className="section-kicker">Próximo passo</p>
          <h2 id="about-offer-title">A filosofia entra no método completo.</h2>
        </Reveal>
        <Reveal>
          <OfferPanel emphasis="hero" />
        </Reveal>
      </section>
    </>
  );
}
