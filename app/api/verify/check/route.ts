import { NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.startsWith("0")) return "+33" + cleaned.slice(1);
  return cleaned;
}

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: "Téléphone et code requis." }, { status: 400 });
    }

    const to = normalizePhone(phone);

    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to, code });

    if (result.status !== "approved") {
      return NextResponse.json({ error: "Code incorrect ou expiré." }, { status: 400 });
    }

    // Mettre phoneVerified à true si l'utilisateur existe déjà
    await prisma.user.updateMany({
      where: { phone: to },
      data: { phoneVerified: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[verify/check]", err);
    const msg = err instanceof Error ? err.message : "Erreur lors de la vérification.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
