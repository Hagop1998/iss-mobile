import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';

const initialState = {
  items: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  viewedAt: null, // when user opened Announcements screen – hide badge after view
};

/**
 * Extract list of announcements from API response.
 * Backend returns: { results: [...], totalCount: N, pages, next, previous, current, perPage }
 */
function parseAnnouncementList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  // Backend uses "results" for the list
  const data = res?.results ?? res?.data ?? res?.result ?? res?.rows ?? res?.items;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const inner = data?.results ?? data?.data ?? data?.items ?? data?.list ?? data?.rows;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

/**
 * Fetches announcements for the current user on login.
 * Calls GET /announcement with:
 * - entityType: general (for everyone)
 * - entityType: user, entityId: userId
 * - entityType: address, entityId: addressId (if user has subscription with address)
 * - entityType: device, entityId: deviceId (if user has subscription with device)
 * Merges all results and deduplicates by id.
 */
export const fetchAnnouncements = createAsyncThunk(
  'announcement/fetchAnnouncements',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const user = state.auth?.user;
      if (!user?.token) {
        console.log('📢 fetchAnnouncements: No token, skipping');
        return { items: [] };
      }

      const userId = user?.id;
      const addressId = user?.userSubscription?.device?.address?.id ?? user?.userSubscription?.address?.id;
      const deviceId = user?.userSubscription?.device?.id;

      const defaultParams = { page: 1, limit: 50, isActive: true };
      const requests = [];

      // 1. General announcements - admin "general" uses no entity ID (Entity IDs: "-"), so omit entityId first
      requests.push(
        (async () => {
          try {
            let res = await apiService.announcement.getList({ ...defaultParams, entityType: 'general' });
            let list = parseAnnouncementList(res);
            if (list.length === 0) {
              res = await apiService.announcement.getList({ ...defaultParams, entityType: 'general', entityId: 0 });
              list = parseAnnouncementList(res);
            }
            console.log('📢 Announcements (general):', list?.length ?? 0, 'items', 'response keys:', res ? Object.keys(res) : []);
            if (list.length === 0 && res && typeof res === 'object') {
              console.log('📢 General response sample:', JSON.stringify(res).slice(0, 500));
            }
            return { source: 'general', data: list };
          } catch (err) {
            console.warn('📢 Announcements (general) request failed:', err?.message);
            return { source: 'general', data: [] };
          }
        })()
      );

      // 2. User-specific announcements
      if (userId) {
        requests.push(
          apiService.announcement.getList({ ...defaultParams, entityType: 'user', entityId: userId })
            .then((res) => {
              const list = parseAnnouncementList(res);
              console.log('📢 Announcements (user):', list?.length ?? 0, 'items');
              return { source: 'user', data: list };
            })
            .catch((err) => {
              console.warn('📢 Announcements (user) request failed:', err?.message);
              return { source: 'user', data: [] };
            })
        );
      }

      // 3. Address-specific announcements (if user has address from subscription)
      if (addressId) {
        requests.push(
          apiService.announcement.getList({ ...defaultParams, entityType: 'address', entityId: addressId })
            .then((res) => ({ source: 'address', data: parseAnnouncementList(res) }))
            .catch(() => ({ source: 'address', data: [] }))
        );
      }

      // 4. Device-specific announcements (if user has device from subscription)
      if (deviceId) {
        requests.push(
          apiService.announcement.getList({ ...defaultParams, entityType: 'device', entityId: deviceId })
            .then((res) => ({ source: 'device', data: parseAnnouncementList(res) }))
            .catch(() => ({ source: 'device', data: [] }))
        );
      }

      const results = await Promise.all(requests);
      const seen = new Set();
      const items = [];
      for (const r of results) {
        const list = Array.isArray(r?.data) ? r.data : [];
        for (const item of list) {
          const id = item?.id ?? item?.title ?? JSON.stringify(item);
          if (!seen.has(id)) {
            seen.add(id);
            items.push(item);
          }
        }
      }

      console.log('📢 fetchAnnouncements: total merged', items.length, 'announcements');
      return { items };
    } catch (error) {
      console.error('❌ fetchAnnouncements error:', error);
      return rejectWithValue(error?.data?.message ?? error?.message ?? 'Failed to load announcements');
    }
  }
);

const announcementSlice = createSlice({
  name: 'announcement',
  initialState,
  reducers: {
    clearAnnouncements: (state) => {
      state.items = [];
      state.error = null;
      state.lastFetchedAt = null;
      state.viewedAt = null;
    },
    // Only hide the badge (count) – do not clear items; list stays so user can still see announcements
    markAnnouncementsViewed: (state) => {
      state.viewedAt = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.items = action.payload?.items ?? [];
        state.lastFetchedAt = new Date().toISOString();
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to load announcements';
        state.items = [];
      });
  },
});

export const { clearAnnouncements, markAnnouncementsViewed } = announcementSlice.actions;
export default announcementSlice.reducer;
