"use client";

import Link from "next/link";
import BaseModal from "./BaseModal";
import type { ProfileGap } from "@/lib/profileCheck";

const GAP_ICONS: Record<ProfileGap["key"], React.ReactNode> = {
  phone: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  address: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  card: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
};

interface Props {
  gaps: ProfileGap[];
  onClose: () => void;
}

export default function IncompleteProfileModal({ gaps, onClose }: Props) {
  return (
    <BaseModal onClose={onClose} aria-labelledby="incomplete-profile-title">
      {/* Заголовок */}
      <div style={{ paddingRight: "calc(32px * var(--scale))" }}>
        <h2
          id="incomplete-profile-title"
          style={{
            margin: 0,
            fontSize: "calc(1.2rem * var(--scale))",
            fontWeight: 700,
            color: "var(--text)",
            lineHeight: 1.3,
          }}
        >
          Профіль не заповнено
        </h2>
        <p
          style={{
            margin: "calc(6px * var(--scale)) 0 0",
            fontSize: "calc(0.85rem * var(--scale))",
            color: "var(--text-2)",
          }}
        >
          Щоб оформити замовлення, потрібно заповнити:
        </p>
      </div>

      {/* Список прогалин */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "calc(8px * var(--scale))",
        }}
      >
        {gaps.map((gap) => (
          <div
            key={gap.key}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "calc(12px * var(--scale))",
              background: "var(--surface-2)",
              border: "1px solid var(--border-2)",
              borderRadius: "var(--radius)",
              padding: "calc(12px * var(--scale)) calc(14px * var(--scale))",
            }}
          >
            {/* Іконка */}
            <span
              aria-hidden="true"
              style={{
                flexShrink: 0,
                width: "calc(34px * var(--scale))",
                height: "calc(34px * var(--scale))",
                borderRadius: "50%",
                background: "var(--surface-3)",
                border: "1px solid var(--border-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
                marginTop: "calc(1px * var(--scale))",
              }}
            >
              {GAP_ICONS[gap.key]}
            </span>

            {/* Текст */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "calc(2px * var(--scale))",
              }}
            >
              <strong
                style={{
                  fontSize: "calc(0.88rem * var(--scale))",
                  fontWeight: 700,
                  color: "var(--text)",
                  lineHeight: 1.4,
                }}
              >
                {gap.label}
              </strong>
              <span
                style={{
                  fontSize: "calc(0.78rem * var(--scale))",
                  color: "var(--text-2)",
                  lineHeight: 1.4,
                }}
              >
                {gap.hint}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Кнопки */}
      <div
        style={{
          display: "flex",
          gap: "calc(10px * var(--scale))",
          justifyContent: "flex-end",
          paddingTop: "calc(4px * var(--scale))",
        }}
      >
        <button className="order-btn secondary" onClick={onClose} type="button">
          Закрити
        </button>
        <Link
          href="/account"
          className="order-btn primary"
          onClick={onClose}
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Заповнити профіль
        </Link>
      </div>
    </BaseModal>
  );
}

// потрібен для SVG JSX
import React from "react";
