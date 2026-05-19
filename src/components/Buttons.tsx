import type { AnchorHTMLAttributes, ReactNode } from 'react';

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  icon?: ReactNode;
};

export function PrimaryButton({ children, icon, className = '', ...props }: LinkButtonProps) {
  return (
    <a className={`button button-primary ${className}`} {...props}>
      <span>{children}</span>
      {icon ? <span className="button-icon">{icon}</span> : null}
    </a>
  );
}

export function SecondaryButton({ children, icon, className = '', ...props }: LinkButtonProps) {
  return (
    <a className={`button button-secondary ${className}`} {...props}>
      <span>{children}</span>
      {icon ? <span className="button-icon">{icon}</span> : null}
    </a>
  );
}
