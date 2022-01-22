export interface System {
  created: Date;
  city: string;
  company: string;
  contact_name: string;
  country: string;
  external_id: string;
  system_id: number;
  latitude: number;
  longitude: number;
  name: string;
  power_rating: number;
  state: string;
  street: string;
  zip: string;
  turn_on_date: string;
}

export interface SystemsResponse {
  systems: System[];
}

export interface Summary {
  lifetime_energy_dc: number;
  ytd_energy_dc: number;
  daily_energy_dc: number;
  updated_on: Date;
  last_power_dc: number;
}

export interface SummaryResponse {
  summary: Summary;
}

// Homey types
export interface PairData {
  username: string;
  password: string;
}

export interface DeviceData {
  sid: string;
}

export interface DeviceSettings {
  username: string;
  password: string;
}
