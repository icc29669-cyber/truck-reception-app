-- 同じ基幹車両を複数の電話番号から利用できるようにする。
-- 電話番号と車番の既存の複合一意制約は維持する。
DROP INDEX IF EXISTS "Vehicle_erpVehicleKey_key";
CREATE INDEX IF NOT EXISTS "Vehicle_erpVehicleKey_idx" ON "Vehicle"("erpVehicleKey");
