import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { offer } from "@/data/site";
import { toAppHref } from "@/lib/routing";

type OfferPanelProps = {
  compact?: boolean;
  emphasis?: "default" | "hero" | "quiet";
};

export function OfferPanel({ compact = false, emphasis = "default" }: OfferPanelProps) {
  const benefits = [
    "7 e-books integrados",
    "Método completo LifeForce 360º",
    "Entrada no ecossistema DGΔD",
    offer.access,
  ];

  return (
    <Card className="offer-panel" data-emphasis={emphasis}>
      <CardHeader>
        <CardTitle>{offer.title}</CardTitle>
        <p>{offer.subtitle}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="price-block">
          <span>De {offer.originalPrice}</span>
          <strong>{offer.price}</strong>
          <small>{offer.installments}</small>
        </div>
        <ul className="flex flex-col gap-3">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-sm text-muted-foreground">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 text-primary" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className={compact ? "flex-col items-stretch gap-3" : "flex-col items-stretch gap-3 sm:flex-row"}>
        <Button asChild size="lg" className={compact ? "cta-button h-12" : "cta-button h-12 flex-1"}>
            <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
              <ShieldCheck data-icon="inline-start" />
              Quero acessar agora
            </a>
          </Button>
        {!compact ? (
          <Button asChild size="lg" variant="outline" className="h-12 flex-1">
            <a href={toAppHref("/codigo-completo")}>
              Ver detalhes
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
