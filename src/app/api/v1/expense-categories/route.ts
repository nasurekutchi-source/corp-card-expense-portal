import { NextRequest, NextResponse } from "next/server";
import {
  getExpenseCategories,
  addExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  addSubcategory,
  removeSubcategory,
  reorderExpenseCategories,
} from "@/lib/store";

export async function GET(req: NextRequest) {
  const activeOnly = req.nextUrl.searchParams.get("activeOnly") === "true";
  return NextResponse.json(getExpenseCategories(activeOnly));
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Reorder action
  if (body.action === "reorder" && Array.isArray(body.orderedIds)) {
    reorderExpenseCategories(body.orderedIds);
    return NextResponse.json({ success: true });
  }

  // Add subcategory
  if (body.action === "addSubcategory" && body.categoryId && body.subcategory) {
    const result = addSubcategory(body.categoryId, body.subcategory);
    if (!result) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json(result);
  }

  // Remove subcategory
  if (body.action === "removeSubcategory" && body.categoryId && body.subCode) {
    const result = removeSubcategory(body.categoryId, body.subCode);
    if (!result) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json(result);
  }

  // Add new category
  const cat = addExpenseCategory(body);
  return NextResponse.json(cat, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const updated = updateExpenseCategory(body.id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = deleteExpenseCategory(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
