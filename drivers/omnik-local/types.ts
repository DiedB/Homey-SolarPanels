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

export interface DeviceSettings {
  ip: string;
}
