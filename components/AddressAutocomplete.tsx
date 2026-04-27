"use client";

import { useEffect, useRef, useState } from "react";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  onPlaceSelected: (place: PlaceResult) => void;
  className?: string;
  placeholder?: string;
}

export default function AddressAutocomplete({ onPlaceSelected, className, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?format=json&q=${encodeURIComponent(value)}&countrycodes=fr&limit=5`;
        const res = await fetch(url, {
          headers: {
            "Accept-Language": "fr",
            "User-Agent": "Repation/1.0 (contact via repation.fr)",
          },
        });
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function handleSelect(result: NominatimResult) {
    setQuery(result.display_name);
    setSuggestions([]);
    setOpen(false);
    onPlaceSelected({
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder ?? "12 rue de la Paix, Paris"}
        className={className}
        autoComplete="off"
      />

      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300 pointer-events-none">
          chargement…
        </span>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i} className={i > 0 ? "border-t border-gray-50" : ""}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-[#1D9E75]/10 hover:text-[#1D9E75] transition-colors leading-snug"
              >
                {s.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
