import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const agencyName = (session as any).agencyName;

  const links = [
    { href: "/dashboard/rent", label: "Loyers du mois" },
    { href: "/dashboard/tenants", label: "Locataires" },
    { href: "/dashboard/billing", label: "Mon abonnement" },
  ];

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-64 shrink-0 bg-ink text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="font-display text-lg">{agencyName}</p>
          <p className="text-xs text-white/50 mt-1">Espace agence</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className="block rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
