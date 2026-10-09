import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Series } from "@/data/demo";
import { getSupabaseServerClient } from "./supabase/server";

// Admin portal data. Every query runs as the signed-in user, so row-level security
// applies: these return data only for admins (the /admin routes also check the role).

export type FarmerStatus = "normal" | "stress_detected" | "trigger_confirmed";

export const STATUS_LABEL: Record<FarmerStatus, string> = {
  normal: "Normal",
  stress_detected: "Stress detected",
  trigger_confirmed: "Trigger confirmed",
};

type StageBand = Series["stages"][number];

export const SEASON_OVER = "season over";

// Growth stage a season is in on its chart's "today" (null before planting / after the season).
export function currentStage(
  stages: StageBand[] | null | undefined,
  today: string | null | undefined,
) {
  if (!stages || !today) return null;
  const st = stages.find((s) => s.start <= today && today <= s.end);
  if (st) return st.name;
  const last = stages[stages.length - 1];
  return last && today > last.end ? SEASON_OVER : "not started";
}

// JSON values as stored in jsonb columns (serializable across the server-function boundary).
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

// Rows are untyped without generated database types: T states the shape selected.
async function must<T>(
  p: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

// ------------------------------------------------------------------ farmers list

export type FarmerRow = {
  id: number;
  name: string;
  phone: string;
  status: FarmerStatus;
  statusUpdatedAt: string;
  plantingDate: string | null;
  cooperative: string | null;
  agent: string | null;
  stage: string | null;
  // The date the worker computed the chart for ("today" on its last run), not the real date.
  stageAsOf: string | null;
};

type RawFarmer = {
  id: number;
  name: string;
  phone: string;
  status: FarmerStatus;
  status_updated_at: string;
  planting_date: string | null;
  cooperatives: { name: string } | null;
  agents: { name: string; code: string } | null;
};

export const fetchFarmers = createServerFn({ method: "GET" }).handler(
  async (): Promise<FarmerRow[]> => {
    const supabase = getSupabaseServerClient();
    const [farmers, charts] = await Promise.all([
      must<RawFarmer[]>(
        supabase
          .from("farmers")
          .select(
            "id, name, phone, status, status_updated_at, planting_date, cooperatives(name), agents(name, code)",
          )
          .order("name"),
      ),
      must<{ farmer_id: number; season_year: number; stages: StageBand[]; today: string }[]>(
        supabase
          .from("season_charts")
          .select("farmer_id, season_year, stages:data->stages, today:data->>today"),
      ),
    ]);
    const latest = new Map<number, (typeof charts)[number]>();
    for (const c of charts) {
      const prev = latest.get(c.farmer_id);
      if (!prev || c.season_year > prev.season_year) latest.set(c.farmer_id, c);
    }
    return farmers.map((f) => {
      const c = latest.get(f.id);
      return {
        id: f.id,
        name: f.name,
        phone: f.phone,
        status: f.status,
        statusUpdatedAt: f.status_updated_at,
        plantingDate: f.planting_date,
        cooperative: f.cooperatives?.name ?? null,
        agent: f.agents ? `${f.agents.name} (${f.agents.code})` : null,
        stage: currentStage(c?.stages, c?.today),
        stageAsOf: c?.today ?? null,
      };
    });
  },
);

// ------------------------------------------------------------------ farmer detail

export type StageResult = {
  id: number;
  stage: string;
  seasonYear: number | null;
  weatherIndex: number | null;
  weatherDetail: { [key: string]: Json } | null;
  ndviAnomaly: number | null;
  ndmiAnomaly: number | null;
  soilMoistureChange: number | null;
  clearObservations: number | null;
  vegetationConfirms: boolean | null;
  weatherProvisional: boolean | null;
  windowComplete: boolean | null;
  advisory: boolean | null;
  triggerConfirmed: boolean | null;
  fullyConfirmed: boolean;
  payoutFraction: number | null;
  severityBand: string | null;
  cloudGapRule: string | null;
  notes: string[];
  evaluatedAt: string | null;
};

export type FarmerDetail = {
  farmer: {
    id: number;
    engineId: number | null;
    name: string;
    phone: string;
    latitude: number;
    longitude: number;
    boundary: Json;
    crop: string;
    zone: string;
    plantingDate: string | null;
    enrollmentDate: string;
    consentAt: string | null;
    status: FarmerStatus;
    statusUpdatedAt: string;
    messagePref: string;
    cooperative: { id: number; name: string; needsReview: boolean } | null;
    agent: string | null;
  };
  chart: { seasonYear: number; series: Series; updatedAt: string } | null;
  stages: StageResult[];
  history: { id: number; from: string | null; to: string; reason: string | null; at: string }[];
  messages: {
    id: number;
    channel: string;
    content: string;
    eventKey: string | null;
    status: string;
    sentAt: string;
  }[];
  reports: {
    id: number;
    reference: string;
    pdfPath: string;
    txtPath: string | null;
    createdAt: string;
  }[];
  claims: {
    id: number;
    reference: string;
    severityBand: string;
    payoutFraction: number;
    status: string;
    sumInsured: number | null;
    payoutAmount: number | null;
    createdAt: string;
  }[];
};

const parseNotes = (n: string | null): string[] => {
  if (!n) return [];
  try {
    const v = JSON.parse(n) as unknown;
    return Array.isArray(v) ? v.map(String) : [String(v)];
  } catch {
    return [n];
  }
};

export const fetchFarmer = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data: { id } }): Promise<FarmerDetail | null> => {
    const supabase = getSupabaseServerClient();
    /* eslint-disable @typescript-eslint/no-explicit-any -- untyped PostgREST rows, mapped below */
    const f = await must<any>(
      supabase
        .from("farmers")
        .select("*, cooperatives(id, name, needs_review), agents(name, code)")
        .eq("id", id)
        .maybeSingle(),
    );
    if (!f) return null;
    const [chart, stages, history, messages, reports, claims] = await Promise.all([
      must<any>(
        supabase
          .from("season_charts")
          .select("season_year, data, updated_at")
          .eq("farmer_id", id)
          .order("season_year", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ),
      must<any[]>(
        supabase.from("stage_results").select("*, seasons(year)").eq("farmer_id", id).order("id"),
      ),
      must<any[]>(
        supabase
          .from("status_history")
          .select("*")
          .eq("farmer_id", id)
          .order("changed_at", { ascending: false }),
      ),
      must<any[]>(
        supabase
          .from("messages")
          .select("*")
          .eq("farmer_id", id)
          .order("sent_at", { ascending: false }),
      ),
      must<any[]>(
        supabase
          .from("reports")
          .select("*")
          .eq("farmer_id", id)
          .order("created_at", { ascending: false }),
      ),
      must<any[]>(
        supabase
          .from("claims")
          .select("*")
          .eq("farmer_id", id)
          .order("created_at", { ascending: false }),
      ),
    ]);
    // Stage order = order of the chart's stage bands (the season's growth order).
    const order = new Map<string, number>(
      ((chart?.data?.stages ?? []) as StageBand[]).map((s, i) => [
        s.name.replace(/ \(.*\)/, "").replace(/ /g, "_"),
        i,
      ]),
    );
    const stageRows: StageResult[] = stages
      .map((r) => ({
        id: r.id,
        stage: r.stage,
        seasonYear: r.seasons?.year ?? null,
        weatherIndex: r.weather_index,
        weatherDetail: r.weather_detail,
        ndviAnomaly: r.ndvi_anomaly,
        ndmiAnomaly: r.ndmi_anomaly,
        soilMoistureChange: r.soil_moisture_change,
        clearObservations: r.clear_observations,
        vegetationConfirms: r.vegetation_confirms,
        weatherProvisional: r.weather_provisional,
        windowComplete: r.window_complete,
        advisory: r.advisory,
        triggerConfirmed: r.trigger_confirmed,
        fullyConfirmed: r.fully_confirmed,
        payoutFraction: r.payout_fraction,
        severityBand: r.severity_band,
        cloudGapRule: r.cloud_gap_rule,
        notes: parseNotes(r.notes),
        evaluatedAt: r.evaluated_at,
      }))
      .sort((a, b) => (order.get(a.stage) ?? 99) - (order.get(b.stage) ?? 99));
    return {
      farmer: {
        id: f.id,
        engineId: f.engine_id,
        name: f.name,
        phone: f.phone,
        latitude: f.latitude,
        longitude: f.longitude,
        boundary: f.boundary_geojson,
        crop: f.crop,
        zone: f.zone,
        plantingDate: f.planting_date,
        enrollmentDate: f.enrollment_date,
        consentAt: f.consent_at,
        status: f.status,
        statusUpdatedAt: f.status_updated_at,
        messagePref: f.message_pref,
        cooperative: f.cooperatives
          ? {
              id: f.cooperatives.id,
              name: f.cooperatives.name,
              needsReview: f.cooperatives.needs_review,
            }
          : null,
        agent: f.agents ? `${f.agents.name} (${f.agents.code})` : null,
      },
      chart: chart
        ? {
            seasonYear: chart.season_year,
            series: chart.data as Series,
            updatedAt: chart.updated_at,
          }
        : null,
      stages: stageRows,
      history: history.map((h) => ({
        id: h.id,
        from: h.old_status,
        to: h.new_status,
        reason: h.reason,
        at: h.changed_at,
      })),
      messages: messages.map((m) => ({
        id: m.id,
        channel: m.channel,
        content: m.content,
        eventKey: m.event_key,
        status: m.delivery_status,
        sentAt: m.sent_at,
      })),
      reports: reports.map((r) => ({
        id: r.id,
        reference: r.reference,
        pdfPath: r.pdf_path,
        txtPath: r.txt_path,
        createdAt: r.created_at,
      })),
      claims: claims.map((c) => ({
        id: c.id,
        reference: c.reference,
        severityBand: c.severity_band,
        payoutFraction: c.payout_fraction,
        status: c.status,
        sumInsured: c.sum_insured_ngn,
        payoutAmount: c.payout_amount_ngn,
        createdAt: c.created_at,
      })),
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

// Report files live in the private gona-files bucket (key "reports/<farmer>/<ref>_<UTC>.pdf");
// older rows may still hold a path on the worker's disk, which cannot be downloaded.
export const isBucketKey = (path: string) => path.startsWith("reports/");

export const signReportUrl = createServerFn({ method: "POST" })
  .inputValidator(z.object({ path: z.string().regex(/^reports\/\d+\/[^/]+\.(pdf|txt)$/) }))
  .handler(async ({ data: { path } }): Promise<string> => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.storage.from("gona-files").createSignedUrl(path, 300);
    if (error || !data) throw new Error(error?.message ?? "Could not create a download link");
    return data.signedUrl;
  });

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
