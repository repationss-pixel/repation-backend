import { prisma } from "@/lib/prisma";
import RechercheClient from "./RechercheClient";

export const dynamic = "force-dynamic";

export default async function RecherchePage() {
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, nom: true, adresse: true, categorie: true, slug: true },
    orderBy: { nom: "asc" },
  });

  return <RechercheClient restaurants={restaurants} />;
}
