"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ agencyName: "", ownerName: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? data.error ?? "Une erreur est survenue.");
      return;
    }

    router.push("/login?signup=success");
  }

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-ink mb-2">Créez votre agence</h1>
        <p className="text-neutral-600 mb-8">Suivez vos loyers dès aujourd'hui.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Nom de l'agence</label>
            <input required className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              value={form.agencyName} onChange={(e) => setForm({ ...form, agencyName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Votre nom</label>
            <input required className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input required type="email" className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Mot de passe</label>
            <input required type="password" minLength={8} className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-brand hover:bg-brand-dark text-white font-medium py-2.5 transition-colors disabled:opacity-60">
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
      </div>
    </main>
  );
}
