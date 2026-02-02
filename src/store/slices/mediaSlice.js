import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';

const initialState = {
  ads: [],
  isLoading: false,
  error: null,
};

function parseMediaList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const data = res?.results ?? res?.data ?? res?.rows ?? res?.items;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const inner = data?.results ?? data?.data ?? data?.items ?? data?.rows;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

export const fetchAds = createAsyncThunk(
  'media/fetchAds',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const user = state.auth?.user;
      if (!user?.token) return { ads: [] };

      const res = await apiService.media.getList({
        page: 1,
        limit: 10,
        mediaType: 'video',
        entityType: 'advertisment',
      });
      const list = parseMediaList(res);
      return { ads: list };
    } catch (error) {
      console.warn('fetchAds error:', error?.message);
      return rejectWithValue(error?.data?.message ?? error?.message ?? 'Failed to load ads');
    }
  }
);

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    clearAds: (state) => {
      state.ads = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.ads = action.payload?.ads ?? [];
      })
      .addCase(fetchAds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? null;
        state.ads = [];
      });
  },
});

export const { clearAds } = mediaSlice.actions;
export default mediaSlice.reducer;
