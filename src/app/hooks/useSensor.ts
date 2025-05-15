import { useQuery, useMutation } from "@tanstack/react-query";

export const useLatestSensor = () => {
  return useQuery({
    queryKey: ["sensor", "latest"],
    queryFn: async () => {
      const res = await fetch("/api/sensor-latest?device_id=esp32-001");
      const json = await res.json();
      if (!json.success)
        throw new Error(json.error?.message || "Failed to fetch latest data");
      return json.data;
    },
    refetchInterval: 2500, // auto refresh tiap 2.5 detik (opsional)
  });
};

export const useAllSensor = () => {
  return useQuery({
    queryKey: ["sensor", "all"],
    queryFn: async () => {
      const res = await fetch("/api/sensor-logs?type=all&device_id=esp32-001");
      const json = await res.json();
      if (!json.success)
        throw new Error(json.error?.message || "Failed to fetch all data");
      return json.data;
    },
    refetchInterval: 5000, // auto refresh tiap 5 detik (opsional)
  });
};

export const useDownloadSensorReport = () => {
  return useMutation({
    mutationFn: async ({
      deviceId,
      start,
      end,
      limit,
      downsample,
    }: {
      deviceId: string;
      start?: string;
      end?: string;
      limit?: number;
      downsample?: number;
    }) => {
      let url = `/api/sensor-logs?type=download&device_id=${deviceId}&format=csv`;
      if (start) url += `&start=${start}`;
      if (end) url += `&end=${end}`;
      if (limit) url += `&limit=${limit}`;
      if (downsample) url += `&downsample=${downsample}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal download report");
      const blob = await res.blob();
      return blob;
    },
  });
};
