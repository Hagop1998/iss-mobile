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


export const getLocalIdByService = (serviceType, user, fallbackLocalId = '2136131714170315') => {
  const serviceToDeviceTypeMap = {
    'smart_intercom': 'door',
    'elevator': 'elevator',
    'barrier': 'barrier',
  };

  const deviceType = serviceToDeviceTypeMap[serviceType] || serviceType;

  if (!user) {
    console.warn(`⚠️ No user provided, using fallback localId for service: ${serviceType}`);
    return fallbackLocalId;
  }

  if (user.devices && Array.isArray(user.devices)) {
    const device = user.devices.find(d => 
      d.deviceType === deviceType || 
      d.type === deviceType ||
      d.serviceType === serviceType
    );
    
    if (device && device.localId) {
      console.log(`✅ Found localId from user.devices for ${serviceType}: ${device.localId}`);
      return device.localId;
    }
  }

  if (user.device) {
    if (user.device.localId) {
      if (!user.device.deviceType || 
          user.device.deviceType === deviceType || 
          user.device.type === deviceType) {
        console.log(`✅ Found localId from user.device for ${serviceType}: ${user.device.localId}`);
        return user.device.localId;
      }
    }
  }

  if (user.localId) {
    console.log(`✅ Found localId from user.localId for ${serviceType}: ${user.localId}`);
    return user.localId;
  }

  const serviceLocalIdFields = {
    'smart_intercom': ['smartIntercomLocalId', 'intercomLocalId', 'doorLocalId'],
    'elevator': ['elevatorLocalId'],
    'barrier': ['barrierLocalId'],
  };

  const fieldsToCheck = serviceLocalIdFields[serviceType] || [];
  for (const field of fieldsToCheck) {
    if (user[field]) {
      console.log(`✅ Found localId from user.${field} for ${serviceType}: ${user[field]}`);
      return user[field];
    }
  }

  if (user.device) {
    for (const field of fieldsToCheck) {
      if (user.device[field]) {
        console.log(`✅ Found localId from user.device.${field} for ${serviceType}: ${user.device[field]}`);
        return user.device[field];
      }
    }
  }

  console.warn(`⚠️ No localId found for service ${serviceType}, using fallback: ${fallbackLocalId}`);
  return fallbackLocalId;
};

