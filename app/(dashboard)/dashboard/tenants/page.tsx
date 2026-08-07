"use client";

import { useEffect, useState } from "react";

type Tenant = {
  id: string; name: string; phone: string | null; email: string | null;
  leases: { id: string; propertyLabel: string; monthlyRent: number; dueDay: number }[];
  currentMonthStatus: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE" | null;
};

const statusStyle: Record<string, string> = {
  PENDING: "bg-neutral-100 text-neutral-600",
  PAID: "bg-emerald-100 text-emerald-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
};
const statusLabel: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payé ce mois",
  PARTIAL: "Payé en partie",
  OVERDUE: "En retard",
};

type Filter = "ALL" | "PAID" | "UNPAID";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", propertyLabel: "", monthlyRent: 0, dueDay: 5,
  });

  function load() {
    fetch("/api/tenants").then((r) => r.json()).then(setTenants);
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", phone: "", email: "", propertyLabel: "", monthlyRent: 0, dueDay: 5 });
    setOpen(false);
    load();
  }

  const filteredTenants = tenants.filter((t) => {
    if (filter === "ALL") return true;
    if (filter === "PAID") return t.currentMonthStatus === "PAID";
    if (filter === "UNPAID") return t.currentMonthStatus && t.currentMonthStatus !== "PAID";
    return true;
  });

  const paidCount = tenants.filter((t) => t.currentMonthStatus === "PAID").length;
  const unpaidCount = tenants.filter((t) => t.currentMonthStatus && t.currentMonthStatus !== "PAID").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Locataires</h1>
        <button onClick={() => setOpen(!open)} className="rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2">
          + Nouveau locataire
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-4 mb-6 grid grid-cols-2 gap-3">
          <input required placeholder="Nom du locataire" className="col-span-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Téléphone (pour WhatsApp)" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email (optionnel)" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required placeholder="Bien loué (ex: Appart 3B, Almadies)" className="col-span-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            value={form.propertyLabel} onChange={(e) => setForm({ ...form, propertyLabel: e.target.value })} />
          <input required type="number" min={0} placeholder="Loyer mensuel (F)" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            value={form.monthlyRent || ""} onChange={(e) => setForm({ ...form, monthlyRent: parseFloat(e.target.value) || 0 })} />
          <input type="number" min={1} max={28} placeholder="Jour d'échéance (ex: 5)" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: parseInt(e.target.value) || 5 })} />
          <button type="submit" className="col-span-2 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2">
            Enregistrer
          </button>
        </form>
      )}

      {/* Filtres rapides : voir en un coup d'œil qui a payé ou non ce mois-ci */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("ALL")}
          className={`text-xs rounded-full px-3 py-1.5 font-medium ${filter === "ALL" ? "bg-ink text-white" : "bg-white border border-neutral-300 text-neutral-600"}`}
        >
          Tous ({tenants.length})
        </button>
        <button
          onClick={() => setFilter("PAID")}
          className={`text-xs rounded-full px-3 py-1.5 font-medium ${filter === "PAID" ? "bg-emerald-600 text-white" : "bg-white border border-neutral-300 text-neutral-600"}`}
        >
          ✓ Ont payé ({paidCount})
        </button>
        <button
          onClick={() => setFilter("UNPAID")}
          className={`text-xs rounded-full px-3 py-1.5 font-medium ${filter === "UNPAID" ? "bg-red-600 text-white" : "bg-white border border-neutral-300 text-neutral-600"}`}
        >
          ✕ N'ont pas payé ({unpaidCount})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
        {filteredTenants.map((t) => (
          <div key={t.id} className="px-4 py-3 flex justify-between items-center text-sm">
            <div>
              <p className="font-medium text-ink">{t.name}</p>
              <p className="text-xs text-neutral-500">
                {t.leases[0]?.propertyLabel} {t.phone && `· ${t.phone}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-ink">
                {t.leases[0] ? Number(t.leases[0].monthlyRent).toLocaleString("fr-FR") + " F/mois" : "—"}
              </span>
              {t.currentMonthStatus && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[t.currentMonthStatus]}`}>
                  {statusLabel[t.currentMonthStatus]}
                </span>
              )}
            </div>
          </div>
        ))}
        {filteredTenants.length === 0 && (
          <p className="px-4 py-6 text-center text-neutral-500 text-sm">
            {tenants.length === 0 ? "Aucun locataire pour le moment." : "Aucun locataire dans ce filtre."}
          </p>
        )}
      </div>
    </div>
  );
}
