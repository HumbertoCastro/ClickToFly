import { MessageCircle } from "lucide-react";

import { defaultQuoteMessage, whatsappHref } from "../lib/contact";

export function FloatingWhatsApp() {
  return (
    <a
      aria-label="Abrir WhatsApp da Analítica"
      className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-soft transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={whatsappHref(defaultQuoteMessage)}
      target="_blank"
      rel="noreferrer"
    >
      <MessageCircle className="size-7" aria-hidden="true" />
    </a>
  );
}
