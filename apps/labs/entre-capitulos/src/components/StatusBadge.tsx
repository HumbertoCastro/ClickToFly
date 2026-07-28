import {
  Ban,
  Bookmark,
  BookOpenText,
  Check,
  type LucideIcon,
} from "lucide-react";
import { statusMeta } from "../constants";
import type { BookStatus } from "../types";

const icons: Record<BookStatus, LucideIcon> = {
  want_to_read: Bookmark,
  reading: BookOpenText,
  completed: Check,
  abandoned: Ban,
};

export function StatusBadge({ status }: { status: BookStatus }) {
  const Icon = icons[status];
  return (
    <span className={`status-badge status-badge--${status}`}>
      <Icon size={13} strokeWidth={2} aria-hidden="true" />
      {statusMeta[status].label}
    </span>
  );
}
