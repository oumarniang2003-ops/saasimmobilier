import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 text-center">
      <p className="text-amber font-medium mb-3">Pour les agences immobilières</p>
      <h1 className="font-display text-5xl text-ink max-w-2xl leading-tight">
        Sachez qui a payé son loyer, sans passer par Excel.
      </h1>
      <p className="text-neutral-600 mt-4 max-w-lg">
        Suivez chaque mois, relancez vos locataires en retard, et laissez-les
        payer en ligne directement — sans changer vos habitudes.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/signup" className="rounded-lg bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 transition-colors">
          Créer mon agence
        </Link>
        <Link href="/login" className="rounded-lg border border-neutral-300 text-ink font-medium px-6 py-3 hover:bg-white transition-colors">
          Se connecter
        </Link>
      </div>
    </main>
  );
}
