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
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  // Handle download report
  if (type === "download") {
    const format = searchParams.get("format") || "csv";

    // Build query
    let query = supabaseAdmin
      .from("sensor_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (deviceId) query = query.eq("device_id", deviceId);
    if (start) query = query.gte("timestamp", start);
    if (end) query = query.lte("timestamp", end);
    if (limit) query = query.limit(parseInt(limit));

    const { data, error } = await query;

    if (error) {
      console.error("Download error:", error);
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    if (format === "csv") {
      // Log sample data
      console.log("Sample data first row:", JSON.stringify(data[0]));

      let csvContent = "";

      if (data && data.length > 0) {
        // Get headers dynamically from the first data object
        const headers = Object.keys(data[0]);
        csvContent = headers.join(",") + "\n";

        data.forEach((row) => {
          const values = headers.map((header) => {
            // Get value directly using header as the key
            const value = row[header];
            // Handle commas in string values
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          });
          csvContent += values.join(",") + "\n";
        });
      } else {
        csvContent = "No data found";
      }

      // Return as downloadable file
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="sensor_logs_${
            new Date().toISOString().split("T")[0]
          }.csv"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: "Unsupported format" },
      { status: 400 }
    );
  }

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
