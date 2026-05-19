import { deals } from '../data';
import { DealTicketCard } from './DealTicketCard';
import { SectionHeader } from './SectionHeader';

export function FeaturedDealsSection() {
  return (
    <section className="deals-section section-pad" id="promocoes">
      <div className="container">
        <SectionHeader
          eyebrow="Promocoes encontradas"
          title="Promocoes que mostram o poder de uma boa oportunidade"
          description="Exemplos de ofertas encontradas pela Click To Fly para clientes que queriam viajar melhor pagando menos."
        />

        <div className="ticket-list">
          {deals.map((deal) => (
            <DealTicketCard key={`${deal.origin}-${deal.destination}`} deal={deal} />
          ))}
        </div>
        <p className="deal-note">
          Valores exibidos como exemplos de oportunidades encontradas. Disponibilidade e tarifas
          variam conforme data, companhia aerea e regras da oferta.
        </p>
      </div>
    </section>
  );
}
