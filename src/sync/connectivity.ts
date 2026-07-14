import NetInfo from '@react-native-community/netinfo';
import { AppState, type AppStateStatus } from 'react-native';
import { store } from '../store';
import { setOnline } from './connectivitySlice';

type Listener = () => void;
const listeners = new Set<Listener>();

export function onConnectivityRestoredOrForegrounded(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let wasOnline: boolean | null = null;
let started = false;

export function startConnectivityMonitor(): void {
  if (started) return;
  started = true;

  NetInfo.addEventListener((state) => {
    const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
    store.dispatch(setOnline(isOnline));
    if (isOnline && wasOnline === false) {
      listeners.forEach((l) => l());
    }
    wasOnline = isOnline;
  });

  AppState.addEventListener('change', (next: AppStateStatus) => {
    if (next === 'active') {
      listeners.forEach((l) => l());
    }
  });
}
