import { stats } from '../data';
import { MetricCard } from './MetricCard';

export function StatsSection() {
  return (
    <section className="stats-section">
      <div className="container stats-grid">
        {stats.map((stat, index) => (
          <MetricCard
            key={stat.label}
            value={stat.value}
            label={stat.label}
            icon={stat.icon}
            highlighted={index === 1}
          />
        ))}
      </div>
    </section>
  );
}
