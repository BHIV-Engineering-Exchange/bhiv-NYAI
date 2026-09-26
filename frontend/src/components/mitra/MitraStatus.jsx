import React from 'react';
import PropTypes from 'prop-types';
import StatusBadge from '../ui/StatusBadge.jsx';

/**
 * MitraStatus — Compact operational status indicator for MITRA
 * Supported states: IDLE, SENDING, SUCCESS, ERROR
 */
const MitraStatus = ({ status = 'IDLE' }) => {
  switch (status) {
    case 'SENDING':
      return (
        <StatusBadge variant="info" size="sm" pulse>
          MITRA Thinking...
        </StatusBadge>
      );
    case 'ERROR':
      return (
        <StatusBadge variant="error" size="sm">
          Service Alert
        </StatusBadge>
      );
    case 'SUCCESS':
      return (
        <StatusBadge variant="success" size="sm">
          Ready
        </StatusBadge>
      );
    case 'IDLE':
    default:
      return (
        <StatusBadge variant="neutral" size="sm">
          Connected
        </StatusBadge>
      );
  }
};

MitraStatus.propTypes = {
  status: PropTypes.oneOf(['IDLE', 'SENDING', 'SUCCESS', 'ERROR'])
};

export default MitraStatus;
