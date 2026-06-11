const WHATSAPP_NUMBER = "5531991850284";

export function whatsappHref(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const defaultQuoteMessage =
  "Olá, equipe Analítica. Gostaria de solicitar uma cotação de suprimentos laboratoriais.";
