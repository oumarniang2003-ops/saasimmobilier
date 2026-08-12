"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Property = {
  leaseId: string;
  propertyLabel: string;
  tenantName: string;
  tenantPhone: string | null;
  monthlyRent: number;
  active: boolean;
  currentMonthStatus: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE" | null;
};

type LandlordDetail = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  properties: Property[];
  expectedMonthlyTotal: number;
  collectedThisMonth: number;
  totalRevenueAllTime: number;
};

const statusStyle: Record<string, string> = {
  PENDING: "bg-neutral-100 text-neutral-600",
  PAID: "bg-emerald-100 text-emerald-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
};
const statusLabel: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payé",
  PARTIAL: "Partiel",
  OVERDUE: "En retard",
};

export default function LandlordDetailPage() {
  const params = useParams();
  const [data, setData] = useState<LandlordDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/landlords/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <p className="text-neutral-500 text-sm">Chargement...</p>;
  if (!data) return <p className="text-neutral-500 text-sm">Bailleur introuvable.</p>;

  const collectionRate =
    data.expectedMonthlyTotal > 0
      ? Math.round((data.collectedThisMonth / data.expectedMonthlyTotal) * 100)
      : 0;

  return (
    <div>
      <Link href="/dashboard/landlords" className="text-sm text-neutral-500 hover:text-brand">
        ← Bailleurs
      </Link>

      <div className="flex items-center justify-between mb-6 mt-2">
        <div>
          <h1 className="font-display text-2xl text-ink">{data.name}</h1>
          <p className="text-sm text-neutral-500">
            {data.phone} {data.email && `· ${data.email}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Attendu ce mois-ci</p>
          <p className="text-xl font-semibold text-ink">{data.expectedMonthlyTotal.toLocaleString("fr-FR")} F</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Encaissé ce mois-ci</p>
          <p className="text-xl font-semibold text-emerald-600">
            {data.collectedThisMonth.toLocaleString("fr-FR")} F
            <span className="text-xs text-neutral-400 font-normal ml-1">({collectionRate}%)</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Total encaissé (tous mois)</p>
          <p className="text-xl font-semibold text-ink">{data.totalRevenueAllTime.toLocaleString("fr-FR")} F</p>
        </div>
      </div>

      <h2 className="font-display text-lg text-ink mb-3">
        Biens gérés ({data.properties.filter((p) => p.active).length})
      </h2>

      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
        {data.properties.map((p) => (
          <div key={p.leaseId} className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-medium text-ink">{p.propertyLabel}</p>
              <p className="text-xs text-neutral-500">
                Locataire : {p.tenantName} {p.tenantPhone && `· ${p.tenantPhone}`}
                {!p.active && <span className="text-red-500 ml-2">(bail inactif)</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-ink">{p.monthlyRent.toLocaleString("fr-FR")} F/mois</span>
              {p.currentMonthStatus && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[p.currentMonthStatus]}`}>
                  {statusLabel[p.currentMonthStatus]}
                </span>
              )}
            </div>
          </div>
        ))}
        {data.properties.length === 0 && (
          <p className="px-4 py-6 text-center text-neutral-500 text-sm">
            Aucun bien associé à ce bailleur pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}
