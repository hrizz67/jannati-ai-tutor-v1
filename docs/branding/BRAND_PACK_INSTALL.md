# INSTALL

## 1. Salin aset
Copy folder ini ke projek:

```text
public/brand/
```

## 2. Salin component
Copy:

```text
src/components/BrandLogo.jsx
```

ke:

```text
src/components/BrandLogo.jsx
```

## 3. Update manifest
Gunakan kandungan:

```text
public/brand/brand/manifest-snippet.json
```

untuk update `manifest.json`.

## 4. Update favicon
Pastikan `index.html` guna:

```html
<link rel="icon" href="/brand/icons/favicon.ico" />
<link rel="apple-touch-icon" href="/brand/icons/apple-touch-icon.png" />
```

## 5. Guna logo dalam app
```jsx
import BrandLogo from "./components/BrandLogo";

<BrandLogo variant="horizontal" size="md" />
```

## 6. Build
```bash
npm run validate
npm run build
```
