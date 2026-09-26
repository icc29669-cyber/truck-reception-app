-- 既存受付は変更せず、新規受付の確定番号を保存する。
ALTER TABLE "Reception" ADD COLUMN IF NOT EXISTS "receptionNo" VARCHAR(16);
CREATE UNIQUE INDEX IF NOT EXISTS "Reception_receptionNo_key" ON "Reception"("receptionNo");
