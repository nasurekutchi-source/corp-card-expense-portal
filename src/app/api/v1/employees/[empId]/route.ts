import { NextRequest, NextResponse } from "next/server";
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empId: string }> }
) {
  try {
    const { empId } = await params;
    const employee = getEmployeeById(empId);

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ data: employee });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch employee", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ empId: string }> }
) {
  try {
    const { empId } = await params;
    const body = await request.json();
    const employee = updateEmployee(empId, body);

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ data: employee });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update employee", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ empId: string }> }
) {
  try {
    const { empId } = await params;
    const deleted = deleteEmployee(empId);

    if (!deleted) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Employee deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete employee", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
