ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "erpVehicleKey" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "erpImportedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Vehicle_erpVehicleKey_idx" ON "Vehicle"("erpVehicleKey");
