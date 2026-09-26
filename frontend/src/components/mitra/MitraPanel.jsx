import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Shield } from 'lucide-react';
import MitraStatus from './MitraStatus.jsx';
import MitraMessageList from './MitraMessageList.jsx';
import MitraComposer from './MitraComposer.jsx';
import BHIVButton from '../ui/BHIVButton.jsx';
import mitraApi from '../../services/mitraApi.js';
import './Mitra.css';

/**
 * MitraPanel — Interactive slide-out companion drawer adhering to the BHIV Design System
 * Connected to live POST /api/companion/chat endpoint.
 */
const MitraPanel = ({
  isOpen = false,
  onClose,
  user = null
}) => {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('IDLE'); // 'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'
  const [sessionId, setSessionId] = useState(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState(null);

  const panelRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Check if current user is an authenticated user or guest without credentials
  const isGuestSession = !user || user.isGuest || user.email === 'guest@nyaya.ai';
  // Has token check (e.g. if user is authenticated with a token)
  const hasAuthToken = Boolean(
    user?.token ||
    (typeof localStorage !== 'undefined' && (
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('nyaya_token') ||
      (() => {
        try {
          const u = JSON.parse(localStorage.getItem('nyaya_user') || '{}');
          return u.token || u.jwt || null;
        } catch {
          return null;
        }
      })()
    ))
  );

  // Keyboard navigation & accessibility focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      // Focus panel or input when opened
      const timer = setTimeout(() => {
        const inputEl = panelRef.current?.querySelector('#mitra-chat-input');
        if (inputEl) {
          inputEl.focus();
        } else {
          panelRef.current?.focus();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose?.();
          return;
        }

        if (e.key === 'Tab' && panelRef.current) {
          const focusableElements = panelRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            const first = focusableElements[0];
            const last = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  const handleSendMessage = useCallback(async (text) => {
    if (!text || !text.trim() || status === 'SENDING') return;

    const userMessageId = `user_${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setStatus('SENDING');
    setLastFailedPrompt(null);

    // If guest mode has no valid MITRA credentials, handle explicitly without fabricating fake identities
    if (isGuestSession && !hasAuthToken) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `mitra_guest_${Date.now()}`,
            role: 'mitra',
            text: 'MITRA requires an authenticated session to execute sovereign capabilities and record conversational memory across BHIV.\n\nPlease log in to your authenticated NYAI account to consult MITRA directly.',
            intent: 'auth_required',
            timestamp: new Date().toISOString(),
            isError: false,
            suggestedActions: []
          }
        ]);
        setStatus('IDLE');
      }, 300);
      return;
    }

    try {
      const response = await mitraApi.sendMessage({
        message: text.trim(),
        user,
        sessionId,
        activeApp: 'nyai'
      });

      if (response.sessionId) {
        setSessionId(response.sessionId);
      }

      const mitraMsg = {
        id: `mitra_${Date.now()}`,
        role: 'mitra',
        text: response.text,
        intent: response.intent,
        timestamp: response.timestamp || new Date().toISOString(),
        suggestedActions: response.suggestedActions || [],
        capabilityResult: response.capabilityResult,
        traceId: response.traceId
      };

      setMessages(prev => [...prev, mitraMsg]);
      setStatus('SUCCESS');
    } catch (err) {
      setLastFailedPrompt(text.trim());
      setStatus('ERROR');

      const isAuthError = err.message && (err.message.includes('401') || err.message.includes('Authentication failed'));
      const errorText = isAuthError
        ? 'MITRA session authentication failed. Please re-authenticate your session or verify credentials.'
        : 'MITRA is temporarily unavailable. Please try again shortly.';

      setMessages(prev => [
        ...prev,
        {
          id: `mitra_err_${Date.now()}`,
          role: 'mitra',
          text: errorText,
          timestamp: new Date().toISOString(),
          isError: true,
          developerDetails: {
            status: 'ERROR',
            errorMessage: err.message,
            timestamp: new Date().toISOString(),
            endpoint: '/api/companion/chat'
          }
        }
      ]);
    }
  }, [status, isGuestSession, hasAuthToken, user, sessionId]);

  const handleRetry = () => {
    if (lastFailedPrompt) {
      handleSendMessage(lastFailedPrompt);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setStatus('IDLE');
    setSessionId(null);
    setLastFailedPrompt(null);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="mitra-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mitra-panel-title"
    >
      <div
        ref={panelRef}
        className="mitra-drawer"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <header className="mitra-header">
          <div className="mitra-title-group">
            <span className="mitra-icon" aria-hidden="true">
              <Shield size={20} strokeWidth={1.75} />
            </span>
            <div>
              <div className="mitra-title-row">
                <h2 id="mitra-panel-title" className="mitra-title">
                  MITRA Companion
                </h2>
                <MitraStatus status={status} />
              </div>
              <span className="mitra-subtitle">BHIV Sovereign AI Companion</span>
            </div>
          </div>

          <div className="mitra-header-actions">
            {messages.length > 0 && (
              <BHIVButton
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                title="Clear current conversation"
                aria-label="Clear conversation history"
              >
                Clear
              </BHIVButton>
            )}
            <button
              type="button"
              className="mitra-close-btn"
              onClick={onClose}
              aria-label="Close MITRA Companion"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        {/* Guest warning banner if applicable */}
        {isGuestSession && !hasAuthToken && (
          <div className="mitra-guest-notice" role="alert">
            <span className="mitra-guest-notice__icon" aria-hidden="true">ℹ️</span>
            <div className="mitra-guest-notice__text">
              <strong>Guest Session</strong>: Full MITRA memory & sovereign capabilities require an authenticated account.
            </div>
          </div>
        )}

        {/* Message Transcript Area */}
        <div className="mitra-body">
          <MitraMessageList
            messages={messages}
            isSending={status === 'SENDING'}
            onRetry={handleRetry}
            onActionClick={handleSendMessage}
            userName={user?.name || user?.email?.split('@')[0] || 'Advocate'}
          />
        </div>

        {/* Message Composer Footer */}
        <footer className="mitra-footer">
          <MitraComposer
            onSend={handleSendMessage}
            disabled={status === 'SENDING'}
            placeholder={
              isGuestSession && !hasAuthToken
                ? 'Sign in to chat with MITRA...'
                : 'Message MITRA companion...'
            }
          />
        </footer>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

MitraPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object
};

export default MitraPanel;
