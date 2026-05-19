import type { ReactNode } from 'react';

type MetricCardProps = {
  value: string;
  label: string;
  icon: ReactNode;
  highlighted?: boolean;
};

export function MetricCard({ value, label, icon, highlighted = false }: MetricCardProps) {
  return (
    <article className={`metric-card reveal ${highlighted ? 'is-highlighted' : ''}`}>
      <span className="metric-icon">{icon}</span>
      <strong>{value}</strong>
      <p>{label}</p>
    </article>
  );
}
