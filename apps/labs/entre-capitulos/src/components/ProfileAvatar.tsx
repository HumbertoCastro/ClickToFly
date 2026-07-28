import { getProfileAvatarUrl } from "../data/fixedProfiles";
import type { Profile } from "../types";

export function ProfileAvatar({
  profile,
  className,
  decorative = false,
}: {
  profile: Profile;
  className: string;
  decorative?: boolean;
}) {
  const avatarUrl = getProfileAvatarUrl(profile);

  return (
    <span
      className={`${className} profile-avatar`}
      style={{ backgroundColor: profile.color }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={decorative ? "" : `Foto de ${profile.name}`}
          aria-hidden={decorative || undefined}
        />
      ) : (
        profile.initials
      )}
    </span>
  );
}
