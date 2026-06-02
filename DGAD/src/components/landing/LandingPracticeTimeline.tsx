import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { offer } from "@/data/site";

const practiceSteps = [
  {
    label: "Diagnóstico",
    title: "Escolha o pilar mais desalinhado.",
    text: "Saúde, família, finanças, trabalho ou espiritualidade. O sistema começa onde a vida real mais pede comando.",
    outcome: "Clareza do primeiro foco",
  },
  {
    label: "Delta positivo",
    title: "Aplique pequenas melhorias.",
    text: "Um ajuste de 1% por dia: pequeno o bastante para repetir, forte o bastante para mudar o padrão.",
    outcome: "Ação sem depender de motivação",
  },
  {
    label: "Ritual",
    title: "Construa rituais.",
    text: "Repita, ajuste e continue. A força aparece quando a rotina para de depender do humor.",
    outcome: "Constância protegida",
  },
  {
    label: "Integração",
    title: "Integre todas as áreas.",
    text: "Nenhuma cresce sozinha. Corpo, casa, dinheiro, trabalho e fé precisam conversar.",
    outcome: "Vida menos fragmentada",
  },
];

const examples = [
  ["Saúde", "treinar"],
  ["Família", "presença"],
  ["Finanças", "controle"],
  ["Espiritualidade", "conexão"],
  ["Trabalho", "execução"],
];

export function LandingPracticeTimeline() {
  return (
    <section className="lf-section lf-section--light practice-section" aria-labelledby="practice-title">
      <div className="practice-shell">
        <Reveal className="practice-intro">
          <div>
            <p className="section-kicker">Aplicação real</p>
            <h2 id="practice-title">Como aplicar o LifeForce 360º na vida real</h2>
            <p>Uma linha de execução simples: escolher, agir, repetir e integrar.</p>
          </div>

          <aside className="practice-intro__panel" aria-label="Princípio do Delta Positivo">
            <span>Delta positivo</span>
            <strong>1%</strong>
            <p>Pequenas ações repetidas criam direção antes que a rotina volte ao improviso.</p>
          </aside>
        </Reveal>

        <div className="method-timeline" role="list" aria-label="Linha do tempo de aplicação LifeForce 360º">
          {practiceSteps.map((step, index) => (
            <article key={step.title} className={`method-step method-step--${index + 1}`} role="listitem">
              <div className="method-step__marker" aria-hidden="true">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <CheckCircle2 />
              </div>
              <div className="method-step__inner">
                <span>{step.label}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <strong>{step.outcome}</strong>
              </div>
            </article>
          ))}
        </div>

        <div className="practice-footer">
          <div className="practice-examples" aria-label="Exemplos de aplicação">
            {examples.map(([pillar, action]) => (
              <span key={pillar}>
                {pillar}
                <ArrowRight aria-hidden="true" />
                {action}
              </span>
            ))}
          </div>
          <Button asChild size="lg" className="cta-button h-12 px-5 active:scale-[0.96]">
            <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
              Aplicar o método agora
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
