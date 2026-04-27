'use client'

import { useState } from 'react'

export type InvoiceData = {
  restaurant: { nom: string; adresse: string; categorie: string }
  mois: string
  visitesCertifiees: number
  tarifParClient: number
  montantHT: number
  montantTTC: number
  visits: { dateStr: string; user1: string; user2: string }[]
}

export default function InvoicePDFButton({ data }: { data: InvoiceData }) {
  const [loading, setLoading] = useState(false)

  async function downloadPDF() {
    setLoading(true)
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()

    // En-tête
    doc.setFillColor(29, 158, 117)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('REPATION', 14, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Facture de commission — Plateforme de mise en relation', 14, 28)
    doc.text(`Période : ${data.mois}`, 14, 35)

    // Infos restaurant
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(data.restaurant.nom, 14, 55)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(data.restaurant.adresse, 14, 62)
    doc.text(`Catégorie : ${data.restaurant.categorie}`, 14, 68)

    // Récapitulatif
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Récapitulatif', 14, 82)

    autoTable(doc, {
      startY: 87,
      head: [['Description', 'Détail', 'Montant']],
      body: [
        ['Visites certifiées', `${data.visitesCertifiees} visites`, ''],
        ['Clients amenés', `${data.visitesCertifiees} × 2 = ${data.visitesCertifiees * 2} clients`, ''],
        [
          'Forfait Repation par client',
          `${data.visitesCertifiees * 2} × ${data.tarifParClient.toFixed(2)} €`,
          `${data.montantHT.toFixed(2)} €`,
        ],
        ['TVA (20%)', '', `${(data.montantTTC - data.montantHT).toFixed(2)} €`],
        ['Total TTC', '', `${data.montantTTC.toFixed(2)} €`],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [29, 158, 117] },
      columnStyles: { 2: { halign: 'right' } },
    })

    const afterSummary = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    // Liste des visites
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Détail des visites certifiées', 14, afterSummary)

    autoTable(doc, {
      startY: afterSummary + 5,
      head: [['Date & heure', 'Convive 1', 'Convive 2', 'Statut']],
      body: data.visits.map((v) => [v.dateStr, v.user1, v.user2, 'Certifiée ✓']),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [29, 158, 117] },
    })

    // Pied de page
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Repation SAS — contact@repation.fr — Ce document est généré automatiquement.', 14, pageHeight - 10)

    doc.save(`facture-repation-${data.mois.replace(/\s/g, '-')}.pdf`)
    setLoading(false)
  }

  return (
    <button
      onClick={downloadPDF}
      disabled={loading}
      className="w-full bg-[#1D9E75] text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#178a64] transition-colors disabled:opacity-60"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
      </svg>
      {loading ? 'Génération…' : 'Télécharger la facture PDF'}
    </button>
  )
}
