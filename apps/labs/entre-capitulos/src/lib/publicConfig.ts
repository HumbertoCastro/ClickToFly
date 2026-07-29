type PublicEnvironmentValue = string | boolean | undefined;

export type PublicEnvironment = Record<string, PublicEnvironmentValue>;

export const DEFAULT_SUPPORT_EMAIL = "feedback@hcwebsolutions.com.br";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function environmentString(
  environment: PublicEnvironment,
  key: string,
): string {
  const value = environment[key];
  return typeof value === "string" ? value.trim() : "";
}

export function getSupportEmail(
  environment: PublicEnvironment = import.meta.env as PublicEnvironment,
): string {
  const configuredEmail = environmentString(environment, "VITE_SUPPORT_EMAIL");
  return EMAIL_PATTERN.test(configuredEmail)
    ? configuredEmail
    : DEFAULT_SUPPORT_EMAIL;
}

export function shouldBlockProductionWithoutSupabase(options: {
  isProduction: boolean;
  isDemoMode: boolean;
  isSupabaseConfigured: boolean;
}): boolean {
  return (
    options.isProduction &&
    !options.isDemoMode &&
    !options.isSupabaseConfigured
  );
}
