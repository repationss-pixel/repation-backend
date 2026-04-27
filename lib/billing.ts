// Tarif fixe par client amené (HT), selon catégorie
const TARIF_PAR_CLIENT: Record<string, number> = {
  // valeurs enum DB (uppercase)
  RESTAURANT:  2.40,
  BRASSERIE:   2.40,
  FAST_FOOD:   1.50,
  CAFE:        1.00,
  BAR:         1.00,
  BOULANGERIE: 1.00,
  // valeurs legacy lowercase (compatibilité)
  restaurant:  2.40,
  brasserie:   2.40,
  bistrot:     2.40,
  'fast-food': 1.50,
  snack:       1.50,
  café:        1.00,
  bar:         1.00,
  boulangerie: 1.00,
}

export function getTarifParClient(categorie: string): number {
  return TARIF_PAR_CLIENT[categorie] ?? TARIF_PAR_CLIENT[categorie.toLowerCase()] ?? 2.40
}

export function calculateInvoice(
  categorie: string,
  visitesCertifiees: number
): { montantHT: number; montantTTC: number; tarifParClient: number } {
  const tarifParClient = getTarifParClient(categorie)
  // Chaque visite certifiée = 2 clients
  const montantHT = visitesCertifiees * 2 * tarifParClient
  const montantTTC = montantHT * 1.2
  return { montantHT, montantTTC, tarifParClient }
}
