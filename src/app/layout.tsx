// app/layout.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <html lang="en">
      <head>
  <meta charSet="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
  <meta name="description" content="Monitor your IoT sensor data in real-time." />
  <meta name="author" content="Fikri Sidqi" />
  <meta name="theme-color" content="#1A1A1A" />

  <meta property="og:title" content="SensorMonitor" />
  <meta property="og:description" content="Monitor your IoT sensor data in real-time." />
  <meta property="og:image" content="/og-image.png" />
  <meta property="og:url" content="https://iot-agriculture-monitoring.vercel.app/" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:creator" content="@fikrisidqi" />

  <title>Sensor Monitor</title>

  <link rel="icon" href="/favucionis.svg" />
  <link rel="apple-touch-icon" href="/favucionis.svg" />
</head>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  )
}
