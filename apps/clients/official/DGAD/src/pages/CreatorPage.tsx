import { ArrowRight, BadgeCheck, CirclePlay, HeartHandshake, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { mediaAssets, offer, pillars } from "@/data/site";

const lifeMarkers = [
  {
    title: "Faixa preta de Jiu-Jitsu",
    text: "Disciplina, repetição e governo próprio aplicados antes do discurso.",
  },
  {
    title: "Pai e marido",
    text: "Família como prioridade prática, não como frase bonita para depois.",
  },
  {
    title: "Empreendedor",
    text: "Trabalho, vendas, recomeços e decisões difíceis transformados em método.",
  },
  {
    title: "Formado em Marketing",
    text: "Base estratégica para posicionar ideias, comunicar valor e transformar experiência em direção prática.",
  },
  {
    title: "Pós-graduado em Vendas e Negociação",
    text: "Formação pela FAAP, Fundação Armando Álvares Penteado, aplicada à construção de acordos, decisão e resultado.",
  },
];

const codePrinciples = [
  {
    title: "Direção",
    text: "Saber qual área da vida precisa ser organizada primeiro.",
    Icon: Target,
  },
  {
    title: "Responsabilidade",
    text: "Assumir o comando da rotina sem terceirizar culpa ou destino.",
    Icon: ShieldCheck,
  },
  {
    title: "Presença",
    text: "Cuidar de corpo, família, trabalho e fé com constância real.",
    Icon: HeartHandshake,
  },
  {
    title: "Evolução",
    text: "Pequenas melhorias repetidas até a vida mudar de direção.",
    Icon: Sparkles,
  },
];

export function CreatorPage() {
  return (
    <>
      <section className="creator-hero" aria-labelledby="creator-title">
        <Reveal className="creator-hero__copy">
          <p className="section-kicker">Criador do LifeForce 360º</p>
          <h1 id="creator-title">Paulo Matos transformou disciplina vivida em um código aplicável.</h1>
          <p>
            O DGΔD não nasceu como teoria de palco. Nasceu da vida real: treino, trabalho, família, vendas, recomeços,
            fé e decisões repetidas quando a motivação já tinha acabado.
          </p>
          <div className="creator-hero__actions">
            <Button asChild size="lg" className="cta-button h-12 px-5 active:scale-[0.96]">
              <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
                Comprar a coleção completa
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-5 active:scale-[0.96]">
              <a href="#video-paulo">
                Assistir Paulo
                <CirclePlay data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </Reveal>

        <div className="creator-hero__portrait motion-scale">
          <img src={mediaAssets.creator.portrait} alt="Paulo Matos, criador do LifeForce 360º" />
          <div className="creator-hero__seal" aria-label="Identidade do criador">
            <BadgeCheck aria-hidden="true" />
            <span>Disciplina Gera Destino</span>
          </div>
        </div>
      </section>

      <section className="creator-video-section" id="video-paulo" aria-labelledby="creator-video-title">
        <Reveal className="creator-video-section__heading">
          <p className="section-kicker">Vídeo do criador</p>
          <h2 id="creator-video-title">Paulo explica o projeto e o que é o código LifeForce 360º.</h2>
          <p>
            A melhor entrada para entender o método é ouvir a origem pela voz do próprio criador: por que o sistema foi
            criado, para quem ele existe e como ele organiza a vida em volta de escolhas mais fortes.
          </p>
        </Reveal>

        <div className="creator-video-layout">
          <div className="creator-video-frame motion-scale">
            <video
              aria-label="Paulo Matos explicando o projeto LifeForce 360º"
              controls
              controlsList="nodownload"
              playsInline
              preload="metadata"
              poster={mediaAssets.creator.videoPoster}
              src={mediaAssets.creator.video}
            />
          </div>

          <Reveal className="creator-video-notes">
            <span>Assista antes de decidir</span>
            <h3>O método fica mais claro quando você entende a pessoa por trás dele.</h3>
            <p>
              O LifeForce 360º propõe uma régua simples: nenhuma área importante da vida pode ficar abandonada por muito
              tempo sem cobrar preço em outra. O código organiza esse retorno ao centro.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="creator-family-section" aria-labelledby="creator-family-title">
        <div className="creator-family-section__image motion-scale">
          <img src={mediaAssets.creator.family} alt="Paulo Matos em um momento com a família" />
        </div>
        <Reveal className="creator-family-section__copy">
          <p className="section-kicker">Família como centro</p>
          <h2 id="creator-family-title">A disciplina que Paulo defende começa em casa.</h2>
          <p>
            Para Paulo, família não é uma área separada do método. É o motivo para cuidar melhor da saúde, organizar o
            trabalho, proteger o tempo e tomar decisões com mais direção.
          </p>
          <p>
            O LifeForce 360º fala de performance, mas não como fuga da vida real. A proposta é sustentar presença,
            legado e responsabilidade nos lugares que mais importam.
          </p>
        </Reveal>
      </section>

      <section className="creator-story-section" aria-labelledby="creator-story-title">
        <Reveal className="creator-story-section__intro">
          <p className="section-kicker">Origem prática</p>
          <h2 id="creator-story-title">A autoridade aqui vem da aplicação.</h2>
        </Reveal>
        <div className="creator-story-layout">
          <figure className="creator-casual-photo motion-scale">
            <img src={mediaAssets.creator.casual} alt="Paulo Matos em um momento casual" />
            <figcaption>Presença real, fora do estúdio.</figcaption>
          </figure>
          <div className="creator-marker-grid">
            {lifeMarkers.map((marker) => (
              <Reveal key={marker.title}>
                <article className="creator-marker">
                  <h3>{marker.title}</h3>
                  <p>{marker.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="creator-code-section" aria-labelledby="creator-code-title">
        <div className="creator-code-section__media motion-scale">
          <img src={mediaAssets.creator.discipline} alt="Imagem editorial do Código do Guerreiro DGΔD" />
        </div>

        <Reveal className="creator-code-section__copy">
          <p className="section-kicker">Código LifeForce 360º</p>
          <h2 id="creator-code-title">Um mapa para a vida deixar de girar no improviso.</h2>
          <p>
            O código conecta disciplina, energia, família, trabalho, finanças, espiritualidade e tempo. A proposta não é
            criar uma versão perfeita de você, mas uma rotina forte o suficiente para sustentar a próxima decisão.
          </p>
          <div className="creator-code-grid">
            {codePrinciples.map(({ title, text, Icon }) => (
              <article key={title} className="creator-code-card">
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="creator-pillar-section" aria-labelledby="creator-pillars-title">
        <Reveal className="creator-pillar-section__heading">
          <p className="section-kicker">LifeForce 360º</p>
          <h2 id="creator-pillars-title">Os pilares que Paulo transformou em estrutura.</h2>
        </Reveal>
        <div className="creator-pillar-strip" role="list" aria-label="Pilares do LifeForce 360º">
          {pillars.map((pillar, index) => (
            <a
              key={pillar.id}
              className="creator-pillar-item"
              href={pillar.referenceUrl}
              target="_blank"
              rel="noreferrer"
              role="listitem"
              aria-label={`${pillar.title}: abrir livro de referência ${pillar.referenceTitle}`}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.promise}</p>
              <small>Ver livro: {pillar.referenceTitle}</small>
            </a>
          ))}
        </div>
      </section>

      <section className="creator-final-band" aria-labelledby="creator-final-title">
        <Reveal className="creator-final-band__copy">
          <p className="section-kicker">Próximo passo</p>
          <h2 id="creator-final-title">Conhecer Paulo é entender por que o código precisa ser aplicado.</h2>
          <p>
            O conteúdo completo leva essa visão para uma estrutura prática de decisão, rotina e execução. Não é sobre
            parecer disciplinado. É sobre construir uma vida que responda melhor às suas escolhas.
          </p>
          <Button asChild size="lg" className="cta-button h-12 w-fit px-5 active:scale-[0.96]">
            <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
              Comprar a coleção completa
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        </Reveal>
        <div className="creator-final-band__image motion-scale">
          <img src={mediaAssets.creator.project} alt="Imagem visual do projeto DGΔD LifeForce 360º" />
        </div>
      </section>
    </>
  );
}
