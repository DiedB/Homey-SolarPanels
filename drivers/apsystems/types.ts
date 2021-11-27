
export interface DeviceSettings {
  ip: string;
}

export interface EcurData {
  cmdPrefix: string;
  ecu_id: string;
  unknown1: string;
  lifetime_energy: number;
  current_power: number;
  today_energy: number;
  unknown2: string;
  qty_of_inverters: number;
  unknown3: string;
  firmware: string;
  timezone: string;
}
