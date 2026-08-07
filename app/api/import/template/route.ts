import { NextResponse } from "next/server";

const templates: Record<string, string> = {
  tenants:
    "\uFEFF" +
    "Nom,Téléphone,Email,Bien,Loyer,Jour échéance,Bailleur\n" +
    "Fatou Diop,770000000,fatou@example.com,Appartement 3B Almadies,150000,5,Moussa Sarr\n" +
    "Ibrahima Fall,771111111,,Studio Sacré-Cœur,90000,3,",
  landlords:
    "\uFEFF" +
    "Nom,Téléphone,Email\n" +
    "Moussa Sarr,772222222,moussa@example.com\n" +
    "Aïda Ba,773333333,",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (!type || !templates[type]) {
    return NextResponse.json({ error: "Modèle inconnu" }, { status: 400 });
  }

  return new NextResponse(templates[type], {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="modele-${type}.csv"`,
    },
  });
}
