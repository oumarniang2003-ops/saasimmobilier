"use client";

import { useEffect, useState } from "react";

type Tenant = {
  id: string; name: string; phone: string | null; email: string | null;
  leases: { id: string; propertyLabel: string; monthlyRent: number; dueDay: number }[];
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [open, setOpen] = useState(false);
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

      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
        {tenants.map((t) => (
          <div key={t.id} className="px-4 py-3 flex justify-between items-center text-sm">
            <div>
              <p className="font-medium text-ink">{t.name}</p>
              <p className="text-xs text-neutral-500">
                {t.leases[0]?.propertyLabel} {t.phone && `· ${t.phone}`}
              </p>
            </div>
            <span className="font-semibold text-ink">
              {t.leases[0] ? Number(t.leases[0].monthlyRent).toLocaleString("fr-FR") + " F/mois" : "—"}
            </span>
          </div>
        ))}
        {tenants.length === 0 && (
          <p className="px-4 py-6 text-center text-neutral-500 text-sm">Aucun locataire pour le moment.</p>
        )}
      </div>
    </div>
  );
}
