"use client";

import { useState } from "react";
import Link from "next/link";

type ImportResult = { created: number; total: number; errors: string[] } | null;

function UploadCard({
  title,
  description,
  endpoint,
  templateType,
}: {
  title: string;
  description: string;
  endpoint: string;
  templateType: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(endpoint, { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
      return;
    }
    setResult(data);
    setFile(null);
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <h2 className="font-display text-lg text-ink mb-1">{title}</h2>
      <p className="text-sm text-neutral-500 mb-4">{description}</p>

      <a
        href={`/api/import/template?type=${templateType}`}
        className="text-xs text-brand hover:underline font-medium inline-block mb-4"
      >
        📥 Télécharger le modèle (.csv)
      </a>

      <label className="block border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center cursor-pointer hover:border-brand transition-colors">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-sm text-neutral-600">
          {file ? `📄 ${file.name}` : "Cliquez pour choisir un fichier .xlsx ou .csv"}
        </p>
      </label>

      <button
        onClick={handleImport}
        disabled={!file || loading}
        className="w-full mt-4 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2.5 transition-colors disabled:opacity-50"
      >
        {loading ? "Import en cours..." : "Importer ce fichier"}
      </button>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {result && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-sm text-emerald-700 font-medium">
            {result.created} sur {result.total} ligne(s) importée(s) avec succès.
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-xs text-amber-700 space-y-1">
              {result.errors.map((e, i) => <li key={i}>⚠ {e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function ImportPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-ink mb-2">Importer vos données</h1>
      <p className="text-neutral-600 mb-6">
        Plutôt que de tout saisir un par un, déposez vos fichiers Excel ou
        CSV. Importez d'abord vos <strong>bailleurs</strong>, puis vos{" "}
        <strong>locataires</strong> — comme ça, si votre fichier locataires
        précise le nom du bailleur, l'association se fait automatiquement.
      </p>

      <div className="space-y-5">
        <UploadCard
          title="1. Bailleurs (propriétaires)"
          description="Colonnes attendues : Nom, Téléphone, Email"
          endpoint="/api/import/landlords"
          templateType="landlords"
        />
        <UploadCard
          title="2. Locataires (avec leur bail)"
          description="Colonnes attendues : Nom, Téléphone, Email, Bien, Loyer, Jour échéance, Bailleur (optionnel)"
          endpoint="/api/import/tenants"
          templateType="tenants"
        />
      </div>

      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/dashboard/tenants" className="text-brand hover:underline">
          → Voir les locataires
        </Link>
        <Link href="/dashboard/landlords" className="text-brand hover:underline">
          → Voir les bailleurs
        </Link>
      </div>
    </div>
  );
}
