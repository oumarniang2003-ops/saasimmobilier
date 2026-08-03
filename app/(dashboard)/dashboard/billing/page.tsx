"use client";

import { useState } from "react";

const plans = [
  { id: "STARTER", name: "Starter", price: "9€/mois", features: ["Jusqu'à 10 locataires suivis", "Relances WhatsApp"] },
  { id: "PRO", name: "Pro", price: "19€/mois", features: ["Jusqu'à 50 locataires", "Paiement en ligne"] },
  { id: "AGENCY", name: "Agency", price: "39€/mois", features: ["Locataires illimités", "Plusieurs agents"] },
];

export default function BillingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function subscribe(plan: string) {
    setLoadingPlan(plan);
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setLoadingPlan(null);
    if (data.url) window.location.href = data.url;
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-2">Mon abonnement</h1>
      <p className="text-neutral-600 mb-8">Choisissez le plan adapté à la taille de votre portefeuille locatif.</p>

      <div className="grid grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="font-display text-xl text-ink">{p.name}</h2>
            <p className="text-2xl font-semibold text-brand mt-2">{p.price}</p>
            <ul className="mt-4 space-y-1 text-sm text-neutral-600">
              {p.features.map((f) => <li key={f}>• {f}</li>)}
            </ul>
            <button onClick={() => subscribe(p.id)} disabled={loadingPlan === p.id}
              className="mt-6 w-full rounded-lg bg-ink hover:bg-black text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60">
              {loadingPlan === p.id ? "Redirection..." : "Choisir ce plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
