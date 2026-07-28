import { useState } from "react";
import { Check } from "lucide-react";
import { profileColors } from "../constants";
import type { Profile } from "../types";

export function ProfileForm({
  profile,
  submitLabel = "Salvar perfil",
  onSubmit,
  onCancel,
}: {
  profile?: Profile;
  submitLabel?: string;
  onSubmit(input: Pick<Profile, "name" | "initials" | "color">): Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [initials, setInitials] = useState(profile?.initials ?? "");
  const [color, setColor] = useState(profile?.color ?? profileColors[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Informe o nome do perfil.");
      return;
    }
    if (!initials.trim()) {
      setError("Informe as iniciais.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit({
        name: name.trim(),
        initials: initials.trim().slice(0, 3).toUpperCase(),
        color,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível salvar.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="profile-form__preview">
        <span style={{ backgroundColor: color }}>{initials || "EC"}</span>
        <div>
          <small>Seu marcador</small>
          <strong>{name || "Novo leitor"}</strong>
        </div>
      </div>
      <label className="field">
        <span>Nome do perfil</span>
        <input
          autoFocus
          maxLength={40}
          value={name}
          onChange={(event) => {
            const nextName = event.target.value;
            setName(nextName);
            if (!profile && !initials.trim()) {
              setInitials(
                nextName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part.charAt(0))
                  .join("")
                  .toUpperCase(),
              );
            }
          }}
          placeholder="Como devemos chamar você?"
        />
      </label>
      <label className="field">
        <span>Iniciais</span>
        <input
          maxLength={3}
          value={initials}
          onChange={(event) => setInitials(event.target.value.toUpperCase())}
          placeholder="EC"
        />
      </label>
      <fieldset className="color-picker">
        <legend>Cor do perfil</legend>
        <div>
          {profileColors.map((profileColor) => (
            <button
              key={profileColor}
              type="button"
              className={profileColor === color ? "is-selected" : ""}
              style={{ backgroundColor: profileColor }}
              onClick={() => setColor(profileColor)}
              aria-label={`Usar a cor ${profileColor}`}
              aria-pressed={profileColor === color}
            >
              {profileColor === color && <Check size={16} />}
            </button>
          ))}
        </div>
      </fieldset>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        {onCancel && (
          <button className="button button--ghost" type="button" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button className="button button--primary" disabled={saving} type="submit">
          {saving ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
