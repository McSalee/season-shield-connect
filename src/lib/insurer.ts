import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "./supabase/server";
import { must, type FarmerStatus, type Json } from "./farmers";

// Insurer portal data. Every query runs as the signed-in user, so row-level security
// applies: insurers read every farmer (no phone numbers) but only fully confirmed triggers,
// claims and reports. Admins may open the insurer view; queries filter on fully confirmed
// stage results so they see the same portfolio as the insurer.

// ------------------------------------------------------------------ claim workflow

export type ClaimStatus = "confirmed" | "sent_to_insurer" | "acknowledged" | "disputed" | "settled";

export const CLAIM_STATUSES: ClaimStatus[] = [
  "confirmed",
  "sent_to_insurer",
  "acknowledged",
  "disputed",
  "settled",
];

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  confirmed: "Confirmed",
  sent_to_insurer: "Sent to insurer",
  acknowledged: "Acknowledged",
  disputed: "Disputed",
  settled: "Settled",
};

export type ClaimAction = { to: ClaimStatus; label: string; needsReason?: boolean };

// The moves public.claim_transition() allows per role (the database enforces them; this
// only decides which buttons to show).
export const CLAIM_ACTIONS: Record<
  "admin" | "insurer",
  Partial<Record<ClaimStatus, ClaimAction[]>>
> = {
  admin: { confirmed: [{ to: "sent_to_insurer", label: "Send to insurer" }] },
  insurer: {
    sent_to_insurer: [
      { to: "acknowledged", label: "Acknowledge" },
      { to: "disputed", label: "Dispute", needsReason: true },
    ],
    acknowledged: [
      { to: "settled", label: "Mark settled" },
      { to: "disputed", label: "Dispute", needsReason: true },
    ],
    disputed: [{ to: "acknowledged", label: "Acknowledge" }],
  },
};

export const transitionClaim = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      claimId: z.number().int().positive(),
      to: z.enum(["sent_to_insurer", "acknowledged", "disputed", "settled"]),
      note: z.string().max(2000).optional(),
    }),
  )
  .handler(async ({ data: { claimId, to, note } }): Promise<ClaimStatus> => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.rpc("claim_transition", {
      p_claim_id: claimId,
      p_to_status: to,
      p_note: note?.trim() || null,
    });
    if (error) throw new Error(error.message);
    return data as ClaimStatus;
  });

// ------------------------------------------------------------------ claims

export type ClaimEvent = {
  id: number;
  from: ClaimStatus;
  to: ClaimStatus;
  note: string | null;
  actor: string | null;
  actorRole: string;
  at: string;
};

export type ClaimRow = {
  id: number;
  reference: string;
  status: ClaimStatus;
  severityBand: string;
  payoutFraction: number;
  sumInsured: number | null;
  payoutAmount: number | null;
  createdAt: string;
  updatedAt: string;
  farmer: { id: number; name: string; cooperative: string | null };
  season: { year: number; zone: string } | null;
  stage: string | null;
  // Both legs of the double trigger, as evaluated by the engine.
  evidence: {
    weatherIndex: number | null;
    weatherDetail: { [key: string]: Json } | null;
    ndviAnomaly: number | null;
    ndmiAnomaly: number | null;
    soilMoistureChange: number | null;
    clearObservations: number | null;
    vegetationConfirms: boolean | null;
    cloudGapRule: string | null;
    evaluatedAt: string | null;
  } | null;
  report: { pdfPath: string; txtPath: string | null; createdAt: string } | null;
  events: ClaimEvent[];
};

export const fetchClaims = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClaimRow[]> => {
    const supabase = getSupabaseServerClient();
    /* eslint-disable @typescript-eslint/no-explicit-any -- untyped PostgREST rows, mapped below */
    const rows = await must<any[]>(
      supabase
        .from("claims")
        .select(
          "id, reference, status, severity_band, payout_fraction, sum_insured_ngn, payout_amount_ngn, " +
            "created_at, updated_at, farmers(id, name, cooperatives(name)), seasons(year, zone), " +
            "stage_results(stage, weather_index, weather_detail, ndvi_anomaly, ndmi_anomaly, " +
            "soil_moisture_change, clear_observations, vegetation_confirms, cloud_gap_rule, evaluated_at), " +
            "reports(pdf_path, txt_path, created_at), " +
            "claim_events(id, from_status, to_status, note, actor_name, actor_role, created_at)",
        )
        .order("created_at", { ascending: false }),
    );
    return rows.map((c) => {
      const sr = c.stage_results;
      return {
        id: c.id,
        reference: c.reference,
        status: c.status,
        severityBand: c.severity_band,
        payoutFraction: c.payout_fraction,
        sumInsured: c.sum_insured_ngn == null ? null : Number(c.sum_insured_ngn),
        payoutAmount: c.payout_amount_ngn == null ? null : Number(c.payout_amount_ngn),
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        farmer: {
          id: c.farmers.id,
          name: c.farmers.name,
          cooperative: c.farmers.cooperatives?.name ?? null,
        },
        season: c.seasons ? { year: c.seasons.year, zone: c.seasons.zone } : null,
        stage: sr?.stage ?? null,
        evidence: sr
          ? {
              weatherIndex: sr.weather_index,
              weatherDetail: sr.weather_detail,
              ndviAnomaly: sr.ndvi_anomaly,
              ndmiAnomaly: sr.ndmi_anomaly,
              soilMoistureChange: sr.soil_moisture_change,
              clearObservations: sr.clear_observations,
              vegetationConfirms: sr.vegetation_confirms,
              cloudGapRule: sr.cloud_gap_rule,
              evaluatedAt: sr.evaluated_at,
            }
          : null,
        report: c.reports
          ? {
              pdfPath: c.reports.pdf_path,
              txtPath: c.reports.txt_path,
              createdAt: c.reports.created_at,
            }
          : null,
        events: ((c.claim_events ?? []) as any[])
          .map((e) => ({
            id: e.id,
            from: e.from_status,
            to: e.to_status,
            note: e.note,
            actor: e.actor_name,
            actorRole: e.actor_role,
            at: e.created_at,
          }))
          .sort((a, b) => (a.at < b.at ? -1 : 1)),
      };
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */
  },
);

// ------------------------------------------------------------------ portfolio

export type Portfolio = {
  farmers: number;
  farmersByStatus: Record<FarmerStatus, number>;
  // Season sum insured x farmers in that season and zone (farmers with a planting date).
  sumInsured: number | null;
  seasons: { year: number; zone: string; sumInsured: number | null; farmers: number }[];
  triggers: number;
  payoutTotal: number; // naira, all claims with an amount
  claimsByStatus: Record<ClaimStatus, { n: number; amount: number }>;
  claimsWithoutAmount: number;
  byCooperative: { name: string; farmers: number; triggers: number; payout: number }[];
  byStage: { stage: string; triggers: number; payout: number }[];
};

export const fetchPortfolio = createServerFn({ method: "GET" }).handler(
  async (): Promise<Portfolio> => {
    const supabase = getSupabaseServerClient();
    const [farmers, seasons, stages, claims] = await Promise.all([
      must<
        {
          id: number;
          status: FarmerStatus;
          zone: string;
          planting_date: string | null;
          cooperatives: { name: string } | null;
        }[]
      >(supabase.from("farmers").select("id, status, zone, planting_date, cooperatives(name)")),
      must<{ year: number; zone: string; sum_insured_ngn: string | number | null }[]>(
        supabase.from("seasons").select("year, zone, sum_insured_ngn"),
      ),
      must<{ farmer_id: number; stage: string }[]>(
        supabase
          .from("stage_results")
          .select("farmer_id, stage")
          .eq("trigger_confirmed", true)
          .eq("fully_confirmed", true),
      ),
      must<
        {
          farmer_id: number;
          status: ClaimStatus;
          payout_amount_ngn: string | number | null;
          stage_results: { stage: string } | null;
        }[]
      >(
        supabase
          .from("claims")
          .select("farmer_id, status, payout_amount_ngn, stage_results(stage)"),
      ),
    ]);

    const coopOf = new Map(farmers.map((f) => [f.id, f.cooperatives?.name ?? "No cooperative"]));
    const farmersByStatus: Record<FarmerStatus, number> = {
      normal: 0,
      stress_detected: 0,
      trigger_confirmed: 0,
    };
    for (const f of farmers) farmersByStatus[f.status] += 1;

    const seasonRows = seasons.map((s) => ({
      year: s.year,
      zone: s.zone,
      sumInsured: s.sum_insured_ngn == null ? null : Number(s.sum_insured_ngn),
      farmers: farmers.filter(
        (f) => f.zone === s.zone && f.planting_date?.slice(0, 4) === String(s.year),
      ).length,
    }));
    const priced = seasonRows.filter((s) => s.sumInsured != null);
    const sumInsured = priced.length
      ? priced.reduce((t, s) => t + s.farmers * (s.sumInsured ?? 0), 0)
      : null;

    const claimsByStatus = Object.fromEntries(
      CLAIM_STATUSES.map((s) => [s, { n: 0, amount: 0 }]),
    ) as Record<ClaimStatus, { n: number; amount: number }>;
    let payoutTotal = 0;
    let claimsWithoutAmount = 0;
    const coops = new Map<string, { farmers: number; triggers: number; payout: number }>();
    const coop = (name: string) => {
      if (!coops.has(name)) coops.set(name, { farmers: 0, triggers: 0, payout: 0 });
      return coops.get(name)!;
    };
    for (const f of farmers) coop(coopOf.get(f.id)!).farmers += 1;
    const byStageMap = new Map<string, { triggers: number; payout: number }>();
    const stageRow = (stage: string) => {
      if (!byStageMap.has(stage)) byStageMap.set(stage, { triggers: 0, payout: 0 });
      return byStageMap.get(stage)!;
    };
    for (const s of stages) {
      coop(coopOf.get(s.farmer_id) ?? "No cooperative").triggers += 1;
      stageRow(s.stage).triggers += 1;
    }
    for (const c of claims) {
      const amount = c.payout_amount_ngn == null ? null : Number(c.payout_amount_ngn);
      claimsByStatus[c.status].n += 1;
      if (amount == null) {
        claimsWithoutAmount += 1;
        continue;
      }
      claimsByStatus[c.status].amount += amount;
      payoutTotal += amount;
      coop(coopOf.get(c.farmer_id) ?? "No cooperative").payout += amount;
      if (c.stage_results) stageRow(c.stage_results.stage).payout += amount;
    }

    return {
      farmers: farmers.length,
      farmersByStatus,
      sumInsured,
      seasons: seasonRows.sort((a, b) => b.year - a.year || a.zone.localeCompare(b.zone)),
      triggers: stages.length,
      payoutTotal,
      claimsByStatus,
      claimsWithoutAmount,
      byCooperative: [...coops.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.farmers - a.farmers || a.name.localeCompare(b.name)),
      byStage: [...byStageMap.entries()].map(([stage, v]) => ({ stage, ...v })),
    };
  },
);
