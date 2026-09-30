import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "ddhs" | "dho" | "bmo" | "doctor";

export const ROLE_LABELS: Record<AppRole, string> = {
  ddhs: "Deputy Director of Health Services",
  dho: "District Health Officer",
  bmo: "Block Medical Officer",
  doctor: "Doctor / Medical Officer",
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      return;
    }
    let cancelled = false;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!cancelled) setRoles((data ?? []).map((r) => r.role as AppRole));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isOfficer = roles.some((r) => r === "ddhs" || r === "dho" || r === "bmo");

  return { session, user, roles, isOfficer, loading };
}
