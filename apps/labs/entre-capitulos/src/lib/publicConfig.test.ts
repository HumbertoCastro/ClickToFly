import { describe, expect, it } from "vitest";
import {
  DEFAULT_SUPPORT_EMAIL,
  getSupportEmail,
  shouldBlockProductionWithoutSupabase,
} from "./publicConfig";

describe("public deployment configuration", () => {
  it("uses the configured support email and falls back safely", () => {
    expect(
      getSupportEmail({ VITE_SUPPORT_EMAIL: " suporte@example.com " }),
    ).toBe("suporte@example.com");
    expect(getSupportEmail({})).toBe(DEFAULT_SUPPORT_EMAIL);
    expect(getSupportEmail({ VITE_SUPPORT_EMAIL: "not-an-email" })).toBe(
      DEFAULT_SUPPORT_EMAIL,
    );
  });

  it("blocks only a production app without Supabase outside demo mode", () => {
    expect(
      shouldBlockProductionWithoutSupabase({
        isProduction: true,
        isDemoMode: false,
        isSupabaseConfigured: false,
      }),
    ).toBe(true);
    expect(
      shouldBlockProductionWithoutSupabase({
        isProduction: true,
        isDemoMode: true,
        isSupabaseConfigured: false,
      }),
    ).toBe(false);
    expect(
      shouldBlockProductionWithoutSupabase({
        isProduction: false,
        isDemoMode: false,
        isSupabaseConfigured: false,
      }),
    ).toBe(false);
    expect(
      shouldBlockProductionWithoutSupabase({
        isProduction: true,
        isDemoMode: false,
        isSupabaseConfigured: true,
      }),
    ).toBe(false);
  });
});
