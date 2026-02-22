import { NextRequest, NextResponse } from "next/server";
import { lookupGstin, addGstinRecord, getGstinCache, refreshGstinCache } from "@/lib/repository";

export async function GET(req: NextRequest) {
  const gstin = req.nextUrl.searchParams.get("gstin");
  const action = req.nextUrl.searchParams.get("action");

  // List all cached GSTINs
  if (action === "list") {
    return NextResponse.json(getGstinCache());
  }

  // Refresh cache (simulate CIGNET sync)
  if (action === "refresh") {
    const result = await refreshGstinCache();
    return NextResponse.json({ message: `Refreshed ${result.refreshed} of ${result.total} records`, ...result });
  }

  if (!gstin) {
    return NextResponse.json({ error: "gstin parameter required" }, { status: 400 });
  }

  // Validate GSTIN format: 2-digit state + 10-char PAN + 1 entity + 1 Z + 1 check
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
  if (!gstinRegex.test(gstin)) {
    return NextResponse.json({
      valid: false,
      error: "Invalid GSTIN format",
      format: "Expected: 2-digit state code + 10-char PAN + entity number + Z + check digit",
    }, { status: 400 });
  }

  // Check local cache first
  const cached = await lookupGstin(gstin);
  if (cached) {
    return NextResponse.json({
      valid: true,
      source: "CACHE",
      data: cached,
    });
  }

  // Simulate CIGNET API lookup for unknown GSTINs
  const stateCode = gstin.substring(0, 2);
  const pan = gstin.substring(2, 12);

  const newRecord = await addGstinRecord({
    gstin,
    legalName: `Entity with PAN ${pan}`,
    tradeName: `Trade Name (${pan})`,
    status: "ACTIVE",
    stateCode,
    registrationType: "Regular",
    validatedVia: "CIGNET",
    address: `Registered address for state ${stateCode}`,
    einvoiceEnabled: true,
  });

  return NextResponse.json({
    valid: true,
    source: "CIGNET",
    data: newRecord,
  });
}
