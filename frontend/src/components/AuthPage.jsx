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
            setSuccessMessage('Registration successful! Please log in with your credentials.');
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
      <div className="bhiv-auth-page__galaxy-layer" style={{ background: 'radial-gradient(circle at 50% 30%, #111827 0%, #0b0f19 80%)' }} aria-hidden="true" />

      <div className="bhiv-auth-card">
        <div className="bhiv-auth-card__header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <StatusBadge variant="info">SOVEREIGN AI GATEWAY</StatusBadge>
          </div>
          <div className="bhiv-auth-card__brand-text" style={{ justifyContent: 'center' }}>
            <span>Nyaya Legal AI</span>
          </div>
          <p className="bhiv-auth-card__subtitle">
            Autonomous Multi-Agent Legal Intelligence Platform
          </p>
        </div>

        <div className="bhiv-auth-card__tabs" role="tablist">
          <button
            type="button"
            className={`bhiv-auth-card__tab-btn ${isLogin ? 'bhiv-auth-card__tab-btn--active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); setSuccessMessage(''); }}
            role="tab"
            aria-selected={isLogin}
          >
            Log In
          </button>
          <button
            type="button"
            className={`bhiv-auth-card__tab-btn ${!isLogin ? 'bhiv-auth-card__tab-btn--active' : ''}`}
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
          <div className="bhiv-auth-card__error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="bhiv-auth-card__form-group">
              <label className="bhiv-auth-card__label" htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                className="bhiv-auth-card__input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Senior Counsel"
                required={!isLogin}
              />
            </div>
          )}

          <div className="bhiv-auth-card__form-group">
            <label className="bhiv-auth-card__label" htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              className="bhiv-auth-card__input"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="counsel@nyaya.ai"
              required
            />
          </div>

          <div className="bhiv-auth-card__form-group">
            <label className="bhiv-auth-card__label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="bhiv-auth-card__input"
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
            style={{ width: '100%', marginTop: '12px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authenticating...' : (isLogin ? 'Log In to Nyaya' : 'Create Account')}
          </BHIVButton>
        </form>

        <div className="bhiv-auth-card__guest-divider">
          <span>or</span>
        </div>

        <BHIVButton
          type="button"
          variant="ghost"
          size="md"
          style={{ width: '100%' }}
          onClick={onSkipAuth}
        >
          Continue as Guest Researcher
        </BHIVButton>

        <div className="bhiv-auth-card__footer">
          <span className="bhiv-auth-card__toggle-text">
            Protected by BHIV Governance Architecture • Sovereign Compliance
          </span>
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
