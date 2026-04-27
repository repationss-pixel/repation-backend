'use client'

import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { useRef } from 'react'

export default function QRCodeAdminPage() {
  const { slug } = useParams<{ slug: string }>()
  const printRef = useRef<HTMLDivElement>(null)

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? 'https://repation.fr'

  const qrUrl = `${baseUrl}/check-in/${slug}`

  function handlePrint() {
    const content = printRef.current
    if (!content) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Repation — ${slug}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: sans-serif;
              background: white;
            }
            .card {
              text-align: center;
              padding: 40px;
              border: 3px solid #1D9E75;
              border-radius: 24px;
              max-width: 360px;
            }
            .logo { font-size: 28px; font-weight: 900; color: #1D9E75; margin-bottom: 8px; }
            .subtitle { font-size: 13px; color: #666; margin-bottom: 24px; }
            .qr-container { margin: 0 auto 24px; }
            .instruction { font-size: 14px; color: #333; margin-bottom: 8px; font-weight: 600; }
            .url { font-size: 10px; color: #999; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">Repation</div>
            <div class="subtitle">Mangez ensemble, vivez mieux</div>
            <div class="qr-container">${content.innerHTML}</div>
            <div class="instruction">Scannez pour confirmer votre présence</div>
            <div class="url">${qrUrl}</div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md text-center">
        {/* En-tête */}
        <div className="mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
            Administration
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">QR Code restaurant</h1>
        <p className="text-gray-500 text-sm mb-8">
          Imprimez ce QR code et plastifiez-le sur la table dédiée.
        </p>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-2xl border-2 border-[#1D9E75]/20 shadow-sm">
            <div ref={printRef}>
              <QRCodeSVG
                value={qrUrl}
                size={240}
                level="H"
                imageSettings={{
                  src: '/logo.png',
                  height: 52,
                  width: 52,
                  excavate: true,
                }}
              />
            </div>
          </div>
        </div>

        {/* Infos */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Restaurant</span>
            <span className="font-medium text-gray-800 font-mono">{slug}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-500">URL encodée</span>
            <span className="font-medium text-gray-600 text-xs truncate max-w-[180px]" title={qrUrl}>
              {qrUrl}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handlePrint}
            className="w-full bg-[#1D9E75] text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#178a64] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Imprimer
          </button>

          <a
            href={`/dashboard/restaurant/${slug}`}
            className="w-full border border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            Voir le tableau de bord
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-6 leading-relaxed">
          Ce QR code est unique pour ce restaurant. Plastifiez-le et posez-le sur la table Repation dédiée.
        </p>
      </div>
    </div>
  )
}
