/**
 * store/verificationStore.ts
 *
 * Зберігає стан верифікації між закриттями модалок.
 *
 * Сценарій: юзер відкрив "Змінити телефон", ввів номер, отримав SMS,
 * випадково закрив модалку — коли відкриє знову, побачить одразу крок OTP
 * (якщо код ще не протермінувався).
 *
 * Аналогічно для 2FA при логіні.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Типи ─────────────────────────────────────────────────────────────────────

/** Стан верифікації телефону */
export interface PhoneVerificationState {
  /** E.164 номер на який відправлено SMS: "+380XXXXXXXXX" або null */
  pendingPhone: string | null;
  /** Unix timestamp (ms) коли код протермінується */
  expiresAt: number | null;
  /** Чи вже на кроці OTP (код відправлено) */
  otpSent: boolean;
}

/** Стан 2FA при логіні */
export interface TwoFactorState {
  /** Email юзера що логіниться — для повторного відправлення */
  pendingEmail: string | null;
  /** Unix timestamp протермінування */
  expiresAt: number | null;
  /** Чи вже відправлено OTP */
  otpSent: boolean;
}

interface VerificationStore {
  phone: PhoneVerificationState;
  twoFactor: TwoFactorState;

  // Phone actions
  setPhoneOtpSent: (phone: string, ttlSeconds?: number) => void;
  clearPhoneVerification: () => void;

  // 2FA actions
  setTwoFactorOtpSent: (email: string, ttlSeconds?: number) => void;
  clearTwoFactor: () => void;
}

// ── Дефолтні стани ────────────────────────────────────────────────────────────

const DEFAULT_PHONE: PhoneVerificationState = {
  pendingPhone: null,
  expiresAt: null,
  otpSent: false,
};

const DEFAULT_2FA: TwoFactorState = {
  pendingEmail: null,
  expiresAt: null,
  otpSent: false,
};

const OTP_TTL_MS = (ttlSeconds: number) => ttlSeconds * 1000;

// ── Store ─────────────────────────────────────────────────────────────────────

export const useVerificationStore = create<VerificationStore>()(
  persist(
    (set) => ({
      phone: DEFAULT_PHONE,
      twoFactor: DEFAULT_2FA,

      setPhoneOtpSent: (phone, ttlSeconds = 120) =>
        set({
          phone: {
            pendingPhone: phone,
            expiresAt: Date.now() + OTP_TTL_MS(ttlSeconds),
            otpSent: true,
          },
        }),

      clearPhoneVerification: () => set({ phone: DEFAULT_PHONE }),

      setTwoFactorOtpSent: (email, ttlSeconds = 120) =>
        set({
          twoFactor: {
            pendingEmail: email,
            expiresAt: Date.now() + OTP_TTL_MS(ttlSeconds),
            otpSent: true,
          },
        }),

      clearTwoFactor: () => set({ twoFactor: DEFAULT_2FA }),
    }),
    {
      name: "verification-storage",
      // Зберігаємо тільки активні OTP сесії
      partialize: (state) => ({
        phone: state.phone,
        twoFactor: state.twoFactor,
      }),
    },
  ),
);

// ── Хелпери ───────────────────────────────────────────────────────────────────

/** Чи ще дійсний OTP код (не протермінувався) */
export function isOtpValid(expiresAt: number | null): boolean {
  if (!expiresAt) return false;
  return Date.now() < expiresAt;
}

/** Скільки секунд залишилось до закінчення OTP */
export function otpSecondsLeft(expiresAt: number | null): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}
