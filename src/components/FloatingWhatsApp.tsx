import { MessageCircle } from 'lucide-react';
import { whatsappMessage, whatsappNumber } from '../data';

const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

export function FloatingWhatsApp() {
  return (
    <a className="floating-whatsapp" href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Chamar Click To Fly no WhatsApp">
      <span>Promocoes no WhatsApp</span>
      <MessageCircle />
    </a>
  );
}
