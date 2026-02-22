import { NextRequest, NextResponse } from "next/server";
import { getAuditLog } from "@/lib/store";

export async function GET(req: NextRequest) {
  const entityType = req.nextUrl.searchParams.get("entityType") || undefined;
  const entityId = req.nextUrl.searchParams.get("entityId") || undefined;
  const action = req.nextUrl.searchParams.get("action") || undefined;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");

  const logs = getAuditLog({ entityType, entityId, action, limit });
  return NextResponse.json(logs);
}
