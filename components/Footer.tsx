// Server Component — no 'use client' needed, accordion is CSS-only via <details>
import { Instagram, ChevronDown } from "lucide-react";

export default function Footer() {
  return (
    <footer>
      <div className="footer-content">
        {/* Brand + social */}
        <div className="footer-logo">
          <div className="footer-logo-row">
            <img src="/images/shop-icon.png" width={28} alt="logo" />
            <span className="footer-brand">Come by</span>
          </div>
          <p className="footer-desc">
            Найкращі продукти та страви з доставкою до дверей. Замовляйте онлайн
            та насолоджуйтесь якістю.
          </p>
          <div className="footer-social">
            <a href="#" aria-label="Instagram">
              <Instagram size={20} />
            </a>
          </div>
        </div>

        {/* Contacts — <details> is accordion on mobile, always visible on desktop */}
        <details className="footer-contacts">
          <summary>
            <b>Контакти</b>
            <ChevronDown
              size={14}
              className="footer-chevron"
              aria-hidden="true"
            />
          </summary>
          <ul>
            <li>Телефон:</li>
            <li>Email:</li>
            <li>Адреса:</li>
          </ul>
        </details>
      </div>
      <div className="footer-bottom">© 2025 Come by. Всі права захищено.</div>
    </footer>
  );
}
