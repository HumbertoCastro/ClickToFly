import { type ComponentType, type FormEvent, useMemo, useState } from 'react';
import {
  ArrowRight,
  CaretDown,
  ChatsCircle,
  CheckCircle,
  ClipboardText,
  Heartbeat,
  HouseLine,
  MapPinLine,
  PhoneCall,
  ShieldCheck,
  Stethoscope,
  UsersThree,
  WhatsappLogo,
} from '@phosphor-icons/react';
import heroCutoutUrl from './assets/layza-prisma-hero-waist.png';

type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
type PhosphorIcon = ComponentType<{
  size?: number;
  weight?: IconWeight;
  className?: string;
  'aria-hidden'?: boolean;
}>;

type Service = {
  icon: PhosphorIcon;
  tag: string;
  title: string;
  text: string;
};

const whatsappNumber = '5531983152969';
const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  'Olá, Prisma Enfermagem. Gostaria de agendar uma avaliação.',
)}`;

const trustSignals = [
  {
    title: '28 anos de enfermagem',
    text: 'Experiência clínica, docência e cuidado construído com método.',
  },
  {
    title: 'Casa ou consultório',
    text: 'O formato do atendimento acompanha a necessidade de cada paciente.',
  },
  {
    title: 'WhatsApp como porta de entrada',
    text: 'Contato rápido para entender o caso e alinhar os próximos passos.',
  },
];

const services: Service[] = [
  {
    icon: Heartbeat,
    tag: 'Feridas',
    title: 'Lesões cutâneas',
    text: 'Avaliação da pele, escolha de cobertura e acompanhamento da evolução com orientação clara.',
  },
  {
    icon: ShieldCheck,
    tag: 'Diabetes',
    title: 'Educação para diabéticos',
    text: 'Sinais de alerta, rotina de pele e prevenção para agir cedo e com mais segurança.',
  },
  {
    icon: Stethoscope,
    tag: 'Rotina',
    title: 'Cuidados gerais de enfermagem',
    text: 'Suporte para pacientes e famílias que precisam organizar o cuidado sem improviso.',
  },
];

const journey = [
  {
    icon: ClipboardText,
    title: 'Entender o caso',
    text: 'Histórico, rotina, aspecto da lesão, fatores de risco e dúvidas de quem está cuidando.',
  },
  {
    icon: Stethoscope,
    title: 'Definir a conduta',
    text: 'Orientação sobre cobertura, proteção, observação e o que merece atenção imediata.',
  },
  {
    icon: Heartbeat,
    title: 'Acompanhar a resposta',
    text: 'Comparação da evolução para ajustar o cuidado quando a pele pede outra estratégia.',
  },
  {
    icon: ChatsCircle,
    title: 'Orientar a família',
    text: 'Informações práticas para reduzir insegurança e melhorar a rotina de quem cuida.',
  },
];

const careModes = [
  {
    icon: HouseLine,
    title: 'Atendimento domiciliar',
    text: 'Para quem precisa de cuidado sem deslocamento e com adaptação à rotina da casa.',
  },
  {
    icon: MapPinLine,
    title: 'Avaliação em consultório',
    text: 'Ambiente adequado para observar a pele, explicar condutas e orientar a família.',
  },
  {
    icon: UsersThree,
    title: 'Paciente e cuidador',
    text: 'Clareza para quem executa o cuidado no dia a dia e quer evitar tentativa e erro.',
  },
  {
    icon: ShieldCheck,
    title: 'Prevenção e monitoramento',
    text: 'Educação em saúde para reduzir riscos e perceber cedo quando algo mudou.',
  },
];

const faqs = [
  {
    question: 'Quando uma ferida precisa de avaliação profissional?',
    answer:
      'Quando demora para cicatrizar, apresenta dor, vermelhidão, secreção, odor, inchaço ou quando a pessoa tem diabetes, alteração circulatória ou baixa sensibilidade.',
  },
  {
    question: 'A Prisma atende somente feridas?',
    answer:
      'O foco principal é o cuidado com lesões cutâneas, mas também há educação em saúde para diabéticos e cuidados gerais de enfermagem conforme a necessidade.',
  },
  {
    question: 'O atendimento substitui consulta médica?',
    answer:
      'Não. A assistência de enfermagem ajuda na avaliação, cuidado e acompanhamento. Febre, piora rápida ou sinais intensos de infecção exigem avaliação médica.',
  },
  {
    question: 'Como funciona o primeiro contato?',
    answer:
      'Você chama no WhatsApp, explica a situação e recebe orientação sobre os próximos passos para avaliação e planejamento do cuidado.',
  },
];

const formOptions = [
  'Avaliação de ferida',
  'Curativo e acompanhamento',
  'Educação em saúde para diabéticos',
  'Cuidados gerais de enfermagem',
];

const footerNavLinks = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#servicos', label: 'Serviços' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contato', label: 'Contato' },
];

const footerCareItems = [
  'Lesões cutâneas e acompanhamento',
  'Educação em saúde para diabéticos',
  'Cuidados gerais de enfermagem',
];

const footerCareTags = ['Atendimento domiciliar', 'Avaliação em consultório', 'Paciente e cuidador'];

function App() {
  const [openFaq, setOpenFaq] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', need: formOptions[0] });
  const [touched, setTouched] = useState({ name: false, phone: false });
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const errors = useMemo(
    () => ({
      name: form.name.trim().length < 2 ? 'Informe seu nome para personalizar o contato.' : '',
      phone:
        form.phone.replace(/\D/g, '').length < 10
          ? 'Informe um telefone com DDD para retorno pelo WhatsApp.'
          : '',
    }),
    [form.name, form.phone],
  );

  const customWhatsappHref = useMemo(() => {
    const message = [
      'Olá, Prisma Enfermagem.',
      `Meu nome é ${form.name || '[nome]'}.`,
      `Telefone: ${form.phone || '[telefone]'}.`,
      `Preciso de ajuda com: ${form.need}.`,
    ].join('\n');

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }, [form.name, form.need, form.phone]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ name: true, phone: true });

    if (errors.name || errors.phone) {
      setFormState('error');
      return;
    }

    setFormState('loading');
    window.setTimeout(() => {
      setFormState('success');
    }, 360);
  }

  return (
    <div className="site-shell">
      <div className="prism-field" aria-hidden="true">
        <span className="prism-shape prism-shape-1" />
        <span className="prism-shape prism-shape-2" />
        <span className="prism-shape prism-shape-3" />
        <span className="prism-shape prism-shape-4" />
        <span className="prism-shape prism-shape-5" />
        <span className="prism-shape prism-shape-6" />
      </div>

      <Header />

      <main>
        <section className="hero" id="top">
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>Feridas pedem cuidado certo.</h1>
              <p className="hero-text">
                A Prisma orienta, avalia e acompanha com atendimento humano em casa ou no consultório.
              </p>

              <div className="hero-actions">
                <a className="button button-primary" href={whatsappHref} target="_blank" rel="noreferrer">
                  <WhatsappLogo size={20} weight="bold" aria-hidden />
                  Agendar avaliação
                </a>
                <a className="button button-secondary" href="#como-funciona">
                  Entender o atendimento
                  <ArrowRight size={18} weight="bold" aria-hidden />
                </a>
              </div>
            </div>

            <div className="hero-visual" aria-label="Apresentação da enfermeira responsável pela Prisma Enfermagem">
              <div className="hero-visual-prisms" aria-hidden="true">
                <span className="hero-prism hero-prism-a" />
                <span className="hero-prism hero-prism-b" />
                <span className="hero-prism hero-prism-c" />
                <span className="hero-prism hero-prism-d" />
              </div>

              <div className="hero-visual-stage" aria-hidden="true">
                <span className="hero-stage-ring hero-stage-ring-1" />
                <span className="hero-stage-ring hero-stage-ring-2" />
                <span className="hero-stage-ring hero-stage-ring-3" />
                <span className="hero-stage-orbit hero-stage-orbit-a" />
                <span className="hero-stage-orbit hero-stage-orbit-b" />
                <span className="hero-stage-base" />

                <figure className="hero-cutout-wrap">
                  <img
                    className="hero-cutout"
                    src={heroCutoutUrl}
                    alt="Láyza Machado Dias, enfermeira responsável pela Prisma Enfermagem"
                    loading="eager"
                    decoding="async"
                  />
                </figure>
              </div>
            </div>
          </div>
        </section>

        <section className="signal-bar" aria-label="Sinais de confiança">
          {trustSignals.map((signal) => (
            <article className="signal-item" key={signal.title}>
              <h2>{signal.title}</h2>
              <p>{signal.text}</p>
            </article>
          ))}
        </section>

        <section className="section section-tint journey-section" id="como-funciona">
          <div className="journey-layout">
            <div className="journey-intro">
              <h2>Do sinal observado ao plano de cuidado.</h2>
              <p>
                A Prisma transforma dúvida em orientação objetiva. O cuidado começa pela leitura do caso,
                continua na conduta e ganha consistência no acompanhamento.
              </p>

              <div className="journey-alert">
                <strong>Quando vale procurar avaliação</strong>
                <ul>
                  <li>Dor, secreção, odor ou piora rápida da pele.</li>
                  <li>Ferida que não fecha ou retorna com frequência.</li>
                  <li>Diabetes, baixa sensibilidade ou alteração circulatória.</li>
                </ul>
              </div>
            </div>

            <div className="journey-steps">
              {journey.map((step) => (
                <article className="journey-step" key={step.title}>
                  <span className="journey-icon">
                    <step.icon size={28} weight="duotone" aria-hidden />
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-white services-section" id="servicos">
          <div className="section-copy">
            <h2>Atendimento para feridas, diabetes e rotina de cuidado.</h2>
            <p>
              A landing organiza o que a pessoa precisa entender no primeiro contato: o que observar, o que
              a Prisma faz e como iniciar a conversa com segurança.
            </p>
          </div>

          <div className="services-grid">
            <ServiceCard service={services[0]} className="service-card-primary" />

            <article className="service-proof">
              <p>O que muda na prática</p>
              <h3>Menos improviso, mais clareza para decidir o próximo passo.</h3>
              <ul>
                <li>
                  <CheckCircle size={18} weight="fill" aria-hidden />
                  <span>Orientação sobre cobertura, proteção e sinais de alerta.</span>
                </li>
                <li>
                  <CheckCircle size={18} weight="fill" aria-hidden />
                  <span>Explicação direta para paciente, familiar ou cuidador.</span>
                </li>
                <li>
                  <CheckCircle size={18} weight="fill" aria-hidden />
                  <span>Critério para acompanhar a resposta da pele ao cuidado.</span>
                </li>
              </ul>
            </article>

            <ServiceCard service={services[1]} className="service-card-secondary" />
            <ServiceCard service={services[2]} className="service-card-secondary service-card-tinted" />
          </div>
        </section>

        <section className="section modes-section">
          <div className="modes-copy">
            <h2>Atendimento pensado para a realidade de cada família.</h2>
            <p>
              A forma de cuidar muda conforme o deslocamento, a autonomia do paciente e a necessidade de
              orientação contínua. O método se adapta sem perder rigor.
            </p>
          </div>

          <div className="modes-list">
            {careModes.map((mode) => (
              <article className="mode-item" key={mode.title}>
                <span className="mode-icon">
                  <mode.icon size={26} weight="duotone" aria-hidden />
                </span>
                <div>
                  <h3>{mode.title}</h3>
                  <p>{mode.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section section-white faq-section" id="faq">
          <div className="faq-intro">
            <h2>Perguntas antes da primeira conversa.</h2>
            <p>
              O objetivo é orientar com responsabilidade. Quando existe sinal de urgência, a página deixa isso
              explícito e direciona para atendimento médico.
            </p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <article className="faq-item" key={faq.question}>
                  <button
                    aria-controls={`faq-answer-${index}`}
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    type="button"
                  >
                    <span>{faq.question}</span>
                    <CaretDown className={isOpen ? 'rotate-180' : ''} size={20} weight="bold" aria-hidden />
                  </button>
                  <div id={`faq-answer-${index}`} hidden={!isOpen}>
                    <p>{faq.answer}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section section-tint contact-section" id="contato">
          <div className="contact-copy">
            <h2>Conte o caso. A Prisma organiza o próximo passo.</h2>
            <p>
              Para urgências, febre, piora rápida ou sinais intensos de infecção, procure atendimento médico.
              Para avaliação de enfermagem, o WhatsApp é o caminho mais rápido.
            </p>

            <a className="phone-link" href={`tel:+${whatsappNumber}`}>
              <PhoneCall size={20} weight="bold" aria-hidden />
              (31) 98315-2969
            </a>

            <div className="contact-panel">
              <strong>O que ajuda no primeiro contato</strong>
              <ul>
                <li>
                  <span className="contact-panel-index">01</span>
                  <div>
                    <span className="contact-panel-label">Nome e WhatsApp com DDD</span>
                    <small>Para retorno rapido e identificacao do pedido.</small>
                  </div>
                </li>
                <li>
                  <span className="contact-panel-index">02</span>
                  <div>
                    <span className="contact-panel-label">Principal necessidade</span>
                    <small>Curativo, avaliacao, orientacao ou acompanhamento.</small>
                  </div>
                </li>
                <li>
                  <span className="contact-panel-index">03</span>
                  <div>
                    <span className="contact-panel-label">Resumo da situacao atual</span>
                    <small>O que esta acontecendo agora e ha quanto tempo.</small>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <label>
                <span>Nome</span>
                <input
                  value={form.name}
                  onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  aria-describedby="name-helper"
                  aria-invalid={Boolean(touched.name && errors.name)}
                  placeholder="Seu nome"
                />
                <small id="name-helper">
                  {touched.name && errors.name ? errors.name : 'Usado apenas para iniciar o contato.'}
                </small>
              </label>

              <label>
                <span>WhatsApp</span>
                <input
                  value={form.phone}
                  onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  aria-describedby="phone-helper"
                  aria-invalid={Boolean(touched.phone && errors.phone)}
                  inputMode="tel"
                  placeholder="(31) 99999-9999"
                />
                <small id="phone-helper">
                  {touched.phone && errors.phone ? errors.phone : 'Inclua DDD para agilizar o retorno.'}
                </small>
              </label>
            </div>

            <label className="select-label">
              <span>Principal necessidade</span>
              <select
                value={form.need}
                onChange={(event) => setForm((current) => ({ ...current, need: event.target.value }))}
              >
                {formOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <small>Selecione a opção mais próxima da sua situação.</small>
            </label>

            <div className="form-actions">
              <button className="button button-primary" disabled={formState === 'loading'} type="submit">
                {formState === 'loading' ? 'Preparando mensagem' : 'Agendar avaliação'}
                <ArrowRight size={18} weight="bold" aria-hidden />
              </button>

              {formState === 'success' ? (
                <a className="button button-secondary" href={customWhatsappHref} target="_blank" rel="noreferrer">
                  Abrir WhatsApp
                  <WhatsappLogo size={19} weight="bold" aria-hidden />
                </a>
              ) : null}
            </div>

            <p className="form-status" role="status" aria-live="polite">
              {formState === 'error'
                ? 'Revise os campos destacados para preparar a mensagem.'
                : formState === 'success'
                  ? 'Mensagem pronta. Abra o WhatsApp para enviar seu pedido de avaliação.'
                  : 'Resposta pelo WhatsApp conforme disponibilidade de atendimento.'}
            </p>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="Navegação principal">
        <a className="brand-lockup" href="#top" aria-label="Prisma Enfermagem">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>
            Prisma
            <small>Enfermagem</small>
          </span>
        </a>

        <div className="nav-links">
          <a href="#como-funciona">Como funciona</a>
          <a href="#servicos">Serviços</a>
          <a href="#faq">FAQ</a>
        </div>

        <a className="nav-cta" href={whatsappHref} target="_blank" rel="noreferrer">
          <WhatsappLogo size={18} weight="bold" aria-hidden />
          Agendar avaliação
        </a>
      </nav>
    </header>
  );
}

function ServiceCard({ className, service }: { className?: string; service: Service }) {
  return (
    <article className={['service-card', className].filter(Boolean).join(' ')}>
      <span className="service-tag">{service.tag}</span>
      <div className="service-card-head">
        <service.icon size={32} weight="duotone" aria-hidden />
        <h3>{service.title}</h3>
      </div>
      <p>{service.text}</p>
    </article>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <a className="brand-lockup" href="#top" aria-label="Prisma Enfermagem">
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            <span>
              Prisma
              <small>Enfermagem</small>
            </span>
          </a>

          <p>
            Assistência ao portador de lesão cutânea, educação em saúde para diabéticos e cuidados
            gerais com orientação clara para pacientes, familiares e cuidadores.
          </p>

          <div className="footer-pill-list" aria-label="Formatos de atendimento">
            {footerCareTags.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <nav className="footer-column" aria-label="Navegação do rodapé">
          <p className="footer-heading">Navegação</p>
          <ul className="footer-links">
            {footerNavLinks.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-column">
          <p className="footer-heading">Cuidados</p>
          <ul className="footer-links footer-links-muted">
            {footerCareItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="footer-column footer-contact">
          <p className="footer-heading">Contato</p>

          <a className="footer-phone" href={`tel:+${whatsappNumber}`}>
            <PhoneCall size={18} weight="bold" aria-hidden />
            (31) 98315-2969
          </a>

          <p>Primeiro contato pelo WhatsApp para entender o caso e orientar o próximo passo.</p>

          <a className="button button-primary footer-cta" href={whatsappHref} target="_blank" rel="noreferrer">
            <WhatsappLogo size={19} weight="bold" aria-hidden />
            Agendar avaliação
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Prisma Enfermagem</p>
        <span>Atendimento sob avaliação, em casa ou no consultório, conforme a necessidade do caso.</span>
        <a href="#top">Voltar ao topo</a>
      </div>
    </footer>
  );
}

export default App;
