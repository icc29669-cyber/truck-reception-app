-- 既存の予約・受付を保持し、同じ送信の再実行を一意に識別する。
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "requestId" VARCHAR(64);
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "requestHash" VARCHAR(64);
ALTER TABLE "Reception" ADD COLUMN IF NOT EXISTS "requestId" VARCHAR(64);
ALTER TABLE "Reception" ADD COLUMN IF NOT EXISTS "requestHash" VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_requestId_key" ON "Reservation"("requestId");
CREATE UNIQUE INDEX IF NOT EXISTS "Reception_requestId_key" ON "Reception"("requestId");
