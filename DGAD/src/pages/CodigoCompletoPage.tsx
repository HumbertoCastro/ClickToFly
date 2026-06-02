import { ArrowRight, CheckCircle2, LockKeyhole, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OfferPanel } from "@/components/OfferPanel";
import { Reveal } from "@/components/Reveal";
import { VideoShowcase } from "@/components/VideoShowcase";
import { mediaAssets, offer } from "@/data/site";

const faqs = [
  {
    question: "Para quem é esse produto?",
    answer:
      "Para homens adultos que buscam clareza, rotina e responsabilidade pessoal para organizar as áreas essenciais da vida com mais disciplina.",
  },
  {
    question: "Como funciona a garantia?",
    answer:
      "Você tem 7 dias para solicitar reembolso integral conforme as regras da plataforma de pagamento e a legislação vigente.",
  },
  {
    question: "Como acessar o produto?",
    answer:
      "Após a confirmação do pagamento, o acesso é enviado por e-mail ou disponibilizado na área de compras da Hotmart.",
  },
  {
    question: "O pagamento é seguro?",
    answer:
      "Sim. A compra é processada no checkout oficial da Hotmart, com métodos como cartão de crédito, Pix e boleto, quando disponíveis.",
  },
];

export function CodigoCompletoPage() {
  return (
    <>
      <section className="sales-hero" aria-labelledby="sales-title">
        <div className="sales-hero__copy">
          <Reveal>
            <Badge variant="secondary" className="w-fit">
              Acesso imediato · Garantia de 7 dias
            </Badge>
            <h1 id="sales-title">{offer.title}</h1>
            <p>{offer.subtitle} Descubra o código para a vida real que transforma rotina em resultado aplicado.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="cta-button h-12">
                <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
                  <ShieldCheck data-icon="inline-start" />
                  Comprar agora
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12">
                <a href="#conteudo">
                  Ver conteúdo
                  <ArrowRight data-icon="inline-end" />
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
        <Reveal className="sales-hero__offer" delay={0.08}>
          <figure className="sales-product-figure">
            <img src={mediaAssets.productBundle} alt="Pacote digital DGAD com sete e-books e acesso multiplataforma" />
          </figure>
          <OfferPanel compact emphasis="hero" />
        </Reveal>
      </section>

      <section className="section-shell" id="conteudo" aria-labelledby="content-title">
        <Reveal className="section-heading">
          <p className="section-kicker">Sobre o conteúdo</p>
          <h2 id="content-title">Um método para organizar a vida com disciplina diária.</h2>
          <p>
            O LifeForce 360° conecta decisões, rotina e responsabilidade pessoal para mudanças reais e duradouras.
          </p>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Método aplicado", "Não depende de motivação solta. Depende de clareza, repetição e responsabilidade."],
            ["Vida integrada", "Mente, corpo, espiritualidade, trabalho, finanças e família entram no mesmo sistema."],
            ["Execução real", "O foco é sair do discurso e criar direção prática para o dia a dia."],
          ].map(([title, text]) => (
            <Reveal key={title}>
              <Card className="principle-card">
                <CardContent>
                  <CheckCircle2 aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="creator-section sales-creator" aria-labelledby="sales-creator-title">
        <div className="creator-media">
          <img src={mediaAssets.creator.portrait} alt="Paulo Matos, criador do LifeForce 360°" />
        </div>
        <Reveal className="creator-copy">
          <p className="section-kicker">Paulo Matos</p>
          <h2 id="sales-creator-title">“Esse código nasceu da prática real.”</h2>
          <p>
            Disciplina diária, decisões difíceis, família como prioridade, saúde como base e propósito como direção.
            Essa é a lógica por trás do DGAD.
          </p>
          <p>
            Se você busca clareza, direção e consistência, este conteúdo foi criado para organizar a ação antes que a
            rotina volte ao improviso.
          </p>
        </Reveal>
      </section>

      <section className="section-shell guarantee-section" aria-labelledby="guarantee-title">
        <Reveal className="section-heading">
          <p className="section-kicker">Compra segura</p>
          <h2 id="guarantee-title">Garantia, acesso e pagamento claros antes do clique.</h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [ShieldCheck, "Garantia de 7 dias", "Seu dinheiro de volta em até 7 dias após a compra, conforme a plataforma."],
            [MonitorSmartphone, "Qualquer dispositivo", "Acesse pelo computador, celular, tablet ou outro dispositivo digital."],
            [LockKeyhole, "Checkout oficial", "Pagamento processado em ambiente seguro pela Hotmart."],
          ].map(([Icon, title, text]) => (
            <Reveal key={String(title)}>
              <Card className="principle-card">
                <CardContent>
                  <Icon aria-hidden="true" />
                  <h3>{title as string}</h3>
                  <p>{text as string}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <VideoShowcase />

      <section className="section-shell faq-section" aria-labelledby="faq-title">
        <Reveal className="section-heading">
          <p className="section-kicker">Perguntas frequentes</p>
          <h2 id="faq-title">Respostas objetivas para decidir sem ruído.</h2>
        </Reveal>
        <Accordion type="single" collapsible className="faq-list">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`faq-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="closing-band sales-close" aria-labelledby="sales-close-title">
        <Reveal>
          <h2 id="sales-close-title">O próximo passo é simples.</h2>
          <p>Entre no checkout oficial, finalize a compra e receba o acesso ao conteúdo digital.</p>
          <Button asChild size="lg" className="cta-button h-12">
            <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
              Comprar agora por {offer.price}
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        </Reveal>
      </section>
    </>
  );
}
