import type { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'light' | 'dark';
};

export function Badge({ children, icon, variant = 'light' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {icon ? <span className="badge-icon">{icon}</span> : null}
      {children}
    </span>
  );
}
