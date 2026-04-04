import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatPlate(p: {
  region: string;
  classNum: string;
  hira: string;
  number: string;
}): string {
  if (!p.region && !p.classNum) return "";
  return [p.region, p.classNum, p.hira, p.number].filter(Boolean).join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      phone,
      centerId,
      plate = { region: "", classNum: "", hira: "", number: "" },
      driverInput = { companyName: "", driverName: "", phone: "", maxLoad: "" },
      reservationId,
    } = body as {
      phone: string;
      centerId: number;
      plate?: { region: string; classNum: string; hira: string; number: string };
      driverInput?: { companyName: string; driverName: string; phone: string; maxLoad: string };
      reservationId?: number;
    };

    if (!phone || !centerId) {
      return NextResponse.json({ error: "電話番号・センターIDが必要です" }, { status: 400 });
    }

    const vehicleNumber = formatPlate(plate);
    const effectivePhone = phone || driverInput.phone;

    // ─── トランザクションで一括処理 ─────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      // 1. ドライバーをupsert（電話番号＋会社名＋名前が一致すれば更新、なければ作成）
      let driver = await tx.driver.findFirst({
        where: {
          phone: effectivePhone,
          name: driverInput.driverName,
          companyName: driverInput.companyName,
        },
      });
      if (!driver) {
        driver = await tx.driver.create({
          data: {
            phone: effectivePhone,
            name: driverInput.driverName,
            companyName: driverInput.companyName,
          },
        });
      } else {
        driver = await tx.driver.update({
          where: { id: driver.id },
          data: { updatedAt: new Date() },
        });
      }

      // 2. 車両をupsert（車番が一致すれば更新、なければ作成）
      let vehicle = null;
      if (vehicleNumber) {
        vehicle = await tx.vehicle.findFirst({
          where: { vehicleNumber, phone: effectivePhone },
        });
        if (!vehicle) {
          vehicle = await tx.vehicle.create({
            data: {
              region: plate.region,
              classNum: plate.classNum,
              hira: plate.hira,
              number: plate.number,
              vehicleNumber,
              maxLoad: driverInput.maxLoad ?? "",
              phone: effectivePhone,
            },
          });
        } else {
          vehicle = await tx.vehicle.update({
            where: { id: vehicle.id },
            data: {
              maxLoad: driverInput.maxLoad ?? vehicle.maxLoad,
              updatedAt: new Date(),
            },
          });
        }
      }

      // 3. 本日のセンター受付連番を算出
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayCount = await tx.reception.count({
        where: {
          centerId,
          arrivedAt: { gte: todayStart, lte: todayEnd },
        },
      });
      const centerDailyNo = todayCount + 1;

      // 4. 予約がある場合、ステータスを checked_in に更新（楽観ロック）
      let reservationData = null;
      if (reservationId) {
        const reservation = await tx.reservation.findUnique({
          where: { id: reservationId },
        });
        if (!reservation) {
          throw new Error("予約が見つかりません");
        }
        if (reservation.status !== "pending") {
          throw new Error(
            reservation.status === "checked_in"
              ? "この予約は既に受付済みです。他の方が先に受付した可能性があります。"
              : `この予約は現在「${reservation.status}」のため受付できません。`
          );
        }
        reservationData = await tx.reservation.update({
          where: { id: reservationId },
          data: { status: "checked_in" },
        });
      }

      // 5. 受付記録を作成
      const reception = await tx.reception.create({
        data: {
          centerId,
          centerDailyNo,
          driverName: driverInput.driverName,
          companyName: driverInput.companyName,
          phone: effectivePhone,
          plateRegion: plate.region,
          plateClassNum: plate.classNum,
          plateHira: plate.hira,
          plateNumber: plate.number,
          vehicleNumber,
          maxLoad: driverInput.maxLoad ?? "",
          driverId: driver.id,
          vehicleId: vehicle?.id ?? null,
          reservationId: reservationId ?? null,
        },
        include: { center: true },
      });

      return { reception, centerDailyNo, reservationData };
    });

    // 現在の待機台数（本日受付済み件数）
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const waitingCount = await prisma.reception.count({
      where: { centerId, arrivedAt: { gte: todayStart } },
    });

    const center = await prisma.center.findUnique({ where: { id: centerId } });

    const responseData: Record<string, unknown> = {
      id: result.reception.id,
      centerDailyNo: result.centerDailyNo,
      arrivedAt: result.reception.arrivedAt.toISOString(),
      waitingCount,
      driver: {
        name: driverInput.driverName,
        companyName: driverInput.companyName,
        phone: effectivePhone,
      },
      vehicleNumber,
      centerName: center?.name ?? "",
      barcodeValue: `RC-${result.reception.id}-${result.centerDailyNo}`,
    };

    if (result.reservationData) {
      responseData.reservation = {
        startTime: result.reservationData.startTime,
        endTime: result.reservationData.endTime,
      };
    }

    return NextResponse.json(responseData);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "受付処理に失敗しました" }, { status: 500 });
  }
}
