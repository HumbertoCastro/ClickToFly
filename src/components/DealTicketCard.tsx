import { Plane } from 'lucide-react';
import type { Deal } from '../types';

type DealTicketCardProps = {
  deal: Deal;
};

export function DealTicketCard({ deal }: DealTicketCardProps) {
  return (
    <article className="deal-ticket reveal">
      <div className="ticket-image">
        <img src={deal.image} alt={deal.imageAlt} />
      </div>
      <div className="ticket-route">
        <div>
          <small>Origem</small>
          <strong>{deal.origin}</strong>
        </div>
        <span className="ticket-plane">
          <Plane />
        </span>
        <div>
          <small>Destino</small>
          <strong>{deal.destination}</strong>
        </div>
      </div>

      <div className="ticket-price">
        <small>Encontrado por</small>
        <strong>{deal.foundPrice}</strong>
      </div>

      <div className="ticket-divider" aria-hidden="true" />

      <div className="ticket-meta">
        <span>
          <small>Preço médio</small>
          <strong>{deal.averagePrice}</strong>
        </span>
        <span>
          <small>Economia</small>
          <strong className="saving">{deal.savings}</strong>
        </span>
        <span>
          <small>Período</small>
          <strong>{deal.period}</strong>
        </span>
        <em>{deal.status}</em>
      </div>
    </article>
  );
}
