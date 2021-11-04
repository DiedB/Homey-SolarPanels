export interface StatusData {
  dailyProductionEnergy?: number;
  currentProductionPower?: number;
  dailyConsumptionEnergy?: number;
  currentConsumptionPower?: number;
  currentVoltage?: number;
  currentTemperature?: number;
  extendedFields?: string[];
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
  useExtendedFields?: boolean;
  batteryPercentageField?: string;
}
