// Server Component — статичний контент, не потребує 'use client'
import { Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-logo">
          <img src="/images/shop-icon.png" width={32} alt="logo" />
          <span className="footer-brand">Come by</span>
          <p>
            Найкращі продукти та страви з доставкою до дверей. Замовляйте онлайн
            та насолоджуйтесь якістю.
          </p>
          <div className="footer-social">
            <a href="#">
              <Instagram size={24} />
            </a>
          </div>
        </div>
        <div className="footer-contacts">
          <b>Контакти</b>
          <ul>
            <li>Телефон:</li>
            <li>Email:</li>
            <li>Адреса:</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">© 2025 Come by. Всі права захищено.</div>
    </footer>
  );
}
