import type { LucideIcon } from "lucide-react";
import { CalendarCheck, ClipboardList, GraduationCap, LayoutDashboard, Landmark, ScrollText, Settings2, Sparkles } from "lucide-react";
import type { Role } from "@/types/api";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  /** Only routes that actually exist are rendered (no dead navigation). Flip when the module ships. */
  built: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["faculty", "office_admin"], built: true },
  { href: "/students", label: "Students", icon: GraduationCap, roles: ["faculty", "office_admin"], built: true },
  { href: "/academic", label: "Academics", icon: Settings2, roles: ["office_admin"], built: true },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck, roles: ["faculty", "office_admin"], built: true },
  { href: "/marks", label: "Marks", icon: ClipboardList, roles: ["faculty", "office_admin"], built: true },
  { href: "/fees", label: "Fees", icon: Landmark, roles: ["office_admin"], built: true },
  { href: "/insights", label: "Student Insights", icon: Sparkles, roles: ["office_admin"], built: true },
  { href: "/audit", label: "Audit", icon: ScrollText, roles: ["office_admin"], built: true },
];

/** Navigation for a role. Presentation only: the API enforces permissions regardless. */
export function navFor(role: Role, opts: { includeUnbuilt?: boolean } = {}): NavItem[] {
  return NAV_ITEMS.filter((i) => i.roles.includes(role) && (opts.includeUnbuilt || i.built));
}
