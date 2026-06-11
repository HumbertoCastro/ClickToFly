import type { CSSProperties, PropsWithChildren } from "react";

type RevealProps = PropsWithChildren<{
  className?: string;
  delay?: number;
}>;

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const revealClassName = ["reveal", className].filter(Boolean).join(" ");
  const revealStyle = delay
    ? ({ "--reveal-delay": `${delay}s` } as CSSProperties)
    : undefined;

  return <div className={revealClassName} style={revealStyle}>{children}</div>;
}
