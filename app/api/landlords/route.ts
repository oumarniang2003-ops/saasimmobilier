import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const landlords = await prisma.landlord.findMany({
    where: { agencyId: (session as any).agencyId },
    include: { leases: { where: { active: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(landlords);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { name, phone, email } = body;
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const landlord = await prisma.landlord.create({
    data: { agencyId: (session as any).agencyId, name, phone: phone || null, email: email || null },
  });

  return NextResponse.json(landlord, { status: 201 });
}
