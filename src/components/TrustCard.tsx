import type { IconCard } from '../types';

type TrustCardProps = {
  card: IconCard;
};

export function TrustCard({ card }: TrustCardProps) {
  return (
    <article className="trust-card reveal">
      <span className="trust-icon">{card.icon}</span>
      <div>
        <h3>{card.title}</h3>
        <p>{card.description}</p>
      </div>
    </article>
  );
}
