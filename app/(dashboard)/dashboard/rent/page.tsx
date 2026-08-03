"use client";

import { useEffect, useState } from "react";

type Row = {
  leaseId: string;
  tenantName: string;
  tenantPhone: string | null;
  propertyLabel: string;
  monthlyRent: number;
  rentPayment: {
    id: string;
    status: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE";
    amountDue: number;
    amountPaid: number;
    dueDate: string;
    paymentMethod: string | null;
  } | null;
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

function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function shiftMonth(monthKey: string, delta: number) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function RentDashboardPage() {
  const [month, setMonth] = useState(currentMonthKey());
  const [data, setData] = useState<{ rows: Row[]; totalDue: number; totalCollected: number; overdueCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load(m: string) {
    setLoading(true);
    fetch(`/api/rent?month=${m}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }

  useEffect(() => load(month), [month]);

  async function markPaid(rentPaymentId: string, method: string) {
    setBusyId(rentPaymentId);
    await fetch(`/api/rent/${rentPaymentId}/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod: method }),
    });
    setBusyId(null);
    load(month);
  }

  async function sendPaymentLink(rentPaymentId: string, tenantPhone: string | null) {
    setBusyId(rentPaymentId);
    const res = await fetch(`/api/rent/${rentPaymentId}/pay-link`, { method: "POST" });
    const result = await res.json();
    setBusyId(null);

    if (result.url) {
      // Ouvre WhatsApp pré-rempli avec le lien si le locataire a un numéro,
      // sinon copie simplement le lien
      if (tenantPhone) {
        const msg = encodeURIComponent(`Bonjour, voici votre lien de paiement du loyer : ${result.url}`);
        window.open(`https://wa.me/${tenantPhone.replace(/\D/g, "")}?text=${msg}`, "_blank");
      } else {
        navigator.clipboard.writeText(result.url);
        alert("Lien de paiement copié dans le presse-papier.");
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl text-ink capitalize">Loyers — {monthLabel(month)}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(shiftMonth(month, -1))} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-white">
            ← Mois préc.
          </button>
          <button onClick={() => setMonth(currentMonthKey())} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-white">
            Aujourd'hui
          </button>
          <button onClick={() => setMonth(shiftMonth(month, 1))} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-white">
            Mois suiv. →
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500">Total attendu</p>
            <p className="text-xl font-semibold text-ink">{data.totalDue.toLocaleString("fr-FR")} F</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500">Total encaissé</p>
            <p className="text-xl font-semibold text-emerald-600">{data.totalCollected.toLocaleString("fr-FR")} F</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500">Locataires en retard</p>
            <p className="text-xl font-semibold text-red-600">{data.overdueCount}</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-neutral-500 text-sm">Chargement...</p>
      ) : !data || data.rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center text-neutral-500">
          Aucun locataire actif. Ajoutez-en un dans "Locataires" pour commencer le suivi.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
          {data.rows.map((row) => {
            const rp = row.rentPayment;
            const isPaid = rp?.status === "PAID";
            return (
              <div key={row.leaseId} className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-medium text-ink">{row.tenantName}</p>
                  <p className="text-xs text-neutral-500">{row.propertyLabel}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-ink">{row.monthlyRent.toLocaleString("fr-FR")} F</span>
                  {rp && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[rp.status]}`}>
                      {statusLabel[rp.status]}
                    </span>
                  )}
                </div>

                {!isPaid && rp && (
                  <div className="flex items-center gap-2">
                    <select
                      disabled={busyId === rp.id}
                      onChange={(e) => e.target.value && markPaid(rp.id, e.target.value)}
                      defaultValue=""
                      className="text-xs rounded-lg border border-neutral-300 px-2 py-1.5"
                    >
                      <option value="" disabled>Marquer payé via...</option>
                      <option value="CASH">Espèces</option>
                      <option value="TRANSFER">Virement</option>
                      <option value="WAVE">Wave</option>
                      <option value="ORANGE_MONEY">Orange Money</option>
                    </select>
                    <button
                      disabled={busyId === rp.id}
                      onClick={() => sendPaymentLink(rp.id, row.tenantPhone)}
                      className="text-xs rounded-lg bg-brand hover:bg-brand-dark text-white px-3 py-1.5 font-medium disabled:opacity-60"
                    >
                      Envoyer lien de paiement
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
