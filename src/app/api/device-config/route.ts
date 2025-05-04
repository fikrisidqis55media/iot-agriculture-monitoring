import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const deviceId = searchParams.get('device_id')

  if (!deviceId) {
    return NextResponse.json({ success: false, message: 'Missing device_id' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('device_config')
    .select('soil_min, temp_min, temp_max, humidity_min, humidity_max, gas_max, auto_mode')
    .eq('device_id', deviceId)
    .single()

  if (error || !data) {
    console.error('Error fetching config:', error)
    return NextResponse.json({ success: false, message: 'Device not found or error occurred' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data
  })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()

  const {
    deviceId,
    soilMin,
    tempMin,
    tempMax,
    humidityMin,
    humidityMax,
    gasMax,
    autoMode
  } = body

  if (!deviceId) {
    return NextResponse.json({ success: false, message: 'Missing deviceId' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('device_config')
    .update({
      soil_min: soilMin,
      temp_min: tempMin,
      temp_max: tempMax,
      humidity_min: humidityMin,
      humidity_max: humidityMax,
      gas_max: gasMax,
      auto_mode: autoMode
    })
    .eq('device_id', deviceId)

  if (error) {
    console.error('Error updating config:', error)
    return NextResponse.json({ success: false, message: 'Update failed', error }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Config updated successfully' })
}
