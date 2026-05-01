"use client";

export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
      className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
    >
      Déconnexion
    </button>
  );
}
