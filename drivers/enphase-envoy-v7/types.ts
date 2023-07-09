export type ApiProduction = {
  wattHoursToday: number;
  wattHoursSevenDays: number;
  wattHoursLifetime: number;
  wattsNow: number;
};

export type ApiMeters = {
  eid: number;
  state: string;
  measurementType: string;
  phaseMode: string;
  phaseCount: number;
  meteringStatus: string;
  statusFlags: any[];
}[];

export type ApiMeterReadings = {
  eid: number;
  timestamp: number;
  actEnergyDlvd: number;
  actEnergyRcvd: number;
  apparentEnergy: number;
  reactEnergyLagg: number;
  reactEnergyLead: number;
  instantaneousDemand: number;
  activePower: number;
  apparentPower: number;
  reactivePower: number;
  pwrFactor: number;
  voltage: number;
  current: number;
  freq: number;
}[];

export interface DeviceData {
  id: string;
  plantId: string;
}

export interface DeviceSettings {
  username: string;
  password: string;
}
