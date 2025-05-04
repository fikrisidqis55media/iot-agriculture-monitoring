'use client'

import { useState } from 'react'
import { useAllSensor, useLatestSensor } from '@/app/hooks/useSensor'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import dayjs from 'dayjs'
import { SensorData } from '@/app/types/sensor.type'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function SensorCard({ title, value, unit = '', onClick, active = false }: { title: string; value: number; unit?: string; onClick?: () => void; active?: boolean }) {
  const isWarning =
    (title === 'Temperature' && value > 35) ||
    (title === 'Gas Level' && value > 1000) ||
    (title === 'Soil Moisture' && value < 30)

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl border shadow-md hover:shadow-xl transition-all flex flex-col items-center justify-center text-center cursor-pointer
      ${isWarning ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : active ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900' : 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white'}`}
    >
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value} {unit}</p>
    </div>
  )
}


function RangeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold border 
        ${active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 dark:bg-neutral-700 dark:text-white'} 
        hover:bg-blue-600 hover:text-white transition`}
    >
      {label}
    </button>
  )
}

function toTitleCase(str: string) {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function Dashboard() {
  const { data: latest, isLoading: loadingLatest } = useLatestSensor()
  const { data: allData, isLoading: loadingAll } = useAllSensor()
  const [activeSensors, setActiveSensors] = useState<string[]>([])

  const [range, setRange] = useState<'today' | '7days' | '30days'>('today')

  // Device config (auto mode) via react-query
  const deviceId = 'esp32-001';
  const queryClient = useQueryClient();
  const { data: deviceConfig, isLoading: autoModeLoading } = useQuery({
    queryKey: ['device-config', deviceId],
    queryFn: async () => {
      const res = await fetch(`/api/device-config?device_id=${deviceId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const updateAutoMode = useMutation({
    mutationFn: async (autoMode: boolean) => {
      // Kirim seluruh config, hanya autoMode yang diubah
      const payload = {
        deviceId: deviceConfig.data?.deviceId ?? deviceId,
        soilMin: deviceConfig.data?.soilMin,
        tempMin: deviceConfig.data?.tempMin,
        tempMax: deviceConfig.data?.tempMax,
        humidityMin: deviceConfig.data?.humidityMin,
        humidityMax: deviceConfig.data?.humidityMax,
        gasMax: deviceConfig.data?.gasMax,
        autoMode
      };
      const res = await fetch('/api/device-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-config', deviceId] });
    },
  });

  // Relay control states
  const [relayLoading, setRelayLoading] = useState(false);
  const [relayStatus, setRelayStatus] = useState<string | null>(null);

  async function handleRelay(command: 'ON' | 'OFF') {
    setRelayLoading(true);
    setRelayStatus(null);
    try {
      const res = await fetch('/api/manual-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (data.success) {
        setRelayStatus(`Relay turned ${command === 'ON' ? 'ON' : 'OFF'}`);
      } else {
        setRelayStatus(data.message || 'Failed to control relay');
      }
    } catch {
      setRelayStatus('Network error');
    } finally {
      setRelayLoading(false);
    }
  }

  function toggleSensor(sensor: string) {
    setActiveSensors((prev) =>
      prev.includes(sensor)
        ? prev.filter((s) => s !== sensor)
        : [...prev, sensor]
    );
  }

  const sensorLines = [
    { key: 'temperature', color: '#8884d8', name: 'Temperature (°C)' },
    { key: 'humidity', color: '#82ca9d', name: 'Humidity (%)' },
    { key: 'gas_level', color: '#ff7300', name: 'Gas Level' },
    { key: 'soil_moisture_percent', color: '#00c4ff', name: 'Soil Moisture (%)' },
  ];

  if (loadingLatest || loadingAll) return <div className="p-10 text-center">Loading...</div>

  const filteredData = allData?.filter((item: SensorData) => {
    const now = dayjs()
    const timestamp = dayjs(item.timestamp)

    if (range === 'today') return timestamp.isAfter(now.startOf('day'))
    if (range === '7days') return timestamp.isAfter(now.subtract(7, 'day'))
    if (range === '30days') return timestamp.isAfter(now.subtract(30, 'day'))

    return true
  })

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-100 dark:bg-neutral-900 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitor your sensor data realtime.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Last updated: {dayjs(latest.timestamp).format('DD MMM YYYY, HH:mm')}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex gap-2">
            <RangeButton label="Today" active={range === 'today'} onClick={() => setRange('today')} />
            <RangeButton label="7 Days" active={range === '7days'} onClick={() => setRange('7days')} />
            <RangeButton label="30 Days" active={range === '30days'} onClick={() => setRange('30days')} />
          </div>
        </div>
      </div>

      {/* Realtime Overview */}
      <div className="rounded-2xl border bg-white dark:bg-neutral-800 shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Realtime Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <SensorCard
    title="Temperature"
    value={latest.temperature}
    unit="°C"
    onClick={() => toggleSensor('temperature')}
    active={activeSensors.includes('temperature')}
  />
  <SensorCard
    title="Humidity"
    value={latest.humidity}
    unit="%"
    onClick={() => toggleSensor('humidity')}
    active={activeSensors.includes('humidity')}
  />
  <SensorCard
    title="Gas Level"
    value={latest.gas_level}
    onClick={() => toggleSensor('gas_level')}
    active={activeSensors.includes('gas_level')}
  />
  <SensorCard
    title="Soil Moisture"
    value={latest.soil_moisture_percent}
    unit="%"
    onClick={() => toggleSensor('soil_moisture_percent')}
    active={activeSensors.includes('soil_moisture_percent')}
  />
</div>
      </div>

      {/* Auto Mode Switch */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-medium">Auto Mode</span>
        <button
          onClick={() => deviceConfig && updateAutoMode.mutate(!deviceConfig.auto_mode)}
          disabled={autoModeLoading || updateAutoMode.isPending || !deviceConfig}
          className={`w-12 h-6 rounded-full transition-colors ${deviceConfig?.auto_mode ? 'bg-blue-600' : 'bg-gray-300'} relative focus:outline-none`}
          aria-checked={!!deviceConfig?.auto_mode}
          role="switch"
        >
          <span
            className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${deviceConfig?.auto_mode ? 'translate-x-6' : ''}`}
          />
        </button>
        {(autoModeLoading || updateAutoMode.isPending) && <span className="text-xs text-gray-400 ml-2">Updating...</span>}
      </div>

      {/* Relay Control Buttons */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => handleRelay('ON')}
          disabled={relayLoading || deviceConfig?.auto_mode}
          className="px-4 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50"
        >
          Turn Relay ON
        </button>
        <button
          onClick={() => handleRelay('OFF')}
          disabled={relayLoading || deviceConfig?.auto_mode}
          className="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50"
        >
          Turn Relay OFF
        </button>
        {relayStatus && (
          <span className="ml-4 text-sm text-gray-600 dark:text-gray-300">{relayStatus}</span>
        )}
      </div>

      {/* Chart */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-800 shadow-lg transition-colors">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
  {activeSensors.length > 0
    ? activeSensors.map((sensor) => toTitleCase(sensor)).join(', ') + ' Trend'
    : 'Sensor Data Overview'}
</h2>

{activeSensors.length > 0 && (
  <button
    onClick={() => setActiveSensors([])}
    className="mb-4 px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-neutral-600 transition"
  >
    ← Back to Overview
  </button>
)}

<ResponsiveContainer width="100%" height={350}>
  <LineChart data={filteredData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
    <XAxis
      dataKey="timestamp"
      tickFormatter={(str) => dayjs(str).format('HH:mm')}
      minTickGap={20}
      stroke="#333"
    />
    <YAxis stroke="#333" />
    <Tooltip
      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none' }}
      labelFormatter={(label) => dayjs(label).format('DD MMM YYYY, HH:mm')}
    />
    {(activeSensors.length === 0
      ? sensorLines
      : sensorLines.filter(line => activeSensors.includes(line.key))
    ).map(line => (
      <Line
        key={line.key}
        type="monotone"
        dataKey={line.key}
        stroke={line.color}
        strokeWidth={2}
        dot={false}
        name={line.name}
      />
    ))}
  </LineChart>
</ResponsiveContainer>

      </div>
    </div>
  )
}

