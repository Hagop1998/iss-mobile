export const extractErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (!error) return defaultMessage;

  if (error?.data?.message) {
    if (typeof error.data.message === 'string') {
      return error.data.message;
    }
    if (typeof error.data.message === 'object' && error.data.message !== null) {
      const messages = Object.values(error.data.message).filter(msg => msg);
      if (messages.length > 0) {
        return messages.join('\n');
      }
      return 'Validation failed. Please check your input.';
    }
  }

  if (error?.message) {
    return typeof error.message === 'string' ? error.message : defaultMessage;
  }

  if (error?.data?.error) {
    return typeof error.data.error === 'string' ? error.data.error : defaultMessage;
  }

  if (error?.data?.msg) {
    return typeof error.data.msg === 'string' ? error.data.msg : defaultMessage;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
};

export const showErrorAlert = (error, t, defaultMessage = 'An error occurred') => {
  const { Alert } = require('react-native');
  const errorMessage = extractErrorMessage(error, defaultMessage);
  
  Alert.alert(
    t('common.error') || 'Error',
    errorMessage,
    [{ text: t('common.ok') || 'OK', style: 'default' }]
  );
};

