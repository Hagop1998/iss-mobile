export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }
  
  const domainParts = parts[1].split('.');
  if (domainParts.length < 2) {
    return false;
  }

  const tld = domainParts[domainParts.length - 1].toLowerCase();
    return tld === 'com';
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
