# Frontend Image Optimization

Ce document décrit les optimisations d'images déjà implémentées côté frontend et les améliorations futures possibles.

## ✅ Optimisations déjà implémentées

### 1. Lazy Loading natif

**Implémentation** : `src/routes/photos/[folderId]/+page.svelte`

```svelte
<img src={getImageUrl(photo)} alt={photo.fileName} loading="lazy" width="200" height="200" />
```

**Avantages** :

- ✅ Images chargées uniquement quand visibles dans le viewport
- ✅ Réduit la bande passante initiale
- ✅ Améliore le temps de chargement initial (FCP, LCP)
- ✅ Support natif navigateur (pas de JS supplémentaire)

**Support navigateur** : 97%+ (tous navigateurs modernes)

### 2. Dimensions explicites (width/height)

**Avantages** :

- ✅ Évite le Cumulative Layout Shift (CLS)
- ✅ Le navigateur réserve l'espace avant le chargement
- ✅ Améliore le score Lighthouse

**Note** : Les dimensions sont fixes (200x200) car les thumbnails sont carrés.

### 3. Stratégie thumbnail-first via PhotoUrlBuilder

**Implémentation** : `src/lib/domain/photo/PhotoUrlBuilder.ts`

```typescript
buildDisplayUrl(photo: PhotoDto): string {
    // Stratégie : thumbnail first
    if (photo.thumbnailUrl) {
        return this.buildAbsoluteUrl(photo.thumbnailUrl);
    }
    // Fallback : image originale
    return this.buildPhotoFileUrl(photo.id);
}
```

**Avantages** :

- ✅ Utilise thumbnails 300x300 (~4KB) au lieu de l'original (~17KB)
- ✅ **Réduction de 75% de la bande passante**
- ✅ Fallback automatique pour anciennes photos
- ✅ Logique métier centralisée (DDD)

### 4. Attribut alt pour l'accessibilité

```svelte
<img alt={photo.fileName} />
```

**Avantages** :

- ✅ Accessibilité (lecteurs d'écran)
- ✅ SEO
- ✅ Texte affiché si l'image ne charge pas

## 🚀 Optimisations futures recommandées

### 1. Responsive images avec srcset

**Objectif** : Servir différentes tailles selon la résolution de l'écran.

**Implémentation proposée** :

```svelte
<img
	src={photoUrlBuilder.buildThumbnailUrl(photo, 300)}
	srcset="
        {photoUrlBuilder.buildThumbnailUrl(photo, 150)} 150w,
        {photoUrlBuilder.buildThumbnailUrl(photo, 300)} 300w,
        {photoUrlBuilder.buildThumbnailUrl(photo, 600)} 600w
    "
	sizes="(max-width: 640px) 150px, (max-width: 1024px) 300px, 600px"
	alt={photo.fileName}
	loading="lazy"
	width="300"
	height="300"
/>
```

**Gains attendus** :

- Mobile : -50% bande passante (150x150 au lieu de 300x300)
- Desktop HD : +25% qualité (600x600 sur écrans Retina)

**Prérequis backend** :

- Générer plusieurs tailles de thumbnails (150, 300, 600, 1200)
- Ajouter ces URLs dans le DTO

### 2. Format WebP/AVIF

**Objectif** : Utiliser des formats modernes plus compressés.

```svelte
<picture>
	<source srcset={photo.avifUrl} type="image/avif" />
	<source srcset={photo.webpUrl} type="image/webp" />
	<img src={photo.jpegUrl} alt={photo.fileName} loading="lazy" />
</picture>
```

**Gains attendus** :

- WebP : -25% à -35% vs JPEG
- AVIF : -40% à -50% vs JPEG

**Prérequis backend** :

- Générer versions WebP et AVIF à l'upload
- Ajouter ces URLs dans le DTO

### 3. Préchargement des images critiques

**Use case** : Précharger la première image de la grille pour améliorer le LCP.

```svelte
<svelte:head>
	{#if $photos.data?.data[0]}
		<link rel="preload" as="image" href={getImageUrl($photos.data.data[0])} />
	{/if}
</svelte:head>
```

**Gains attendus** : -200ms sur LCP (Largest Contentful Paint).

### 4. Blur placeholder (LQIP)

**Objectif** : Afficher un placeholder flou pendant le chargement.

**Implémentation** :

```svelte
<div class="image-container">
	<img src={photo.placeholderBase64} class="placeholder" aria-hidden="true" />
	<img
		src={getImageUrl(photo)}
		alt={photo.fileName}
		loading="lazy"
		class="real-image"
		on:load={() => (loaded = true)}
	/>
</div>

<style>
	.placeholder {
		filter: blur(20px);
		transform: scale(1.1);
	}
	.real-image {
		opacity: 0;
		transition: opacity 0.3s;
	}
	.real-image.loaded {
		opacity: 1;
	}
</style>
```

**Prérequis backend** :

- Générer un placeholder 20x20 en base64
- L'inclure dans le DTO (~1KB par image)

### 5. Intersection Observer avancé

**Objectif** : Précharger les images juste avant qu'elles ne soient visibles.

```typescript
const observer = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const img = entry.target as HTMLImageElement;
				img.src = img.dataset.src!;
				observer.unobserve(img);
			}
		});
	},
	{ rootMargin: '50px' } // Précharge 50px avant d'être visible
);
```

**Gains** : Préchargement anticipé = impression de chargement instantané.

### 6. Virtual scrolling pour grandes listes

**Use case** : Dossiers avec 1000+ photos.

**Implémentation avec svelte-virtual-list** :

```svelte
<script>
	import VirtualList from 'svelte-virtual-list';

	const photos = $photos.data.data;
</script>

<VirtualList items={photos} let:item>
	<PhotoCard photo={item} />
</VirtualList>
```

**Gains** :

- Seules ~20 images rendues dans le DOM (vs 1000)
- Performance scroll fluide même avec 10000+ photos

## 📊 Performance actuelle vs objectifs

| Métrique              | Actuel     | Objectif            | Status    |
| --------------------- | ---------- | ------------------- | --------- |
| Lazy loading          | ✅ Actif   | ✅                  | Atteint   |
| Dimensions explicites | ✅ 200x200 | ✅                  | Atteint   |
| Thumbnails            | ✅ 300x300 | ✅                  | Atteint   |
| srcset                | ❌ Absent  | ✅ Multi-sizes      | À faire   |
| WebP/AVIF             | ❌ Absent  | ✅ Formats modernes | À faire   |
| LQIP                  | ❌ Absent  | ⚠️ Nice-to-have     | Optionnel |

## 🔧 Mesures et monitoring

### Lighthouse scores cibles

```
Performance: 90+
Accessibility: 95+
Best Practices: 95+
SEO: 90+
```

### Métriques Web Vitals cibles

```
LCP (Largest Contentful Paint): < 2.5s
FID (First Input Delay): < 100ms
CLS (Cumulative Layout Shift): < 0.1
```

### Outils de mesure

- **Chrome DevTools** : Performance tab
- **Lighthouse** : `npm run lighthouse`
- **WebPageTest** : https://www.webpagetest.org/
- **Real User Monitoring** : Sentry Performance

## 🚀 Roadmap d'implémentation

**Phase actuelle** :

- ✅ Lazy loading natif
- ✅ Dimensions explicites
- ✅ Thumbnail-first strategy
- ✅ Alt text pour accessibilité

**Phase 2** (next) :

- [ ] Responsive images (srcset)
- [ ] WebP format support
- [ ] Préchargement image critique

**Phase 3** (futur) :

- [ ] AVIF format support
- [ ] LQIP (blur placeholder)
- [ ] Virtual scrolling pour grandes listes

## 📚 Références

- [Lazy loading - web.dev](https://web.dev/lazy-loading-images/)
- [Responsive images - MDN](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [WebP - Google Developers](https://developers.google.com/speed/webp)
- [Web Vitals - web.dev](https://web.dev/vitals/)
