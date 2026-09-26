import React from 'react';
import PropTypes from 'prop-types';
import { Globe } from 'lucide-react';
import GlassCard from './ui/GlassCard.jsx';
import StatusBadge from './ui/StatusBadge.jsx';

/**
 * BHIV Jurisdiction Information Bar
 * Presents sovereign judicial structure, framing, and emergency guidance.
 */
const JurisdictionInfoBar = ({
  country,
  courtSystem,
  authorityFraming,
  emergencyGuidance,
  legalFramework,
  limitationAct,
  constitution
}) => {
  if (!country && !courtSystem) {
    return null;
  }

  return (
    <GlassCard padding="normal" style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--bhiv-border-subtle, rgba(255, 255, 255, 0.08))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="var(--bhiv-primary-hover, #818cf8)" aria-hidden="true" />
          <h3 style={{
            fontFamily: 'var(--bhiv-font-heading)',
            fontSize: 'var(--bhiv-text-md, 1rem)',
            fontWeight: 'var(--bhiv-weight-semibold, 600)',
            color: 'var(--bhiv-text-primary, #f9fafb)',
            margin: 0
          }}>
            Jurisdiction Architecture
          </h3>
        </div>

        {country && (
          <StatusBadge variant="info" size="sm">
            {country}
          </StatusBadge>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {courtSystem && (
          <div>
            <div style={{
              fontFamily: 'var(--bhiv-font-body)',
              fontSize: 'var(--bhiv-text-xs, 0.75rem)',
              fontWeight: 'var(--bhiv-weight-semibold, 600)',
              color: 'var(--bhiv-text-secondary, #9ca3af)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px'
            }}>
              Court System
            </div>
            <p style={{
              fontFamily: 'var(--bhiv-font-body)',
              fontSize: 'var(--bhiv-text-sm, 0.875rem)',
              lineHeight: 'var(--bhiv-leading-normal, 1.5)',
              color: 'var(--bhiv-text-primary, #f9fafb)',
              margin: 0
            }}>
              {courtSystem}
            </p>
          </div>
        )}

        {authorityFraming && (
          <div>
            <div style={{
              fontFamily: 'var(--bhiv-font-body)',
              fontSize: 'var(--bhiv-text-xs, 0.75rem)',
              fontWeight: 'var(--bhiv-weight-semibold, 600)',
              color: 'var(--bhiv-text-secondary, #9ca3af)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px'
            }}>
              Authority Framing
            </div>
            <p style={{
              fontFamily: 'var(--bhiv-font-body)',
              fontSize: 'var(--bhiv-text-sm, 0.875rem)',
              lineHeight: 'var(--bhiv-leading-normal, 1.5)',
              color: 'var(--bhiv-text-primary, #f9fafb)',
              margin: 0
            }}>
              {authorityFraming}
            </p>
          </div>
        )}

        {emergencyGuidance && (
          <div>
            <div style={{
              fontFamily: 'var(--bhiv-font-body)',
              fontSize: 'var(--bhiv-text-xs, 0.75rem)',
              fontWeight: 'var(--bhiv-weight-semibold, 600)',
              color: 'var(--bhiv-text-secondary, #9ca3af)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px'
            }}>
              Emergency Guidance
            </div>
            <p style={{
              fontFamily: 'var(--bhiv-font-body)',
              fontSize: 'var(--bhiv-text-sm, 0.875rem)',
              lineHeight: 'var(--bhiv-leading-normal, 1.5)',
              color: 'var(--bhiv-text-primary, #f9fafb)',
              margin: 0
            }}>
              {emergencyGuidance}
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

JurisdictionInfoBar.propTypes = {
  country: PropTypes.string,
  courtSystem: PropTypes.string,
  authorityFraming: PropTypes.string,
  emergencyGuidance: PropTypes.string,
  legalFramework: PropTypes.string,
  limitationAct: PropTypes.string,
  constitution: PropTypes.string
};

export default JurisdictionInfoBar;