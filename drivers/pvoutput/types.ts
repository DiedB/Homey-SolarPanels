export interface StatusData {
  currentPower?: number;
  dailyYield?: number;
  currentVoltage?: number;
  currentTemperature?: number;
}

// Homey types
export interface PairData {
  systemId: string;
  apiKey: string;
}

export interface Device {
  name: string;
  data: DeviceData;
  settings: DeviceSettings;
}

export interface DeviceData {
  sid: string;
}

export interface DeviceSettings {
  key: string;
  interval?: number;
}
