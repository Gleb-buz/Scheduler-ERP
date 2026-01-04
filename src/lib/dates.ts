import { format, parseISO } from "date-fns";

export function formatDate(date: string | null | undefined, fmt = "MMM d") {
  if (!date) return "";
  try {
    return format(parseISO(date), fmt);
  } catch {
    return date;
  }
}

export function todayDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}
