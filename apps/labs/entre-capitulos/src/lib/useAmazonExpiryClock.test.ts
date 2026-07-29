import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAmazonExpiryClock } from "./useAmazonExpiryClock";

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe("useAmazonExpiryClock", () => {
  it("re-renders and invalidates exactly after the next Amazon TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T12:00:00.000Z"));
    const expiresAt = "2026-07-28T12:00:00.100Z";
    const onExpire = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    function Probe() {
      const now = useAmazonExpiryClock([expiresAt], onExpire);
      return createElement("output", null, String(now));
    }

    await act(async () => {
      root.render(createElement(Probe));
    });
    expect(onExpire).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(126);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(Number(container.textContent)).toBeGreaterThanOrEqual(
      Date.parse(expiresAt),
    );

    await act(async () => root.unmount());
  });
});
