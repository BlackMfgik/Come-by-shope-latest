"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import CartSidebar from "./CartSidebar";
import ThemeToggle from "./ThemeToggle";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  SearchIcon,
} from "./ui/input-group";

const CART_SEARCH_PAGES = ["/", "/menu", "/shop", "/combo"];

const NAV_LINKS = [
  { href: "/", label: "Головна" },
  { href: "/menu", label: "Меню" },
  { href: "/shop", label: "Магазин" },
  { href: "/combo", label: "Комбо" },
  { href: "/about-us", label: "Про нас" },
];

export default function Header() {
  const { user } = useAuthStore();
  const { items } = useCartStore();
  const router = useRouter();
  const pathname = usePathname();
  const showCartSearch = CART_SEARCH_PAGES.includes(pathname);
  // Task 10: hide user icon on /account page
  const isAccountPage = pathname === "/account";

  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setCartOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".header-search-wrapper")) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  return (
    <>
      <header>
        <Link className="logo" href="/" aria-label="Повернутись на головну">
          <img src="/images/shop-icon.png" className="logo-img" alt="logo" />
          Come by
        </Link>

        {/* Task 12: Nav center with active state via usePathname */}
        <nav className={`nav-center${navOpen ? " active" : ""}`} id="nav">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setNavOpen(false)}
                className={isActive ? "nav-link-active" : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="icons">
          {showCartSearch && (
            <div className="header-search-wrapper">
              <div
                className={`header-search-popup${searchOpen ? " active" : ""}`}
              >
                <form onSubmit={handleSearch}>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <SearchIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      ref={inputRef}
                      id="search-input"
                      type="text"
                      placeholder="Пошук..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <InputGroupAddon align="inline-end">
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-3)",
                            display: "flex",
                            alignItems: "center",
                            padding: 0,
                          }}
                          aria-label="Очистити пошук"
                        >
                          ✕
                        </button>
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </form>
              </div>

              <button
                className="header-search-toggle"
                id="search-btn"
                aria-label="Відкрити пошук"
                onClick={() => setSearchOpen((o) => !o)}
              >
                <Search size={24} />
              </button>
            </div>
          )}

          {showCartSearch && (
            <div
              className="icons-shopping"
              style={{ position: "relative" }}
              onClick={() => setCartOpen((o) => !o)}
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "#009956",
                    color: "#fff",
                    borderRadius: "50%",
                    fontSize: "0.6rem",
                    width: 16,
                    height: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    pointerEvents: "none",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </div>
          )}

          {/* Task 10: hide user link on /account page */}
          {!isAccountPage && (
            <Link
              className="icons-user"
              href={user ? "/account" : "/login"}
              id="user-link"
              aria-label="Акаунт"
            >
              <User size={24} />
            </Link>
          )}

          <ThemeToggle />
        </div>

        <div
          className="burger"
          id="burger"
          onClick={() => setNavOpen((o) => !o)}
        >
          <Menu size={24} />
        </div>
      </header>

      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
