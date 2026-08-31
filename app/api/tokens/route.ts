import { NextResponse } from "next/server";

import { receiveTokens } from "@/lib/checkout-options";
import { fetchPayTokens } from "@/lib/stableflow";

export async function GET() {
  try {
    const tokens = receiveTokens(await fetchPayTokens());
    return NextResponse.json({ tokens });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load tokens";
    console.error("[tokens]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
