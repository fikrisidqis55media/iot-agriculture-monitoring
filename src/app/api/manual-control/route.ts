import mqtt from "mqtt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });

  const body = await req.json()
  const { command } = body; // command: "ON" or "OFF"
  if (command !== 'ON' && command !== 'OFF') {
    return NextResponse.json({ success: false, message: 'Invalid command' }, { status: 400 });
  }

  const client = mqtt.connect('mqtt://broker.hivemq.com:1883');

  client.on('connect', () => {
    console.log('Connected to MQTT');
    client.publish('esp32/relay', command, () => {
      console.log(`Sent command: ${command}`);
      client.end();
    });
  });

  client.on('error', (err) => {
    console.error('MQTT Error:', err);
    client.end();
  });

  return NextResponse.json({ success: true, message: `Sent ${command}` }, { status: 200 });
}
