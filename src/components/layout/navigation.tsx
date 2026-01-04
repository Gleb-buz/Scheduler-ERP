import { CalendarDays, CalendarRange, FolderKanban, History, ListChecks, Settings, Bug } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Today", href: "/today", icon: CalendarDays },
  { label: "Week", href: "/week", icon: CalendarRange },
  { label: "Tasks", href: "/tasks", icon: ListChecks },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Journal", href: "/journal", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const DEBUG_ITEM = { label: "Debug", href: "/debug", icon: Bug };
