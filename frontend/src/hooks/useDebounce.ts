import { useState, useEffect } from 'react';
import { DEBOUNCE_DELAY } from '../constants';

/**
 * Custom hook for debouncing values.
 * Useful for search inputs and other scenarios where you want to delay processing
 * until the user has stopped typing.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms from constants)
 * @returns Debounced value that updates after the specified delay
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // This will only run after user stops typing for 500ms
 *   performSearch(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = DEBOUNCE_DELAY): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

