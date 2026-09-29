import React, { useState, Suspense } from 'react';
import PropTypes from 'prop-types';
import Galaxy from './Galaxy.jsx';
import BHIVButton from './ui/BHIVButton.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
import { getMitraApiBaseUrl } from '../services/mitraApi.js';
import './AuthPage.css';

/**
 * Redesigned AuthPage
 * Clean BHIV design language, preserving all login/signup and guest mode state.
 */
const AuthPage = ({ onAuthSuccess, onSkipAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      if (isLogin) {
        if (formData.email && formData.password) {
          const userName = formData.email.split('@')[0];
          const userData = { email: formData.email, name: userName };

          // Seamless MITRA JWT exchange if credentials match backend
          try {
            const baseUrl = getMitraApiBaseUrl();
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3500);
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
                localStorage.setItem('authToken', token);
              }
            }
          } catch {
            // Standalone / offline fallback preserved
          }

          localStorage.setItem('nyaya_user', JSON.stringify(userData));
          onAuthSuccess(userData);
        } else {
          setError('Please enter both email and password');
          setIsSubmitting(false);
        }
      } else {
        if (formData.email && formData.password && formData.name) {
          const userData = { email: formData.email, name: formData.name };

          // Seamless MITRA signup exchange
          try {
            const baseUrl = getMitraApiBaseUrl();
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3500);
            const signupRes = await fetch(`${baseUrl}/auth/signup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
              signal: controller.signal
            });
            clearTimeout(timer);
            if (signupRes.ok) {
              const sData = await signupRes.json();
              const token = sData.access_token || sData.token;
              if (token) {
                userData.token = token;
                userData.id = sData.user?.id || userData.email;
                localStorage.setItem('authToken', token);
              }
            }
          } catch {
            // Standalone / offline fallback preserved
          }

          localStorage.setItem('nyaya_user', JSON.stringify(userData));
          onAuthSuccess(userData);
        } else {
          setError('Please complete all required fields');
          setIsSubmitting(false);
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
      {/* Background Galaxy */}
      <div className="bhiv-auth-page__galaxy-layer" aria-hidden="true">
        <Suspense fallback={<div style={{ width: '100%', height: '100%', background: '#0b0f19' }} />}>
          <Galaxy 
            mouseInteraction={false}
            density={0.5}
            glowIntensity={0.15}
            saturation={0}
            hueShift={200}
            twinkleIntensity={0.2}
            rotationSpeed={0.02}
            starSpeed={0.15}
            speed={0.4}
          />
        </Suspense>
      </div>

      {/* BHIV Auth Card */}
      <div className="bhiv-auth-card" role="region" aria-labelledby="auth-title">
        <div className="bhiv-auth-card__header">
          <div className="bhiv-auth-card__logo-group">
            <img src="/03.svg" alt="NYAI Logo" className="bhiv-auth-card__logo" />
            <div className="bhiv-auth-card__brand-text">
              <span className="bhiv-auth-card__brand-ecosystem">BHIV</span>
              <span className="bhiv-auth-card__brand-separator">/</span>
              <span id="auth-title">NYAI</span>
            </div>
          </div>
          <StatusBadge variant="info" size="sm">
            LEGAL INTELLIGENCE PLATFORM
          </StatusBadge>
          <p className="bhiv-auth-card__subtitle">
            Enterprise legal research & statutory reasoning OS
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bhiv-auth-card__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={isLogin}
            className={`bhiv-auth-card__tab-btn ${isLogin ? 'bhiv-auth-card__tab-btn--active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isLogin}
            className={`bhiv-auth-card__tab-btn ${!isLogin ? 'bhiv-auth-card__tab-btn--active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <div className="bhiv-auth-card__form-group">
              <label className="bhiv-auth-card__label" htmlFor="auth-name">
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Adv. Rajesh Sharma"
                autoComplete="name"
                className="bhiv-auth-card__input"
              />
            </div>
          )}

          <div className="bhiv-auth-card__form-group">
            <label className="bhiv-auth-card__label" htmlFor="auth-email">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@organization.com"
              autoComplete="email"
              required
              className="bhiv-auth-card__input"
            />
          </div>

          <div className="bhiv-auth-card__form-group">
            <label className="bhiv-auth-card__label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              className="bhiv-auth-card__input"
            />
          </div>

          {error && (
            <div className="bhiv-auth-card__error" role="alert">
              {error}
            </div>
          )}

          <BHIVButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
          >
            {isLogin ? 'Sign In to NYAI' : 'Create NYAI Account'}
          </BHIVButton>
        </form>

        <div className="bhiv-auth-card__footer">
          <div className="bhiv-auth-card__toggle-text">
            {isLogin ? "Don't have an account yet?" : "Already registered?"}
            <button
              type="button"
              className="bhiv-auth-card__toggle-link"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </div>

          <div className="bhiv-auth-card__guest-divider">
            <span>or evaluate platform</span>
          </div>

          <BHIVButton
            type="button"
            variant="ghost"
            size="md"
            fullWidth
            onClick={onSkipAuth}
          >
            Continue as Guest
          </BHIVButton>
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
