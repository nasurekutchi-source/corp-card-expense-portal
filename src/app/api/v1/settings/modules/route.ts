import { NextResponse } from "next/server";
import { getModuleConfig, updateModuleConfig } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getModuleConfig());
}

export async function PUT(request: Request) {
  const body = await request.json();
  const updated = updateModuleConfig(body);
  return NextResponse.json(updated);
}
