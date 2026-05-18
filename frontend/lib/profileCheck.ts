import type { UserInfo } from "@/types";

export interface ProfileGap {
  key: "phone" | "address" | "card";
  label: string;
  hint: string;
}

/**
 * Повертає масив незаповнених обов'язкових полів профілю.
 * Порожній масив = профіль повний, можна оформлювати замовлення.
 */
export function getProfileGaps(user: UserInfo | null): ProfileGap[] {
  if (!user) return [];
  const gaps: ProfileGap[] = [];

  if (!user.phone || !user.phone_verified) {
    gaps.push({
      key: "phone",
      label: "Номер телефону",
      hint: "Додай та підтверди номер телефону через SMS",
    });
  }

  if (!user.address || user.address.trim() === "") {
    gaps.push({
      key: "address",
      label: "Адреса доставки",
      hint: "Вкажи адресу, на яку доставимо замовлення",
    });
  }

  if (!user.card_masked_pan) {
    gaps.push({
      key: "card",
      label: "Картка для оплати",
      hint: "Прив'яжи картку через WayForPay",
    });
  }

  return gaps;
}
