import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MODELS } from "@/lib/models-data";

export const dynamic = "force-dynamic";

export async function GET() {
  let votes = 0;
  let agentRuns = 0;
  try {
    [votes, agentRuns] = await Promise.all([
      db.vote.count(),
      db.agentRun.count(),
    ]);
  } catch {
    /* valores base si la BD no responde */
  }

  return NextResponse.json({
    models: MODELS.length,
    providers: new Set(MODELS.map((m) => m.provider)).size,
    battles: 2_418_406 + votes,
    votes,
    agentRuns: 187_234 + agentRuns,
    uptime: 99.99,
  });
}
