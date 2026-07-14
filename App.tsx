import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store';
import { useAppDispatch, useAppSelector } from './src/store/hooks';
import { bootstrapAuth } from './src/auth/bootstrap';
import { startConnectivityMonitor, onConnectivityRestoredOrForegrounded } from './src/sync/connectivity';
import { kickSync } from './src/sync/syncEngine';
import RootNavigator from './src/navigation/RootNavigator';

function Bootstrap() {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector((s) => s.auth.status);

  useEffect(() => {
    startConnectivityMonitor();
    bootstrapAuth(dispatch);
  }, [dispatch]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    kickSync();
    return onConnectivityRestoredOrForegrounded(() => {
      kickSync();
    });
  }, [authStatus]);

  return <RootNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Bootstrap />
      </SafeAreaProvider>
    </Provider>
  );
}
