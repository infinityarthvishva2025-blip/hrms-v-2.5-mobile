import React from 'react';
import Badge from './Badge';

const StatusBadge = ({ status, style }) => {
  const getBadgeProps = () => {
    switch(status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'present':
        return { type: 'success', text: status };
      case 'inactive':
      case 'rejected':
      case 'absent':
        return { type: 'error', text: status };
      case 'pending':
      case 'half-day':
        return { type: 'warning', text: status };
      case 'on leave':
      case 'holiday':
        return { type: 'info', text: status };
      default:
        return { type: 'default', text: status || 'Unknown' };
    }
  };

  const props = getBadgeProps();
  
  return <Badge text={props.text} type={props.type} style={style} />;
};

export default StatusBadge;
