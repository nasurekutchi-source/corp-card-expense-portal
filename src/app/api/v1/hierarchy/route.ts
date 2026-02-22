import { NextRequest, NextResponse } from "next/server";
import {
  getHierarchy,
  addHierarchyNode,
  updateBankInstitution,
  updateProgram,
  updateEnterprise,
  updateCompany,
  updateDivision,
  updateDepartment,
  updateCostCenter,
} from "@/lib/repository";

export async function GET() {
  try {
    const hierarchy = await getHierarchy();
    return NextResponse.json({ data: hierarchy });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch hierarchy", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.type || !body.record) {
      return NextResponse.json(
        { error: "Missing required fields: type, record" },
        { status: 400 }
      );
    }

    const validTypes = ["bank", "program", "enterprise", "company", "division", "department", "costCenter"];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const node = await addHierarchyNode(body);
    return NextResponse.json({ data: node }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create hierarchy node", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.type || !body.id || !body.record) {
      return NextResponse.json(
        { error: "Missing required fields: type, id, record" },
        { status: 400 }
      );
    }

    const validTypes = ["bank", "program", "enterprise", "company", "division", "department", "costCenter"];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    let updated = null;
    switch (body.type) {
      case "bank":
        updated = await updateBankInstitution(body.id, body.record);
        break;
      case "program":
        updated = await updateProgram(body.id, body.record);
        break;
      case "enterprise":
        updated = await updateEnterprise(body.id, body.record);
        break;
      case "company":
        updated = await updateCompany(body.id, body.record);
        break;
      case "division":
        updated = await updateDivision(body.id, body.record);
        break;
      case "department":
        updated = await updateDepartment(body.id, body.record);
        break;
      case "costCenter":
        updated = await updateCostCenter(body.id, body.record);
        break;
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Node not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update hierarchy node", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
