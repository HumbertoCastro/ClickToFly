import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/Reveal";
import { contactInfo, privacySections, refundSections } from "@/data/site";

type LegalPageProps = {
  kind: "privacy" | "refund";
};

export function LegalPage({ kind }: LegalPageProps) {
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Política de Privacidade" : "Pagamento e Reembolso";
  const intro = isPrivacy
    ? "A sua privacidade é importante para nós. Esta política explica como o site DGAD coleta, utiliza e protege informações fornecidas pelos usuários."
    : "O DGAD é um produto digital entregue online. Esta página explica pagamento, liberação de acesso e reembolso.";
  const sections = isPrivacy ? privacySections : refundSections;

  return (
    <>
      <section className="simple-hero legal-hero" aria-labelledby="legal-title">
        <Reveal>
          <h1 id="legal-title">{title}</h1>
          <p>{intro}</p>
        </Reveal>
      </section>

      <section className="legal-content" aria-label={title}>
        {sections.map((section, index) => (
          <Reveal key={section.title} delay={index * 0.03}>
            <article className="legal-row">
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          </Reveal>
        ))}
      </section>

      <section className="section-shell contact-section" aria-labelledby="contact-title">
        <Reveal className="section-heading">
          <p className="section-kicker">Contato</p>
          <h2 id="contact-title">Canais oficiais de suporte.</h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [MessageCircle, "WhatsApp", contactInfo.whatsapp, "https://wa.me/5511999739131"],
            [Mail, "E-mail", contactInfo.email, `mailto:${contactInfo.email}`],
            [MapPin, "Endereço", contactInfo.address, ""],
          ].map(([Icon, label, value, href]) => (
            <Card key={String(label)} className="contact-card">
              <CardContent>
                <Icon aria-hidden="true" />
                <h3>{label as string}</h3>
                {href ? (
                  <a href={href as string} className="footer-link">
                    {value as string}
                  </a>
                ) : (
                  <p>{value as string}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
