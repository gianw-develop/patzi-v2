"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/user-store";

interface SessionProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "user" | "admin";
  kyc_status: "not_submitted" | "pending" | "approved" | "rejected";
  stable_eligible: boolean;
  is_active: boolean;
}

export default function SessionBootstrap({ profile }: { profile: SessionProfile }) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    setUser({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone ?? "",
      role: profile.role,
      kyc_status: profile.kyc_status,
      stable_eligible: profile.stable_eligible,
      is_active: profile.is_active,
    });
  }, [profile, setUser]);

  return null;
}
