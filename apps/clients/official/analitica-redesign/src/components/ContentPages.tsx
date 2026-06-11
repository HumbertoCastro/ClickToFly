import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import {
  aboutPortfolio,
  complianceItems,
  contact,
  insightPosts,
  quoteFields,
} from "../data/analitica";
import { defaultQuoteMessage, whatsappHref } from "../lib/contact";
import { assetPath, withBasePath, type NavigateHandler } from "../lib/navigation";
import { ComplianceSection } from "./ComplianceSection";
import { ContactSection } from "./ContactSection";
import { CredentialsSection } from "./CredentialsSection";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle } from "./ui/card";

type PageProps = {
  onNavigate: NavigateHandler;
};

type QuoteFormState = {
  nome: string;
  empresa: string;
  email: string;
  cidade: string;
  documento: string;
  telefone: string;
  estado: string;
  mensagem: string;
  arquivo: string;
};

const initialQuoteForm: QuoteFormState = {
  nome: "",
  empresa: "",
  email: "",
  cidade: "",
  documento: "",
  telefone: "",
  estado: "",
  mensagem: "",
  arquivo: "",
};

const fieldMap: Record<string, keyof QuoteFormState> = {
  Nome: "nome",
  Empresa: "empresa",
  "E-mail": "email",
  Cidade: "cidade",
  "CNPJ/CPF": "documento",
  Telefone: "telefone",
  Estado: "estado",
  Mensagem: "mensagem",
};

export function AboutPage({ onNavigate }: PageProps) {
  return (
    <main className="page-shell">
      <section className="overflow-hidden border-b border-border bg-white">
        <div className="container grid gap-10 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20">
          <div className="flex flex-col gap-6">
            <Button asChild className="w-fit" variant="outline">
              <a href={withBasePath("/")} onClick={(event) => onNavigate("/", event)}>
                <ArrowLeft data-icon="inline-start" />
                Voltar para a home
              </a>
            </Button>
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                Quem somos
              </p>
              <h1 className="max-w-3xl text-[2.2rem] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                Tradição de 1989 com foco em tecnologia, atendimento e portfólio técnico.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                A Analítica foi fundada para comercializar reagentes analíticos e suprimentos para
                laboratórios. Hoje atende setores em todo o território nacional, mantendo história,
                equipe qualificada e compromisso com soluções avançadas.
              </p>
            </div>
          </div>
          <img
            className="h-[420px] w-full rounded-2xl object-cover shadow-soft"
            src={assetPath("/assets/site-quem-somos.png")}
            alt="Imagem institucional da Analítica"
          />
        </div>
      </section>

      <CredentialsSection />

      <section className="section-pad bg-secondary/55">
        <div className="container grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Portfólio institucional
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Linhas citadas na página original Quem somos.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {aboutPortfolio.map((item, index) => (
              <article
                key={item}
                className="page-stagger flex gap-3 rounded-xl border border-border bg-white p-4 shadow-line"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                <p className="text-sm font-semibold leading-6 text-foreground">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function ControlledProductsPage({ onNavigate }: PageProps) {
  return (
    <main className="page-shell">
      <ComplianceSection onNavigate={onNavigate} />
      <section className="section-pad bg-secondary/55">
        <div className="container grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Controle de produtos químicos
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Polícia Federal, Exército e Polícia Civil.
            </h1>
            <p className="text-base leading-8 text-muted-foreground">
              A página original explica que esses produtos são regulamentados para evitar uso
              indevido e proteger a segurança pública. A Analítica mantém controle no repasse a
              terceiros habilitados e cuidado na transmissão das informações.
            </p>
          </div>

          <div className="grid gap-4">
            {complianceItems.map((item, index) => (
              <Card key={item} className="page-stagger bg-white" style={{ animationDelay: `${index * 70}ms` }}>
                <CardHeader className="flex-row items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <ShieldCheck className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle>Orientação {index + 1}</CardTitle>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item}</p>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function InsightsPage({ onNavigate }: PageProps) {
  return (
    <main className="page-shell">
      <section className="overflow-hidden border-b border-border bg-white">
        <div className="container flex flex-col gap-6 py-14 lg:py-20">
          <Button asChild className="w-fit" variant="outline">
            <a href={withBasePath("/")} onClick={(event) => onNavigate("/", event)}>
              <ArrowLeft data-icon="inline-start" />
              Voltar para a home
            </a>
          </Button>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Fique por dentro
            </p>
            <h1 className="mt-4 text-[2.2rem] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              Conteúdos técnicos incorporados da categoria original.
            </h1>
            <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
              A seção reúne os artigos exibidos no site da Analítica sobre meios de cultura,
              Thermo/Oxoid, controle de qualidade na siderurgia e Corning.
            </p>
          </div>
        </div>
      </section>

      <section className="section-pad bg-secondary/55">
        <div className="container grid gap-5 sm:grid-cols-2">
          {insightPosts.map((post, index) => (
            <article
              key={post.title}
              className="page-stagger overflow-hidden rounded-2xl border border-border bg-white shadow-line transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-soft"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <img className="h-64 w-full object-cover" src={post.image} alt={post.title} />
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  <BookOpen className="size-4" aria-hidden="true" />
                  {post.category}
                  <span className="text-muted-foreground">{post.date}</span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold leading-tight text-foreground">
                  {post.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function ContactPage() {
  return (
    <main className="page-shell">
      <ContactSection />
    </main>
  );
}

export function QuotePage({ onNavigate }: PageProps) {
  return (
    <main className="page-shell">
      <section className="overflow-hidden border-b border-border bg-white">
        <div className="surface-grid">
          <div className="container grid gap-10 py-14 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:py-20">
            <div className="flex flex-col gap-6">
              <Button asChild className="w-fit" variant="outline">
                <a href={withBasePath("/")} onClick={(event) => onNavigate("/", event)}>
                  <ArrowLeft data-icon="inline-start" />
                  Voltar para a home
                </a>
              </Button>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  Orçamento
                </p>
                <h1 className="mt-4 text-[2.2rem] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                  Facilitamos o processo de cotação online.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                  Preencha as informações sobre sua empresa e os produtos desejados. A mensagem
                  será enviada para o atendimento comercial da Analítica.
                </p>
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground">
                <a className="flex items-center gap-2 hover:text-foreground" href={contact.emailHref}>
                  <Mail className="size-4" aria-hidden="true" />
                  {contact.email}
                </a>
                <a className="flex items-center gap-2 hover:text-foreground" href={contact.phoneHref}>
                  <Phone className="size-4" aria-hidden="true" />
                  {contact.phone}
                </a>
                <a
                  className="flex items-center gap-2 hover:text-foreground"
                  href={contact.mapsHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className="size-4" aria-hidden="true" />
                  {contact.address}
                </a>
              </div>
            </div>

            <QuoteForm />
          </div>
        </div>
      </section>
    </main>
  );
}

function QuoteForm() {
  const [values, setValues] = useState(initialQuoteForm);
  const [errors, setErrors] = useState<Partial<Record<keyof QuoteFormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "success">("idle");

  function updateField(field: keyof QuoteFormState, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setStatus("idle");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const fileName = event.currentTarget.files?.[0]?.name ?? "";
    updateField("arquivo", fileName);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const requiredFields: (keyof QuoteFormState)[] = [
      "nome",
      "empresa",
      "email",
      "cidade",
      "documento",
      "telefone",
      "estado",
      "mensagem",
    ];
    const nextErrors: Partial<Record<keyof QuoteFormState, string>> = {};

    requiredFields.forEach((field) => {
      if (!values[field].trim()) {
        nextErrors[field] = "Preencha este campo para enviar a cotação.";
      }
    });

    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "Informe um e-mail válido para retorno comercial.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const message = [
      defaultQuoteMessage,
      "",
      `Nome: ${values.nome}`,
      `Empresa: ${values.empresa}`,
      `E-mail: ${values.email}`,
      `Cidade/Estado: ${values.cidade} - ${values.estado}`,
      `CNPJ/CPF: ${values.documento}`,
      `Telefone: ${values.telefone}`,
      values.arquivo ? `Arquivo mencionado: ${values.arquivo}` : "",
      "",
      `Mensagem: ${values.mensagem}`,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(whatsappHref(message), "_blank", "noopener,noreferrer");
    setStatus("success");
  }

  return (
    <form
      className="rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-7"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <FileText className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-semibold leading-tight text-foreground">Solicitar cotação</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Campos alinhados ao formulário original de orçamento.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {quoteFields.slice(0, -1).map((label) => {
          const field = fieldMap[label];
          return (
            <div key={label} className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground" htmlFor={field}>
                {label} *
              </label>
              <input
                aria-describedby={errors[field] ? `${field}-error` : undefined}
                aria-invalid={Boolean(errors[field])}
                className="h-12 rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                id={field}
                name={field}
                onChange={(event) => updateField(field, event.currentTarget.value)}
                type={field === "email" ? "email" : "text"}
                value={values[field]}
              />
              {errors[field] && (
                <p className="text-xs font-medium text-destructive" id={`${field}-error`}>
                  {errors[field]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="arquivo">
          Anexar arquivo
        </label>
        <input
          className="sr-only"
          id="arquivo"
          name="arquivo"
          onChange={handleFileChange}
          type="file"
        />
        <label
          className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-input bg-secondary/50 px-4 py-4 text-sm font-medium text-muted-foreground transition hover:border-primary/45 hover:bg-secondary focus-within:border-primary"
          htmlFor="arquivo"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UploadCloud className="size-5" aria-hidden="true" />
          </span>
          <span>{values.arquivo || "Clique para selecionar um arquivo"}</span>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="mensagem">
          Mensagem *
        </label>
        <textarea
          aria-describedby={errors.mensagem ? "mensagem-error" : undefined}
          aria-invalid={Boolean(errors.mensagem)}
          className="min-h-32 rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
          id="mensagem"
          name="mensagem"
          onChange={(event) => updateField("mensagem", event.currentTarget.value)}
          value={values.mensagem}
        />
        {errors.mensagem && (
          <p className="text-xs font-medium text-destructive" id="mensagem-error">
            {errors.mensagem}
          </p>
        )}
      </div>

      {status === "success" && (
        <div className="mt-5 rounded-xl border border-accent/25 bg-accent/10 p-4 text-sm font-medium text-accent-foreground">
          Conversa aberta no WhatsApp. Caso o navegador bloqueie a nova aba, use o botão novamente.
        </div>
      )}

      <Button className="mt-6 w-full" size="lg" type="submit" variant="whatsapp">
        <Send data-icon="inline-start" />
        Enviar pelo WhatsApp
      </Button>
    </form>
  );
}
