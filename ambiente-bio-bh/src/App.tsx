import { FormEvent, useMemo, useState } from "react";
import { TextField } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PestControlIcon from "@mui/icons-material/PestControl";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import ScienceIcon from "@mui/icons-material/Science";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  ActionButton,
  BrandMark,
  BrandName,
  BrandSub,
  BrandWord,
  ButtonRow,
  ContactCard,
  ContactList,
  ContactPanel,
  ContactText,
  Evidence,
  EvidenceItem,
  Footer,
  FooterInner,
  FormBody,
  FormHeader,
  FormPanel,
  GlobalStyle,
  Header,
  HeaderInner,
  Hero,
  HeroCopy,
  HeroGrid,
  HeroImage,
  HeroKicker,
  HeroMedia,
  HeroTitle,
  MethodBand,
  MethodGrid,
  MethodItem,
  Nav,
  OrkinBadge,
  PestChip,
  PestTrack,
  ProofCopy,
  ProofGrid,
  ProofImage,
  RiskPlanCopy,
  RiskPlanImage,
  RiskPlanItem,
  RiskPlanList,
  RiskPlanMedia,
  ResponseList,
  ResponseRow,
  SecondaryButton,
  Section,
  SectionFrame,
  SectionHead,
  SectorGrid,
  SectorItem,
  ServiceGrid,
  ServiceItem,
  SiteShell,
  SpecialistFigure,
  StatusMessage,
} from "./styles";
import {
  address,
  assetUrl,
  email,
  pests,
  phonePrimary,
  phoneSecondary,
  process,
  riskPlans,
  sectors,
  services,
  whatsappUrl,
} from "./content";
import type { PestId } from "./content";

type FormState = {
  name: string;
  phone: string;
  place: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type VisitFormProps = {
  compact?: boolean;
  id?: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  place: "",
  message: "",
};

const responseSignals = [
  {
    label: "Dengue e mosquitos",
    body: "Água parada, quintal, ralos, caixas ou presença constante de mosquitos pedem leitura rápida do foco.",
  },
  {
    label: "Roedores e baratas",
    body: "Ruídos, fezes, trilhas, odor ou atividade à noite indicam acesso, abrigo e alimento dentro do imóvel.",
  },
  {
    label: "Cupins e acervos",
    body: "Pó, asas, peças ocas, livros ou madeira atacada exigem diagnóstico antes de qualquer intervenção.",
  },
];

const proofItems = [
  {
    icon: <ScienceIcon />,
    title: "Coordenação técnica",
    body: "Equipe coordenada por biólogos e orientada por inspeção do ambiente.",
  },
  {
    icon: <CheckCircleIcon />,
    title: "Manejo integrado",
    body: "A.I.M.: avaliar, implantar e monitorar para controlar a causa, não só a ocorrência.",
  },
  {
    icon: <HealthAndSafetyIcon />,
    title: "Serviços especializados",
    body: "Controle urbano, MIP, anóxia para acervos e sanitização profissional.",
  },
];

function PestIllustration({ type }: { type: PestId }) {
  const svgProps = {
    "aria-hidden": true,
    focusable: false,
    viewBox: "0 0 96 72",
  } as const;

  switch (type) {
    case "mosquitos":
      return (
        <svg {...svgProps}>
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
            <path d="M42 38h24" />
            <path d="M65 38l13-9" />
            <path d="M48 37l-18-16c-8-7-20-1-16 9 4 9 19 12 34 7Z" opacity="0.78" />
            <path d="M52 39 32 54c-9 7-22 0-17-10 4-8 20-9 37-5Z" opacity="0.78" />
            <path d="m49 42-6 15" />
            <path d="m57 42-2 17" />
            <path d="m64 42 7 14" />
            <path d="m47 35-10-8" />
            <circle cx="67" cy="38" r="5" />
          </g>
        </svg>
      );
    case "cupins":
      return (
        <svg {...svgProps}>
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
            <ellipse cx="48" cy="35" rx="10" ry="14" />
            <ellipse cx="31" cy="36" rx="12" ry="9" />
            <ellipse cx="66" cy="36" rx="12" ry="9" />
            <path d="M40 31c-12-14-29-16-34-7 7 6 19 10 34 7Z" opacity="0.7" />
            <path d="M56 31c12-14 29-16 34-7-7 6-19 10-34 7Z" opacity="0.7" />
            <path d="M26 30 14 18" />
            <path d="M70 30 82 18" />
            <path d="M37 47 24 58" />
            <path d="M48 50v14" />
            <path d="M59 47 72 58" />
            <path d="M38 23c2 3 5 5 10 5s8-2 10-5" />
          </g>
        </svg>
      );
    case "formigas":
      return (
        <svg {...svgProps}>
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
            <circle cx="27" cy="38" r="9" />
            <ellipse cx="47" cy="38" rx="11" ry="9" />
            <ellipse cx="68" cy="38" rx="13" ry="10" />
            <path d="M22 31 13 20" />
            <path d="M29 30 24 18" />
            <path d="M40 43 27 59" />
            <path d="M47 47 44 62" />
            <path d="M55 43 66 61" />
            <path d="M38 33 27 18" />
            <path d="M55 33 67 18" />
          </g>
        </svg>
      );
    case "roedores":
      return (
        <svg {...svgProps}>
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
            <path d="M21 43c4-15 17-24 33-24 17 0 29 10 31 24-7 11-22 16-38 14-12-2-21-6-26-14Z" />
            <circle cx="56" cy="15" r="9" />
            <circle cx="76" cy="22" r="7" />
            <path d="M80 42c6-1 10 1 12 5" />
            <path d="M19 45c-9 2-14-2-15-8" />
            <path d="M14 48c-7 0-10 5-10 10" />
            <circle cx="70" cy="36" r="1.8" fill="currentColor" stroke="none" />
            <path d="M76 41h10" />
            <path d="M77 45h11" />
            <path d="M35 54 29 64" />
            <path d="M58 55 63 64" />
          </g>
        </svg>
      );
    case "baratas":
      return (
        <svg {...svgProps}>
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
            <ellipse cx="48" cy="39" rx="18" ry="24" />
            <path d="M48 16v47" />
            <path d="M35 31c7-5 19-5 26 0" />
            <path d="M34 44c8 5 20 5 28 0" />
            <path d="M36 19 22 7" />
            <path d="M60 19 74 7" />
            <path d="M31 32 13 24" />
            <path d="M30 40 10 41" />
            <path d="M34 50 17 61" />
            <path d="M65 32 83 24" />
            <path d="M66 40 86 41" />
            <path d="M62 50 79 61" />
          </g>
        </svg>
      );
    case "escorpioes":
      return (
        <svg {...svgProps}>
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
            <ellipse cx="42" cy="42" rx="17" ry="10" />
            <path d="M55 36c12-16 35-9 27 9-3 6-10 8-15 4" />
            <path d="M77 34c5-7 6-14 1-21" />
            <path d="m78 13 7 7" />
            <path d="M28 38 14 28" />
            <path d="M29 46 13 55" />
            <path d="M25 35 8 35" />
            <path d="M39 52 33 64" />
            <path d="M50 51 55 64" />
            <path d="M28 42h-9" />
            <path d="M18 42 7 47" />
            <path d="M18 42 7 37" />
          </g>
        </svg>
      );
    case "aranhas":
      return (
        <svg {...svgProps}>
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
            <circle cx="48" cy="38" r="11" />
            <ellipse cx="48" cy="25" rx="8" ry="7" />
            <path d="M39 32 22 19" />
            <path d="M37 38 15 36" />
            <path d="M40 45 22 58" />
            <path d="M45 49 39 66" />
            <path d="M57 32 74 19" />
            <path d="M59 38 81 36" />
            <path d="M56 45 74 58" />
            <path d="M51 49 57 66" />
            <circle cx="45" cy="24" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="51" cy="24" r="1.4" fill="currentColor" stroke="none" />
          </g>
        </svg>
      );
    case "moscas":
      return (
        <svg {...svgProps}>
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
            <ellipse cx="48" cy="39" rx="11" ry="17" />
            <circle cx="48" cy="19" r="8" />
            <path d="M42 33C25 16 7 17 6 33c9 8 23 9 36 0Z" opacity="0.74" />
            <path d="M54 33c17-17 35-16 36 0-9 8-23 9-36 0Z" opacity="0.74" />
            <path d="m40 51-11 12" />
            <path d="m56 51 11 12" />
            <path d="M42 16h12" />
            <path d="M44 21h8" />
          </g>
        </svg>
      );
    case "vespas":
      return (
        <svg {...svgProps}>
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
            <path d="M26 38c8-12 32-14 46-2-7 15-29 19-46 2Z" />
            <path d="m72 36 14 3-14 5" />
            <circle cx="24" cy="38" r="7" />
            <path d="M38 31c1 6 0 11-4 16" />
            <path d="M50 29c2 7 1 14-5 22" />
            <path d="M62 32c2 5 1 10-3 15" />
            <path d="M39 31C26 12 9 15 9 30c8 6 18 7 30 1Z" opacity="0.74" />
            <path d="M51 30c14-18 31-14 30 2-8 6-18 6-30-2Z" opacity="0.74" />
            <path d="M19 32 10 22" />
            <path d="M19 44 9 52" />
          </g>
        </svg>
      );
    default:
      return null;
  }
}

function buildWhatsAppMessage(form: FormState) {
  const lines = [
    "Olá, vim pela landing page da Ambiente Bio BH e gostaria de agendar uma visita.",
    `Nome: ${form.name}`,
    `Telefone: ${form.phone}`,
    `Local: ${form.place}`,
    `Mensagem: ${form.message}`,
  ];

  return `https://api.whatsapp.com/send?phone=5531987930625&text=${encodeURIComponent(lines.join("\n"))}`;
}

function App() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const contactLink = useMemo(() => buildWhatsAppMessage(form), [form]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setStatus("idle");
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (form.name.trim().length < 2) {
      nextErrors.name = "Informe seu nome para a equipe identificar o atendimento.";
    }

    if (form.phone.replace(/\D/g, "").length < 10) {
      nextErrors.phone = "Inclua um telefone com DDD.";
    }

    if (form.place.trim().length < 3) {
      nextErrors.place = "Conte se é casa, empresa, condomínio ou acervo.";
    }

    if (form.message.trim().length < 8) {
      nextErrors.message = "Descreva o problema em uma frase curta.";
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("error");
      return;
    }

    setStatus("success");
    window.open(contactLink, "_blank", "noopener,noreferrer");
  }

  function VisitForm({ compact = false, id }: VisitFormProps) {
    return (
      <FormPanel id={id} noValidate onSubmit={handleSubmit} $compact={compact}>
        <FormHeader>
          <span>Solicitar visita</span>
          <strong>Resposta por WhatsApp</strong>
        </FormHeader>

        <FormBody>
          <TextField
            label="Nome"
            name="name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name}
            autoComplete="name"
            fullWidth
          />
          <TextField
            label="Telefone com DDD"
            name="phone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            error={Boolean(errors.phone)}
            helperText={errors.phone}
            autoComplete="tel"
            fullWidth
          />
          <TextField
            label="Tipo de local"
            name="place"
            value={form.place}
            onChange={(event) => updateField("place", event.target.value)}
            error={Boolean(errors.place)}
            helperText={errors.place || "Casa, empresa, condomínio, restaurante ou acervo."}
            fullWidth
          />
          <TextField
            label="O que está acontecendo?"
            name="message"
            value={form.message}
            onChange={(event) => updateField("message", event.target.value)}
            error={Boolean(errors.message)}
            helperText={errors.message}
            multiline
            minRows={compact ? 3 : 4}
            fullWidth
          />

          {status === "error" && (
            <StatusMessage $tone="error" aria-live="polite">
              Revise os campos destacados para abrir a mensagem no WhatsApp.
            </StatusMessage>
          )}
          {status === "success" && (
            <StatusMessage $tone="success" aria-live="polite">
              Mensagem pronta. O WhatsApp foi aberto em uma nova aba.
            </StatusMessage>
          )}

          <ActionButton type="submit" startIcon={<WhatsAppIcon />} endIcon={<ArrowForwardIcon />}>
            Enviar pelo WhatsApp
          </ActionButton>
        </FormBody>
      </FormPanel>
    );
  }

  return (
    <SiteShell>
      <GlobalStyle />
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>

      <Header>
        <HeaderInner maxWidth="xl">
          <BrandMark href="#top" aria-label="Ambiente Bio BH">
            <BrandName>
              <BrandWord>ambiente</BrandWord>
              <BrandSub>CONTROLE DE INSETOS E ROEDORES</BrandSub>
            </BrandName>
            <OrkinBadge aria-label="Orkin">
              <span>ORKIN</span>
            </OrkinBadge>
          </BrandMark>

          <Nav aria-label="Contato rápido">
            <a href="tel:+553133446600">
              <PhoneInTalkIcon fontSize="small" />
              {phonePrimary}
            </a>
            <a href="#servicos">Serviços</a>
          </Nav>

          <ActionButton href={whatsappUrl} startIcon={<WhatsAppIcon />} className="header-action">
            Agendar
          </ActionButton>
        </HeaderInner>
      </Header>

      <main id="conteudo">
        <Hero id="top" aria-labelledby="hero-title">
          <HeroGrid maxWidth="xl">
            <HeroCopy>
              <HeroKicker>
                <PestControlIcon fontSize="small" />
                Controle de pragas em Belo Horizonte
              </HeroKicker>
              <HeroTitle id="hero-title">Sua casa livre de pragas.</HeroTitle>
              <p>
                A Ambiente Bio BH elimina focos de risco e protege casas, condomínios e empresas contra
                insetos, roedores e novas infestações.
              </p>

              <ButtonRow>
                <ActionButton href="#agendar-contato" startIcon={<WhatsAppIcon />}>
                  Agendar visita
                </ActionButton>
                <SecondaryButton href="tel:+553133446600" startIcon={<PhoneInTalkIcon />}>
                  Ligar agora
                </SecondaryButton>
              </ButtonRow>
            </HeroCopy>

            <HeroMedia aria-label="Casa protegida contra insetos e infestações">
              <HeroImage
                src={assetUrl("/assets/hero-casa-protegida-3d-cutout.png")}
                alt="Casa 3D com inseto bloqueado por símbolo vermelho de proibição"
                width="1536"
                height="1024"
                fetchPriority="high"
              />
            </HeroMedia>
          </HeroGrid>
        </Hero>

        <Section id="sinais" aria-labelledby="sinais-title">
          <SectionFrame maxWidth="xl">
            <SectionHead>
              <h2 id="sinais-title">Sinais pequenos costumam revelar uma rota de acesso maior.</h2>
              <p>
                A visita técnica começa pela leitura do ambiente: onde a praga entra, onde se abriga e o
                que mantém a atividade.
              </p>
            </SectionHead>

            <ResponseList>
              {responseSignals.map((signal, index) => (
                <ResponseRow key={signal.label}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{signal.label}</h3>
                    <p>{signal.body}</p>
                  </div>
                </ResponseRow>
              ))}
            </ResponseList>
          </SectionFrame>
        </Section>

        <Section id="servicos" aria-labelledby="servicos-title">
          <SectionFrame maxWidth="xl">
            <SectionHead>
              <h2 id="servicos-title">Um plano para cada risco, sem aplicar solução genérica.</h2>
              <p>
                O atendimento separa urgência, rotina preventiva e intervenção especializada para proteger
                casas, empresas, instituições e acervos.
              </p>
            </SectionHead>

            <ServiceGrid>
              {services.map((service) => (
                <ServiceItem key={service.title}>
                  <span>{service.tag}</span>
                  <h3>{service.title}</h3>
                  <p>{service.body}</p>
                </ServiceItem>
              ))}
            </ServiceGrid>
          </SectionFrame>
        </Section>

        <MethodBand id="metodo" aria-labelledby="metodo-title">
          <SectionFrame maxWidth="xl">
            <SectionHead>
              <h2 id="metodo-title">Avaliar, implantar e monitorar até o ambiente voltar ao controle.</h2>
              <p>
                O manejo integrado organiza a resposta: primeiro diagnóstico, depois intervenção e, por
                fim, acompanhamento dos sinais que podem fazer a infestação retornar.
              </p>
            </SectionHead>

            <MethodGrid>
              {process.map((item, index) => (
                <MethodItem key={item.step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{item.step}</h3>
                  <p>{item.body}</p>
                </MethodItem>
              ))}
            </MethodGrid>
          </SectionFrame>
        </MethodBand>

        <Section id="planos-risco" aria-labelledby="planos-risco-title">
          <SectionFrame maxWidth="xl">
            <SectionHead>
              <h2 id="planos-risco-title">Um plano para cada risco, sem atendimento generico.</h2>
              <p>
                As imagens mostram como a equipe alterna leitura tecnica, comunicacao e monitoramento para
                encaixar o controle de pragas no tipo de ambiente.
              </p>
            </SectionHead>

            <RiskPlanList>
              {riskPlans.map((plan, index) => (
                <RiskPlanItem key={plan.title} aria-labelledby={`plano-risco-${index}`}>
                  <RiskPlanCopy>
                    <span>{plan.eyebrow}</span>
                    <h3 id={`plano-risco-${index}`}>{plan.title}</h3>
                    <p>{plan.body}</p>
                    <strong>{plan.detail}</strong>
                  </RiskPlanCopy>

                  <RiskPlanMedia>
                    <RiskPlanImage
                      src={plan.image}
                      alt={plan.alt}
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                      style={{ objectPosition: plan.imagePosition }}
                    />
                  </RiskPlanMedia>
                </RiskPlanItem>
              ))}
            </RiskPlanList>
          </SectionFrame>
        </Section>

        <Section aria-labelledby="prova-title">
          <SectionFrame maxWidth="xl">
            <ProofGrid>
              <SpecialistFigure>
                <ProofImage
                  src={assetUrl("/assets/orkin-produtos-cozinha.png")}
                  alt="Produtos e equipamentos profissionais Orkin em bancada de cozinha industrial"
                  width="900"
                  height="1600"
                  decoding="async"
                />
              </SpecialistFigure>

              <ProofCopy>
                <h2 id="prova-title">Controle de pragas com critério biológico e comunicação direta.</h2>
                <p>
                  A Ambiente atua desde 1980 com controle integrado de pragas e é Ambiente Orkin desde
                  2014. A proposta é combinar resposta objetiva quando há risco com orientação técnica
                  para reduzir reincidência.
                </p>

                <Evidence>
                  {proofItems.map((item) => (
                    <EvidenceItem key={item.title}>
                      {item.icon}
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.body}</p>
                      </div>
                    </EvidenceItem>
                  ))}
                </Evidence>
              </ProofCopy>
            </ProofGrid>
          </SectionFrame>
        </Section>

        <Section id="setores" aria-labelledby="setores-title">
          <SectionFrame maxWidth="xl">
            <SectionHead>
              <h2 id="setores-title">Atendimento para residência, negócio e operação crítica.</h2>
              <p>
                A equipe adapta a inspeção, a técnica e a comunicação ao tipo de ambiente atendido.
              </p>
            </SectionHead>

            <PestTrack aria-label="Pragas atendidas">
              {pests.map((pest) => (
                <PestChip
                  key={pest.id}
                  tabIndex={0}
                  role="group"
                  aria-labelledby={`${pest.id}-title`}
                  aria-describedby={`${pest.id}-description`}
                >
                  <span className="pest-visual">
                    <img src={pest.image} alt={pest.alt} loading="lazy" decoding="async" />
                  </span>
                  <strong id={`${pest.id}-title`}>{pest.title}</strong>
                  <p id={`${pest.id}-description`}>{pest.description}</p>
                </PestChip>
              ))}
            </PestTrack>

            <SectorGrid aria-label="Setores atendidos">
              {sectors.map((sector) => (
                <SectorItem key={sector}>{sector}</SectorItem>
              ))}
            </SectorGrid>
          </SectionFrame>
        </Section>

        <Section id="contato" aria-labelledby="contato-title">
          <SectionFrame maxWidth="xl">
            <ContactPanel>
              <ContactText>
                <h2 id="contato-title">Passe o problema para a equipe e agende a visita.</h2>
                <p>
                  O formulário abre uma mensagem pronta no WhatsApp. Quem prefere atendimento por telefone
                  pode ligar para os números oficiais de Belo Horizonte.
                </p>

                <ContactList>
                  <li>
                    <PhoneInTalkIcon />
                    <span>
                      {phonePrimary} | {phoneSecondary}
                    </span>
                  </li>
                  <li>
                    <EmailIcon />
                    <span>{email}</span>
                  </li>
                  <li>
                    <LocationOnIcon />
                    <span>{address}</span>
                  </li>
                </ContactList>
              </ContactText>

              <ContactCard>
                <VisitForm compact id="agendar-contato" />
              </ContactCard>
            </ContactPanel>
          </SectionFrame>
        </Section>
      </main>

      <Footer>
        <FooterInner maxWidth="xl">
          <BrandMark href="#top" aria-label="Voltar para o topo">
            <BrandName>
              <BrandWord>ambiente</BrandWord>
              <BrandSub>CONTROLE DE INSETOS E ROEDORES</BrandSub>
            </BrandName>
          </BrandMark>
          <span>Ambiente Bio BH, controle integrado de pragas em Belo Horizonte.</span>
        </FooterInner>
      </Footer>
    </SiteShell>
  );
}

export default App;
