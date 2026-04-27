"use client";

import { useState } from "react";

const categories = ["Tous", "Restaurant", "Brasserie", "Café", "Bar", "Fast-food"];

export default function SearchPanel() {
  const [selected, setSelected] = useState("Tous");
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
          className="w-full pl-12 pr-4 py-4 text-gray-800 placeholder-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent text-base transition-all"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelected(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selected === cat
                ? "bg-[#1D9E75] text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <a
        href="/recherche"
        className="block w-full bg-[#1D9E75] hover:bg-[#178560] text-white font-semibold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all text-base text-center"
      >
        Trouver une table →
      </a>
    </div>
  );
}
