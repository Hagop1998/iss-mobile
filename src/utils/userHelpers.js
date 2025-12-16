export const parseApiResponse = (response) => {
  if (response?.results && Array.isArray(response.results)) {
    return response.results;
  }
  if (Array.isArray(response)) {
    return response;
  }
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  if (response?.data?.users && Array.isArray(response.data.users)) {
    return response.data.users;
  }
  if (response?.users && Array.isArray(response.users)) {
    return response.users;
  }
  return [];
};

export const filterUsers = (users, currentUserId) => {
  return users.filter(user => {
    if (!user) return false;
    if (user.role === 'user') {
      return true;
    }
    if (user.id === currentUserId) {
      return false;
    }
    return true;
  });
};

export const getUserDisplayName = (user) => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.firstName || user.lastName || user.email || 'User';
};

