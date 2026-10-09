import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "./supabase/server";
import { must, type Json } from "./farmers";

// Admin portal data. Every query runs as the signed-in user, so row-level security
// applies: these return data only for admins (the /admin routes also check the role).

// ------------------------------------------------------------------ cooperatives

export type CooperativeRow = {
  id: number;
  organizationId: number;
  name: string;
  engineName: string | null;
  lga: string | null;
  state: string | null;
  zone: string;
  needsReview: boolean;
  farmers: number;
  agents: number;
  createdAt: string;
};

export const fetchCooperatives = createServerFn({ method: "GET" }).handler(
  async (): Promise<CooperativeRow[]> => {
    const supabase = getSupabaseServerClient();
    const rows = await must<
      {
        id: number;
        organization_id: number;
        name: string;
        engine_name: string | null;
        lga: string | null;
        state: string | null;
        zone: string;
        needs_review: boolean;
        created_at: string;
        farmers: { count: number }[];
        agents: { count: number }[];
      }[]
    >(
      supabase
        .from("cooperatives")
        .select("*, farmers(count), agents(count)")
        .order("needs_review", { ascending: false })
        .order("name"),
    );
    return rows.map((c) => ({
      id: c.id,
      organizationId: c.organization_id,
      name: c.name,
      engineName: c.engine_name,
      lga: c.lga,
      state: c.state,
      zone: c.zone,
      needsReview: c.needs_review,
      farmers: c.farmers[0]?.count ?? 0,
      agents: c.agents[0]?.count ?? 0,
      createdAt: c.created_at,
    }));
  },
);

const optionalText = z
  .string()
  .trim()
  .max(120)
  .transform((s) => (s === "" ? null : s));

export const updateCooperative = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.number().int().positive(),
      name: z.string().trim().min(2).max(120),
      lga: optionalText,
      state: optionalText,
      zone: z.string().trim().min(1).max(60),
      reviewed: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const coop = await must<{ organization_id: number; name: string } | null>(
      supabase.from("cooperatives").select("organization_id, name").eq("id", data.id).maybeSingle(),
    );
    if (!coop) throw new Error("Cooperative not found");
    // The organization carries the same name (tools/invite_user.py finds it by name).
    // engine_name is left alone: it keeps matching the engine's cooperative name after a rename.
    const org = await supabase
      .from("organizations")
      .update({ name: data.name })
      .eq("id", coop.organization_id);
    if (org.error) {
      throw new Error(
        org.error.code === "23505"
          ? `An organization named "${data.name}" already exists.`
          : org.error.message,
      );
    }
    const { error } = await supabase
      .from("cooperatives")
      .update({
        name: data.name,
        lga: data.lga,
        state: data.state,
        zone: data.zone,
        needs_review: !data.reviewed,
      })
      .eq("id", data.id);
    if (error) {
      // Put the organization's name back so the two never drift apart.
      await supabase
        .from("organizations")
        .update({ name: coop.name })
        .eq("id", coop.organization_id);
      throw new Error(
        error.code === "23505"
          ? `A cooperative named "${data.name}" already exists.`
          : error.message,
      );
    }
  });

// ------------------------------------------------------------------ worker runs

export type JobRow = {
  id: number;
  kind: string;
  status: "queued" | "running" | "succeeded" | "failed";
  params: { [key: string]: Json };
  result: { [key: string]: Json } | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export const fetchJobs = createServerFn({ method: "GET" }).handler(async (): Promise<JobRow[]> => {
  const supabase = getSupabaseServerClient();
  const rows = await must<
    {
      id: number;
      kind: string;
      status: JobRow["status"];
      params: { [key: string]: Json };
      result: { [key: string]: Json } | null;
      error: string | null;
      created_at: string;
      started_at: string | null;
      finished_at: string | null;
    }[]
  >(supabase.from("jobs").select("*").order("id", { ascending: false }).limit(100));
  return rows.map((j) => ({
    id: j.id,
    kind: j.kind,
    status: j.status,
    params: j.params,
    result: j.result,
    error: j.error,
    createdAt: j.created_at,
    startedAt: j.started_at,
    finishedAt: j.finished_at,
  }));
});

// ------------------------------------------------------------------ organizations & users

export type OrganizationRow = {
  id: number;
  name: string;
  kind: "gonainsured" | "cooperative" | "insurer";
  createdAt: string;
  cooperative: { id: number; needsReview: boolean } | null;
  users: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: string;
  }[];
};

export const fetchOrganizations = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrganizationRow[]> => {
    const supabase = getSupabaseServerClient();
    const rows = await must<
      {
        id: number;
        name: string;
        kind: OrganizationRow["kind"];
        created_at: string;
        // one-to-one (cooperatives.organization_id is unique): an object or null, not a list
        cooperatives: { id: number; needs_review: boolean } | null;
        profiles: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: string;
          created_at: string;
        }[];
      }[]
    >(
      supabase
        .from("organizations")
        .select(
          "id, name, kind, created_at, cooperatives(id, needs_review), profiles(id, full_name, email, role, created_at)",
        )
        .order("kind")
        .order("name"),
    );
    return rows.map((o) => ({
      id: o.id,
      name: o.name,
      kind: o.kind,
      createdAt: o.created_at,
      cooperative: o.cooperatives
        ? { id: o.cooperatives.id, needsReview: o.cooperatives.needs_review }
        : null,
      users: o.profiles.map((p) => ({
        id: p.id,
        name: p.full_name,
        email: p.email,
        role: p.role,
        createdAt: p.created_at,
      })),
    }));
  },
);
