import React from 'react';
import PropTypes from 'prop-types';
import { Sparkles } from 'lucide-react';
import BHIVButton from '../ui/BHIVButton.jsx';
import DeveloperDetails from '../ui/DeveloperDetails.jsx';

/**
 * Format basic text formatting safely:
 * - Bold (**text**)
 * - Bullet lists (- or * )
/**
 * Parse inline formatting: **bold** and `code`
 */
function renderMarkdownInline(text) {
  if (!text) return null;

  const parts = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    let earliest = null;
    if (boldMatch && codeMatch) {
      earliest = boldMatch.index < codeMatch.index ? { type: 'bold', match: boldMatch } : { type: 'code', match: codeMatch };
    } else if (boldMatch) {
      earliest = { type: 'bold', match: boldMatch };
    } else if (codeMatch) {
      earliest = { type: 'code', match: codeMatch };
    }

    if (!earliest) {
      parts.push(<span key={keyIdx++}>{remaining}</span>);
      break;
    }

    const matchIndex = earliest.match.index;
    if (matchIndex > 0) {
      parts.push(<span key={keyIdx++}>{remaining.slice(0, matchIndex)}</span>);
    }

    if (earliest.type === 'bold') {
      parts.push(<strong key={keyIdx++}>{earliest.match[1]}</strong>);
    } else {
      parts.push(
        <code key={keyIdx++} className="mitra-inline-code">
          {earliest.match[1]}
        </code>
      );
    }

    remaining = remaining.slice(matchIndex + earliest.match[0].length);
  }

  return parts.length > 0 ? parts : null;
}

/**
 * Parses markdown text supporting:
 * - Fenced code blocks (```)
 * - Markdown tables (| col | col |)
 * - Bullet lists (- or *)
 * - Paragraphs with bold and inline code
 */
function renderFormattedContent(text) {
  if (!text) return null;

  const rawLines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Fenced code block check
    if (trimmed.startsWith('```')) {
      const codeLines = [];
      const lang = trimmed.slice(3).trim();
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++; // Skip closing ```
      elements.push(
        <pre key={`code_${i}`} className="mitra-code-block" data-lang={lang || undefined}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // 2. Markdown table check
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      const tableLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .slice(1, -1)
          .split('|')
          .map(c => c.trim());

        // Check if second line is separator like |---|---|
        const isSeparator = /^\|?(\s*:?-+:?\s*\|?)+$/.test(tableLines[1]);
        const startRowIdx = isSeparator ? 2 : 1;

        const bodyRows = tableLines.slice(startRowIdx).map(r =>
          r.slice(1, -1).split('|').map(c => c.trim())
        );

        elements.push(
          <div key={`table_${i}`} className="mitra-table-container">
            <table className="mitra-markdown-table">
              <thead>
                <tr>
                  {headerCells.map((h, hIdx) => (
                    <th key={hIdx}>{renderMarkdownInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{renderMarkdownInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 3. Bullet lists
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    if (isBullet) {
      const content = trimmed.replace(/^[-*]\s+/, '');
      elements.push(
        <div key={`bullet_${i}`} className="mitra-bullet-item">
          <span className="mitra-bullet-dot" aria-hidden="true">•</span>
          <span className="mitra-bullet-text">{renderMarkdownInline(content)}</span>
        </div>
      );
      i++;
      continue;
    }

    // 4. Regular paragraph
    if (trimmed.length > 0) {
      elements.push(
        <p key={`p_${i}`} className="mitra-message-paragraph">
          {renderMarkdownInline(line)}
        </p>
      );
    } else {
      // Empty line / spacer
      elements.push(<div key={`space_${i}`} className="mitra-line-spacer" />);
    }
    i++;
  }

  return elements;
}

/**
 * MitraMessage — Individual message item
 */
const MitraMessage = ({
  message,
  onRetry,
  onActionClick
}) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`mitra-message-row ${isUser ? 'mitra-message-row--user' : 'mitra-message-row--mitra'}`}>
      <div className={`mitra-message-bubble ${isUser ? 'mitra-message-bubble--user' : 'mitra-message-bubble--mitra'} ${isError ? 'mitra-message-bubble--error' : ''}`}>
        
        {/* Author / Origin indicator */}
        <div className="mitra-message-meta">
          <span className="mitra-message-author">
            {isUser ? 'You' : 'MITRA'}
          </span>
          {message.intent && message.intent !== 'general' && !isUser && (
            <span className="mitra-intent-tag">
              {message.intent}
            </span>
          )}
          {time && <span className="mitra-message-time">{time}</span>}
        </div>

        {/* Message body */}
        <div className="mitra-message-content">
          {renderFormattedContent(message.text)}
        </div>

        {/* Error Retry Option */}
        {isError && onRetry && (
          <div className="mitra-message-actions">
            <BHIVButton
              variant="secondary"
              size="sm"
              onClick={onRetry}
            >
              Retry
            </BHIVButton>
          </div>
        )}

        {/* Developer Diagnostics (Sanitized: NO tokens, NO keys) */}
        {message.developerDetails && (
          <div className="mitra-message-diagnostic">
            <DeveloperDetails title="Diagnostic Info" defaultExpanded={false}>
              <pre className="mitra-diagnostic-pre">
                {JSON.stringify(message.developerDetails, null, 2)}
              </pre>
            </DeveloperDetails>
          </div>
        )}

        {/* Suggested Action Chips */}
        {message.suggestedActions && message.suggestedActions.length > 0 && !isUser && (
          <div className="mitra-suggested-actions">
            {message.suggestedActions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                className="mitra-action-chip"
                onClick={() => onActionClick?.(action)}
              >
                <Sparkles size={12} className="mitra-action-chip__icon" aria-hidden="true" />
                <span>{action}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

MitraMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    role: PropTypes.oneOf(['user', 'mitra', 'system']).isRequired,
    text: PropTypes.string.isRequired,
    intent: PropTypes.string,
    timestamp: PropTypes.string,
    isError: PropTypes.bool,
    suggestedActions: PropTypes.arrayOf(PropTypes.string),
    developerDetails: PropTypes.object
  }).isRequired,
  onRetry: PropTypes.func,
  onActionClick: PropTypes.func
};

export default MitraMessage;
