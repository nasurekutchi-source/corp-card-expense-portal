import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentProfiles,
  getPaymentProfile,
  getPrimaryPaymentProfile,
  addPaymentProfile,
  updatePaymentProfile,
  deletePaymentProfile,
  verifyPaymentProfile,
} from "@/lib/repository";

export async function GET(req: NextRequest) {
  const employeeId = req.nextUrl.searchParams.get("employeeId");
  const id = req.nextUrl.searchParams.get("id");
  const primary = req.nextUrl.searchParams.get("primary");

  if (id) {
    const profile = await getPaymentProfile(id);
    return profile
      ? NextResponse.json(profile)
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (primary && employeeId) {
    const profile = await getPrimaryPaymentProfile(employeeId);
    return profile
      ? NextResponse.json(profile)
      : NextResponse.json({ error: "No primary payment profile" }, { status: 404 });
  }

  return NextResponse.json(await getPaymentProfiles(employeeId || undefined));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const action = body.action;
    if (action === "verify") {
      const profile = await verifyPaymentProfile(body.id);
      return profile
        ? NextResponse.json(profile)
        : NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!body.employeeId) {
      return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
    }

    const profile = await addPaymentProfile(body);
    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create payment profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const profile = await updatePaymentProfile(body.id, body);
    return profile
      ? NextResponse.json(profile)
      : NextResponse.json({ error: "Profile not found" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const deleted = await deletePaymentProfile(id);
  return deleted
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: "Profile not found" }, { status: 404 });
}
