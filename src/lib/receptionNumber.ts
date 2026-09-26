import { Prisma, type PrismaClient } from "@prisma/client";
import { getJSTDayRange, getJSTToday } from "./jstDate";

export class ReceptionNumberLimitError extends Error {
  constructor() {
    super("本日の受付番号が上限（9999件）に達しました。管理者に連絡してください。");
  }
}

export function formatReceptionNumber(centerCode: string, arrivedAt: Date, dailyNo: number): string {
  if (!/^\d{4}$/.test(centerCode)) throw new Error("INVALID_CENTER_CODE");
  if (!Number.isInteger(dailyNo) || dailyNo < 1 || dailyNo > 9999) {
    throw new ReceptionNumberLimitError();
  }
  const date = getJSTToday(arrivedAt).slice(2).replaceAll("-", "");
  return `88${centerCode}${date}${String(dailyNo).padStart(4, "0")}`;
}

export function getReceptionFiscalYear(arrivedAt: Date): string {
  const [year, month] = getJSTToday(arrivedAt).split("-").map(Number);
  return String((month >= 4 ? year : year - 1) % 100).padStart(2, "0");
}

type ReceptionInput = Omit<Prisma.ReceptionUncheckedCreateInput,
  "id" | "centerDailyNo" | "dailyKey" | "receptionNo" | "fiscalYear" | "arrivedAt"
> & { arrivedAt: Date };

/** 人物・車両・予約更新も一括確定する登録処理から使う。入れ子のtransactionは作らない。 */
export async function createNumberedReceptionInTransaction(
  tx: Prisma.TransactionClient,
  centerCode: string,
  data: ReceptionInput,
) {
  formatReceptionNumber(centerCode, data.arrivedAt, 1);
  const date = getJSTToday(data.arrivedAt);
  const range = getJSTDayRange(date);
  const observed = await tx.reception.aggregate({
    where: { centerId: data.centerId, arrivedAt: { gte: range.start, lte: range.end } },
    _max: { centerDailyNo: true },
  });
  const existingMax = observed._max.centerDailyNo ?? 0;
  const counter = await tx.centerDailyCounter.upsert({
    where: { centerId_date: { centerId: data.centerId, date } },
    create: { centerId: data.centerId, date, lastNo: existingMax + 1 },
    update: { lastNo: { increment: 1 } },
  });
  let dailyNo = counter.lastNo;
  // upsertの行ロックを受付保存まで保持し、旧サーバーが採番した番号も飛ばす。
  if (dailyNo <= existingMax) {
    dailyNo = existingMax + 1;
    await tx.centerDailyCounter.update({ where: { id: counter.id }, data: { lastNo: dailyNo } });
  }
  return tx.reception.create({
    data: {
      ...data,
      centerDailyNo: dailyNo,
      dailyKey: `${date}_${data.centerId}_${dailyNo}`,
      receptionNo: formatReceptionNumber(centerCode, data.arrivedAt, dailyNo),
      fiscalYear: getReceptionFiscalYear(data.arrivedAt),
    },
  });
}

/** カウンタの更新と受付の保存を同じトランザクションで確定する。 */
export async function createNumberedReception(
  client: PrismaClient,
  centerCode: string,
  data: ReceptionInput,
) {
  // 設定不備で採番を消費しないよう、書き込み前に確認する。
  formatReceptionNumber(centerCode, data.arrivedAt, 1);
  for (let attempt = 0; ; attempt++) {
    try {
      return await client.$transaction(
        (tx) => createNumberedReceptionInTransaction(tx, centerCode, data),
        { maxWait: 10000, timeout: 20000 },
      );
    } catch (error) {
      // 切替中の旧サーバーとの競合時は、ロールバック後に最新値を読み直す。
      if (error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2002" || error.code === "P2034") && attempt < 3) continue;
      throw error;
    }
  }
}
