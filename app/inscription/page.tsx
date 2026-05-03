import Link from "next/link";
import InscriptionForm from "@/components/InscriptionForm";

export default function InscriptionPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img
              src="/logo-repation.png"
              alt="Repation"
              style={{ height: "48px", width: "auto", display: "inline-block" }}
            />
          </Link>
          <p className="mt-2 text-sm text-gray-500">Le hasard vous met à table.</p>
        </div>

        <InscriptionForm />

        <p className="text-sm text-center text-gray-400 mt-6">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-[#1D9E75] hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
