import { createSlice } from '@reduxjs/toolkit';

// Initial state - only local UI state, no API state
const initialState = {
  selectedService: null,
  selectedVisitorIdentity: null,
  selectedTimePeriod: null,
  address: '',
};

// QR slice - only for local UI state
const qrSlice = createSlice({
  name: 'qr',
  initialState,
  reducers: {
    setSelectedService: (state, action) => {
      state.selectedService = action.payload;
    },
    setSelectedVisitorIdentity: (state, action) => {
      state.selectedVisitorIdentity = action.payload;
    },
    setSelectedTimePeriod: (state, action) => {
      state.selectedTimePeriod = action.payload;
    },
    setAddress: (state, action) => {
      state.address = action.payload;
    },
    clearQRData: (state) => {
      state.selectedService = null;
      state.selectedVisitorIdentity = null;
      state.selectedTimePeriod = null;
      state.address = '';
    },
    resetQRState: (state) => {
      return initialState;
    },
  },
});

export const {
  setSelectedService,
  setSelectedVisitorIdentity,
  setSelectedTimePeriod,
  setAddress,
  clearQRData,
  resetQRState,
} = qrSlice.actions;

export default qrSlice.reducer;
