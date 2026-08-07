import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSpreadsheetFile, pick } from "@/lib/import";

// Colonnes attendues (insensible à la casse) :
// Nom, Téléphone, Email, Bien, Loyer, Jour échéance, Bailleur (optionnel)
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

  // Pré-charge les bailleurs existants pour faire correspondre par nom
  // sans re-questionner la base à chaque ligne
  const existingLandlords = await prisma.landlord.findMany({ where: { agencyId } });

  let created = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const name = pick(row, "nom", "name", "locataire");
    const phone = pick(row, "téléphone", "telephone", "phone", "tel");
    const email = pick(row, "email", "e-mail", "mail");
    const propertyLabel = pick(row, "bien", "logement", "propriété", "adresse");
    const rentRaw = pick(row, "loyer", "loyer mensuel", "montant");
    const dueDayRaw = pick(row, "jour échéance", "jour d'échéance", "echeance", "jour");
    const landlordName = pick(row, "bailleur", "propriétaire", "proprietaire");

    if (!name || !propertyLabel || !rentRaw) {
      errors.push(`Ligne ${i + 2} : nom, bien ou loyer manquant, ignorée.`);
      continue;
    }

    const monthlyRent = parseFloat(rentRaw.replace(/[^\d.,]/g, "").replace(",", "."));
    if (!monthlyRent || isNaN(monthlyRent)) {
      errors.push(`Ligne ${i + 2} : loyer invalide ("${rentRaw}"), ignorée.`);
      continue;
    }

    const dueDay = parseInt(dueDayRaw) || 5;

    // Fait correspondre le bailleur par nom si une colonne est fournie
    let landlordId: string | undefined;
    if (landlordName) {
      const match = existingLandlords.find((l) => l.name.toLowerCase() === landlordName.toLowerCase());
      landlordId = match?.id;
      if (!landlordId) {
        errors.push(`Ligne ${i + 2} : bailleur "${landlordName}" introuvable (importez d'abord vos bailleurs), locataire créé sans bailleur associé.`);
      }
    }

    await prisma.tenant.create({
      data: {
        agencyId,
        name,
        phone: phone || null,
        email: email || null,
        leases: {
          create: { agencyId, propertyLabel, monthlyRent, dueDay, landlordId },
        },
      },
    });
    created++;
  }

  return NextResponse.json({ created, total: rows.length, errors });
}
