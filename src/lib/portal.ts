import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./supabase/server";

// Row counts as the signed-in user sees them (row-level security applied).
// null = the user may not read that table at all.
export type VisibleCounts = {
  farmers: number | null;
  cooperatives: number | null;
  claims: number | null;
  jobs: number | null;
};

export const fetchVisibleCounts = createServerFn({ method: "GET" }).handler(
  async (): Promise<VisibleCounts> => {
    const supabase = getSupabaseServerClient();
    const count = async (table: keyof VisibleCounts) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      return error ? null : (count ?? 0);
    };
    const [farmers, cooperatives, claims, jobs] = await Promise.all([
      count("farmers"),
      count("cooperatives"),
      count("claims"),
      count("jobs"),
    ]);
    return { farmers, cooperatives, claims, jobs };
  },
);
