export interface DriverInfo {
  id: number;
  name: string;
  companyName: string;
  defaultVehicle: string;
  phone: string;
}

export interface ReservationInfo {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  vehicleNumber: string;
  companyName: string;
  driverName: string;
}

export interface LookupResult {
  driver: DriverInfo | null;
  reservation: ReservationInfo | null;
}

export interface DriverInput {
  companyName: string;
  driverName: string;
  vehicleNumber: string;
}

export interface ReceptionResult {
  id: number;
  centerDailyNo: number;
  barcodeSeq: string;
  barcodeValue: string;
  arrivedAt: string;
  fiscalYear: string;
  driver: { name: string; companyName: string; phone: string };
  vehicleNumber: string;
  reservation: { startTime: string; endTime: string } | null;
  centerName: string;
}

export interface KioskSession {
  centerId: number;
  centerName: string;
  phone: string;
  lookupResult: LookupResult | null;
  driverInput: DriverInput;
  receptionResult: ReceptionResult | null;
}
