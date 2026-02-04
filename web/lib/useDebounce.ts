/**
 * Debounce callback so multiple rapid clicks don't fire multiple API calls.
 * Use for 3-of-4 biometric triggers and other one-shot actions.
 */

import { useCallback, useRef } from 'react';

/**
 * Returns a debounced version of the callback. While pending, subsequent calls are ignored.
 * @param fn Callback (e.g. trigger biometric)
 * @param delayMs Minimum ms between invocations (default 2000 for biometric)
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number = 2000
): T {
  const lastCall = useRef<number>(0);
  const pending = useRef<boolean>(false);

  return useCallback(
    ((...args: unknown[]) => {
      const now = Date.now();
      if (pending.current) return;
      if (now - lastCall.current < delayMs) return;
      lastCall.current = now;
      pending.current = true;
      const result = fn(...args);
      if (result instanceof Promise) {
        result.finally(() => {
          pending.current = false;
        });
      } else {
        pending.current = false;
      }
      return result;
    }) as T,
    [fn, delayMs]
  );
}
