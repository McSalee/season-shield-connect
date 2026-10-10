import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Series } from "@/data/demo";
import { getSupabaseServerClient } from "./supabase/server";

// Farmer data for the admin and cooperative portals. Every query runs as the signed-in
// user, so row-level security decides the rows: admins see every farmer, cooperative
// staff only their own cooperative's, and only fully confirmed stage results.

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
export async function must<T>(
  p: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

// Farmers' phone numbers are not in the farmers table's readable columns: admins and
// cooperative staff get them through farmer_phones() (only their own farmers'); insurers
// get none, so `phone` is null for them.
async function fetchPhones(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  ids: number[],
): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map();
  const rows = await must<{ farmer_id: number; phone: string }[]>(
    supabase.rpc("farmer_phones", { farmer_ids: ids }),
  );
  return new Map(rows.map((r) => [r.farmer_id, r.phone]));
}

// ------------------------------------------------------------------ farmers list

export const STATUSES: FarmerStatus[] = ["normal", "stress_detected", "trigger_confirmed"];

export type FarmerSearch = { status?: FarmerStatus | undefined; q?: string | undefined };

// ?status=...&q=... on the list pages.
export const validateFarmerSearch = (s: Record<string, unknown>): FarmerSearch => ({
  ...(STATUSES.includes(s["status"] as FarmerStatus)
    ? { status: s["status"] as FarmerStatus }
    : {}),
  ...(typeof s["q"] === "string" && s["q"] ? { q: s["q"] } : {}),
});

export type FarmerRow = {
  id: number;
  name: string;
  phone: string | null; // null for insurers
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
            "id, name, status, status_updated_at, planting_date, cooperatives(name), agents(name, code)",
          )
          .order("name"),
      ),
      // Stage names and dates only, so the shared (result-free) charts serve every role.
      must<{ farmer_id: number; season_year: number; stages: StageBand[]; today: string }[]>(
        supabase
          .from("season_charts_shared")
          .select("farmer_id, season_year, stages:data->stages, today:data->>today"),
      ),
    ]);
    const phones = await fetchPhones(
      supabase,
      farmers.map((f) => f.id),
    );
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
        phone: phones.get(f.id) ?? null,
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
    phone: string | null; // null for insurers
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

// charts: "full" = with each stage's result (admins only: season_charts), "shared" = stage
// names and dates only (season_charts_shared), for the cooperative and insurer portals.
export const fetchFarmer = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.number().int().positive(), charts: z.enum(["full", "shared"]) }))
  .handler(async ({ data: { id, charts } }): Promise<FarmerDetail | null> => {
    const supabase = getSupabaseServerClient();
    /* eslint-disable @typescript-eslint/no-explicit-any -- untyped PostgREST rows, mapped below */
    const f = await must<any>(
      supabase
        .from("farmers")
        .select(
          "id, engine_id, name, latitude, longitude, boundary_geojson, crop, zone, planting_date, " +
            "enrollment_date, consent_at, status, status_updated_at, message_pref, " +
            "cooperatives(id, name, needs_review), agents(name, code)",
        )
        .eq("id", id)
        .maybeSingle(),
    );
    if (!f) return null;
    const [chart, stages, history, messages, reports, claims] = await Promise.all([
      must<any>(
        supabase
          .from(charts === "full" ? "season_charts" : "season_charts_shared")
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
        phone: (await fetchPhones(supabase, [f.id])).get(f.id) ?? null,
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
