"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AccountRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        router.replace("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      if (!profile?.role) {
        router.replace("/auth");
        return;
      }

      router.replace(profile.role === "owner" ? "/owner" : "/profile");
    }

    run();
  }, [router]);

  return null;
}
