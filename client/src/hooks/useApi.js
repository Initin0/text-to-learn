import { useMemo } from 'react';
import { useAuth } from './useAuth.js';
import { createApi } from '../utils/api.js';

export function useApi() {
  const { getToken } = useAuth();
  return useMemo(() => createApi(getToken), [getToken]);
}
