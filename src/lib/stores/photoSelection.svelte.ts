import type { PhotoDto } from '$lib/api/types';

/**
 * Photo selection store using Svelte 5 runes.
 *
 * Manages multi-select state for photos with support for:
 * - Single toggle (checkbox click or Ctrl+Click)
 * - Range selection (Shift+Click)
 * - Select all / clear all
 */
class PhotoSelectionStore {
	selectedIds = $state<Set<string>>(new Set());
	lastSelectedId = $state<string | null>(null);

	get isSelectionMode(): boolean {
		return this.selectedIds.size > 0;
	}

	get selectedCount(): number {
		return this.selectedIds.size;
	}

	/**
	 * Toggle selection of a single photo.
	 */
	toggle(photoId: string): void {
		const newSet = new Set(this.selectedIds);
		if (newSet.has(photoId)) {
			newSet.delete(photoId);
		} else {
			newSet.add(photoId);
		}
		this.selectedIds = newSet;
		this.lastSelectedId = photoId;
	}

	/**
	 * Select only this photo, deselecting all others.
	 */
	selectOnly(photoId: string): void {
		this.selectedIds = new Set([photoId]);
		this.lastSelectedId = photoId;
	}

	/**
	 * Add a photo to the selection without deselecting others.
	 */
	addToSelection(photoId: string): void {
		const newSet = new Set(this.selectedIds);
		newSet.add(photoId);
		this.selectedIds = newSet;
		this.lastSelectedId = photoId;
	}

	/**
	 * Select a range of photos from lastSelectedId to toPhotoId.
	 * Used for Shift+Click behavior.
	 */
	selectRange(photos: PhotoDto[], toPhotoId: string): void {
		if (!this.lastSelectedId) {
			this.selectOnly(toPhotoId);
			return;
		}

		const photoIds = photos.map((p) => p.id);
		const fromIndex = photoIds.indexOf(this.lastSelectedId);
		const toIndex = photoIds.indexOf(toPhotoId);

		if (fromIndex === -1 || toIndex === -1) {
			this.selectOnly(toPhotoId);
			return;
		}

		const start = Math.min(fromIndex, toIndex);
		const end = Math.max(fromIndex, toIndex);

		const newSet = new Set(this.selectedIds);
		for (let i = start; i <= end; i++) {
			newSet.add(photoIds[i]);
		}
		this.selectedIds = newSet;
		this.lastSelectedId = toPhotoId;
	}

	/**
	 * Select all photos in the given list.
	 */
	selectAll(photos: PhotoDto[]): void {
		this.selectedIds = new Set(photos.map((p) => p.id));
	}

	/**
	 * Clear all selections.
	 */
	clear(): void {
		this.selectedIds = new Set();
		this.lastSelectedId = null;
	}

	/**
	 * Check if a specific photo is selected.
	 */
	isSelected(photoId: string): boolean {
		return this.selectedIds.has(photoId);
	}

	/**
	 * Get an array of selected photo IDs.
	 */
	getSelectedIds(): string[] {
		return Array.from(this.selectedIds);
	}
}

export const photoSelection = new PhotoSelectionStore();
