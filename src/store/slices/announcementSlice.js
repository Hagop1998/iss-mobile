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
 * Fetches announcements for the current user.
 * Backend GET /announcement only allows page and limit; it returns announcements relevant to the user.
 */
export const fetchAnnouncements = createAsyncThunk(
  'announcement/fetchAnnouncements',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const user = state.auth?.user;
      if (!user?.token) {
        return { items: [] };
      }

      const res = await apiService.announcement.getList({ page: 1, limit: 50 });
      const items = parseAnnouncementList(res);
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
