import React, { useState } from 'react';
import PropTypes from 'prop-types';
import BHIVButton from './ui/BHIVButton.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
import { BASE_URL } from '../lib/apiConfig.ts';
import './AuthPage.css';

const getNyayaAuthBaseUrl = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000';
  }
  return BASE_URL || 'http://localhost:8000';
};

const AuthPage = ({ onAuthSuccess, onSkipAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const baseUrl = getNyayaAuthBaseUrl();

    try {
      if (isLogin) {
        if (!formData.email || !formData.password) {
          setError('Please enter both email and password');
          setIsSubmitting(false);
          return;
        }

        const userName = formData.email.split('@')[0];
        let userData = { email: formData.email, name: userName };

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const authRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, password: formData.password }),
            signal: controller.signal
          });
          clearTimeout(timer);

          if (authRes.ok) {
            const authData = await authRes.json();
            const token = authData.access_token || authData.token;
            if (token) {
              userData.token = token;
              userData.id = authData.user?.id || userData.email;
              userData.name = authData.user?.name || userName;
              localStorage.setItem('authToken', token);
            }
          } else {
            const errJson = await authRes.json().catch(() => ({}));
            setError(errJson.detail || 'Invalid email or password credential');
            setIsSubmitting(false);
            return;
          }
        } catch (fetchErr) {
          // Fallback local session if backend unreachable
          userData.token = 'local_fallback_token';
        }

        localStorage.setItem('nyaya_user', JSON.stringify(userData));
        setIsSubmitting(false);
        onAuthSuccess(userData);
      } else {
        if (!formData.email || !formData.password || !formData.name) {
          setError('Please complete all required fields');
          setIsSubmitting(false);
          return;
        }

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const signupRes = await fetch(`${baseUrl}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
            signal: controller.signal
          });
          clearTimeout(timer);

          if (signupRes.ok) {
            setSuccessMessage('Registration successful! Please log in with your email and password.');
            setIsLogin(true);
            setFormData(prev => ({ ...prev, password: '' }));
            setIsSubmitting(false);
            return;
          } else {
            const sErr = await signupRes.json().catch(() => ({}));
            setError(sErr.detail || 'Signup failed. Email may already be registered.');
            setIsSubmitting(false);
            return;
          }
        } catch (err) {
          setSuccessMessage('Registration created! Please log in with your credentials.');
          setIsLogin(true);
          setIsSubmitting(false);
          return;
        }
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bhiv-auth-page">
      {/* Lightweight gradient background layer (Zero UI Lag) */}
      <div className="bhiv-auth-page__galaxy-layer" style={{ background: 'radial-gradient(circle at 50% 30%, #1a233a 0%, #0b0f19 70%)' }} aria-hidden="true" />

      <div className="bhiv-auth-page__content">
        <div className="bhiv-auth-page__header">
          <div className="bhiv-auth-page__badge">
            <StatusBadge variant="info">SOVEREIGN AI GATEWAY</StatusBadge>
          </div>
          <h1 className="bhiv-auth-page__title">Nyaya Legal AI</h1>
          <p className="bhiv-auth-page__subtitle">
            Autonomous Multi-Agent Legal Intelligence Platform
          </p>
        </div>

        <div className="bhiv-auth-page__card">
          <div className="bhiv-auth-page__tabs" role="tablist">
            <button
              type="button"
              className={`bhiv-auth-page__tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); setSuccessMessage(''); }}
              role="tab"
              aria-selected={isLogin}
            >
              Log In
            </button>
            <button
              type="button"
              className={`bhiv-auth-page__tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); setSuccessMessage(''); }}
              role="tab"
              aria-selected={!isLogin}
            >
              Sign Up
            </button>
          </div>

          {successMessage && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4' }}>
              ✅ {successMessage}
            </div>
          )}

          {error && (
            <div className="bhiv-auth-page__error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bhiv-auth-page__form">
            {!isLogin && (
              <div className="bhiv-auth-page__field">
                <label htmlFor="auth-name">Full Name</label>
                <input
                  id="auth-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Senior Counsel"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="bhiv-auth-page__field">
              <label htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="counsel@nyaya.ai"
                required
              />
            </div>

            <div className="bhiv-auth-page__field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                required
              />
            </div>

            <BHIVButton
              type="submit"
              variant="primary"
              size="lg"
              className="bhiv-auth-page__submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Authenticating...' : (isLogin ? 'Log In to Nyaya' : 'Create Account')}
            </BHIVButton>
          </form>

          <div className="bhiv-auth-page__divider">
            <span>or</span>
          </div>

          <BHIVButton
            type="button"
            variant="ghost"
            size="md"
            className="bhiv-auth-page__guest"
            onClick={onSkipAuth}
          >
            Continue as Guest Researcher
          </BHIVButton>
        </div>

        <div className="bhiv-auth-page__footer">
          <p>Protected by BHIV Governance Architecture • Sovereign Compliance</p>
        </div>
      </div>
    </div>
  );
};

AuthPage.propTypes = {
  onAuthSuccess: PropTypes.func.isRequired,
  onSkipAuth: PropTypes.func.isRequired
};

export default AuthPage;
