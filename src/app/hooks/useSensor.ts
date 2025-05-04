import { useQuery } from '@tanstack/react-query'

export const useLatestSensor = () => {
  return useQuery({
    queryKey: ['sensor', 'latest'],
    queryFn: async () => {
      const res = await fetch('/api/sensor-logs?type=latest&device_id=esp32-001')
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Failed to fetch latest data')
      return json.data
    },
    refetchInterval: 5000, // auto refresh tiap 5 detik (opsional)
  })
}

export const useAllSensor = () => {
  return useQuery({
    queryKey: ['sensor', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/sensor-logs?type=all&device_id=esp32-001')
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Failed to fetch all data')
      return json.data
  },
    refetchInterval: 5000, // auto refresh tiap 5 detik (opsional)
  })
}
