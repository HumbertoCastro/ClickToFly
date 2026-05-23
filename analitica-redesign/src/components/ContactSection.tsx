import { ExternalLink, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { contact } from "../data/analitica";
import { defaultQuoteMessage, whatsappHref } from "../lib/contact";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SectionIntro } from "./SectionIntro";

const contactActions = [
  {
    label: "WhatsApp comercial",
    value: contact.whatsapp,
    href: whatsappHref(defaultQuoteMessage),
    icon: MessageCircle,
    external: true,
  },
  {
    label: "Telefone",
    value: contact.phone,
    href: contact.phoneHref,
    icon: Phone,
    external: false,
  },
  {
    label: "E-mail",
    value: contact.email,
    href: contact.emailHref,
    icon: Mail,
    external: false,
  },
  {
    label: "Endereço",
    value: contact.address,
    href: contact.mapsHref,
    icon: MapPin,
    external: true,
  },
];

export function ContactSection() {
  return (
    <section id="contato" className="section-pad bg-secondary/55">
      <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <SectionIntro
            title="Restou alguma dúvida? Envie uma mensagem."
            description="O contato comercial fica simples: WhatsApp para cotação, telefone para suporte imediato e e-mail para demandas formais."
          />
          <Button asChild className="w-fit" size="lg" variant="whatsapp">
            <a href={whatsappHref(defaultQuoteMessage)} target="_blank" rel="noreferrer">
              <MessageCircle data-icon="inline-start" />
              Abrir conversa no WhatsApp
            </a>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {contactActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.label} className="bg-white">
                <CardHeader>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <CardTitle>{action.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    className="inline-flex items-start gap-2 text-sm font-semibold leading-6 text-primary hover:underline"
                    href={action.href}
                    target={action.external ? "_blank" : undefined}
                    rel={action.external ? "noreferrer" : undefined}
                  >
                    {action.value}
                    {action.external && <ExternalLink className="mt-1 size-4 shrink-0" aria-hidden="true" />}
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
