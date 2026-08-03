import { prisma } from "./prisma";

/** Renvoie le mois courant au format "2026-08" */
export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Construit la date d'échéance pour un mois donné et un jour d'échéance */
export function buildDueDate(monthKey: string, dueDay: number): Date {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, dueDay);
}

/**
 * Crée les lignes de suivi de loyer (RentPayment) pour le mois donné,
 * pour tous les baux actifs d'une agence qui n'en ont pas encore.
 * Idempotent : peut être appelée plusieurs fois sans créer de doublons
 * (contrainte unique sur [leaseId, month]).
 */
export async function generateRentPaymentsForMonth(agencyId: string, monthKey: string) {
  const activeLeases = await prisma.lease.findMany({
    where: { agencyId, active: true },
  });

  let created = 0;
  for (const lease of activeLeases) {
    const existing = await prisma.rentPayment.findUnique({
      where: { leaseId_month: { leaseId: lease.id, month: monthKey } },
    });
    if (existing) continue;

    await prisma.rentPayment.create({
      data: {
        leaseId: lease.id,
        month: monthKey,
        amountDue: lease.monthlyRent,
        dueDate: buildDueDate(monthKey, lease.dueDay),
        status: "PENDING",
      },
    });
    created++;
  }

  return created;
}

/**
 * Met à jour le statut des loyers en attente dont la date d'échéance
 * est dépassée, pour les passer en retard (OVERDUE).
 */
export async function markOverdueRentPayments(agencyId: string) {
  const now = new Date();

  const leases = await prisma.lease.findMany({ where: { agencyId }, select: { id: true } });
  const leaseIds = leases.map((l) => l.id);

  await prisma.rentPayment.updateMany({
    where: {
      leaseId: { in: leaseIds },
      status: "PENDING",
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });
}
