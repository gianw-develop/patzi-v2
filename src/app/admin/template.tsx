"use client";

import { usePathname } from "next/navigation";
import StableLedgerAdminExperience from "@/components/admin/StableLedgerAdminExperience";

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/stable") return <StableLedgerAdminExperience />;
  return children;
}
