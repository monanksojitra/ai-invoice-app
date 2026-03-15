/**
 * Custom Hooks for Performance Optimization
 */

import { useRef, useLayoutEffect, useCallback } from 'react';

/**
 * Creates a stable callback reference that doesn't change between renders
 * but always calls the latest version of the callback.
 * 
 * Use this instead of useCallback when you need a truly stable reference
 * that won't cause child components to re-render.
 * 
 * @example
 * const handleClick = useStableCallback((value: string) => {
 *   console.log(value, someStateThatChanges);
 * });
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  // Update the ref on every render so we always call the latest callback
  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  // Return a memoized callback that never changes
  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Hook to track if component is still mounted
 * Useful for preventing state updates on unmounted components
 * 
 * @example
 * const isMounted = useIsMounted();
 * 
 * async function fetchData() {
 *   const data = await api.fetch();
 *   if (isMounted.current) {
 *     setData(data);
 *   }
 * }
 */
export function useIsMounted() {
  const isMounted = useRef(true);

  useLayoutEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

/**
 * Creates an AbortController that's automatically aborted on unmount
 * 
 * @example
 * const abortController = useAbortController();
 * 
 * fetch(url, { signal: abortController.signal })
 *   .then(response => response.json())
 *   .catch(error => {
 *     if (error.name !== 'AbortError') {
 *       console.error(error);
 *     }
 *   });
 */
export function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!abortControllerRef.current) {
    abortControllerRef.current = new AbortController();
  }

  useLayoutEffect(() => {
    const controller = abortControllerRef.current;

    return () => {
      controller?.abort();
    };
  }, []);

  return abortControllerRef.current;
}
