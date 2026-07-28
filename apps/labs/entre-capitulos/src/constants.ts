import type { BookStatus, RatingCriterionKey } from "./types";

export const colors = {
  primary: {
    main: "#4A5D4E",
    hover: "#3C4A3F",
    soft: "#DDE6DF",
  },
  secondary: {
    main: "#A85F3F",
    soft: "#F1DDD4",
  },
  rating: {
    filled: "#B7791F",
    empty: "#8F877D",
  },
  background: {
    default: "#F7F3EC",
    surface: "#FFFDF8",
  },
  text: {
    primary: "#24211D",
    secondary: "#6F685F",
  },
  border: {
    subtle: "#D8D1C6",
    control: "#8F877D",
  },
  status: {
    wantToRead: { foreground: "#345A72", background: "#DDE8EF" },
    reading: { foreground: "#7B5110", background: "#F3E4C5" },
    completed: { foreground: "#365C3C", background: "#DDE9DE" },
    abandoned: { foreground: "#833535", background: "#F0DADA" },
  },
  feedback: {
    success: "#4F7A55",
    warning: "#9A6818",
    error: "#A74646",
    info: "#456F8C",
  },
} as const;

export const statusMeta: Record<
  BookStatus,
  { label: string; shortLabel: string }
> = {
  want_to_read: { label: "Quero ler", shortLabel: "Quero ler" },
  reading: { label: "Lendo", shortLabel: "Lendo" },
  completed: { label: "Lido", shortLabel: "Lido" },
  abandoned: { label: "Abandonado", shortLabel: "Abandonado" },
};

export const ratingCriteria: {
  key: RatingCriterionKey;
  label: string;
  hint: string;
}[] = [
  {
    key: "writing_quality",
    label: "Qualidade da escrita",
    hint: "Clareza, estilo e força da linguagem.",
  },
  {
    key: "engagement",
    label: "História envolvente",
    hint: "Quanto a leitura prende a atenção.",
  },
  {
    key: "theme",
    label: "Tema abordado",
    hint: "Relevância e profundidade das ideias.",
  },
  {
    key: "characters",
    label: "Qualidade dos personagens",
    hint: "Complexidade, coerência e evolução.",
  },
  {
    key: "plot",
    label: "Qualidade da trama",
    hint: "Estrutura e encadeamento dos acontecimentos.",
  },
  {
    key: "pacing",
    label: "Ritmo da narrativa",
    hint: "Equilíbrio entre avanço, pausa e tensão.",
  },
  {
    key: "originality",
    label: "Originalidade",
    hint: "Frescor das ideias e da execução.",
  },
  {
    key: "world_building",
    label: "Ambientação e mundo",
    hint: "Força do lugar, época e universo narrativo.",
  },
  {
    key: "emotional_impact",
    label: "Impacto emocional",
    hint: "O quanto a leitura permanece depois da última página.",
  },
  {
    key: "ending",
    label: "Satisfação com o desfecho",
    hint: "Coerência e força do encerramento.",
  },
];

export const profileColors = [
  "#4A5D4E",
  "#A85F3F",
  "#456F8C",
  "#7B5110",
  "#6B5A78",
  "#365C3C",
];
