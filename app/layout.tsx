import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Repation — Le hasard vous met à table",
  description:
    "Repation vous connecte à d'autres convives dans des restaurants partenaires près de chez vous.",
  keywords: ["repas", "restaurant", "rencontre", "social", "convivialité"],
  icons: {
    icon: [{ url: '/logo-repation.png', type: 'image/png' }],
    apple: [{ url: '/logo-repation.png' }],
  },
  openGraph: {
    title: "Repation — Le hasard vous met à table",
    description:
      "Rejoignez Repation et partagez un repas avec de nouvelles personnes dans des restaurants partenaires.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={GeistSans.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
