export interface ProductionData {
  serialNumber: string;
  lastReportDate: number;
  devType: number;
  lastReportWatts: number;
  maxReportWatts: number;
}
[];

export interface DeviceData {
  id: string;
  plantId: string;
}

export interface DeviceSettings {
  username: string;
  password: string;
}
