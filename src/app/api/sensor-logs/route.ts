import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    deviceId,
    temperature,
    humidity,
    gasLevel,
    soilMoistureRaw,
    soilMoisturePercent,
  } = body;

  if (!deviceId) {
    return NextResponse.json(
      { success: false, message: "Missing deviceId" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("sensor_logs").insert([
    {
      device_id: deviceId,
      temperature,
      humidity,
      gas_level: gasLevel,
      soil_moisture_raw: soilMoistureRaw,
      soil_moisture_percent: soilMoisturePercent,
      timestamp: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error("Insert error:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const deviceId = searchParams.get("device_id");
  const limit = searchParams.get("limit");

  if (type === "latest") {
    if (!deviceId) {
      return NextResponse.json(
        { success: false, message: "Missing device_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("sensor_logs")
      .select("*")
      .eq("device_id", deviceId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Fetch latest error:", error);
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  }

  // if (type === "all") {
  //   const query = supabaseAdmin
  //     .from("sensor_logs")
  //     .select("*")
  //     .order("timestamp", { ascending: true });

  //   if (deviceId) query.eq("device_id", deviceId);
  //   if (limit) query.limit(parseInt(limit));

  //   const { data, error } = await query;

  //   if (error) {
  //     console.error("Fetch all error:", error);
  //     return NextResponse.json({ success: false, error }, { status: 500 });
  //   }

  //   return NextResponse.json({ success: true, data }, { status: 200 });
  // }
  if (type === "all") {
    const query = supabaseAdmin
      .from("sensor_logs")
      .select("*")
      .order("timestamp", { ascending: true });

    if (deviceId) query.eq("device_id", deviceId);
    if (limit) query.limit(parseInt(limit));

    const { data, error } = await query;

    if (error) {
      console.error("Fetch all error:", error);
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    // Downsample if query param exists
    const downsample = parseInt(searchParams.get("downsample") || "1");
    const sampledData = data.filter((_, index) => index % downsample === 0);

    return NextResponse.json(
      { success: true, data: sampledData },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { success: false, message: "Invalid type param" },
    { status: 400 }
  );
}
