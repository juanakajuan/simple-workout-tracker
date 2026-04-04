/**
 * Custom hook for persisting state to localStorage with automatic synchronization.
 *
 * This hook provides a React state that is automatically synced with localStorage,
 * allowing data to persist across page reloads and browser sessions. It also
 * handles cross-tab synchronization via the storage event.
 *
 * @example
 * ```tsx
 * const [value, setValue] = useLocalStorage('myKey', 'defaultValue');
 * // value is loaded from localStorage or uses default
 * setValue('new value'); // Updates both state and localStorage
 * ```
 *
 * @module useLocalStorage
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Default deserialization function that casts the value to the expected type.
 *
 * @template T The expected type of the stored value
 * @param value The raw value from localStorage
 * @returns The value cast to type T
 */
function defaultDeserialize<T>(value: unknown): T {
  return value as T;
}

/**
 * Configuration options for useLocalStorage hook.
 *
 * @template T The type of the stored value
 */
interface UseLocalStorageOptions<T> {
  /**
   * Custom deserialization function to transform stored values.
   * Useful for normalizing data from old storage formats.
   */
  deserialize?: (value: unknown) => T;
}

/**
 * React hook that syncs state with localStorage.
 *
 * @template T The type of the value being stored
 * @param key The localStorage key to use for persistence
 * @param initialValue The default value if no stored value exists
 * @param options Optional configuration for deserialization
 * @returns A tuple of [storedValue, setValue] similar to useState
 *
 * @example
 * ```tsx
 * // Basic usage with string
 * const [name, setName] = useLocalStorage('userName', 'Anonymous');
 *
 * // With custom deserialization for complex objects
 * const [user, setUser] = useLocalStorage('user', defaultUser, {
 *   deserialize: (value) => normalizeUser(value)
 * });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>
) {
  const deserialize = options?.deserialize ?? defaultDeserialize<T>;

  /**
   * Initialize state from localStorage or use initial value.
   * This only runs once during component mount.
   */
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(JSON.parse(item)) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Updates both the React state and localStorage.
   * Accepts either a new value or a function that receives the current value.
   */
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  /**
   * Listen for storage changes from other tabs/windows.
   * Updates state when the same key is modified in another context.
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          setStoredValue(e.newValue ? deserialize(JSON.parse(e.newValue)) : initialValue);
        } catch (error) {
          console.error(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [deserialize, initialValue, key]);

  return [storedValue, setValue] as const;
}
