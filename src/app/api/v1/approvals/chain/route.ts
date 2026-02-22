import { NextRequest, NextResponse } from "next/server";
import {
  getApprovalChainRules,
  addApprovalChainRule,
  updateApprovalChainRule,
  deleteApprovalChainRule,
} from "@/lib/repository";

export async function GET() {
  const rules = await getApprovalChainRules();
  return NextResponse.json({ data: rules });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rule = await addApprovalChainRule(body);
  return NextResponse.json({ data: rule }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const updated = await updateApprovalChainRule(id, updates);
  if (!updated) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }
  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param is required" }, { status: 400 });
  }
  const deleted = await deleteApprovalChainRule(id);
  if (!deleted) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Deleted" });
}
