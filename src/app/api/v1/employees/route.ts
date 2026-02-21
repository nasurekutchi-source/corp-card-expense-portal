import { NextRequest, NextResponse } from "next/server";
import { getEmployees, addEmployee } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get("status") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      level: searchParams.get("level") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const employees = getEmployees(filters);
    return NextResponse.json({ data: employees, total: employees.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch employees", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.firstName || !body.lastName || !body.email || !body.employeeNumber) {
      return NextResponse.json(
        { error: "Missing required fields: firstName, lastName, email, employeeNumber" },
        { status: 400 }
      );
    }

    const employee = addEmployee(body);
    return NextResponse.json({ data: employee }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create employee", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
