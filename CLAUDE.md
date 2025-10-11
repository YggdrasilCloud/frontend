# YggdrasilCloud Frontend

## Vue d'ensemble

Frontend web pour YggdrasilCloud, une application de gestion de photos construite avec une architecture Domain-Driven Design (DDD). Ce frontend consomme l'API REST fournie par le backend Symfony.

## Architecture technique

### Stack choisie

**Framework principal : SvelteKit**
- **Raison** : Performance maximale avec compilation vers vanilla JS (pas de virtual DOM)
- **Avantages** :
  - Bundle ultra-léger (meilleure performance que React/Vue)
  - Code très concis et lisible
  - SSR/SPA hybride avec routing intégré
  - Réactivité native sans boilerplate

**Gestion d'état et cache : TanStack Query (@tanstack/svelte-query)**
- **Raison** : Gestion professionnelle du cache et des requêtes API
- **Features utilisées** :
  - Cache automatique avec invalidation intelligente
  - Prefetching pour améliorer la performance
  - Optimistic updates pour une UI réactive
  - Retry automatique en cas d'échec réseau
  - Stale time configuré à 60 secondes
  - Garbage collection à 5 minutes

**Upload de fichiers : Uppy**
- **Raison** : Meilleur uploader moderne, framework-agnostic
- **Features** :
  - Drag & drop natif
  - Upload par chunks (support des gros fichiers)
  - Barre de progression détaillée
  - Retry automatique
  - Prévisualisation avant upload
  - Validation côté client (taille, type MIME)
- **Intégration** : Wrapper Svelte léger dans `src/lib/components/UppyUploader.svelte`
  - Crée l'instance Uppy dans `onMount`
  - Configure Dashboard + XHRUpload
  - Forwarde les événements via `createEventDispatcher`
  - Destruction propre dans `onDestroy`

**Drag & Drop : svelte-dnd-action**
- **Raison** : Meilleure bibliothèque drag & drop pour Svelte
- **Usage prévu** :
  - Réorganisation de dossiers
  - Déplacement de photos entre dossiers
  - Support tactile (mobile)

**Virtualisation : svelte-virtual-list**
- **Raison** : Performance pour afficher des milliers de photos
- **Usage** : Grilles de photos et listes de dossiers
- **Bénéfice** : Seuls les éléments visibles sont rendus dans le DOM

### Architecture des dossiers

```
frontend/
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts              # Client API avec auth JWT
│   │   │   ├── types.ts               # Types TypeScript pour l'API
│   │   │   ├── queries/
│   │   │   │   ├── folders.ts         # TanStack queries pour folders
│   │   │   │   └── photos.ts          # TanStack queries pour photos
│   │   │   └── mutations/
│   │   │       └── createFolder.ts    # TanStack mutations
│   │   ├── components/
│   │   │   ├── UppyUploader.svelte    # Wrapper Uppy réutilisable
│   │   │   └── FileExplorer/          # Composants de gestion de fichiers (à venir)
│   │   │       ├── FolderTree.svelte
│   │   │       ├── PhotoGrid.svelte
│   │   │       └── PhotoCard.svelte
│   │   └── stores/                     # Stores Svelte (à venir)
│   │       ├── selection.ts           # Gestion sélection multiple
│   │       └── view.ts                # Mode vue (grille/liste)
│   ├── routes/
│   │   ├── +layout.svelte             # Layout global avec QueryClientProvider
│   │   ├── +page.svelte               # Page d'accueil
│   │   └── photos/                    # Routes photos (à venir)
│   │       └── [folderId]/
│   │           └── +page.svelte
│   └── app.html                       # Template HTML de base
├── static/                             # Assets statiques
├── docker-compose.yaml                 # Docker Compose pour développement
├── Dockerfile                          # Multi-stage build (dev/prod)
├── vite.config.ts                      # Configuration Vite
├── svelte.config.js                    # Configuration SvelteKit
├── tsconfig.json                       # Configuration TypeScript
└── package.json
```

## API Client

### Configuration

Le client API est configuré via la variable d'environnement `PUBLIC_API_URL` :

```env
PUBLIC_API_URL=http://localhost:8000
```

### Authentification

Le client API supporte l'authentification JWT :

```typescript
import { apiClient } from '$lib/api/client';

// Définir le token JWT
apiClient.setToken('your-jwt-token');

// Toutes les requêtes suivantes incluront le header Authorization
```

### Types

Les types TypeScript reflètent les DTOs de l'API backend :

```typescript
interface PhotoDto {
	id: string;
	fileName: string;
	storagePath: string;
	mimeType: string;
	sizeInBytes: number;
	uploadedAt: string;
}

interface ListPhotosResponse {
	items: PhotoDto[];
	total: number;
	page: number;
	perPage: number;
}
```

## Utilisation avec TanStack Query

### Exemple : Lister les photos d'un dossier

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { photosQuery } from '$lib/api/queries/photos';

	$: folderId = $page.params.folderId;
	$: query = photosQuery(folderId, 1, 50);
</script>

{#if $query.isLoading}
	<p>Chargement...</p>
{:else if $query.isError}
	<p>Erreur: {$query.error.message}</p>
{:else if $query.data}
	<div class="photos-grid">
		{#each $query.data.items as photo}
			<img src={photo.storagePath} alt={photo.fileName} />
		{/each}
	</div>
{/if}
```

### Exemple : Créer un dossier

```svelte
<script lang="ts">
	import { createFolderMutation } from '$lib/api/mutations/createFolder';

	const mutation = createFolderMutation();

	async function handleSubmit(event: SubmitEvent) {
		const formData = new FormData(event.target as HTMLFormElement);
		const name = formData.get('name') as string;

		await $mutation.mutateAsync({ name });
		// Le cache TanStack Query est automatiquement invalidé
	}
</script>

<form on:submit|preventDefault={handleSubmit}>
	<input name="name" required />
	<button type="submit" disabled={$mutation.isPending}>
		Créer
	</button>
</form>
```

### Exemple : Upload avec Uppy

```svelte
<script lang="ts">
	import { useQueryClient } from '@tanstack/svelte-query';
	import UppyUploader from '$lib/components/UppyUploader.svelte';

	const queryClient = useQueryClient();
	const folderId = '123e4567-e89b-12d3-a456-426614174000';

	function handleUploadComplete(event: CustomEvent) {
		const { successful, failed } = event.detail;

		console.log(`✅ ${successful.length} fichiers uploadés`);

		// Invalider le cache pour recharger la liste
		queryClient.invalidateQueries({ queryKey: ['photos', folderId] });
	}
</script>

<UppyUploader
	endpoint="/api/folders/{folderId}/photos"
	allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
	maxFileSize={20971520}
	on:complete={handleUploadComplete}
/>
```

## Docker

### Développement

```bash
docker compose up
```

Le serveur de développement Vite sera accessible sur `http://localhost:5173` avec hot-reload.

### Variables d'environnement

- `PUBLIC_API_URL` : URL de l'API backend (défaut: `http://localhost:8000`)

### Multi-stage build

Le Dockerfile utilise un build multi-stage :
1. **development** : Node 22 Alpine avec Vite dev server
2. **builder** : Compile l'application pour la production
3. **production** : Image optimisée avec seulement les dépendances de prod

## Décisions d'architecture

### Pourquoi multi-repo (API séparée du frontend) ?

**Contexte** : YggdrasilCloud doit supporter plusieurs clients :
- Application web (ce repo)
- Application mobile Android (futur)

**Avantages de la séparation** :
- ✅ API = source de vérité indépendante des clients
- ✅ Déploiement indépendant (web sur CDN, API sur serveur)
- ✅ Développement parallèle (web, Android)
- ✅ Releases indépendantes (API v1.2, Web v1.5, Android v1.0)
- ✅ CORS configuré pour accepter web + Android

### Pourquoi Uppy plutôt qu'une solution custom ?

**Avantages d'Uppy** :
- ✅ Features professionnelles (chunks, retry, progress)
- ✅ Framework-agnostic (pas besoin de wrapper React)
- ✅ Bien maintenu et testé en production
- ✅ UI personnalisable
- ✅ Support des gros fichiers avec chunks

**Alternative considérée** : FilePond
- Plus "Svelte-friendly" mais moins de features
- Pas de support natif des chunks
- Conclusion : Uppy est plus complet pour un gestionnaire de photos

### Pourquoi TanStack Query plutôt qu'un cache maison ?

**Avantages TanStack Query** :
- ✅ Moins de code à maintenir
- ✅ Cache automatique avec invalidation intelligente
- ✅ Prefetching pour améliorer la performance
- ✅ Optimistic updates (UI réactive)
- ✅ Retry automatique
- ✅ Bundle léger (~13kb)

**Cache maison** :
- ❌ Plus de code à écrire et maintenir
- ❌ Risque de bugs (invalidation, race conditions)
- ❌ Pas de prefetching out-of-the-box

**Conclusion** : TanStack Query fait gagner énormément de temps et est déjà très léger.

### Pourquoi SvelteKit plutôt que React/Vue ?

**Performance** :
- ✅ Svelte compile vers vanilla JS (pas de runtime)
- ✅ Bundle plus léger que React/Vue
- ✅ Pas de virtual DOM = moins de calculs

**Developer Experience** :
- ✅ Code plus concis (moins de boilerplate)
- ✅ Réactivité native (`$:` pour les computed values)
- ✅ Stores intégrés sans bibliothèque externe

**SvelteKit** :
- ✅ SSR/SPA hybride
- ✅ Routing file-based intégré
- ✅ Load functions pour le data fetching
- ✅ Adapters pour déployer partout (Node, Vercel, Netlify, statique)

**Alternative considérée** : React + Chonky
- Chonky = bibliothèque de gestionnaire de fichiers clé en main
- Mais écosystème React plus lourd
- Conclusion : On peut recréer les fonctionnalités de Chonky avec Svelte + Uppy + svelte-dnd-action

## Fonctionnalités prévues

### Phase 1 (MVP) - En cours
- [x] Structure du projet
- [x] Client API avec TanStack Query
- [x] Composant Uppy pour upload
- [ ] Liste des dossiers (FolderTree)
- [ ] Grille de photos (PhotoGrid avec virtualisation)
- [ ] Création de dossiers

### Phase 2
- [ ] Sélection multiple (Ctrl+Clic, Shift+Clic)
- [ ] Drag & drop pour réorganiser
- [ ] Prévisualisation des photos (lightbox)
- [ ] Recherche de photos
- [ ] Filtres (date, taille, type)

### Phase 3
- [ ] Extraction et affichage des métadonnées EXIF
- [ ] Géolocalisation sur carte
- [ ] Albums virtuels
- [ ] Partage de photos

### Phase 4
- [ ] Mode hors-ligne (PWA)
- [ ] Synchronisation avec l'app Android
- [ ] Export bulk (ZIP)
- [ ] Timeline automatique

## Interface inspirée de

**Référence UI** : FileRun, Nextcloud Photos

**Caractéristiques** :
- Arborescence de dossiers à gauche
- Grille de photos au centre
- Barre d'outils en haut (nouveau dossier, upload, vue)
- Drag & drop entre dossiers
- Sélection multiple avec checkbox
- Prévisualisation au clic

**Différence avec Ext.js** :
- Ext.js était une bibliothèque commerciale (Sencha) avec des composants riches
- Notre stack moderne (Svelte + Uppy + svelte-dnd-action) offre les mêmes fonctionnalités en open-source
- Performance meilleure avec Svelte (pas de framework lourd)

## Documentation API

L'API backend expose une documentation OpenAPI/Swagger accessible sur :
```
http://localhost:8000/api/doc
```

Cette documentation est automatiquement générée depuis les contrôleurs Symfony avec les annotations OpenAPI.

## CORS

Le backend Symfony doit être configuré pour accepter les requêtes cross-origin :

```yaml
# api/config/packages/nelmio_cors.yaml
nelmio_cors:
    defaults:
        origin_regex: true
        allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']
        allow_methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
        allow_headers: ['Content-Type', 'Authorization']
```

Regex CORS pour développement + production :
```
^https?://(localhost|.*\.yggdrasil\.cloud)(:[0-9]+)?$
```

## Authentification

### JWT Flow

1. **Login** : `POST /api/auth/login` avec credentials
2. **Réponse** : Token JWT dans le body
3. **Utilisation** : `apiClient.setToken(token)`
4. **Requêtes** : Header `Authorization: Bearer {token}` automatiquement ajouté

### Gestion du token

Le token peut être stocké :
- **Option 1** : LocalStorage (simple mais pas sécurisé pour XSS)
- **Option 2** : Cookie httpOnly (plus sécurisé, géré par le backend)
- **Option 3** : Memory + refresh token (best practice)

**TODO** : Implémenter la stratégie d'authentification choisie

## Contribution

### Conventions de code

- **TypeScript strict** : Tous les fichiers en `.ts` ou `.svelte` avec types
- **Prettier** : Formattage automatique
- **ESLint** : Linting avec plugin Svelte

### Structure des composants

```svelte
<script lang="ts">
	// 1. Imports
	import { onMount } from 'svelte';

	// 2. Props (exports)
	export let title: string;

	// 3. Variables et stores
	let count = 0;

	// 4. Reactive statements
	$: doubled = count * 2;

	// 5. Lifecycle et fonctions
	onMount(() => {
		console.log('Mounted');
	});

	function increment() {
		count++;
	}
</script>

<!-- 6. Template -->
<div>
	<h1>{title}</h1>
	<button on:click={increment}>Count: {count}</button>
</div>

<!-- 7. Styles scoped -->
<style>
	div {
		padding: 1rem;
	}
</style>
```

### Git workflow

Commits simples et descriptifs (pas de conventional commits) :
```
Configure Docker setup
Add TanStack Query integration
Create UppyUploader component
```

## Roadmap

- **v0.1** : Structure de base + client API
- **v0.2** : Liste dossiers + grille photos
- **v0.3** : Upload + création dossiers
- **v0.4** : Drag & drop + sélection multiple
- **v0.5** : EXIF + prévisualisation
- **v1.0** : App Android + sync

## Ressources

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Uppy Documentation](https://uppy.io/docs/)
- [API Backend](https://github.com/YggdrasilCloud/api)
