export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const getPasswordStrength = (password) => {
  if (password.length < 6) return { strength: 'weak', color: '#EF4444' };
  if (password.length < 8) return { strength: 'medium', color: '#F59E0B' };
  if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
    return { strength: 'strong', color: '#10B981' };
  }
  return { strength: 'good', color: '#3B82F6' };
};

export const formatPhoneNumber = (value) => {
  let cleaned = value.replace(/[^\d+]/g, '');

  if (!cleaned.startsWith('+')) {
    cleaned = '+374' + cleaned.replace(/\+/g, '');
  }

  else if (cleaned.startsWith('+') && !cleaned.startsWith('+374')) {
    cleaned = '+' + cleaned.substring(1).replace(/\+/g, '');
  }

  return cleaned.substring(0, 16);
};

export const validatePhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
};
