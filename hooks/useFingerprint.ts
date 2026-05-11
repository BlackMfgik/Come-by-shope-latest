"use client";

/**
 * hooks/useFingerprint.ts
 *
 * Генерує унікальний deviceId браузера через FingerprintJS.
 * Використовується при логіні — бекенд порівнює з відомими пристроями юзера.
 * Якщо пристрій невідомий → бекенд повертає requires_2fa: true.
 *
 * FingerprintJS Pro (платний) дає точніший fingerprint;
 * @fingerprintjs/fingerprintjs (безкоштовний) достатній для базового захисту.
 */
import { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

interface FingerprintResult {
  deviceId: string | null;
  loading: boolean;
}

// Кешуємо в модулі — не перераховуємо при кожному монтуванні
let cachedDeviceId: string | null = null;

export function useFingerprint(): FingerprintResult {
  const [deviceId, setDeviceId] = useState<string | null>(cachedDeviceId);
  const [loading, setLoading] = useState(!cachedDeviceId);

  useEffect(() => {
    if (cachedDeviceId) return;

    let cancelled = false;

    async function load() {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        if (!cancelled) {
          cachedDeviceId = result.visitorId;
          setDeviceId(result.visitorId);
        }
      } catch (err) {
        console.warn("[useFingerprint] Failed to get deviceId:", err);
        // Не блокуємо логін якщо FingerprintJS не спрацював
        if (!cancelled) setDeviceId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { deviceId, loading };
}
