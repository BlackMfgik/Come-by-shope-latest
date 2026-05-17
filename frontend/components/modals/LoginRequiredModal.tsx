"use client";

import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import BaseModal from "./BaseModal";

interface Props {
  onClose: () => void;
}

export default function LoginRequiredModal({ onClose }: Props) {
  const router = useRouter();

  function goLogin() {
    onClose();
    router.push("/login");
  }

  return (
    <BaseModal
      onClose={onClose}
      maxWidth={360}
      aria-labelledby="login-required-title"
    >
      <div style={{ textAlign: "center" }}>
        <div className="modal-icon-wrap modal-icon-accent">
          <LogIn size={28} color="var(--accent, #009956)" />
        </div>
        <h3 id="login-required-title" style={{ margin: 0 }}>
          Увійдіть в акаунт
        </h3>
        <p className="modal-subtitle">
          Щоб оформити замовлення, потрібно спочатку увійти або зареєструватись~
        </p>
        <div className="modal-buttons">
          <button className="btn btn-primary" onClick={goLogin}>
            Увійти
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Скасувати
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
