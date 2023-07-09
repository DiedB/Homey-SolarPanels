export interface ApiSystems {
  total: number;
  current_page: number;
  size: number;
  count: number;
  items: string;
  systems: {
    system_id: number;
    name: string;
    public_name: string;
    timezone: string;
    connection_type: string;
    energy_lifetime: number;
    energy_today: number;
    system_size: number;
    status: string;
    last_report_at: number;
    last_energy_at: number;
    operational_at: number;
    attachment_type: any;
    interconnect_date: any;
    reference?: string;
    other_references?: string[];
  }[];
}

export interface ApiSystemSummary {
  system_id: number;
  current_power: number;
  energy_lifetime: number;
  energy_today: number;
  last_interval_end_at: any;
  last_report_at: number;
  modules: number;
  operational_at: any;
  size_w: number;
  source: string;
  status: string;
  summary_date: string;
}
