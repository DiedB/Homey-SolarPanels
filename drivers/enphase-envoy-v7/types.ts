export interface Production {
  type: string;
  wNow: number;
  whLifetime: number;
  readingTime: number;
  activeCount: number;
  whLastSevenDays?: number;
  whToday?: number;
  rmsCurrent?: number;
  rmsVoltage?: number;
  reactPwr?: number;
  apprntPwr?: number;
  pwrFactor?: number;
}

export interface Consumption {
  type: string;
  activeCount: number;
  whLifetime: number;
  whLastSevenDays: number;
  whToday: number;
  wNow: number;
  varhLeadToday: number;
  varhLagToday: number;
  vahToday: number;
  varhLeadLifetime: number;
  varhLagLifetime: number;
  vahLifetime: number;
  rmsCurrent: number;
  rmsVoltage: number;
  reactPwr: number;
  apprntPwr: number;
  pwrFactor: number;
  readingTime: number;
}

export interface ProductionData {
  production: Production[];
  consumption: Consumption[];
}

export interface DeviceData {
  id: string;
  plantId: string;
}

export interface DeviceSettings {
  username: string;
  password: string;
}
