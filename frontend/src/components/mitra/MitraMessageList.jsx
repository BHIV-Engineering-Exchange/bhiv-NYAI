import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Shield } from 'lucide-react';
import MitraMessage from './MitraMessage.jsx';

/**
 * MitraMessageList — Displays conversation history with auto-scroll and status indicators
 */
const MitraMessageList = ({
  messages = [],
  isSending = false,
  onRetry,
  onActionClick,
  userName = 'User'
}) => {
  const bottomRef = useRef(null);
  const isInitialMount = useRef(true);

  // Auto-scroll to bottom only when new user/assistant messages arrive or during sending
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending]);

  const defaultGreeting = `Hello ${userName || 'there'}. I am MITRA, your autonomous AI companion across the BHIV sovereign intelligence ecosystem. How can I assist your legal, procedural, or operational workflows today?`;

  return (
    <div
      className="mitra-message-list"
      role="log"
      aria-live="polite"
      aria-label="MITRA conversation history"
    >
      {/* If empty, show genuine static welcome card */}
      {messages.length === 0 && (
        <div className="mitra-welcome-card" role="region" aria-label="MITRA Companion Overview">
          <div className="mitra-welcome-card__header">
            <span className="mitra-welcome-card__icon" aria-hidden="true">
              <Shield size={22} strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="mitra-welcome-card__title">MITRA Companion</h3>
              <span className="mitra-welcome-card__subtitle">BHIV Legal Intelligence Node</span>
            </div>
          </div>
          <p className="mitra-welcome-card__text">
            {defaultGreeting}
          </p>
          <div className="mitra-welcome-card__suggestions">
            <span className="mitra-welcome-card__suggestions-title">Suggested Consultations:</span>
            <div className="mitra-action-pills">
              {[
                'Summarize active case',
                'Check multi-jurisdiction rules',
                'Explain latest compliance update'
              ].map((action, i) => (
                <button
                  key={i}
                  type="button"
                  className="mitra-action-pill"
                  onClick={() => onActionClick && onActionClick(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Render conversation messages */}
      {messages.map((msg, index) => {
        const isLast = index === messages.length - 1;
        return (
          <MitraMessage
            key={msg.id || index}
            message={msg}
            onRetry={isLast && msg.isError ? onRetry : undefined}
            onActionClick={onActionClick}
          />
        );
      })}

      {/* Real-time sending indicator */}
      {isSending && (
        <div className="mitra-message-row mitra-message-row--mitra" aria-live="polite">
          <div className="mitra-message-bubble mitra-message-bubble--mitra mitra-message-bubble--thinking">
            <div className="mitra-message-meta">
              <span className="mitra-message-author">MITRA</span>
            </div>
            <div className="mitra-thinking-dots">
              <span className="mitra-dot" />
              <span className="mitra-dot" />
              <span className="mitra-dot" />
              <span className="mitra-thinking-text">Sending to MITRA...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  );
};

MitraMessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object),
  isSending: PropTypes.bool,
  onRetry: PropTypes.func,
  onActionClick: PropTypes.func,
  userName: PropTypes.string
};

export default MitraMessageList;
