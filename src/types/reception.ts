export interface PlateInput {
  region: string;
  classNum: string;
  hira: string;
  number: string;
}

export function formatPlate(p: PlateInput): string {
  if (!p.region && !p.classNum) return "";
  return [p.region, p.classNum, p.hira, p.number].filter(Boolean).join(" ");
}

export interface DriverCandidate {
  id: number;
  name: string;
  companyName: string;
  phone: string;
}

export interface VehicleCandidate {
  id: number;
  vehicleNumber: string;
  plate: PlateInput;
  maxLoad: string;
}

export interface DriverInput {
  companyName: string;
  driverName: string;
  phone: string;
  maxLoad: string;
}

export interface ReservationCandidate {
  id: number;
  startTime: string;
  endTime: string;
  driverName: string;
  companyName: string;
  vehicleNumber: string;
  maxLoad: string;
  plateRegion: string;
  plateClassNum: string;
  plateHira: string;
  plateNumber: string;
  status: string;
  /** "local" = reception-app内予約, "berth" = berth-app予約（IDにオフセット+1000000済み） */
  source?: "local" | "berth";
}

export interface ReceptionResult {
  id: number;
  centerDailyNo: number;
  arrivedAt: string;
  waitingCount: number;
  driver: { name: string; companyName: string; phone: string };
  vehicleNumber: string;
  centerName: string;
  reservation?: { startTime: string; endTime: string };
  barcodeValue?: string;
}

export interface KioskSession {
  centerId: number;
  centerName: string;
  phone: string;
  plate: PlateInput;
  driverInput: DriverInput;
  driverCandidates: DriverCandidate[];
  selectedDriver: DriverCandidate | null;
  vehicleCandidates: VehicleCandidate[];
  selectedVehicle: VehicleCandidate | null;
  receptionResult: ReceptionResult | null;
  // 予約連携
  reservationCandidates: ReservationCandidate[];
  selectedReservation: ReservationCandidate | null;
}
