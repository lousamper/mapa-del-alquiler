"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserWithProfile = {
  id: string;
  email: string | null;
  role: "tenant" | "owner";
  alias: string;
};

export function useUser() {
  const [user, setUser] = useState<UserWithProfile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // 1) Auth user
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr || !auth.user) {
        if (mounted) setUser(null);
        return;
      }

      // 2) Profile (role + alias)
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role, alias")
        .eq("id", auth.user.id)
        .single();

      if (profileErr || !profile) {
        if (mounted) setUser(null);
        return;
      }

      if (mounted) {
        setUser({
          id: auth.user.id,
          email: auth.user.email ?? null,
          role: profile.role,
          alias: profile.alias,
        });
      }
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return user;
}
