// app/api/sensor/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { deviceId, timestamp, temperature, humidity, gasLevel, soilMoistureRaw, soilMoisturePercent } = body

  const { error } = await supabase.from('sensor_logs').insert([{
    device_id: deviceId,
    timestamp,
    temperature,
    humidity,
    gas_level: gasLevel,
    soil_moisture_raw: soilMoistureRaw,
    soil_moisture_percent: soilMoisturePercent
  }])

  if (error) {
    console.error('Insert error:', error)
    return NextResponse.json({ success: false, error }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
