import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SyncStatusState {
  engineState: 'idle' | 'syncing' | 'paused';
  pendingCount: number;
  lastSyncedAt: number | null;
  lastError: string | null;
  portfolioSynced: number;
  portfolioComplete: boolean;
}

const initialState: SyncStatusState = {
  engineState: 'idle',
  pendingCount: 0,
  lastSyncedAt: null,
  lastError: null,
  portfolioSynced: 0,
  portfolioComplete: false,
};

const syncStatusSlice = createSlice({
  name: 'syncStatus',
  initialState,
  reducers: {
    setEngineState(state, action: PayloadAction<SyncStatusState['engineState']>) {
      state.engineState = action.payload;
    },
    setPendingCount(state, action: PayloadAction<number>) {
      state.pendingCount = action.payload;
    },
    setLastSyncedAt(state, action: PayloadAction<number>) {
      state.lastSyncedAt = action.payload;
    },
    setLastError(state, action: PayloadAction<string | null>) {
      state.lastError = action.payload;
    },
    setPortfolioProgress(state, action: PayloadAction<{ synced: number; complete: boolean }>) {
      state.portfolioSynced = action.payload.synced;
      state.portfolioComplete = action.payload.complete;
    },
  },
});

export const { setEngineState, setPendingCount, setLastSyncedAt, setLastError, setPortfolioProgress } =
  syncStatusSlice.actions;
export default syncStatusSlice.reducer;
