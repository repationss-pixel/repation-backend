"use client";

import { useState } from "react";

export default function SearchPanel() {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Où voulez-vous manger ?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 text-[#1C1009] placeholder-[#B0A090] bg-white border border-[#D4BFA0] rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C4A06A] focus:border-transparent text-base transition-all"
        />
      </div>

      <a
        href="/recherche"
        className="block w-full bg-[#6B3D14] hover:bg-[#2C1A0A] text-white font-semibold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all text-base text-center"
      >
        Trouver une table →
      </a>
    </div>
  );
}
