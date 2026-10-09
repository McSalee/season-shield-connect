import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./supabase/server";
import { must } from "./farmers";

// Cooperative portal data beyond the shared farmer list and page (lib/farmers.ts).
// Row-level security limits cooperative staff to their own cooperative's rows.

export type AgentRow = {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  active: boolean;
  farmers: number;
};

export const fetchAgents = createServerFn({ method: "GET" }).handler(
  async (): Promise<AgentRow[]> => {
    const supabase = getSupabaseServerClient();
    const [agents, farmers] = await Promise.all([
      must<{ id: number; code: string; name: string; phone: string | null; active: boolean }[]>(
        supabase.from("agents").select("id, code, name, phone, active").order("code"),
      ),
      must<{ agent_id: number | null }[]>(supabase.from("farmers").select("agent_id")),
    ]);
    const counts = new Map<number, number>();
    for (const f of farmers)
      if (f.agent_id != null) counts.set(f.agent_id, (counts.get(f.agent_id) ?? 0) + 1);
    return agents.map((a) => ({ ...a, farmers: counts.get(a.id) ?? 0 }));
  },
);
