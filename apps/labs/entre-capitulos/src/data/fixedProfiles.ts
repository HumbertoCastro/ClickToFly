import type { Profile } from "../types";

export type FixedProfileKey = "humberto" | "ana";

export interface FixedProfileDefinition {
  key: FixedProfileKey;
  name: string;
  initials: string;
  color: string;
  avatarFile: string;
  legacyNames?: string[];
}

export const fixedProfileDefinitions: FixedProfileDefinition[] = [
  {
    key: "humberto",
    name: "Humberto",
    initials: "HU",
    color: "#A85F3F",
    avatarFile: "profiles/humberto.png",
    legacyNames: ["caio"],
  },
  {
    key: "ana",
    name: "Ana",
    initials: "AN",
    color: "#4A5D4E",
    avatarFile: "profiles/ana.png",
  },
];

export const fixedLocalProfiles: Profile[] = fixedProfileDefinitions.map(
  (definition, index) => ({
    id: `profile-${definition.key}`,
    name: definition.name,
    initials: definition.initials,
    color: definition.color,
    archivedAt: null,
    createdAt: `2026-01-${String(5 + index * 3).padStart(2, "0")}T12:00:00.000Z`,
  }),
);

function normalizeProfileName(name: string): string {
  return name.trim().toLocaleLowerCase("pt-BR");
}

export function getFixedProfileDefinition(
  profile: Pick<Profile, "name">,
): FixedProfileDefinition | undefined {
  const normalizedName = normalizeProfileName(profile.name);
  return fixedProfileDefinitions.find(
    (definition) =>
      definition.key === normalizedName ||
      definition.legacyNames?.includes(normalizedName),
  );
}

export function getProfileAvatarUrl(
  profile: Pick<Profile, "name">,
): string | null {
  const avatarFile = getFixedProfileDefinition(profile)?.avatarFile;
  return avatarFile ? `${import.meta.env.BASE_URL}${avatarFile}` : null;
}

export function sortFixedProfiles(profiles: Profile[]): Profile[] {
  const seen = new Set<FixedProfileKey>();

  return profiles
    .filter((profile) => getFixedProfileDefinition(profile))
    .sort((left, right) => {
      const leftKey = getFixedProfileDefinition(left)?.key;
      const rightKey = getFixedProfileDefinition(right)?.key;
      return (
        fixedProfileDefinitions.findIndex(
          (definition) => definition.key === leftKey,
        ) -
        fixedProfileDefinitions.findIndex(
          (definition) => definition.key === rightKey,
        )
      );
    })
    .filter((profile) => {
      const key = getFixedProfileDefinition(profile)?.key;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
