export interface InverterData {
  inverterName: string;
  currentPower: number;
  currentVoltage: number;
  dailyProduction: number;
  currentTemperature: number;
}

export interface DeviceData {
  id: number;
}

export interface SettingsInput {
  newSettings: NewSettings;
  changedKeys: Array<string>;
}

export interface NewSettings {
  ip?: string | null;
  interval?: number | null;
}

export interface DeviceSettings {
  ip: string;
  interval: number;
}

export interface Device {
  name: string;
  data: DeviceData;
  settings: DeviceSettings;
}