export interface SensorData {
    id: string
    device_id: string
    timestamp: string
    temperature: number
    humidity: number
    gas_level: number
    soil_moisture_raw: number
    soil_moisture_percent: number
  }