'use client'

import { useState } from 'react'
import { useAllSensor, useLatestSensor } from '@/app/hooks/useSensor'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import dayjs from 'dayjs'
import { SensorData } from '@/app/types/sensor.type'

export default function Dashboard() {
  const { data: latest, isLoading: loadingLatest } = useLatestSensor()
  const { data: allData, isLoading: loadingAll } = useAllSensor()

  const [range, setRange] = useState<'today' | '7days' | '30days'>('today')

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
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex gap-2">
            <RangeButton label="Today" active={range === 'today'} onClick={() => setRange('today')} />
            <RangeButton label="7 Days" active={range === '7days'} onClick={() => setRange('7days')} />
            <RangeButton label="30 Days" active={range === '30days'} onClick={() => setRange('30days')} />
          </div>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SensorCard title="Temperature" value={`${latest.temperature} °C`} />
        <SensorCard title="Humidity" value={`${latest.humidity} %`} />
        <SensorCard title="Gas Level" value={latest.gas_level} />
        <SensorCard title="Soil Moisture" value={`${latest.soil_moisture_percent} %`} />
      </div>

      {/* Chart */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-800 shadow-lg transition-colors">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Sensor Data Overview</h2>
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
            <Line type="monotone" dataKey="temperature" stroke="#8884d8" strokeWidth={2} dot={false} name="Temperature (°C)" />
            <Line type="monotone" dataKey="humidity" stroke="#82ca9d" strokeWidth={2} dot={false} name="Humidity (%)" />
            <Line type="monotone" dataKey="gas_level" stroke="#ff7300" strokeWidth={2} dot={false} name="Gas Level" />
            <Line type="monotone" dataKey="soil_moisture_percent" stroke="#00c4ff" strokeWidth={2} dot={false} name="Soil Moisture (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function SensorCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-800 shadow-md hover:shadow-xl transition-all flex flex-col items-center justify-center text-center">
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
    </div>
  )
}

function RangeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold border ${active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 dark:bg-neutral-700 dark:text-white'} hover:bg-blue-600 hover:text-white transition`}
    >
      {label}
    </button>
  )
}
