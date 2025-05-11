import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { device_id, temperature, humidity, soil_moisture, gas_level } = body;

  if (!device_id) {
    return NextResponse.json(
      { success: false, message: "Missing device_id" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("sensor_latest").upsert(
    {
      device_id,
      temperature,
      humidity,
      soil_moisture,
      gas_level,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "device_id" }
  );

  if (error) {
    console.error("Failed to update latest sensor data:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Latest sensor data updated",
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("device_id");

  if (!deviceId) {
    return NextResponse.json(
      { success: false, message: "Missing device_id" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("sensor_latest")
    .select("*")
    .eq("device_id", deviceId)
    .single();

  if (error) {
    console.error("Failed to fetch latest sensor data:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 200 });
}
