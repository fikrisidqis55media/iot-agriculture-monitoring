import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { deviceId, timestamp, temperature, humidity, gasLevel, soilMoistureRaw, soilMoisturePercent } = body

  const { error } = await supabaseAdmin.from('sensor_logs').insert([{
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'latest' or 'all'

  if (type === 'latest') {
    const { data, error } = await supabaseAdmin
      .from('sensor_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()


    if (error) {
      console.error('Fetch latest error:', error)
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  }

  if (type === 'all') {
    const { data, error } = await supabaseAdmin
      .from('sensor_logs')
      .select('*')
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Fetch all error:', error)
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  }

  return NextResponse.json({ success: false, message: 'Invalid type param' }, { status: 400 })
}
