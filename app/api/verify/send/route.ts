import { NextResponse } from "next/server";
import twilio from "twilio";

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
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });

    const to = normalizePhone(phone);

    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to, channel: "sms" });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[verify/send]", err);
    const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi du SMS.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
