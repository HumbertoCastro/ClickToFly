import { Plane } from 'lucide-react';

type LogoProps = {
  compact?: boolean;
};

export function Logo({ compact = false }: LogoProps) {
  return (
    <a className={`brand ${compact ? 'brand-compact' : ''}`} href="/#inicio" aria-label="Click To Fly">
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-swoosh" />
        <Plane />
      </span>
      <span className="brand-copy">
        <strong>
          click <span>to</span> fly
        </strong>
        {!compact ? <small>Agencia de Viagens</small> : null}
      </span>
    </a>
  );
}
