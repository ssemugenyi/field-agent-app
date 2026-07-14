import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {

  status: 'unknown' | 'authenticated' | 'unauthenticated';
  agentId: string | null;
  agentDisplayName: string | null;
  agentRegion: string | null;
}

const initialState: AuthState = {
  status: 'unknown',
  agentId: null,
  agentDisplayName: null,
  agentRegion: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated(
      state,
      action: PayloadAction<{ agentId: string; agentDisplayName: string; agentRegion: string }>,
    ) {
      state.status = 'authenticated';
      state.agentId = action.payload.agentId;
      state.agentDisplayName = action.payload.agentDisplayName;
      state.agentRegion = action.payload.agentRegion;
    },
    setUnauthenticated(state) {
      state.status = 'unauthenticated';
      state.agentId = null;
      state.agentDisplayName = null;
      state.agentRegion = null;
    },
  },
});

export const { setAuthenticated, setUnauthenticated } = authSlice.actions;
export default authSlice.reducer;
