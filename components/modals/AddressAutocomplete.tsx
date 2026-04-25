"use client";

import { useState, useEffect, useRef } from "react";

interface Suggestion {
  id: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

// Kyiv's settlement ref in Nova Poshta DB
const KYIV_REF = "8d5a980d-391c-11dd-90d9-001a92567626";
const NP_API = "https://api.novaposhta.ua/v2.0/json/";

async function searchStreets(query: string): Promise<Suggestion[]> {
  const apiKey = process.env.NEXT_PUBLIC_NOVA_POSHTA_KEY;
  if (!apiKey) {
    console.warn(
      "[AddressAutocomplete] NEXT_PUBLIC_NOVA_POSHTA_KEY не вказаний",
    );
    return [];
  }

  const res = await fetch(NP_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey,
      modelName: "Address",
      calledMethod: "searchSettlementStreets",
      methodProperties: {
        StreetName: query,
        SettlementRef: KYIV_REF,
        Limit: "5",
      },
    }),
  });

  if (!res.ok) return [];

  const json = await res.json();

  // Nova Poshta response: { data: [{ Addresses: [...] }] }
  const addresses: Array<{ Present: string; SettlementStreetRef: string }> =
    json?.data?.[0]?.Addresses ?? [];

  return addresses.map((a) => ({
    id: a.SettlementStreetRef,
    label: a.Present, // e.g. "вул. Хрещатик, Київ"
  }));
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Введіть вулицю, Київ",
  id,
  className,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    setSuggestions([]);
    setIsOpen(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 3) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchStreets(val.trim());
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSuggestions([]);
    }
  }

  function handleSelect(label: string) {
    onChange(label);
    setSuggestions([]);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="address-autocomplete-wrapper">
      <input
        id={id}
        className={className ?? "modal-input"}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />

      {isLoading && value.trim().length >= 3 && (
        <div className="address-autocomplete-dropdown">
          <div className="address-autocomplete-loading">Шукаємо…</div>
        </div>
      )}

      {isOpen && !isLoading && suggestions.length > 0 && (
        <div className="address-autocomplete-dropdown" role="listbox">
          {suggestions.map((s) => (
            <button
              key={s.id}
              className="address-autocomplete-item"
              role="option"
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s.label)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
