import React from 'react';
import PropTypes from 'prop-types';
import { Shield } from 'lucide-react';
import './Mitra.css';

/**
 * MitraLauncher — Accessible trigger button for the MITRA Platform Companion
 * Uses Lucide Shield icon instead of emoji for professional appearance.
 */
const MitraLauncher = ({
  onClick,
  isOpen = false,
  variant = 'default',
  badgeText = null
}) => {
  const isNavbar = variant === 'navbar';

  return (
    <button
      type="button"
      className={`mitra-launcher ${isNavbar ? 'mitra-launcher--navbar' : ''} ${isOpen ? 'mitra-launcher--active' : ''}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close MITRA Companion' : 'Open MITRA Companion'}
      aria-expanded={isOpen}
      title="MITRA Autonomous Companion — BHIV Sovereign Intelligence"
    >
      <span className="mitra-launcher__icon" aria-hidden="true">
        <Shield size={15} strokeWidth={2} />
      </span>
      <span className="mitra-launcher__label">MITRA</span>
      {badgeText && (
        <span className="mitra-launcher__badge">{badgeText}</span>
      )}
    </button>
  );
};

MitraLauncher.propTypes = {
  onClick: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'navbar', 'floating']),
  badgeText: PropTypes.string
};

export default MitraLauncher;
