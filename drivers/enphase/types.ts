// API Types

export interface Interval {
  end_at: Date;
  devices_reporting: number;
  powr: number;
  enwh: number;
}

export interface Meta {
  status: string;
  last_report_at: Date;
  last_energy_at: Date;
  operational_at: Date;
}

export interface EnphaseApiStats {
  system_id: number;
  total_devices: number;
  intervals: Interval[];
  meta: Meta;
}

export interface System {
  system_id: number;
  system_name: string;
  system_public_name: string;
  status: string;
  timezone: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
  connection_type: string;
}

export interface EnphaseApiSystems {
  systems: System[];
}

// Homey types
export interface PairData {
  userId: string;
  apiKey: string;
}

export interface DeviceData {
  id: string;
}

export interface DeviceSettings {
  uid: string;
  key: string;
  interval?: number;
}

export interface Device {
  name: string;
  data: DeviceData;
  settings: DeviceSettings;
}
