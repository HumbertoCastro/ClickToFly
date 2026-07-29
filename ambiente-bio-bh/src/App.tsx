import { FormEvent, useEffect, useRef, useState } from "react";
import {
  aimProcess,
  assetUrl,
  buildWhatsappUrl,
  contact,
  faqItems,
  inspectionPoints,
  navigationItems,
  pests,
  placeTypes,
  preferredPeriods,
  servedSegments,
  signals,
  solutions,
  specialties,
  trustPoints,
} from "./content";
import {
  AimGrid,
  AimItem,
  AimNumber,
  Brand,
  ButtonArrow,
  ContactDetails,
  ContactGrid,
  ContactIntro,
  ContactLink,
  ContactSection,
  Coverage,
  CoverageHeader,
  FaqHeader,
  FaqList,
  FaqSection,
  Field,
  FieldError,
  FieldMeta,
  Footer,
  FooterBrand,
  FooterColumn,
  FooterCta,
  FooterCtaActions,
  FooterInner,
  FooterMeta,
  Form,
  FormActions,
  FormCard,
  FormEyebrow,
  GlobalStyle,
  Header,
  HeaderActions,
  HeaderInner,
  Hero,
  HeroActions,
  HeroCopy,
  HeroEyebrow,
  HeroImage,
  HeroMedia,
  HeroStage,
  HeroTitle,
  ImageCard,
  ImageCardBody,
  ImageCardMedia,
  InspectionHeader,
  InspectionMarker,
  InspectionSection,
  InspectionVisual,
  LinkButton,
  MenuButton,
  MethodCta,
  MethodLayout,
  MethodSection,
  Nav,
  OccurrenceFeature,
  OccurrenceFeatureBody,
  OccurrenceFeatureMedia,
  OccurrenceLayout,
  OccurrenceSection,
  PestGrid,
  PestItem,
  PreferenceGrid,
  PreferenceNote,
  PrimaryButton,
  Section,
  SectionHeader,
  SectionIntro,
  SectionKicker,
  SectionTitle,
  SegmentGrid,
  SegmentItem,
  SignalBand,
  SignalIntro,
  SignalList,
  SiteShell,
  SolutionGrid,
  SpecialtyGrid,
  SpecialtyItem,
  SpecialtySpotlight,
  TrustItem,
  TrustRail,
} from "./styles";

type FormErrors = {
  placeType?: string;
  problem?: string;
};

function usePageMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    nodes.forEach((node) => node.setAttribute("data-revealed", "false"));
    root.classList.add("motion-ready");

    if (reducedMotion.matches) {
      nodes.forEach((node) => node.setAttribute("data-revealed", "true"));
      return () => root.classList.remove("motion-ready");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-revealed", "true");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -2% 0px",
        threshold: 0.08,
      },
    );

    nodes.forEach((node) => observer.observe(node));

    const revealAll = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      nodes.forEach((node) => node.setAttribute("data-revealed", "true"));
      observer.disconnect();
    };

    reducedMotion.addEventListener("change", revealAll);

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", revealAll);
      root.classList.remove("motion-ready");
    };
  }, []);
}

function VisitForm() {
  const [placeType, setPlaceType] = useState("");
  const [problem, setProblem] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredPeriod, setPreferredPeriod] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState("");
  const placeTypeRef = useRef<HTMLSelectElement>(null);
  const problemRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!placeType) {
      nextErrors.placeType = "Selecione o tipo de local.";
    }

    if (problem.trim().length < 8) {
      nextErrors.problem = "Descreva o problema em pelo menos 8 caracteres.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("Revise os campos indicados.");
      window.requestAnimationFrame(() => {
        if (nextErrors.placeType) {
          placeTypeRef.current?.focus();
          return;
        }

        problemRef.current?.focus();
      });
      return;
    }

    const whatsappUrl = buildWhatsappUrl(
      placeType,
      problem,
      preferredDate,
      preferredPeriod,
    );
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setStatus("Conversa preparada no WhatsApp.");
  }

  return (
    <FormCard id="agendar-contato" data-reveal="right">
      <FormEyebrow>Solicitar avaliação</FormEyebrow>
      <h3>Conte o essencial para começarmos.</h3>
      <p>
        Duas informações são obrigatórias. Data e período são preferências
        opcionais.
      </p>

      <Form onSubmit={handleSubmit} noValidate>
        <Field>
          <label htmlFor="place-type">Tipo de local</label>
          <select
            ref={placeTypeRef}
            id="place-type"
            name="placeType"
            value={placeType}
            onChange={(event) => {
              setPlaceType(event.target.value);
              setErrors((current) => ({ ...current, placeType: undefined }));
            }}
            aria-invalid={Boolean(errors.placeType)}
            aria-describedby={errors.placeType ? "place-type-error" : undefined}
            required
          >
            <option value="">Selecione uma opção</option>
            {placeTypes.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.placeType && (
            <FieldError id="place-type-error">{errors.placeType}</FieldError>
          )}
        </Field>

        <Field>
          <label htmlFor="problem">
            Conte em poucas palavras o que está acontecendo
          </label>
          <textarea
            ref={problemRef}
            id="problem"
            name="problem"
            rows={4}
            value={problem}
            onChange={(event) => {
              setProblem(event.target.value);
              setErrors((current) => ({ ...current, problem: undefined }));
            }}
            aria-invalid={Boolean(errors.problem)}
            aria-describedby={
              errors.problem ? "problem-error problem-count" : "problem-count"
            }
            minLength={8}
            maxLength={280}
            placeholder="Ex.: encontrei sinais de cupim em dois cômodos."
            required
          />
          <FieldMeta id="problem-count">
            <span>{errors.problem ? "" : "Diga onde percebeu o sinal."}</span>
            <span>{problem.length}/280</span>
          </FieldMeta>
          {errors.problem && (
            <FieldError id="problem-error">{errors.problem}</FieldError>
          )}
        </Field>

        <PreferenceGrid>
          <Field>
            <label htmlFor="preferred-date">Dia de preferência (opcional)</label>
            <input
              id="preferred-date"
              name="preferredDate"
              type="date"
              value={preferredDate}
              onChange={(event) => setPreferredDate(event.target.value)}
            />
          </Field>
          <Field>
            <label htmlFor="preferred-period">
              Período de preferência (opcional)
            </label>
            <select
              id="preferred-period"
              name="preferredPeriod"
              value={preferredPeriod}
              onChange={(event) => setPreferredPeriod(event.target.value)}
            >
              <option value="">Selecione</option>
              {preferredPeriods.map((period) => (
                <option value={period} key={period}>
                  {period}
                </option>
              ))}
            </select>
          </Field>
        </PreferenceGrid>
        <PreferenceNote>
          A preferência não confirma a visita. A equipe valida a disponibilidade
          na conversa.
        </PreferenceNote>

        <FormActions>
          <PrimaryButton type="submit">
            Continuar no WhatsApp
            <ButtonArrow aria-hidden="true">↗</ButtonArrow>
          </PrimaryButton>
          <span role="status" aria-live="polite">
            {status}
          </span>
        </FormActions>
      </Form>
    </FormCard>
  );
}

function BrandMark() {
  return (
    <Brand href="#top" aria-label="Ambiente Orkin — início">
      <img src={assetUrl("favicon.png")} alt="" width="512" height="512" />
    </Brand>
  );
}

function App() {
  const [compactHeader, setCompactHeader] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPestId, setSelectedPestId] = useState<string>(pests[0].id);
  const selectedPest =
    pests.find((pest) => pest.id === selectedPestId) ?? pests[0];

  usePageMotion();

  useEffect(() => {
    const sections = navigationItems
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    let animationFrame = 0;

    const updateHeader = () => {
      setCompactHeader(window.scrollY > 24);

      const marker = window.scrollY + Math.min(window.innerHeight * 0.35, 260);
      let nextSection = "";

      sections.forEach((section) => {
        if (section.offsetTop <= marker) {
          nextSection = section.id;
        }
      });

      setActiveSection(nextSection);
    };

    const handleScroll = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateHeader);
    };

    const handleResize = () => {
      handleScroll();
      if (window.innerWidth > 980) {
        setMobileMenuOpen(false);
      }
    };

    updateHeader();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <GlobalStyle />
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>

      <SiteShell>
        <Header data-header-compact={compactHeader ? "true" : "false"}>
          <HeaderInner>
            <BrandMark />

            <Nav
              id="site-navigation"
              aria-label="Navegação principal"
              $open={mobileMenuOpen}
            >
              {navigationItems.map((item) => (
                <a
                  href={item.href}
                  key={item.id}
                  aria-current={
                    activeSection === item.id ? "location" : undefined
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </Nav>

            <MenuButton
              type="button"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-controls="site-navigation"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              <span aria-hidden="true" />
            </MenuButton>

            <HeaderActions>
              <a
                href={contact.phonePrimaryHref}
                aria-label={`Ligar para ${contact.phonePrimary}`}
              >
                {contact.phonePrimary}
              </a>
              <LinkButton href="#agendar-contato">
                Solicitar avaliação
              </LinkButton>
            </HeaderActions>
          </HeaderInner>
        </Header>

        <main id="conteudo" tabIndex={-1}>
          <HeroStage>
            <Hero id="top" aria-labelledby="hero-title">
              <HeroCopy data-reveal="hero-copy">
                <HeroEyebrow>
                  <span aria-hidden="true" />
                  Controle de pragas em Belo Horizonte
                </HeroEyebrow>
                <HeroTitle id="hero-title">
                  Diagnóstico técnico. Controle responsável.
                </HeroTitle>
                <p>
                  Soluções para residências e empresas, definidas após avaliar
                  o ambiente.
                </p>
                <HeroActions>
                  <PrimaryButton as="a" href="#agendar-contato">
                    Solicitar avaliação
                    <ButtonArrow aria-hidden="true">↓</ButtonArrow>
                  </PrimaryButton>
                  <a href={contact.phonePrimaryHref}>
                    Ou ligue {contact.phonePrimary}
                  </a>
                </HeroActions>
              </HeroCopy>

              <HeroMedia
                data-hero-person
                data-reveal="hero-person"
                data-reveal-delay="2"
              >
                <picture>
                  <source
                    srcSet={[
                      `${assetUrl("assets/editorial/funcionario-orkin-cutout-640.webp")} 640w`,
                      `${assetUrl("assets/editorial/funcionario-orkin-cutout-870.webp")} 870w`,
                    ].join(", ")}
                    sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 900px) 74vw, 52vw"
                    type="image/webp"
                  />
                  <HeroImage
                    src={assetUrl(
                      "assets/editorial/funcionario-orkin-cutout-870.webp",
                    )}
                    alt="Profissional uniformizada da Orkin pronta para realizar uma avaliação técnica."
                    width="870"
                    height="994"
                    fetchPriority="high"
                    decoding="async"
                  />
                </picture>
              </HeroMedia>
            </Hero>

            <TrustRail
              role="list"
              aria-label="Credenciais da empresa"
              data-reveal="up"
            >
              {trustPoints.map((point) => (
                <TrustItem role="listitem" key={point.value}>
                  <strong>{point.value}</strong>
                  <span>{point.label}</span>
                </TrustItem>
              ))}
            </TrustRail>
          </HeroStage>

          <SignalBand id="sinais" aria-labelledby="signals-title">
            <SignalIntro data-reveal="left">
              <SectionKicker>Quando chamar</SectionKicker>
              <h2 id="signals-title">O primeiro sinal já merece atenção.</h2>
            </SignalIntro>
            <SignalList data-reveal="up">
              {signals.map((signal, index) => (
                <li key={signal}>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <strong>{signal}</strong>
                </li>
              ))}
            </SignalList>
          </SignalBand>

          <Section id="servicos" aria-labelledby="solutions-title">
            <SectionHeader>
              <div data-reveal="up">
                <SectionKicker>Soluções</SectionKicker>
                <SectionTitle id="solutions-title">
                  Um plano adequado ao seu ambiente.
                </SectionTitle>
              </div>
              <SectionIntro
                data-reveal="up"
                data-reveal-delay="1"
              >
                A mesma precisão técnica, aplicada a rotinas e riscos
                diferentes.
              </SectionIntro>
            </SectionHeader>

            <SolutionGrid>
              {solutions.map((solution, index) => (
                <ImageCard
                  key={solution.title}
                  data-reveal={index === 0 ? "left" : "right"}
                  data-reveal-delay={String(index)}
                >
                  <ImageCardMedia>
                    <picture>
                      <source
                        srcSet={[
                          `${assetUrl(`${solution.imageBase}-640.webp`)} 640w`,
                          `${assetUrl(`${solution.imageBase}-960.webp`)} 960w`,
                        ].join(", ")}
                        sizes="(max-width: 900px) 100vw, 54vw"
                        type="image/webp"
                      />
                      <img
                        src={assetUrl(`${solution.imageBase}-960.webp`)}
                        alt={solution.alt}
                        width="960"
                        height="640"
                        loading="lazy"
                      />
                    </picture>
                  </ImageCardMedia>
                  <ImageCardBody>
                    <SectionKicker>
                      {solution.number} — {solution.eyebrow}
                    </SectionKicker>
                    <h3>{solution.title}</h3>
                    <p>{solution.body}</p>
                    <ul>
                      {solution.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                    <a href="#agendar-contato">
                      Falar com a equipe <span aria-hidden="true">↗</span>
                    </a>
                  </ImageCardBody>
                </ImageCard>
              ))}
            </SolutionGrid>

            <SpecialtySpotlight
              data-reveal="up"
              aria-labelledby="specialties-title"
            >
              <header>
                <div>
                  <SectionKicker>Atuação especializada</SectionKicker>
                  <h3 id="specialties-title">
                    Contextos sensíveis pedem outra abordagem.
                  </h3>
                </div>
                <p>
                  Recursos específicos para acervos, coleções e ambientes que
                  precisam de sanitização profissional.
                </p>
              </header>
              <SpecialtyGrid
                role="group"
                aria-label="Serviços especializados"
              >
                {specialties.map((specialty) => (
                  <SpecialtyItem key={specialty.title} href="#agendar-contato">
                    <span aria-hidden="true">↗</span>
                    <div>
                      <h3>{specialty.title}</h3>
                      <p>{specialty.body}</p>
                    </div>
                  </SpecialtyItem>
                ))}
              </SpecialtyGrid>
            </SpecialtySpotlight>
          </Section>

          <InspectionSection aria-labelledby="inspection-title">
            <InspectionHeader>
              <div data-reveal="left">
                <SectionKicker>Leitura do ambiente</SectionKicker>
                <SectionTitle id="inspection-title">
                  Antes de agir, é preciso entender o cenário.
                </SectionTitle>
              </div>
              <SectionIntro
                data-reveal="right"
                data-reveal-delay="1"
              >
                A inspeção conecta o que você percebeu aos acessos e condições
                que podem sustentar a ocorrência.
              </SectionIntro>
            </InspectionHeader>

            <InspectionVisual data-reveal="mask">
              <picture>
                <source
                  srcSet={[
                    `${assetUrl("assets/editorial/hero-inspecao-640.webp")} 640w`,
                    `${assetUrl("assets/editorial/hero-inspecao-960.webp")} 960w`,
                    `${assetUrl("assets/editorial/hero-inspecao-1440.webp")} 1440w`,
                  ].join(", ")}
                  sizes="(max-width: 720px) 100vw, 1240px"
                  type="image/webp"
                />
                <img
                  src={assetUrl("assets/editorial/hero-inspecao-1440.webp")}
                  alt="Cena editorial de uma inspeção técnica em ambiente residencial."
                  width="1440"
                  height="900"
                  loading="lazy"
                />
              </picture>
              <figcaption>
                {inspectionPoints.map((point, index) => (
                  <InspectionMarker $position={index} key={point.title}>
                    <span>{point.number}</span>
                    <strong>{point.title}</strong>
                    <p>{point.body}</p>
                  </InspectionMarker>
                ))}
              </figcaption>
            </InspectionVisual>
          </InspectionSection>

          <MethodSection id="metodo" aria-labelledby="method-title">
            <MethodLayout>
              <SectionHeader>
                <div data-reveal="left">
                  <SectionKicker>Método A.I.M.</SectionKicker>
                  <SectionTitle id="method-title">
                    Decidir com evidência, não por tentativa.
                  </SectionTitle>
                </div>
                <SectionIntro
                  data-reveal="right"
                  data-reveal-delay="1"
                >
                  Avaliação técnica, ação proporcional e acompanhamento da
                  resposta do ambiente em uma sequência clara.
                </SectionIntro>
              </SectionHeader>

              <AimGrid data-reveal="up">
                {aimProcess.map((item) => (
                  <AimItem key={item.title}>
                    <AimNumber>{item.number}</AimNumber>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </AimItem>
                ))}
              </AimGrid>

              <MethodCta data-reveal="up">
                <p>
                  O plano nasce da leitura do local e pode ser ajustado conforme
                  a resposta observada.
                </p>
                <a href="#agendar-contato">
                  Solicitar avaliação <span aria-hidden="true">↗</span>
                </a>
              </MethodCta>
            </MethodLayout>
          </MethodSection>

          <Coverage id="setores" aria-labelledby="coverage-title">
            <CoverageHeader>
              <div data-reveal="left">
                <SectionKicker>Onde atuamos</SectionKicker>
                <h2 id="coverage-title">
                  Controle alinhado à rotina de cada ambiente.
                </h2>
              </div>
              <p data-reveal="right">
                A avaliação considera circulação de pessoas, atividade do local
                e pontos críticos antes de orientar as medidas.
              </p>
            </CoverageHeader>
            <SegmentGrid data-reveal="up">
              {servedSegments.map((segment) => (
                <SegmentItem key={segment.title}>
                  <span>{segment.number}</span>
                  <div>
                    <h3>{segment.title}</h3>
                    <p>{segment.body}</p>
                  </div>
                </SegmentItem>
              ))}
            </SegmentGrid>
          </Coverage>

          <OccurrenceSection
            id="ocorrencias"
            aria-labelledby="occurrences-title"
          >
            <SectionHeader>
              <div data-reveal="left">
                <SectionKicker>Ocorrências</SectionKicker>
                <SectionTitle id="occurrences-title">
                  Reconheça sinais. A avaliação confirma o caminho.
                </SectionTitle>
              </div>
              <SectionIntro
                data-reveal="right"
                data-reveal-delay="1"
              >
                Explore exemplos comuns para organizar o que você observou. O
                conteúdo não substitui o diagnóstico no local.
              </SectionIntro>
            </SectionHeader>

            <OccurrenceLayout>
              <OccurrenceFeature aria-live="polite">
                <OccurrenceFeatureMedia>
                  <img
                    src={assetUrl(`assets/pests/${selectedPest.image}`)}
                    alt={selectedPest.alt}
                    width="960"
                    height="960"
                    loading="lazy"
                  />
                </OccurrenceFeatureMedia>
                <OccurrenceFeatureBody>
                  <span>Ocorrência selecionada</span>
                  <h3>{selectedPest.title}</h3>
                  <p>{selectedPest.summary}</p>
                  <ul aria-label={`Sinais relacionados a ${selectedPest.title}`}>
                    {selectedPest.signals.map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                </OccurrenceFeatureBody>
              </OccurrenceFeature>

              <PestGrid aria-label="Escolha uma ocorrência para explorar">
                {pests.map((pest) => (
                  <PestItem key={pest.id}>
                    <button
                      type="button"
                      aria-label={pest.title}
                      aria-pressed={selectedPest.id === pest.id}
                      onClick={() => setSelectedPestId(pest.id)}
                    >
                      <img
                        src={assetUrl(`assets/pests/${pest.image}`)}
                        alt=""
                        width="960"
                        height="960"
                        loading="lazy"
                      />
                      <strong>{pest.title}</strong>
                    </button>
                  </PestItem>
                ))}
              </PestGrid>
            </OccurrenceLayout>
          </OccurrenceSection>

          <FaqSection id="duvidas" aria-labelledby="faq-title">
            <FaqHeader data-reveal="left">
              <SectionKicker>Dúvidas frequentes</SectionKicker>
              <h2 id="faq-title">Informação clara antes da conversa.</h2>
              <p>
                Respostas diretas sobre avaliação, atendimento e próximos
                passos.
              </p>
            </FaqHeader>
            <FaqList data-reveal="up">
              {faqItems.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </FaqList>
          </FaqSection>

          <ContactSection id="contato" aria-labelledby="contact-title">
            <ContactGrid>
              <ContactIntro data-reveal="left">
                <SectionKicker>Contato</SectionKicker>
                <SectionTitle id="contact-title">
                  Conte o essencial. Nós continuamos pelo WhatsApp.
                </SectionTitle>
                <p>
                  A equipe entende o cenário, orienta os próximos passos e
                  combina o atendimento quando necessário.
                </p>

                <ContactDetails>
                  <ContactLink href={contact.phonePrimaryHref}>
                    <span>Telefone</span>
                    <strong>{contact.phonePrimary}</strong>
                  </ContactLink>
                  <ContactLink href={contact.phoneSecondaryHref}>
                    <span>Telefone</span>
                    <strong>{contact.phoneSecondary}</strong>
                  </ContactLink>
                  <ContactLink href={`mailto:${contact.email}`}>
                    <span>E-mail</span>
                    <strong>{contact.email}</strong>
                  </ContactLink>
                  <address>
                    <span>Endereço</span>
                    <strong>{contact.address}</strong>
                  </address>
                </ContactDetails>
              </ContactIntro>

              <VisitForm />
            </ContactGrid>
          </ContactSection>
        </main>

        <Footer>
          <FooterCta>
            <div>
              <p>Próximo passo</p>
              <h2>Vamos entender o que está acontecendo no seu ambiente.</h2>
            </div>
            <FooterCtaActions>
              <PrimaryButton as="a" href="#agendar-contato">
                Solicitar avaliação
                <ButtonArrow aria-hidden="true">↑</ButtonArrow>
              </PrimaryButton>
              <a href={contact.phonePrimaryHref}>
                Ligar {contact.phonePrimary} <span aria-hidden="true">↗</span>
              </a>
            </FooterCtaActions>
          </FooterCta>

          <FooterInner>
            <FooterBrand>
              <BrandMark />
              <p>
                Controle de pragas com critério técnico para residências,
                empresas e ambientes sensíveis em Belo Horizonte.
              </p>
            </FooterBrand>
            <FooterColumn>
              <h3>Navegação</h3>
              {navigationItems.map((item) => (
                <a href={item.href} key={item.id}>
                  {item.label}
                </a>
              ))}
            </FooterColumn>
            <FooterColumn>
              <h3>Contato</h3>
              <a href={contact.phonePrimaryHref}>{contact.phonePrimary}</a>
              <a href={contact.phoneSecondaryHref}>{contact.phoneSecondary}</a>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </FooterColumn>
          </FooterInner>

          <FooterMeta>
            <p>Ambiente Orkin — Belo Horizonte, MG.</p>
            <a
              href="https://ambiente.bio.br/politica-de-privacidade/"
              target="_blank"
              rel="noreferrer"
            >
              Política de privacidade (abre em nova aba)
            </a>
          </FooterMeta>
        </Footer>
      </SiteShell>
    </>
  );
}

export default App;
