export interface Value {
  date: string;
  value?: number;
}

export interface Meter {
  type: "Production" | "Consumption";
  values: Value[];
}

export interface Details {
  timeUnit: string;
  unit: string;
  meters: Meter[];
}

export interface PowerResponse {
  powerDetails: Details;
}

export interface EnergyResponse {
  energyDetails: Details;
}

export interface List {
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  kWpDC?: any;
}

export interface Reporters {
  count: number;
  list: List[];
}

export interface EquipmentListResponse {
  reporters: Reporters;
}

export interface PhaseData {
  acCurrent: number;
  acVoltage: number;
  acFrequency: number;
  apparentPower: number;
  activePower: number;
  reactivePower: number;
  cosPhi: number;
}

export interface Telemetry {
  date: string;
  totalActivePower: number;
  dcVoltage: number;
  groundFaultResistance: number;
  powerLimit: number;
  totalEnergy: number;
  temperature?: number;
  inverterMode: string;
  operationMode: number;
  L1Data: PhaseData;
}

export interface Data {
  count: number;
  telemetries: Telemetry[];
}

export interface EquipmentDataResponse {
  data: Data;
}

// Homey types
export interface PairData {
  systemId: string;
  apiKey: string;
}

export interface DeviceData {
  sid: string;
  serial_number: string;
}

export interface DeviceSettings {
  key: string;
  interval: number;
  checkTemperature: boolean;
}
