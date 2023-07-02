export interface ProductionData {
  wattHoursToday: number;
  wattHoursSevenDays: number;
  wattHoursLifetime: number;
  wattsNow: number;
}

export interface DeviceData {
  id: string;
  plantId: string;
}

export interface DeviceSettings {
  username: string;
  password: string;
}
