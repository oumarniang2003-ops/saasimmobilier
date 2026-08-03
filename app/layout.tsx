import "./globals.css";

export const metadata = {
  title: "LoyerFacile — Gestion des loyers pour agences immobilières",
  description: "Suivez qui a payé, relancez en un clic, encaissez en ligne.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
