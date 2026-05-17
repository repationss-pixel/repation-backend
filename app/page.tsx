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
          padding: "0 32px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}>
          <div style={{ width: "180px" }} />

          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            <img
              src="/logo-repation.png"
              alt="Repation"
              style={{
                height: "36px",
                width: "auto",
                filter: "brightness(0) sepia(1) saturate(0.6) hue-rotate(5deg) opacity(0.85)",
              }}
            />
          </div>

          <nav style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {sessionPrenom ? (
              <a href={accountHref} style={{
                fontSize: "13px", fontWeight: 600, color: "#6B3D14",
                border: "1px solid #C4A06A", padding: "8px 20px", borderRadius: "8px",
                textDecoration: "none",
              }}>
                Mon compte
              </a>
            ) : (
              <>
                <a href="/connexion" style={{
                  fontSize: "13px", fontWeight: 600, color: "#6B3D14",
                  textDecoration: "none",
                }}>
                  Connexion
                </a>
                <a href="/inscription" style={{
                  fontSize: "13px", fontWeight: 600, background: "#2C1A0A",
                  color: "#F2EAD9", padding: "8px 20px", borderRadius: "8px",
                  textDecoration: "none",
                }}>
                  S&apos;inscrire
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── HERO 2 colonnes ── */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "calc(100vh - 64px)" }}>

        {/* Colonne gauche — beige */}
        <div style={{
          background: "#F2EAD9",
          padding: "80px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}>
          <p style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "3.5px",
            color: "#C4A06A", textTransform: "uppercase", marginBottom: "28px",
          }}>
            La table partagée
          </p>

          <h1 className={playfair.className} style={{
            fontSize: "54px", lineHeight: 1.1, color: "#1C1009",
            marginBottom: "24px", fontWeight: 700,
          }}>
            Le hasard vous met<br />
            <em style={{ color: "#6B3D14", fontStyle: "italic" }}>à table.</em>
          </h1>

          <p style={{
            fontSize: "15px", color: "#8C6D4A", lineHeight: 1.75,
            marginBottom: "44px", maxWidth: "380px",
          }}>
            Repation vous connecte à d&apos;autres convives dans des restaurants partenaires près de chez vous.
          </p>

          {/* Barre de recherche */}
          <div style={{ display: "flex", marginBottom: "20px", maxWidth: "440px" }}>
            <input
              type="text"
              placeholder="Ville, restaurant, quartier…"
              style={{
                flex: 1, padding: "13px 18px", background: "white",
                border: "1px solid #D4BFA0", borderRight: "none",
                borderRadius: "8px 0 0 8px", fontSize: "14px", color: "#1C1009",
                outline: "none", fontFamily: "inherit",
              }}
            />
            <button style={{
              padding: "13px 22px", background: "#2C1A0A", color: "#F2EAD9",
              border: "none", borderRadius: "0 8px 8px 0", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              Rechercher
            </button>
          </div>

          {/* Pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["Midi", "Soir", "Brasserie", "Restaurant", "Café"].map((pill) => (
              <span key={pill} style={{
                padding: "6px 16px", border: "1px solid #C4A06A",
                borderRadius: "20px", fontSize: "12px", color: "#6B3D14",
                cursor: "pointer", userSelect: "none",
              }}>
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Colonne droite — bois sombre */}
        <div style={{
          background: "#2C1A0A",
          padding: "64px 48px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
          <p style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "3.5px",
            color: "#C4A06A", textTransform: "uppercase", marginBottom: "32px",
          }}>
            Tables disponibles
          </p>

          {restaurants.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: "60px" }}>
              <p className={playfair.className} style={{
                fontSize: "26px", color: "#C4A06A", fontStyle: "italic",
                textAlign: "center", marginBottom: "12px",
              }}>
                Bientôt dans votre ville
              </p>
              <p style={{ fontSize: "13px", color: "#6B4A2A", textAlign: "center", maxWidth: "240px", lineHeight: 1.6 }}>
                Les premiers restaurants partenaires arrivent prochainement.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(196,160,106,0.18)",
                    borderRadius: "12px",
                    padding: "20px 22px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                      <div>
                        <p style={{ fontSize: "15px", fontWeight: 600, color: "#F2EAD9", marginBottom: "4px" }}>
                          {r.nom}
                        </p>
                        <p style={{ fontSize: "12px", color: "#8C6D4A" }}>
                          {ville}{heure ? ` · ${heure}` : ""}
                        </p>
                      </div>

                      {/* 2 ronds — place prise / place libre */}
                      <div style={{ display: "flex", gap: "7px", alignItems: "center", paddingTop: "2px" }}>
                        <div style={{
                          width: "11px", height: "11px", borderRadius: "50%",
                          background: "#C4A06A",
                        }} />
                        <div style={{
                          width: "11px", height: "11px", borderRadius: "50%",
                          background: hasOpenSeat ? "transparent" : "#C4A06A",
                          border: hasOpenSeat ? "1.5px solid #C4A06A" : "none",
                        }} />
                      </div>
                    </div>

                    {hasOpenSeat && (
                      <a href={`/restaurant/${r.slug}`} style={{
                        display: "inline-block",
                        fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px",
                        color: "#C4A06A", border: "1px solid #C4A06A",
                        padding: "5px 14px", borderRadius: "6px",
                        textTransform: "uppercase", textDecoration: "none",
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

      {/* ── BANDE DU BAS ── */}
      <div style={{
        background: "#EDE3CF",
        borderTop: "1px solid #D4BFA0",
        padding: "28px 64px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <p className={playfair.className} style={{
          fontSize: "19px", fontStyle: "italic", color: "#6B3D14",
        }}>
          Repation, le hasard vous met à table.
        </p>
        <a href="/inscription" style={{
          fontSize: "14px", fontWeight: 600, color: "#2C1A0A",
          textDecoration: "none",
        }}>
          Vous êtes restaurateur ?&nbsp;<span style={{ color: "#C4A06A" }}>→</span>
        </a>
      </div>

    </div>
  );
}
