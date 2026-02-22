import { NextResponse } from "next/server";
import { getModuleConfig, updateModuleConfig } from "@/lib/repository";

export async function GET() {
  return NextResponse.json(await getModuleConfig());
}

export async function PUT(request: Request) {
  const body = await request.json();
  const updated = await updateModuleConfig(body);
  return NextResponse.json(updated);
}
