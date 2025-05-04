import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const {
    deviceId,
    mode,
    durationMs,
    startedAt,
    endedAt,
    sensorSnapshot
  } = body

  if (
    !deviceId || !mode || !durationMs ||
    !startedAt || !endedAt || !sensorSnapshot
  ) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('watering_logs').insert([{
    device_id: deviceId,
    mode,
    duration_ms: durationMs,
    started_at: startedAt,
    ended_at: endedAt,
    sensor_snapshot: sensorSnapshot
  }])

  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json({ success: false, message: 'Failed to insert log', error }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Watering log saved', data }, { status: 201 })
}
