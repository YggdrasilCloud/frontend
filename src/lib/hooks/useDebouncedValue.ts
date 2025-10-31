import { writable } from 'svelte/store';
import type { Readable } from 'svelte/store';

/**
 * Creates a debounced version of a value.
 * Optimized for performance - prevents excessive API calls during user input.
 *
 * @param initialValue - Initial value
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Tuple of [debouncedValue store, setValue function]
 *
 * @example
 * ```ts
 * const [debouncedSearch, setSearch] = useDebouncedValue('', 300);
 *
 * // In component:
 * <input on:input={(e) => setSearch(e.target.value)} />
 *
 * // Use debouncedSearch in query:
 * $: query = photosQuery(folderId, { search: $debouncedSearch });
 * ```
 */
export function useDebouncedValue<T>(
	initialValue: T,
	delay = 300
): [Readable<T>, (value: T) => void] {
	const debouncedValue = writable<T>(initialValue);
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	const setValue = (value: T) => {
		// Clear existing timeout
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}

		// Set new timeout
		timeoutId = setTimeout(() => {
			debouncedValue.set(value);
			timeoutId = null;
		}, delay);
	};

	return [{ subscribe: debouncedValue.subscribe }, setValue];
}

/**
 * Creates a debounced callback function.
 * Useful for actions that should be delayed until user stops interacting.
 *
 * @param callback - Function to debounce
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
	callback: T,
	delay = 300
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return (...args: Parameters<T>) => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			callback(...args);
			timeoutId = null;
		}, delay);
	};
}
