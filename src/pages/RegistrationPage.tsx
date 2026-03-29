import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRegister } from '../api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function RegistrationPage() {
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Введіть email і пароль'); return; }
    try {
      const data = await apiRegister(email, password);
      saveAuth(data.token, data.user);
      navigate('/shop');
    } catch (err: any) {
      setError(err.message || 'Помилка реєстрації');
    }
  }

  return (
    <>
      <Header />
      <main className="register-section">
        <div className="register-box">
          <form id="registerForm" onSubmit={handleSubmit}>
            <input type="email" id="regEmail" placeholder="Адреса електронної пошти" required
              value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" id="regPassword" placeholder="Пароль" required
              value={password} onChange={e => setPassword(e.target.value)} />
            {error && <p style={{ color: '#c0392b', margin: '4px 0' }}>{error}</p>}
            <button className="register-button" type="submit">Зареєструватися</button>
            <div className="google-login">
              <button id="google-login-btn" type="button">
                <img src="/images/google-icon.png" alt="Google" />
                Увійти через Google
              </button>
            </div>
          </form>
          <div className="links">
            <a href="#">Забули пароль?</a>
            <Link to="/login">Вхід</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
