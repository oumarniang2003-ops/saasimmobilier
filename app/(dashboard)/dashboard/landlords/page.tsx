"use client";

import { useEffect, useState } from "react";

type Landlord = {
  id: string; name: string; phone: string | null; email: string | null;
  leases: { id: string; propertyLabel: string }[];
};

export default function LandlordsPage() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  function load() {
    fetch("/api/landlords").then((r) => r.json()).then(setLandlords);
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/landlords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", phone: "", email: "" });
    setOpen(false);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Bailleurs</h1>
        <button onClick={() => setOpen(!open)} className="rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2">
          + Nouveau bailleur
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-4 mb-6 grid grid-cols-2 gap-3">
          <input required placeholder="Nom du bailleur" className="col-span-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Téléphone" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email (optionnel)" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <button type="submit" className="col-span-2 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2">
            Enregistrer
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
        {landlords.map((l) => (
          <div key={l.id} className="px-4 py-3 flex justify-between items-center text-sm">
            <div>
              <p className="font-medium text-ink">{l.name}</p>
              <p className="text-xs text-neutral-500">{l.phone}</p>
            </div>
            <span className="text-xs text-neutral-500">
              {l.leases.length} bien{l.leases.length > 1 ? "s" : ""} géré{l.leases.length > 1 ? "s" : ""}
            </span>
          </div>
        ))}
        {landlords.length === 0 && (
          <p className="px-4 py-6 text-center text-neutral-500 text-sm">Aucun bailleur pour le moment.</p>
        )}
      </div>
    </div>
  );
}
