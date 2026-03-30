import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import ShopPage from "./pages/ShopPage";
import ComboPage from "./pages/ComboPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import AccountPage from "./pages/AccountPage";
import "./styles.css";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/combo" element={<ComboPage />} />
              <Route path="/about-us" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registration" element={<RegistrationPage />} />
              <Route path="/account" element={<AccountPage />} />
              {/* Legacy HTML links redirect */}
              <Route path="/main.html" element={<Navigate to="/" replace />} />
              <Route
                path="/menu.html"
                element={<Navigate to="/menu" replace />}
              />
              <Route
                path="/shop.html"
                element={<Navigate to="/shop" replace />}
              />
              <Route
                path="/combo.html"
                element={<Navigate to="/combo" replace />}
              />
              <Route
                path="/about-us.html"
                element={<Navigate to="/about-us" replace />}
              />
              <Route
                path="/login.html"
                element={<Navigate to="/login" replace />}
              />
              <Route
                path="/registration.html"
                element={<Navigate to="/registration" replace />}
              />
              <Route
                path="/user.html"
                element={<Navigate to="/account" replace />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
