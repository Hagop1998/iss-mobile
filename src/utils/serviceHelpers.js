import { colors } from '../constants/colors';

export const getServiceIcon = (serviceType) => {
  const type = serviceType?.toLowerCase() || '';
  
  if (type.includes('intercom') || type === 'smart_intercom') {
    return 'call';
  }
  if (type.includes('elevator')) {
    return 'business';
  }
  if (type.includes('camera') || type.includes('security') || type.includes('surveillance')) {
    return 'videocam';
  }
  if (type.includes('barrier')) {
    return 'car';
  }
  return 'settings';
};

export const getServiceColor = (serviceType) => {
  const type = serviceType?.toLowerCase() || '';
  
  if (type.includes('intercom') || type === 'smart_intercom') {
    return colors.blue?.[500] || '#3B82F6';
  }
  if (type.includes('elevator')) {
    return colors.green?.[500] || '#10B981';
  }
  if (type.includes('camera') || type.includes('security') || type.includes('surveillance')) {
    return colors.orange?.[500] || '#F59E0B';
  }
  if (type.includes('barrier')) {
    return colors.primary || '#3C0056';
  }
  return colors.gray?.[500] || '#6B7280';
};

export const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase() || '';
  
  switch (statusLower) {
    case 'active':
      return { 
        bg: colors.green?.[100] || '#D1FAE5', 
        text: colors.green?.[700] || '#047857' 
      };
    case 'expired':
    case 'cancelled':
      return { 
        bg: colors.red?.[100] || '#FEE2E2', 
        text: colors.red?.[700] || '#B91C1C' 
      };
    case 'pending':
      return { 
        bg: colors.yellow?.[100] || '#FEF3C7', 
        text: colors.yellow?.[700] || '#A16207' 
      };
    default:
      return { 
        bg: colors.gray?.[100] || '#F3F4F6', 
        text: colors.gray?.[700] || '#374151' 
      };
  }
};

