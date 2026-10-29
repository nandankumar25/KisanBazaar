import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API Services
export const registerUser = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const googleLoginUser = async (credential) => {
  const response = await api.post('/auth/google', { credential, isRegistration: false });
  return response.data;
};

export const googleRegisterUser = async (credential, role, extraData = {}) => {
  const response = await api.post('/auth/google', {
    credential,
    role,
    isRegistration: true,
    action: 'register',
    ...extraData,
  });
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateUserProfile = async (data) => {
  const response = await api.put('/auth/profile', data);
  return response.data;
};

export const uploadAvatarApi = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await api.post('/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteAvatarApi = async () => {
  const response = await api.delete('/auth/avatar');
  return response.data;
};

export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return `${baseUrl}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
};

export const verifyEmailToken = async (token) => {
  const response = await api.get(`/auth/verify-email/${token}`);
  return response.data;
};

export const resendVerificationEmail = async (email) => {
  const response = await api.post('/auth/resend-verification', { email });
  return response.data;
};

export const forgotPasswordRequest = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordSubmit = async (token, password) => {
  const response = await api.put(`/auth/reset-password/${token}`, { password });
  return response.data;
};

// Admin API Services
export const getAdminStatsApi = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

export const getAdminUsersApi = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const updateUserRoleApi = async (userId, role) => {
  const response = await api.put(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const deleteUserApi = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const getAdminMandisApi = async (params = {}) => {
  const response = await api.get('/admin/mandis', { params });
  return response.data;
};

export const verifyMandiApi = async (mandiId, data) => {
  const response = await api.put(`/admin/mandis/${mandiId}/verify`, data);
  return response.data;
};

// Mandi API Services
export const getMandis = async (params = {}) => {
  const response = await api.get('/mandis', { params });
  return response.data;
};

export const getMandiById = async (id) => {
  const response = await api.get(`/mandis/${id}`);
  return response.data;
};

export const getMyMandi = async () => {
  const response = await api.get('/mandis/my-mandi');
  return response.data;
};

export const updateMyMandi = async (data) => {
  const response = await api.put('/mandis/my-mandi', data);
  return response.data;
};

// Mandi Price API Services
export const getMandiPrices = async (params = {}) => {
  const response = await api.get('/mandi-prices', { params });
  return response.data;
};

export const getMandiPriceTrends = async (crop) => {
  const response = await api.get(`/mandi-prices/trends/${encodeURIComponent(crop)}`);
  return response.data;
};

export const createMandiPrice = async (data) => {
  const response = await api.post('/mandi-prices', data);
  return response.data;
};

export const updateMandiPrice = async (id, data) => {
  const response = await api.put(`/mandi-prices/${id}`, data);
  return response.data;
};

export const deleteMandiPrice = async (id) => {
  const response = await api.delete(`/mandi-prices/${id}`);
  return response.data;
};

// Mandi Demand API Services
export const getMandiDemands = async (params = {}) => {
  const response = await api.get('/mandi-demands', { params });
  return response.data;
};

export const getMyMandiDemands = async () => {
  const response = await api.get('/mandi-demands/my-demands');
  return response.data;
};

export const createMandiDemand = async (data) => {
  const response = await api.post('/mandi-demands', data);
  return response.data;
};

export const updateMandiDemand = async (id, data) => {
  const response = await api.put(`/mandi-demands/${id}`, data);
  return response.data;
};

export const deleteMandiDemand = async (id) => {
  const response = await api.delete(`/mandi-demands/${id}`);
  return response.data;
};

// Mandi Booking API Services
export const getMandiStats = async () => {
  const response = await api.get('/mandi-bookings/stats');
  return response.data;
};

export const getMandiBookings = async (params = {}) => {
  const response = await api.get('/mandi-bookings/mandi', { params });
  return response.data;
};

export const getFarmerBookings = async (params = {}) => {
  const response = await api.get('/mandi-bookings/farmer', { params });
  return response.data;
};

export const getMandiBookingById = async (id) => {
  const response = await api.get(`/mandi-bookings/${id}`);
  return response.data;
};

export const createMandiBooking = async (data) => {
  const response = await api.post('/mandi-bookings', data);
  return response.data;
};

export const reviewMandiBooking = async (id, data) => {
  const response = await api.put(`/mandi-bookings/${id}/review`, data);
  return response.data;
};

export const markMandiBookingArrived = async (id, data = {}) => {
  const response = await api.put(`/mandi-bookings/${id}/arrival`, data);
  return response.data;
};

export const recordQualityAndWeighing = async (id, data) => {
  const response = await api.put(`/mandi-bookings/${id}/quality-weighing`, data);
  return response.data;
};

export const completeMandiSale = async (id, data = {}) => {
  const response = await api.put(`/mandi-bookings/${id}/complete`, data);
  return response.data;
};

export const updateMandiBookingPayment = async (id, data) => {
  const response = await api.put(`/mandi-bookings/${id}/payment`, data);
  return response.data;
};

// Crop Lot API Services
export const getCropLots = async (params = {}) => {
  const response = await api.get('/crop-lots', { params });
  return response.data;
};

export const getCropLotById = async (id) => {
  const response = await api.get(`/crop-lots/${id}`);
  return response.data;
};

export const createCropLot = async (data) => {
  const response = await api.post('/crop-lots', data);
  return response.data;
};

export const updateCropLot = async (id, data) => {
  const response = await api.put(`/crop-lots/${id}`, data);
  return response.data;
};

export const deleteCropLot = async (id) => {
  const response = await api.delete(`/crop-lots/${id}`);
  return response.data;
};

// Transporter API Services
export const getTransporters = async (params = {}) => {
  const response = await api.get('/transporters', { params });
  return response.data;
};

export const getMyTransporterProfile = async () => {
  const response = await api.get('/transporters/me');
  return response.data;
};

export const createTransporterProfile = async (data) => {
  const response = await api.post('/transporters', data);
  return response.data;
};

export const updateTransporterProfile = async (id, data) => {
  const response = await api.put(`/transporters/${id}`, data);
  return response.data;
};

export const calculateTransportCost = async (data) => {
  const response = await api.post('/transporters/calculate-cost', data);
  return response.data;
};

export const createTransportBooking = async (data) => {
  const response = await api.post('/transports', data);
  return response.data;
};

export const getTransportBookings = async (params = {}) => {
  const response = await api.get('/transports', { params });
  return response.data;
};

export const updateTransportStatus = async (id, data) => {
  const response = await api.put(`/transports/${id}/status`, data);
  return response.data;
};

export const updateTransportPayment = async (id, data) => {
  const response = await api.put(`/transports/${id}/payment`, data);
  return response.data;
};

// Buyer API Services
export const getBuyers = async (params = {}) => {
  const response = await api.get('/buyers', { params });
  return response.data;
};

export const getBuyerById = async (id) => {
  const response = await api.get(`/buyers/${id}`);
  return response.data;
};

export const getMatchedBuyers = async (cropLotId) => {
  const response = await api.get(`/buyers/match/${cropLotId}`);
  return response.data;
};

// Offer API Services
export const createOffer = async (data) => {
  const response = await api.post('/offers', data);
  return response.data;
};

export const getOffers = async (params = {}) => {
  const response = await api.get('/offers', { params });
  return response.data;
};

export const getOfferById = async (id) => {
  const response = await api.get(`/offers/${id}`);
  return response.data;
};

export const acceptOffer = async (id) => {
  const response = await api.put(`/offers/${id}/accept`);
  return response.data;
};

export const rejectOffer = async (id) => {
  const response = await api.put(`/offers/${id}/reject`);
  return response.data;
};

export const counterOffer = async (id, data) => {
  const response = await api.put(`/offers/${id}/counter`, data);
  return response.data;
};

export const cancelOffer = async (id, data = {}) => {
  const response = await api.put(`/offers/${id}/cancel`, data);
  return response.data;
};

// Messaging API Services
export const sendMessage = async (data) => {
  const response = await api.post('/messages', data);
  return response.data;
};

export const getConversations = async () => {
  const response = await api.get('/messages/conversations');
  return response.data;
};

export const getConversationMessages = async (id) => {
  const response = await api.get(`/messages/conversations/${id}`);
  return response.data;
};

export const getOrCreateConversation = async (otherUserIdOrOptions, params = {}) => {
  let targetUserId = otherUserIdOrOptions;
  let queryParams = { ...params };

  if (otherUserIdOrOptions && typeof otherUserIdOrOptions === 'object') {
    targetUserId =
      otherUserIdOrOptions.otherUserId ||
      otherUserIdOrOptions.userId ||
      otherUserIdOrOptions.recipientId;
    if (otherUserIdOrOptions.cropLotId || otherUserIdOrOptions.cropLot) {
      queryParams.cropLot = otherUserIdOrOptions.cropLotId || otherUserIdOrOptions.cropLot;
    }
    if (otherUserIdOrOptions.offerId || otherUserIdOrOptions.offer) {
      queryParams.offer = otherUserIdOrOptions.offerId || otherUserIdOrOptions.offer;
    }
  }

  const response = await api.get(`/messages/with/${targetUserId}`, { params: queryParams });
  return response.data;
};

export const getUnreadMessageCount = async () => {
  const response = await api.get('/messages/unread-count');
  return response.data;
};

// Notification API Services
export const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put('/notifications/mark-all-read');
  return response.data;
};

// Transaction API Services
export const getTransactions = async (params = {}) => {
  const response = await api.get('/transactions', { params });
  return response.data;
};

export const getTransactionById = async (id) => {
  const response = await api.get(`/transactions/${id}`);
  return response.data;
};

export const createTransaction = async (data) => {
  const response = await api.post('/transactions', data);
  return response.data;
};

export const recordPayment = async (id, data) => {
  const response = await api.post(`/transactions/${id}/payment`, data);
  return response.data;
};

export const updateTransactionStatus = async (id, data) => {
  const response = await api.put(`/transactions/${id}/status`, data);
  return response.data;
};

export default api;

