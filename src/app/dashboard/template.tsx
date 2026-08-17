"use client";

import { usePathname } from "next/navigation";
import StableDashboardOverview from "@/components/stable/StableDashboardOverview";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/dashboard") return <StableDashboardOverview />;
  return children;
}
