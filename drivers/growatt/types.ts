export interface PlantParams {
  plantName: string;
  plantId: string;
}

export interface TotalData {}

export interface User {
  uid: string;
  userLanguage: string;
  inverterGroup: any[];
  timeZone: number;
  lng: string;
  dataAcqList: any[];
  type: number;
  password: string;
  isValiPhone: number;
  kind: number;
  mailNotice: boolean;
  id: number;
  lastLoginIp: string;
  phoneNum: string;
  approved: boolean;
  area: string;
  smsNotice: boolean;
  isAgent: number;
  token: string;
  nickName: string;
  parentUserId: number;
  customerCode: string;
  counrty: string;
  isPhoneNumReg: number;
  createDate: string;
  rightlevel: number;
  appType: string;
  serverUrl: string;
  lat: string;
  lastLoginTime: string;
  roleId: number;
  enabled: boolean;
  agentCode: string;
  inverterList: any[];
  isValiEmail: number;
  accountName: string;
  email: string;
  company: string;
  activeName: string;
  codeIndex: number;
  appAlias: string;
  isBigCustomer: number;
  noticeType: string;
}

export interface Back {
  data: PlantParams[];
  service: string;
  quality: string;
  isOpenSmartFamily: number;
  totalData: TotalData;
  success: boolean;
  user: User;
  msg: string;
  app_code: string;
}

export interface LoginData {
  back: Back;
}

export interface DeviceList {
  lost: boolean;
  location: string;
  datalogSn: string;
  deviceSn: string;
  deviceStatus: number;
  pCharge: string;
  activePower: number;
  deviceAilas: string;
  deviceType: string;
  storageType: string;
  eToday: string;
  power: string;
  eChargeToday: string;
  apparentPower: number;
  capacity: string;
  energy: string;
}

export interface PlantData {
  plantMoneyText: string;
  optimizerType: number;
  ammeterType: string;
  storagePgrid: string;
  todayEnergy: string;
  storageTodayPpv: string;
  invTodayPpv: string;
  totalEnergy: string;
  nominalPower: number;
  todayDischarge: string;
  Co2Reduction: string;
  isHaveOptimizer: number;
  storagePuser: string;
  useEnergy: string;
  totalMoneyText: string;
  nominal_Power: number;
  deviceList: DeviceList[];
}

export interface DeviceData {
  id: string;
  plantId: string;
}

export interface DeviceSettings {
  username: string;
  password: string;
}
