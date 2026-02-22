import { NextRequest, NextResponse } from "next/server";
import { getEscalationConfig, updateEscalationConfig, checkAndEscalateApprovals } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getEscalationConfig());
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "run") {
    const result = checkAndEscalateApprovals();
    return NextResponse.json({
      message: `Checked ${result.checked} pending approvals, escalated ${result.escalated.length}`,
      ...result,
    });
  }

  // Update config
  const updated = updateEscalationConfig(body);
  return NextResponse.json(updated);
}
