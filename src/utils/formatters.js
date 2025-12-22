
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (error) {
    return dateString || 'N/A';
  }
};

export const formatPrice = (price, currency = 'AMD') => {
  if (!price && price !== 0) return 'N/A';
  try {
    return `${Number(price).toLocaleString()} ${currency}`;
  } catch (error) {
    return `${price} ${currency}`;
  }
};

