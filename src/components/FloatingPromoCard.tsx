import type { ReactNode } from 'react';

type FloatingPromoCardProps = {
  className?: string;
  icon?: ReactNode;
  eyebrow: string;
  title: string;
  value?: string;
};

export function FloatingPromoCard({ className = '', icon, eyebrow, title, value }: FloatingPromoCardProps) {
  return (
    <article className={`floating-promo-card ${className}`}>
      {icon ? <span className="floating-promo-icon">{icon}</span> : null}
      <div>
        <span>{eyebrow}</span>
        <strong>{title}</strong>
        {value ? <em>{value}</em> : null}
      </div>
    </article>
  );
}
