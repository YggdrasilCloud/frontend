# Backend Image Optimization Recommendations

Ce document liste les optimisations à implémenter côté backend pour améliorer les performances de chargement des images.

## 🎯 Objectifs

- Réduire la latence de chargement des images
- Minimiser la bande passante utilisée
- Améliorer l'expérience utilisateur (preview, scrubbing)
- Maximiser l'efficacité du cache navigateur/CDN

## 📋 Recommandations prioritaires

### 1. Headers de cache agressifs

**Pour les thumbnails (immutables)** :

```http
Cache-Control: public, max-age=31536000, immutable
ETag: "hash-du-fichier"
Last-Modified: Mon, 11 Oct 2024 12:00:00 GMT
```

**Rationale** :

- `max-age=31536000` : cache 1 an (thumbnails ne changent jamais)
- `immutable` : évite les validations inutiles même lors d'un refresh
- `ETag` : permet validation conditionnelle si nécessaire

**Pour les images originales** :

```http
Cache-Control: public, max-age=86400
ETag: "hash-du-fichier"
Last-Modified: Mon, 11 Oct 2024 12:00:00 GMT
```

**Implémentation recommandée** :

```php
// Symfony Controller
public function servePhoto(string $photoId): Response
{
    $photo = $this->photoRepository->find($photoId);

    return $this->file($photo->getStoragePath(), $photo->getFileName(), [
        'Content-Type' => $photo->getMimeType(),
        'Cache-Control' => 'public, max-age=31536000, immutable',
        'ETag' => md5_file($photo->getStoragePath()),
        'Last-Modified' => $photo->getUploadedAt()->format('D, d M Y H:i:s') . ' GMT',
    ]);
}
```

### 2. Support du Range header (HTTP 206)

**Objectif** : Permettre le chargement progressif et le scrubbing vidéo.

**Headers requis** :

```http
Accept-Ranges: bytes
Content-Range: bytes 0-1023/4096
Content-Length: 1024
```

**Implémentation recommandée** :

```php
public function servePhoto(string $photoId, Request $request): Response
{
    $photo = $this->photoRepository->find($photoId);
    $filePath = $photo->getStoragePath();
    $fileSize = filesize($filePath);

    // Vérifier si le client demande un range
    $range = $request->headers->get('Range');

    if ($range) {
        // Parse "bytes=0-1023"
        preg_match('/bytes=(\d+)-(\d*)/', $range, $matches);
        $start = (int) $matches[1];
        $end = $matches[2] !== '' ? (int) $matches[2] : $fileSize - 1;

        $stream = fopen($filePath, 'rb');
        fseek($stream, $start);
        $data = fread($stream, $end - $start + 1);
        fclose($stream);

        return new Response($data, 206, [
            'Content-Type' => $photo->getMimeType(),
            'Content-Range' => "bytes $start-$end/$fileSize",
            'Content-Length' => $end - $start + 1,
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    // Réponse normale
    return $this->file($filePath);
}
```

### 3. Servir les images via URLs directes

**❌ Éviter** :

```
GET /api/photos/{id}/file (passe par PHP à chaque fois)
```

**✅ Préférer** :

```
GET /uploads/photos/2024/10/abc123.jpg (servi directement par Nginx)
GET /uploads/thumbnails/2024/10/abc123_300x300.jpg (servi directement par Nginx)
```

**Configuration Nginx recommandée** :

```nginx
location /uploads/ {
    # Servir directement les fichiers statiques
    alias /var/www/api/storage/uploads/;

    # Headers de cache agressifs
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Content-Type-Options "nosniff";

    # Support Range
    add_header Accept-Ranges bytes;

    # Compression (mais pas pour les images déjà compressées)
    gzip off;

    # Logs
    access_log off;
    error_log /var/log/nginx/uploads_error.log error;
}

location /uploads/thumbnails/ {
    alias /var/www/api/storage/uploads/thumbnails/;

    # Cache encore plus agressif pour les thumbnails
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header X-Content-Type-Options "nosniff";

    access_log off;
}
```

### 4. URLs signées temporaires (si authentification nécessaire)

**Use case** : Photos privées accessibles uniquement par le propriétaire.

**Implémentation** :

```php
class SignedUrlGenerator
{
    public function generateSignedUrl(Photo $photo, int $expiresInSeconds = 3600): string
    {
        $expires = time() + $expiresInSeconds;
        $path = $photo->getStoragePath();

        // Créer une signature HMAC
        $signature = hash_hmac('sha256', $path . $expires, $_ENV['APP_SECRET']);

        return sprintf(
            '/uploads/photos/%s?expires=%d&signature=%s',
            basename($path),
            $expires,
            $signature
        );
    }
}

// Nginx vérifie la signature via Lua ou redirige vers PHP
```

**Alternative plus simple** : Générer un token JWT court (5-10 min).

### 5. Compression et HTTP/2

**Nginx configuration** :

```nginx
# HTTP/2
listen 443 ssl http2;

# Compression (uniquement pour HTML/CSS/JS, pas pour images)
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_vary on;

# Pas de compression pour les images (déjà compressées)
gzip_disable "MSIE [1-6]\.";
```

**Brotli (meilleur que gzip)** :

```nginx
brotli on;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml;
brotli_comp_level 6;
```

### 6. Keep-Alive et connexions persistantes

```nginx
# Keep-Alive
keepalive_timeout 65;
keepalive_requests 100;

# HTTP/2 Server Push (optionnel)
http2_push_preload on;
```

### 7. Versionnement des thumbnails

**Problème** : Si un thumbnail change, le cache navigateur le garde.

**Solution** : Ajouter un hash dans l'URL.

```
/uploads/thumbnails/abc123_300x300_v2.jpg
/uploads/thumbnails/abc123_300x300.jpg?v=abc123hash
```

**Implémentation** :

```php
class PhotoDto
{
    public string $thumbnailUrl;

    public static function fromPhoto(Photo $photo): self
    {
        $dto = new self();
        $dto->thumbnailUrl = sprintf(
            '/uploads/thumbnails/%s?v=%s',
            basename($photo->getThumbnailPath()),
            substr(md5_file($photo->getThumbnailPath()), 0, 8)
        );
        return $dto;
    }
}
```

## 📊 Gains attendus

| Optimisation         | Gain latence          | Gain bande passante |
| -------------------- | --------------------- | ------------------- |
| Cache headers (1 an) | -90% (cache hit)      | -95%                |
| Thumbnails (300x300) | -75% (vs original)    | -75%                |
| Range support        | +50% UX (progressive) | Variable            |
| Nginx direct         | -50ms (vs PHP)        | 0%                  |
| HTTP/2               | -20% (multiplexing)   | -10%                |

**Total attendu** : **~85% réduction latence**, **~80% réduction bande passante**.

## 🔍 Validation

### Tests à effectuer

```bash
# Vérifier les headers de cache
curl -I https://api.yggdrasil.cloud/uploads/thumbnails/photo.jpg

# Vérifier le support Range
curl -I -H "Range: bytes=0-1023" https://api.yggdrasil.cloud/uploads/photos/photo.jpg

# Mesurer la latence
curl -w "@curl-format.txt" -o /dev/null -s https://api.yggdrasil.cloud/uploads/thumbnails/photo.jpg
```

**curl-format.txt** :

```
time_namelookup:  %{time_namelookup}\n
time_connect:     %{time_connect}\n
time_starttransfer: %{time_starttransfer}\n
time_total:       %{time_total}\n
```

### Outils de monitoring

- **Chrome DevTools** : Network tab → Headers → Cache-Control
- **WebPageTest** : https://www.webpagetest.org/
- **Lighthouse** : Audit performance dans Chrome
- **curl** : Vérification headers HTTP

## 🚀 Roadmap d'implémentation

**Phase 1** (backend actuel) :

- ✅ Génération de thumbnails
- ✅ API endpoints `/api/photos/{id}/file`
- ✅ DTOs avec `fileUrl` et `thumbnailUrl`

**Phase 2** (à implémenter) :

- [ ] Configuration Nginx pour servir `/uploads/` en statique
- [ ] Headers de cache agressifs sur les thumbnails
- [ ] Support du Range header (HTTP 206)

**Phase 3** (optimisations avancées) :

- [ ] URLs signées pour photos privées
- [ ] HTTP/2 + Brotli compression
- [ ] CDN (Cloudflare/AWS CloudFront)

**Phase 4** (futur) :

- [ ] WebP/AVIF format support
- [ ] Responsive images (srcset)
- [ ] Lazy loading natif

## 📚 Références

- [HTTP Caching - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Range Requests - RFC 7233](https://tools.ietf.org/html/rfc7233)
- [HTTP/2 - RFC 7540](https://tools.ietf.org/html/rfc7540)
- [Nginx Performance Tuning](https://www.nginx.com/blog/tuning-nginx/)
