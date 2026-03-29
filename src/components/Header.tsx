import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartSidebar from './CartSidebar';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { user } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 200);
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setCartOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  return (
    <>
      <header>
        <Link className="logo" to="/" aria-label="Повернутись на головну">
          <img src="/images/shop-icon.png" className="logo-img" alt="logo" />
          Come by
        </Link>

        <nav className={`nav-center${navOpen ? ' active' : ''}`} id="nav">
          <Link to="/" onClick={() => setNavOpen(false)}>Головна</Link>
          <Link to="/menu" onClick={() => setNavOpen(false)}>Меню</Link>
          <Link to="/shop" onClick={() => setNavOpen(false)}>Магазин</Link>
          <Link to="/combo" onClick={() => setNavOpen(false)}>Комбо</Link>
          <Link to="/about-us" onClick={() => setNavOpen(false)}>Про нас</Link>
        </nav>

        <div className="icons">
          <div className="search-icon" id="search-btn" onClick={(e) => { e.stopPropagation(); setSearchOpen(o => !o); }}>
            <img src="/images/search.png" width={24} alt="search" />
            <div className={`search-box${searchOpen ? ' active' : ''}`} id="search-box">
              <form onSubmit={handleSearch}>
                <input
                  ref={searchRef}
                  id="search-input"
                  type="text"
                  placeholder="Пошук..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
              </form>
            </div>
          </div>

          <div className="icons-shopping" style={{ position: 'relative' }} onClick={() => setCartOpen(o => !o)}>
            <img src="/images/shopping-cart.png" width={24} alt="cart" />
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 0, background: '#009956', color: '#fff', borderRadius: '50%', fontSize: '0.6rem', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {cartCount}
              </span>
            )}
          </div>

          <div className="icons-user">
            <Link to={user ? '/account' : '/login'} id="user-link">
              <img src="/images/user.png" width={24} alt="user" />
            </Link>
          </div>

          <ThemeToggle />

          <div className="burger" id="burger" onClick={() => setNavOpen(o => !o)}>
            <img src="/images/burger-icon.png" width={24} alt="menu" />
          </div>
        </div>
      </header>

      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
