import { useEffect, useRef, useState } from "react";

const MAX_TIMER_DELAY = 2_147_000_000;

/**
 * Re-renderiza exatamente quando o próximo dado Amazon vence. O callback
 * permite ao consumidor consultar novamente o servidor; o relógio garante
 * que o DOM deixe de exibir o valor vencido mesmo se a nova consulta falhar.
 */
export function useAmazonExpiryClock(
  expirations: readonly (string | null | undefined)[],
  onExpire?: () => void,
): number {
  const [now, setNow] = useState(() => Date.now());
  const callbackRef = useRef(onExpire);
  const signature = expirations.filter(Boolean).sort().join("|");

  useEffect(() => {
    callbackRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const current = Date.now();
    const next = signature
      .split("|")
      .map((value) => Date.parse(value))
      .filter((value) => Number.isFinite(value) && value > current)
      .sort((left, right) => left - right)[0];

    if (next === undefined) return;

    const timeout = window.setTimeout(() => {
      setNow(Date.now());
      callbackRef.current?.();
    }, Math.min(MAX_TIMER_DELAY, Math.max(0, next - current + 25)));

    return () => window.clearTimeout(timeout);
  }, [now, signature]);

  return now;
}
