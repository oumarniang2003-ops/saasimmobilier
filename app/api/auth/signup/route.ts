import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  agencyName: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { agencyName, ownerName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
  }

  const slug = agencyName
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const passwordHash = await bcrypt.hash(password, 10);

  const agency = await prisma.agency.create({
    data: {
      name: agencyName,
      slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
      email,
      subscription: { create: { plan: "STARTER", status: "TRIALING" } },
      users: { create: { name: ownerName, email, passwordHash } },
    },
  });

  return NextResponse.json({ agencyId: agency.id }, { status: 201 });
}
