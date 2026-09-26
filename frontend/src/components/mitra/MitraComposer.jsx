import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import BHIVButton from '../ui/BHIVButton.jsx';

/**
 * MitraComposer — Accessible message composer for MITRA Companion
 */
const MitraComposer = ({
  onSend,
  disabled = false,
  placeholder = 'Ask MITRA anything...'
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea up to max 120px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="mitra-composer" onSubmit={handleSubmit} role="search" aria-label="Message MITRA">
      <label htmlFor="mitra-chat-input" className="sr-only">
        Message MITRA Companion
      </label>
      <div className="mitra-composer__input-wrapper">
        <textarea
          id="mitra-chat-input"
          ref={textareaRef}
          className="mitra-composer__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Message MITRA Companion"
        />
        <BHIVButton
          type="submit"
          variant="primary"
          size="sm"
          disabled={disabled || !text.trim()}
          aria-label="Send message to MITRA"
          className="mitra-composer__send-btn"
        >
          {disabled ? (
            <span className="mitra-composer__loading-dot" aria-hidden="true">⋯</span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </BHIVButton>
      </div>
      <div className="mitra-composer__hint">
        <span>Press <kbd>Enter ↵</kbd> to send, <kbd>Shift + Enter</kbd> for new line</span>
      </div>
    </form>
  );
};

MitraComposer.propTypes = {
  onSend: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string
};

export default MitraComposer;
