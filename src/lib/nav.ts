import {
  LayoutDashboard,
  CalendarPlus,
  IceCream2,
  PackagePlus,
  PackageOpen,
  FileBarChart,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  shortTitle?: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    shortTitle: "Home",
    href: "/",
    icon: LayoutDashboard,
    description: "Monthly overview",
  },
  {
    title: "Daily Entry",
    shortTitle: "Daily",
    href: "/daily",
    icon: CalendarPlus,
    description: "Revenue & expenses",
  },
  {
    title: "Inventory",
    shortTitle: "Stock",
    href: "/inventory",
    icon: IceCream2,
    description: "Items & stock levels",
  },
  {
    title: "Stock Purchase",
    shortTitle: "Buy",
    href: "/purchases",
    icon: PackagePlus,
    description: "Record new stock",
  },
  {
    title: "Empty Boxes",
    shortTitle: "Sales",
    href: "/empty-boxes",
    icon: PackageOpen,
    description: "Mark sold boxes",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileBarChart,
    description: "Monthly analytics & export",
  },
  {
    title: "Order Planner",
    href: "/planner",
    icon: Sparkles,
    description: "Smart supplier order",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Shop & fridge capacity",
  },
];

/** The four primary destinations shown in the mobile bottom navigation. */
export const BOTTOM_NAV_HREFS = ["/", "/daily", "/empty-boxes", "/reports"];
