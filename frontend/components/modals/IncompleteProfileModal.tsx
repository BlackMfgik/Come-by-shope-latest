"use client";

import { useRouter } from "next/navigation";
import BaseModal from "./BaseModal";
import type { ProfileGap } from "@/lib/profileCheck";

const GAP_ICONS: Record<ProfileGap["key"], string> = {
  phone: "📱",
  address: "📍",
  card: "💳",
};

interface Props {
  gaps: ProfileGap[];
  onClose: () => void;
}

export default function IncompleteProfileModal({ gaps, onClose }: Props) {
  const router = useRouter();

  function handleGoToProfile() {
    onClose();
    router.push("/account");
  }

  return (
    <BaseModal onClose={onClose} aria-labelledby="incomplete-profile-title">
      <div className="incomplete-profile-modal">
        <div className="incomplete-profile-modal__header">
          <h2 id="incomplete-profile-title" className="incomplete-profile-modal__title">
            Профіль не заповнено
          </h2>
          <p className="incomplete-profile-modal__subtitle">
            Щоб оформити замовлення, потрібно заповнити:
          </p>
        </div>

        <ul className="incomplete-profile-modal__list">
          {gaps.map((gap) => (
            <li key={gap.key} className="incomplete-profile-modal__item">
              <span
                className="incomplete-profile-modal__icon"
                aria-hidden="true"
              >
                {GAP_ICONS[gap.key]}
              </span>
              <div className="incomplete-profile-modal__item-text">
                <strong className="incomplete-profile-modal__item-label">
                  {gap.label}
                </strong>
                <p className="incomplete-profile-modal__item-hint">
                  {gap.hint}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="incomplete-profile-modal__footer">
          <button
            className="order-btn secondary"
            onClick={onClose}
            type="button"
          >
            Закрити
          </button>
          <button
            className="order-btn primary"
            onClick={handleGoToProfile}
            type="button"
          >
            Заповнити профіль
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
