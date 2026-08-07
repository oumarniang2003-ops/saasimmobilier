import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSpreadsheetFile, pick } from "@/lib/import";

// Colonnes attendues (insensible à la casse) : Nom, Téléphone, Email
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const agencyId = (session as any).agencyId;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Aucun fichier envoyé" }, { status: 400 });

  let rows: Record<string, any>[];
  try {
    rows = await parseSpreadsheetFile(file);
  } catch (err) {
    return NextResponse.json({ error: "Impossible de lire ce fichier. Vérifiez qu'il s'agit bien d'un .xlsx ou .csv." }, { status: 400 });
  }

  let created = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const name = pick(row, "nom", "name", "nom du bailleur", "propriétaire");
    const phone = pick(row, "téléphone", "telephone", "phone", "tel");
    const email = pick(row, "email", "e-mail", "mail");

    if (!name) {
      errors.push(`Ligne ${i + 2} : nom manquant, ignorée.`);
      continue;
    }

    await prisma.landlord.create({
      data: { agencyId, name, phone: phone || null, email: email || null },
    });
    created++;
  }

  return NextResponse.json({ created, total: rows.length, errors });
}
