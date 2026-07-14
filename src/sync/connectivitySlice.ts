import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ConnectivityState {

  isOnline: boolean | null;
}

const initialState: ConnectivityState = { isOnline: null };

const connectivitySlice = createSlice({
  name: 'connectivity',
  initialState,
  reducers: {
    setOnline(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
  },
});

export const { setOnline } = connectivitySlice.actions;
export default connectivitySlice.reducer;
