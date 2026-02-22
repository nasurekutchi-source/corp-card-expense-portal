import { NextRequest, NextResponse } from "next/server";
import { getEscalationConfig, updateEscalationConfig, checkAndEscalateApprovals } from "@/lib/repository";

export async function GET() {
  return NextResponse.json(await getEscalationConfig());
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "run") {
    const result = await checkAndEscalateApprovals();
    return NextResponse.json({
      message: `Checked ${result.checked} pending approvals, escalated ${result.escalated.length}`,
      ...result,
    });
  }

  // Update config
  const updated = await updateEscalationConfig(body);
  return NextResponse.json(updated);
}
