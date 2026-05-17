const TARIF_PAR_CLIENT = 1.00 // HT, en euros
const SEUIL_GRATUIT = 5       // les 4 premiers clients sont gratuits

export function calculateInvoice(
  visitesCertifiees: number
): { montantHT: number; montantTTC: number; tarifParClient: number } {
  // Chaque visite certifiée = 2 clients
  const clientsAmenes = visitesCertifiees * 2
  const clientsFacturables = Math.max(0, clientsAmenes - SEUIL_GRATUIT)
  const montantHT = clientsFacturables * TARIF_PAR_CLIENT
  const montantTTC = montantHT * 1.2
  return { montantHT, montantTTC, tarifParClient: TARIF_PAR_CLIENT }
}
