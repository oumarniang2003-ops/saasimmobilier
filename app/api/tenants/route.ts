import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const tenants = await prisma.tenant.findMany({
    where: { agencyId: (session as any).agencyId },
    include: { leases: { where: { active: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tenants);
}

// Crée un locataire ET son bail en une seule étape (formulaire unique côté agent,
// plus rapide pour un usage quotidien qu'un flux en 2 écrans séparés)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const agencyId = (session as any).agencyId;
  const body = await req.json();
  const { name, phone, email, propertyLabel, monthlyRent, dueDay } = body;

  if (!name || !propertyLabel || !monthlyRent) {
    return NextResponse.json({ error: "Nom, bien et loyer mensuel requis" }, { status: 400 });
  }

  const tenant = await prisma.tenant.create({
    data: {
      agencyId,
      name,
      phone: phone || null,
      email: email || null,
      leases: {
        create: {
          agencyId,
          propertyLabel,
          monthlyRent,
          dueDay: dueDay || 5,
        },
      },
    },
    include: { leases: true },
  });

  return NextResponse.json(tenant, { status: 201 });
}
