"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Suggestion {
  placeId: string;
  description: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: {
                input: string;
                language?: string;
                componentRestrictions?: { country: string };
              },
              callback: (
                predictions: Array<{ place_id: string; description: string }> | null,
                status: string,
              ) => void,
            ) => void;
          };
          PlacesServiceStatus: { OK: string };
        };
      };
    };
  }
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Введіть адресу",
  id,
  className,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<InstanceType<
    (typeof window)["google"]["maps"]["places"]["AutocompleteService"]
  > | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey) return;

    if (window.google?.maps?.places) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => setScriptLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=uk`;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize service after script is loaded
  useEffect(() => {
    if (scriptLoaded && window.google?.maps?.places) {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
    }
  }, [scriptLoaded]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(
    (input: string) => {
      if (!serviceRef.current || input.length < 3) {
        setSuggestions([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      serviceRef.current.getPlacePredictions(
        { input, language: "uk" },
        (predictions, status) => {
          setIsLoading(false);
          if (
            status === window.google?.maps?.places?.PlacesServiceStatus?.OK &&
            predictions
          ) {
            setSuggestions(
              predictions.slice(0, 5).map((p) => ({
                placeId: p.place_id,
                description: p.description,
              })),
            );
            setIsOpen(true);
          } else {
            setSuggestions([]);
            setIsOpen(false);
          }
        },
      );
    },
    [],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  function handleSelect(description: string) {
    onChange(description);
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

      {isLoading && value.length >= 3 && (
        <div className="address-autocomplete-dropdown">
          <div className="address-autocomplete-loading">Шукаємо…</div>
        </div>
      )}

      {isOpen && !isLoading && suggestions.length > 0 && (
        <div className="address-autocomplete-dropdown" role="listbox">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              className="address-autocomplete-item"
              role="option"
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s.description)}
            >
              {s.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
