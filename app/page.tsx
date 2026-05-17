import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ReservationStatut } from "@prisma/client";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"] });

export const dynamic = "force-dynamic";

export default async function Home() {
  let sessionPrenom: string | null = null;
  let sessionType: string | null = null;
  try {
    const raw = cookies().get("repation_session")?.value;
    if (raw) {
      const p = JSON.parse(raw);
      sessionPrenom = p.prenom ?? null;
      sessionType = p.type ?? null;
    }
  } catch {}

  const accountHref = sessionType === "RESTAURATEUR" ? "/dashboard/restaurateur" : "/mon-compte";

  const now = new Date();
  const restaurants = await prisma.restaurant.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      reservations: {
        where: {
          statut: ReservationStatut.EN_ATTENTE,
          visitId: null,
          creneau: { gte: now },
        },
        orderBy: { creneau: "asc" },
        take: 1,
      },
    },
  });

  return (
    <div style={{ background: "#F2EAD9", minHeight: "100vh", color: "#1C1009" }}>

      {/* ── NAVBAR ── */}
      <header style={{
        background: "#F2EAD9",
        borderBottom: "1px solid #D4BFA0",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}>
          {/* Spacer gauche */}
          <div style={{ width: "200px" }} />

          {/* Logo centré */}
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            <span className={playfair.className} style={{
              fontSize: "22px",
              fontStyle: "italic",
              fontWeight: 700,
              color: "#1C1009",
              letterSpacing: "-0.5px",
            }}>
              repation
            </span>
          </div>

          {/* Nav droite */}
          <nav style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {sessionPrenom ? (
              <a href={accountHref} style={{
                fontSize: "13px", fontWeight: 600, color: "#6B3D14",
                border: "1px solid #D4BFA0", padding: "7px 18px",
                borderRadius: "8px", textDecoration: "none",
                background: "transparent",
              }}>
                {sessionPrenom}
              </a>
            ) : (
              <>
                <a href="/connexion" style={{
                  fontSize: "13px", fontWeight: 600, color: "#6B3D14",
                  border: "1px solid #D4BFA0", padding: "7px 18px",
                  borderRadius: "8px", textDecoration: "none",
                  background: "transparent",
                }}>
                  Connexion
                </a>
                <a href="/inscription" style={{
                  fontSize: "13px", fontWeight: 600, color: "#F2EAD9",
                  background: "#2C1A0A", padding: "7px 18px",
                  borderRadius: "8px", textDecoration: "none",
                  border: "1px solid #2C1A0A",
                }}>
                  S&apos;inscrire
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── HERO 2 colonnes ── */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "calc(100vh - 60px)",
      }}
        className="hero-grid"
      >

        {/* Colonne gauche */}
        <div style={{
          background: "#F2EAD9",
          padding: "72px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}>
          <p style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "#C4A06A",
            marginBottom: "24px",
          }}>
            La table partagée
          </p>

          <h1 className={playfair.className} style={{
            fontSize: "44px",
            lineHeight: 1.15,
            fontWeight: 700,
            color: "#1C1009",
            marginBottom: "20px",
          }}>
            Le hasard vous met<br />
            <em style={{ color: "#6B3D14" }}>à table.</em>
          </h1>

          <p style={{
            fontSize: "14px",
            color: "#7A6A55",
            lineHeight: 1.75,
            marginBottom: "40px",
            maxWidth: "360px",
          }}>
            Repation vous connecte à d&apos;autres convives dans des restaurants partenaires près de chez vous.
          </p>

          {/* Barre de recherche */}
          <div style={{ display: "flex", maxWidth: "420px", marginBottom: "18px" }}>
            <input
              type="text"
              placeholder="Ville, restaurant, quartier…"
              style={{
                flex: 1,
                padding: "12px 16px",
                background: "white",
                border: "1px solid #D4BFA0",
                borderRight: "none",
                borderRadius: "8px 0 0 8px",
                fontSize: "13px",
                color: "#1C1009",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button style={{
              padding: "12px 20px",
              background: "#6B3D14",
              color: "#F2EAD9",
              border: "none",
              borderRadius: "0 8px 8px 0",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}>
              Rechercher
            </button>
          </div>

          {/* Pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["Midi", "Soir", "Brasserie", "Restaurant", "Café"].map((pill) => (
              <span key={pill} style={{
                padding: "5px 14px",
                border: "1px solid #C4A06A",
                borderRadius: "20px",
                fontSize: "12px",
                color: "#6B3D14",
                cursor: "pointer",
                userSelect: "none",
                background: "transparent",
              }}>
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Colonne droite — bois */}
        <div style={{
          background: "#2C1A0A",
          padding: "56px 44px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
          <p style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "#C4A06A",
            marginBottom: "28px",
          }}>
            Tables disponibles
          </p>

          {restaurants.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <p className={playfair.className} style={{
                fontSize: "24px",
                fontStyle: "italic",
                color: "#C4A06A",
                textAlign: "center",
                marginBottom: "10px",
              }}>
                Bientôt dans votre ville
              </p>
              <p style={{ fontSize: "13px", color: "#6B4A2A", textAlign: "center", lineHeight: 1.6, maxWidth: "220px" }}>
                Les premiers restaurants partenaires arrivent prochainement.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {restaurants.map((r) => {
                const slot = r.reservations[0];
                const hasOpenSeat = !!slot;
                const heure = slot
                  ? new Date(slot.creneau).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                  : null;
                const adresseParts = r.adresse.split(",");
                const ville = adresseParts[adresseParts.length - 1]?.trim() ?? r.adresse;

                return (
                  <div key={r.id} style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(196,160,106,0.3)",
                    borderRadius: "12px",
                    padding: "18px 20px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <p className={playfair.className} style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#F2EAD9",
                          marginBottom: "3px",
                        }}>
                          {r.nom}
                        </p>
                        <p style={{ fontSize: "11px", color: "#8C6D4A" }}>
                          {ville}{heure ? ` · ${heure}` : ""}
                        </p>
                      </div>

                      {/* 2 ronds */}
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", paddingTop: "2px" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#C4A06A" }} />
                        <div style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: hasOpenSeat ? "transparent" : "#C4A06A",
                          border: hasOpenSeat ? "1.5px solid #C4A06A" : "none",
                        }} />
                      </div>
                    </div>

                    {hasOpenSeat && (
                      <a href={`/restaurant/${r.slug}`} style={{
                        display: "inline-block",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        background: "#C4A06A",
                        color: "#1C1009",
                        padding: "5px 14px",
                        borderRadius: "6px",
                        textDecoration: "none",
                      }}>
                        Rejoindre la table
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── BANDE BAS ── */}
      <div style={{
        background: "#EDE3CF",
        borderTop: "1px solid #D4BFA0",
        padding: "24px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <p className={playfair.className} style={{
          fontSize: "17px",
          fontStyle: "italic",
          color: "#7A6A55",
        }}>
          Repation, le hasard vous met à table.
        </p>
        <a href="/inscription" style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#6B3D14",
          border: "1px solid #C4A06A",
          padding: "7px 18px",
          borderRadius: "8px",
          textDecoration: "none",
        }}>
          Vous êtes restaurateur ?&nbsp;→
        </a>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        background: "#EDE3CF",
        borderTop: "1px solid #D4BFA0",
        padding: "32px 40px",
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}>
          <div>
            <p className={playfair.className} style={{
              fontSize: "16px",
              fontStyle: "italic",
              color: "#6B3D14",
              marginBottom: "4px",
            }}>
              repation
            </p>
            <p style={{ fontSize: "12px", color: "#B0A090" }}>
              © {new Date().getFullYear()} Repation. Tous droits réservés.
            </p>
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { href: "/contact", label: "Contact" },
              { href: "/cgu", label: "CGU" },
              { href: "/cgu-restaurateurs", label: "CGU Restaurateurs" },
              { href: "/confidentialite", label: "Confidentialité" },
            ].map(({ href, label }) => (
              <a key={href} href={href} style={{
                fontSize: "12px",
                color: "#7A6A55",
                textDecoration: "none",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1C1009")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#7A6A55")}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}
