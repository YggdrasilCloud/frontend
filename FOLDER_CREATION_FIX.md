# Fix: Folder Creation Error Handling

## Problem

The folder creation feature was not providing proper feedback to users when:

- The API request failed (network error, API down, etc.)
- The folder was created successfully
- Any error occurred during the process

This made it impossible for users to know if their folder was actually created.

## Root Cause

The `handleNewFolder()` function was using `.mutate()` instead of `.mutateAsync()`, which meant:

1. No error handling was in place
2. No success confirmation was shown
3. Users received no feedback about the operation status

## Solution

Updated both pages where folder creation occurs:

- `src/routes/photos/+page.svelte`
- `src/routes/photos/[folderId]/+page.svelte`

### Changes Made

**Before:**

```typescript
function handleNewFolder() {
	const name = prompt('Enter folder name:');
	if (!name) return;

	const validation = FolderNameValidator.validate(name);
	if (!validation.isValid) {
		alert(validation.error);
		return;
	}

	const sanitizedName = FolderNameValidator.sanitize(name);
	$createFolder.mutate({ name: sanitizedName });
	// ❌ No error handling, no feedback
}
```

**After:**

```typescript
async function handleNewFolder() {
	const name = prompt('Enter folder name:');
	if (!name) return;

	const validation = FolderNameValidator.validate(name);
	if (!validation.isValid) {
		alert(validation.error);
		return;
	}

	const sanitizedName = FolderNameValidator.sanitize(name);

	try {
		await $createFolder.mutateAsync({ name: sanitizedName });
		alert(`Folder "${sanitizedName}" created successfully!`);
		// ✅ Success feedback
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Failed to create folder';
		alert(`Error: ${errorMsg}`);
		console.error('Failed to create folder:', error);
		// ✅ Error handling with user feedback
	}
}
```

## Testing

Added comprehensive E2E tests in `tests/e2e/folder-creation.spec.ts`:

1. **Successful folder creation** - Verifies prompt and success alert
2. **Invalid characters validation** - Tests forbidden characters (/, \, etc.)
3. **Name sanitization** - Verifies whitespace trimming
4. **Cancel prompt** - Ensures no API call when cancelled
5. **Empty name** - Prevents creation with empty string
6. **Button disabled state** - Button should be disabled during API call
7. **Error handling** - Shows error alert when API fails
8. **List refresh** - Folder list refreshes after successful creation

## How to Verify the Fix

### Manual Testing

1. Start the development server:

   ```bash
   docker compose up
   ```

2. Navigate to http://localhost:5173/photos

3. Click "New Folder" button

4. Enter a folder name and press OK

5. You should see:
   - **If API is working**: Success alert "Folder [name] created successfully!"
   - **If API is down**: Error alert "Error: API Error: ..."
   - Folder list refreshes automatically on success

### Automated Testing

Run E2E tests:

```bash
docker compose exec frontend npm run test:e2e tests/e2e/folder-creation.spec.ts
```

## API Requirements

For folder creation to work, the backend API must:

1. Be running and accessible at the URL specified in `PUBLIC_API_URL`
2. Have CORS properly configured
3. Respond to `POST /api/folders` with JSON body: `{ "name": "folder-name" }`
4. Return 2xx status code on success with `FolderDto` response
5. Return 4xx/5xx status codes on error with error details

## Common Issues

### "API Error: 404"

- Backend API is not running or endpoint doesn't exist
- Check backend is running and `/api/folders` endpoint exists

### "API Error: 500"

- Backend encountered an error
- Check backend logs for details

### "Network error" or "Failed to fetch"

- CORS issue or network connectivity problem
- Verify CORS is configured correctly on backend
- Check browser console for CORS errors

### No feedback at all

- JavaScript error in console
- Check browser console for errors
- Verify TanStack Query is properly initialized

## Related Files

- `src/routes/photos/+page.svelte` - Main photos page
- `src/routes/photos/[folderId]/+page.svelte` - Folder detail page
- `src/lib/api/mutations/createFolder.ts` - TanStack Query mutation
- `src/lib/api/client.ts` - API client
- `tests/e2e/folder-creation.spec.ts` - E2E tests
- `tests/e2e/folders.spec.ts` - Original folder tests
