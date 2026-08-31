import { NextResponse } from "next/server";

import { getDB, listOrders } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDB();
    const orders = await listOrders(db, 50);
    return NextResponse.json({ orders });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list orders";
    console.error("[orders] GET", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
