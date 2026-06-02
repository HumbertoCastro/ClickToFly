import { useRef, useState, type CSSProperties } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  CirclePlay,
  CircleDollarSign,
  Dumbbell,
  Flame,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { LandingFinalCta } from "@/components/landing/LandingFinalCta";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingOfferSection } from "@/components/landing/LandingOfferSection";
import { LandingPracticeTimeline } from "@/components/landing/LandingPracticeTimeline";
import { Reveal } from "@/components/Reveal";
import { customerFeedbackVideos, mediaAssets, offer, pillars } from "@/data/site";
import { toAppHref } from "@/lib/routing";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const painQuestions = [
  "Você começa projetos e abandona?",
  "Trabalho, saúde, família e rotina vivem desequilibrados?",
  "Você sabe o que precisa fazer, mas não consegue manter constância?",
];

const warriorPrinciples = ["Decisão", "Governo próprio", "Disciplina", "Fé", "Ação", "Constância"];

const compassPillars = [
  { number: "01", title: "Saúde", promise: "Corpo como base." },
  { number: "02", title: "Família", promise: "Prioridade com direção." },
  { number: "03", title: "Trabalho", promise: "Execução diária." },
  { number: "04", title: "Finanças", promise: "Controle sem fantasia." },
  { number: "05", title: "Espiritualidade", promise: "Propósito como norte." },
  { number: "06", title: "Descanso", promise: "Recuperação estratégica." },
  { number: "07", title: "Governo próprio", promise: "Comando interno." },
];

const ebookPreviews = [
  {
    title: "O Código do Guerreiro",
    theme: "Decisão",
    text: "Há um momento na vida em que o silêncio é mais barulhento que qualquer multidão. É o instante em que você se encara no espelho e percebe que ninguém virá te salvar. Nem sorte. Nem milagres fáceis. Nem desculpas bem contadas. Só você, sua fé e a decisão que escolhe tomar. A maioria das pessoas sonha com uma vida melhor. Poucos decidem pagar o preço. Porque toda mudança começa com um corte. E todo corte dói. É a dor de abandonar a velha versão. O conforto. As desculpas. O amanhã eu começo. Mas é justamente aqui que algo muda...",
  },
  {
    title: "Espiritualidade e Propósito",
    theme: "Chamado",
    text: "Há um momento na vida em que o barulho do mundo já não convence mais. Os aplausos perdem o sentido. O dinheiro não basta. Até as vitórias parecem incompletas. É quando o silêncio começa a falar. E a alma, adormecida há tanto tempo, desperta. Não é o fim. É o chamado. O chamado aparece no cansaço sem explicação. Na sensação de estar cumprindo tarefas, mas não vivendo uma missão. Como se Deus colocasse a mão no ombro e dissesse: está na hora de voltar pra dentro. E é exatamente aí que essa jornada começa...",
  },
  {
    title: "Finanças e Prosperidade",
    theme: "Controle",
    text: "A maioria das pessoas não quer liberdade. Quer conforto. E é por isso que o dinheiro domina tanta gente. O homem que busca prosperidade sem consciência se torna escravo daquilo que conquista. Mas existe outra forma. O guerreiro financeiro entende algo diferente: dinheiro é ferramenta. Não destino. Cada real é uma decisão. Cada gasto é um voto. Cada hábito financeiro constrói ou destrói o futuro. Prosperidade não começa na conta bancária. Começa na mente. E quase ninguém percebe isso até ser tarde...",
  },
  {
    title: "Família e Legado",
    theme: "Presença",
    text: "No fim da vida, quase ninguém se arrepende de não ter trabalhado mais. Se arrepende do tempo que não voltou. Dos abraços adiados. Das conversas que ficaram para depois. Da presença trocada pela pressa. Família não é apenas quem divide a casa. É quem recebe as consequências das suas escolhas. Cada palavra. Cada ausência. Cada prioridade. Você está construindo legado ou apenas sobrevivendo? Porque legado não nasce em grandes momentos. Nasce nas pequenas decisões repetidas. Nos dias comuns. E talvez seja exatamente aí que esteja o problema...",
  },
  {
    title: "Saúde: O Corpo como Templo",
    theme: "Energia",
    text: "Seu corpo está sustentando seus sonhos ou está impedindo você de viver eles? A maioria espera adoecer para começar a cuidar. Espera sentir dor. Perder energia. Ganhar peso. Mas o corpo sempre avisa. Só que quase ninguém escuta. Seu corpo não é estética. É ferramenta. É energia para trabalhar. Construir patrimônio. Proteger quem você ama. Disciplina física não é vaidade. É responsabilidade. E o preço de ignorar isso quase sempre chega...",
  },
  {
    title: "Trabalho, Estudo, Propósito e Renda",
    theme: "Competência",
    text: "Existe uma mentira perigosa: quando eu tiver tempo, eu começo. Mas quase ninguém percebe. Quem espera tempo livre normalmente continua parado. O guerreiro moderno aprende algo diferente: ele constrói enquanto está cansado. Estuda enquanto trabalha. Aprende enquanto executa. Porque renda não nasce do desejo. Nasce da competência. Da repetição. Do desconforto. Você está construindo valor ou apenas trocando tempo por dinheiro?",
  },
];

type EbookPreview = (typeof ebookPreviews)[number];

const ebookCoverImage = mediaAssets.ebookCover;

const benefits = [
  {
    title: "Saúde",
    text: "Energia para sustentar escolhas difíceis.",
    Icon: Dumbbell,
    image: mediaAssets.benefits.saude,
  },
  {
    title: "Família",
    text: "Presença, prioridade e legado no cotidiano.",
    Icon: HeartHandshake,
    image: mediaAssets.benefits.familia,
  },
  {
    title: "Espiritualidade",
    text: "Propósito como norte das decisões.",
    Icon: Sparkles,
    image: mediaAssets.benefits.espiritualidade,
  },
  {
    title: "Finanças",
    text: "Controle sem fantasia e sem fuga.",
    Icon: CircleDollarSign,
    image: mediaAssets.benefits.financas,
  },
  {
    title: "Trabalho",
    text: "Execução, competência e renda aplicada.",
    Icon: BriefcaseBusiness,
    image: mediaAssets.benefits.trabalho,
  },
  {
    title: "Rotina",
    text: "Agenda simples para proteger o essencial.",
    Icon: CalendarCheck,
    image: mediaAssets.benefits.rotina,
  },
  {
    title: "Disciplina",
    text: "Constância quando a motivação falha.",
    Icon: ShieldCheck,
    image: mediaAssets.benefits.disciplina,
  },
];

const communityValues = ["Disciplina", "Família", "Responsabilidade", "Fé", "Propósito", "Execução"];

const testimonials = [
  {
    quote: "Parei de tratar disciplina como inspiração. Hoje tenho um plano para o treino, o trabalho e a casa.",
    name: "Aluno LifeForce",
  },
  {
    quote: "O que mudou foi a clareza. Eu sabia o que fazer, mas não tinha uma estrutura para repetir.",
    name: "Comprador DGΔD",
  },
  {
    quote: "Entendi que não era só conteúdo. Era um compromisso com a minha evolução diária.",
    name: "Guerreiro LifeForce",
  },
];

const futureFeatures = ["App", "Agenda", "Metas", "Painel 360º", "Evolução"];

const faqs = [
  {
    question: "Serve para homens e mulheres?",
    answer: "Sim. A linguagem fala com pessoas que querem responsabilidade, clareza e evolução real, independentemente do gênero.",
  },
  {
    question: "Recebo na hora?",
    answer: "Sim. Após a confirmação do pagamento, o acesso ao conteúdo digital é liberado pela plataforma de compra.",
  },
  {
    question: "Tem religião?",
    answer: "O método fala de fé, propósito e espiritualidade, mas não exige que a pessoa pertença a uma religião específica.",
  },
  {
    question: "Quanto tempo leva?",
    answer: "A proposta é prática e progressiva. Você começa aplicando pequenos ajustes no primeiro pilar desalinhado e evolui a partir daí.",
  },
  {
    question: "Funciona para quem trabalha muito?",
    answer: "Sim. O sistema foi pensado para vida real: trabalho, família, treino, rotina apertada e recomeços.",
  },
  {
    question: "Preciso já ser disciplinado?",
    answer: "Não. O objetivo é justamente criar uma estrutura para transformar intenção em constância.",
  },
];

export function HomePage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [activeBook, setActiveBook] = useState<number | null>(null);
  const [activeFeedbackVideo, setActiveFeedbackVideo] = useState<string | null>(null);
  const selectedBook = activeBook === null ? null : ebookPreviews[activeBook];

  const renderEbookCard = (book: EbookPreview, index: number, clone = false) => {
    const active = activeBook === index;

    return (
      <article
        key={`${book.title}-${clone ? "clone" : "main"}`}
        className={active ? "ebook-card ebook-card--active" : "ebook-card"}
        onMouseEnter={() => setActiveBook(index)}
        onFocus={() => {
          if (!clone) {
            setActiveBook(index);
          }
        }}
        onClick={() => setActiveBook(index)}
        onKeyDown={(event) => {
          if (!clone && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setActiveBook(index);
          }
        }}
        tabIndex={clone ? -1 : 0}
        aria-hidden={clone ? "true" : undefined}
        aria-label={clone ? undefined : `${book.title}: abrir detalhes do e-book`}
      >
        <div className="ebook-card__cover" aria-hidden="true">
          <img
            src={ebookCoverImage}
            alt=""
            loading={index < 3 ? "eager" : "lazy"}
            decoding="async"
          />
          <h3>{book.title}</h3>
        </div>
      </article>
    );
  };

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const mm = gsap.matchMedia();

      gsap.utils.toArray<HTMLElement>(".motion-scale").forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0.72, scale: 0.88, filter: "brightness(0.72)" },
          {
            opacity: 1,
            scale: 1,
            filter: "brightness(1)",
            ease: "none",
            scrollTrigger: {
              trigger: element,
              start: "top 86%",
              end: "bottom 22%",
              scrub: true,
            },
          },
        );
      });

      gsap.fromTo(
        ".hero-title-line",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.9,
          ease: "power3.out",
        },
      );

      mm.add("(min-width: 900px)", () => {
        ScrollTrigger.create({
          trigger: ".pinned-system",
          start: "top top+=84",
          end: "bottom bottom-=160",
          pin: ".pinned-system__visual",
          pinSpacing: false,
        });
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="home-landing">
      <LandingHero />

      <section className="lf-section lf-section--light pain-band" aria-labelledby="pain-title">
        <div className="lf-section__grid">
          <Reveal className="lf-section__headline">
            <p className="section-kicker">O ponto real</p>
            <h2 id="pain-title">Você não precisa de mais motivação.</h2>
            <p className="pain-band__statement">Motivação falha. Disciplina decide.</p>
          </Reveal>
          <div className="pain-band__body">
            {painQuestions.map((question) => (
              <Reveal key={question}>
                <article className="pain-question">
                  <Flame aria-hidden="true" />
                  <p>{question}</p>
                </article>
              </Reveal>
            ))}
            <Reveal>
              <div className="pain-answer">
                <span>O problema não é capacidade.</span>
                <strong>É sistema.</strong>
                <Button asChild size="lg" className="cta-button h-12 w-fit px-5 active:scale-[0.96]">
                  <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
                    Quero aplicar o sistema
                    <ArrowRight data-icon="inline-end" />
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="lf-section pinned-system" id="metodo" aria-labelledby="ecosystem-title">
        <div className="lf-section__grid lf-section__grid--wide">
          <div className="pinned-system__visual motion-scale">
            <div className="lifeforce-compass" aria-label="Bússola LifeForce 360º">
              <div className="lifeforce-compass__rings" aria-hidden="true" />
              <div className="lifeforce-compass__dial" aria-hidden="true">
                <span className="lifeforce-compass__axis lifeforce-compass__axis--north">N</span>
                <span className="lifeforce-compass__axis lifeforce-compass__axis--east">E</span>
                <span className="lifeforce-compass__axis lifeforce-compass__axis--south">S</span>
                <span className="lifeforce-compass__axis lifeforce-compass__axis--west">W</span>
                <span className="lifeforce-compass__needle lifeforce-compass__needle--north" />
                <span className="lifeforce-compass__needle lifeforce-compass__needle--south" />
                <span className="lifeforce-compass__needle lifeforce-compass__needle--east" />
                <span className="lifeforce-compass__needle lifeforce-compass__needle--west" />
                <span className="lifeforce-compass__mark">Δ</span>
              </div>
              <div className="lifeforce-compass__orbit" role="list" aria-label="Pilares LifeForce 360º">
                {compassPillars.map((pillar, index) => {
                  const orbitAngle = -62 + index * (360 / compassPillars.length);

                  return (
                    <div
                      key={pillar.title}
                      className="lifeforce-compass__slot"
                      role="listitem"
                      style={
                        {
                          "--orbit-angle": `${orbitAngle}deg`,
                          "--card-angle": `${-orbitAngle}deg`,
                        } as CSSProperties
                      }
                    >
                      <article className="lifeforce-compass__card">
                        <span>{pillar.number}</span>
                        <h3>{pillar.title}</h3>
                        <p>{pillar.promise}</p>
                      </article>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="pinned-system__copy">
            <Reveal>
              <p className="section-kicker">LifeForce 360º</p>
              <h2 id="ecosystem-title">Um ecossistema para evoluir todas as áreas da vida.</h2>
              <p>
                A vida real não funciona separada. Saúde afeta trabalho. Finanças afetam família. Família afeta
                espiritualidade. Tempo afeta tudo.
              </p>
            </Reveal>
            <div className="pillar-stack">
              {pillars.map((pillar, index) => (
                <Reveal key={pillar.id} delay={index * 0.04}>
                  <article className="pillar-row">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{pillar.title}</h3>
                      <p>{pillar.promise}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <p className="system-line">Construir uma vida forte, equilibrada e com propósito.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="lf-section code-section" aria-labelledby="code-title">
        <div className="code-section__mark motion-scale" aria-hidden="true">
          <img src={mediaAssets.deltaMark} alt="" loading="lazy" decoding="async" />
        </div>
        <Reveal className="code-section__copy">
          <p className="section-kicker">DGΔD</p>
          <h2 id="code-title">O Código do Guerreiro não é motivação. É sistema.</h2>
          <p>
            DGΔD significa <strong>Disciplina Gera Destino</strong>. O símbolo Δ representa evolução contínua.
          </p>
          <p>
            Nasceu da vida real: trabalho, família, treino, negócios, erros, recomeços e disciplina diária.
          </p>
          <div className="principle-cloud" aria-label="Bases do Código do Guerreiro">
            {warriorPrinciples.map((principle) => (
              <span key={principle}>{principle}</span>
            ))}
          </div>
          <p className="code-section__truth">O destino não acontece. Ele é construído.</p>
          <Button asChild size="lg" className="cta-button h-12 w-fit px-5 active:scale-[0.96]">
            <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
              Entrar no Código
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        </Reveal>
      </section>

      <LandingPracticeTimeline />

      <section className="lf-section founder-section founder-section--feature" aria-labelledby="founder-title">
        <div className="founder-feature-media">
          <figure className="founder-photo founder-photo--feature motion-scale">
            <img src={mediaAssets.creator.portrait} alt="Paulo Matos, criador do LifeForce 360º" />
            <figcaption>Faixa preta, pai, empreendedor e criador do ecossistema LifeForce 360º.</figcaption>
          </figure>
          <div className="founder-media-row">
            <figure className="founder-family-card motion-scale">
              <img src={mediaAssets.creator.family} alt="Paulo Matos em um momento com a família" />
              <figcaption>Família como eixo do método.</figcaption>
            </figure>
            <a
              className="founder-video-teaser"
              href={toAppHref("/criador")}
              aria-label="Assistir Paulo explicando o LifeForce 360º"
            >
              <CirclePlay aria-hidden="true" />
              <span>Vídeo do criador</span>
              <strong>Paulo explica o projeto e o código LifeForce 360º</strong>
            </a>
          </div>
        </div>
        <Reveal className="founder-copy">
          <p className="section-kicker">Paulo Matos</p>
          <h2 id="founder-title">Antes do método, existe uma vida disciplinada na prática.</h2>
          <p>
            Paulo Matos criou o DGAD a partir de uma lógica simples: disciplina não é discurso. É repetição,
            responsabilidade e direção aplicada nas áreas que sustentam a vida.
          </p>
          <p>
            A página do criador reúne a história, o vídeo próprio de Paulo e a explicação do que é o código LifeForce
            360º.
          </p>
          <div className="founder-proof-grid" aria-label="Experiências que formam o método">
            {["Jiu-Jitsu", "Família", "Vendas", "Empreendedorismo", "Recomeços"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="founder-actions">
            <Button asChild size="lg" variant="outline" className="h-12 w-fit px-5 active:scale-[0.96]">
              <a href={toAppHref("/criador")}>
                Ver a página do criador
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild size="lg" className="cta-button h-12 w-fit px-5 active:scale-[0.96]">
              <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
                Entrar no Código
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </Reveal>
      </section>

      <section className="lf-section books-preview-section" id="livros" aria-labelledby="books-title">
        <h2 className="sr-only" id="books-title">
          E-books DGAD
        </h2>
        <div className="ebook-stage" onMouseLeave={() => setActiveBook(null)}>
          <div className="ebook-carousel" aria-label="Carrossel dos sete e-books">
            <div className="ebook-carousel__track">
              <div className="ebook-carousel__group">{ebookPreviews.map((book, index) => renderEbookCard(book, index))}</div>
              <div className="ebook-carousel__group ebook-carousel__group--clone" aria-hidden="true">
                {ebookPreviews.map((book, index) => renderEbookCard(book, index, true))}
              </div>
            </div>
          </div>
          {selectedBook ? (
            <article className="ebook-expanded-card" aria-live="polite">
              <div className="ebook-card__cover" aria-hidden="true">
                <img src={ebookCoverImage} alt="" loading="eager" decoding="async" />
                <h3>{selectedBook.title}</h3>
              </div>
              <div className="ebook-card__details">
                <h3>{selectedBook.title}</h3>
                <p className="ebook-card__text">{selectedBook.text}</p>
                <div className="ebook-card__commerce">
                  <strong>{offer.price}</strong>
                  <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
                    Página de compras
                    <ArrowRight aria-hidden="true" />
                  </a>
                </div>
                <a className="ebook-card__bundle" href={offer.checkoutUrl} target="_blank" rel="noreferrer">
                  Comprar todos os 7 e-books
                  <ArrowRight aria-hidden="true" />
                </a>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="lf-section lf-section--light benefits-section" aria-labelledby="benefits-title">
        <Reveal className="lf-section__headline">
          <p className="section-kicker">Benefícios</p>
          <h2 id="benefits-title">O método organiza a vida que você precisa sustentar todos os dias.</h2>
        </Reveal>
        <div className="benefit-bento">
          {benefits.map(({ title, text, Icon, image }, index) => (
            <article
              key={title}
              className={`benefit-card benefit-card--${index}`}
              style={{ "--benefit-bg": `url(${image})` } as CSSProperties}
            >
              <div className="benefit-card__content">
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="lf-section movement-section" aria-labelledby="movement-title">
        <Reveal className="movement-section__copy">
          <p className="section-kicker">Pertencimento</p>
          <h2 id="movement-title">Você não está entrando apenas em um método. Está entrando em um movimento.</h2>
          <p>
            Ao adquirir o Código do Guerreiro, você entra para os Guerreiros LifeForce: pessoas que decidiram parar de
            viver no automático.
          </p>
        </Reveal>
        <div className="movement-panel motion-scale">
          <div className="movement-values">
            {communityValues.map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>
          <blockquote>Eu assumo responsabilidade pela minha evolução diária.</blockquote>
          <Button asChild size="lg" className="cta-button h-12 w-fit px-5 active:scale-[0.96]">
            <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
              Assumir o compromisso
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </section>

      <section className="lf-section proof-section" aria-labelledby="proof-title">
        <Reveal className="lf-section__headline">
          <p className="section-kicker">Provas sociais</p>
          <h2 id="proof-title">Feedbacks reais de clientes satisfeitos.</h2>
          <p>Relatos em vídeo e comentários curtos entram como evidência direta antes da decisão.</p>
        </Reveal>
        <div className="proof-grid proof-grid--feedback">
          {customerFeedbackVideos.map((video) => (
            <article key={video.id} className="proof-video proof-video--feedback motion-scale">
              <div className="proof-video__media">
                {activeFeedbackVideo === video.id ? (
                  <video
                    aria-label={video.title}
                    autoPlay
                    controls
                    controlsList="nodownload"
                    playsInline
                    preload="metadata"
                    poster={video.poster}
                  >
                    <source src={video.src} type="video/mp4" />
                  </video>
                ) : (
                  <button
                    type="button"
                    className="proof-video__poster"
                    onClick={() => setActiveFeedbackVideo(video.id)}
                    aria-label={`Assistir ${video.title}`}
                  >
                    <img src={video.poster} alt="" loading="lazy" decoding="async" />
                    <span className="proof-video__play">
                      <CirclePlay aria-hidden="true" />
                      Assistir feedback
                    </span>
                  </button>
                )}
              </div>
              <div className="proof-video__copy">
                <h3>{video.title}</h3>
                <p>{video.description}</p>
              </div>
            </article>
          ))}
          <div className="testimonial-rail" aria-label="Depoimentos curtos">
            {testimonials.map((testimonial) => (
              <article key={testimonial.quote}>
                <MessageCircle aria-hidden="true" />
                <p>“{testimonial.quote}”</p>
                <strong>{testimonial.name}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <LandingOfferSection />

      <section className="lf-section lf-section--light future-section" aria-labelledby="future-title">
        <Reveal className="future-section__copy">
          <p className="section-kicker">Próximo ciclo</p>
          <h2 id="future-title">Isso é só o começo.</h2>
          <p>
            Você não está comprando apenas conteúdo. Está entrando em um ecossistema em expansão, preparado para o
            futuro aplicativo LifeForce 360º.
          </p>
        </Reveal>
        <div className="app-mockup motion-scale" aria-label="Prévia visual do futuro aplicativo">
          <div className="app-mockup__phone">
            <div className="app-mockup__top">
              <span>LifeForce</span>
              <strong>72%</strong>
            </div>
            <div className="app-mockup__delta">Δ+</div>
            <div className="app-mockup__bars">
              {futureFeatures.map((feature, index) => (
                <span key={feature} style={{ "--bar": `${58 + index * 8}%` } as CSSProperties}>
                  {feature}
                </span>
              ))}
            </div>
          </div>
          <div className="future-tags">
            {futureFeatures.map((feature) => (
              <span key={feature}>{feature}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="lf-section faq-section-new" aria-labelledby="faq-title">
        <Reveal className="lf-section__headline">
          <p className="section-kicker">FAQ</p>
          <h2 id="faq-title">Dúvidas antes de entrar.</h2>
        </Reveal>
        <Accordion type="single" collapsible className="faq-list faq-list--landing">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`landing-faq-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <LandingFinalCta />
    </div>
  );
}
