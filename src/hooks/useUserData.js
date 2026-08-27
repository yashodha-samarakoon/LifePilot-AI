import { useEffect, useRef, useState } from 'react';
import { useUserStore } from '@/stores/user.store';

/**
 * Hook to fetch user data when component mounts.
 */
export function useUserData(uid) {
  const { fetchProfile, fetchGoals } = useUserStore();
  const fetched = useRef(false);

  useEffect(() => {
    if (uid && !fetched.current) {
      fetched.current = true;
      fetchProfile(uid);
      fetchGoals(uid);
    }
  }, [uid]);
}

/**
 * Hook for debounced value.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
