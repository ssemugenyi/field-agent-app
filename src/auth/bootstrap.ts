import * as tokenStore from './tokenStore';
import { validateSessionAtBoot } from '../api/baseQuery';
import { setAuthenticated, setUnauthenticated } from './authSlice';
import type { AppDispatch } from '../store';

export async function bootstrapAuth(dispatch: AppDispatch): Promise<void> {
  await tokenStore.loadSession();
  const session = tokenStore.getCachedSession();
  if (!session) {
    dispatch(setUnauthenticated());
    return;
  }

  const valid = await validateSessionAtBoot();
  const current = tokenStore.getCachedSession();
  if (valid && current) {
    dispatch(
      setAuthenticated({
        agentId: current.agentId,
        agentDisplayName: current.agentDisplayName,
        agentRegion: current.agentRegion,
      }),
    );
  } else {
    dispatch(setUnauthenticated());
  }
}
