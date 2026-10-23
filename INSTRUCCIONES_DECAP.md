# Cómo usar Decap CMS para subir productos

## Opción 1: Desarrollo local (para probar ahora)

1. Abrir dos terminales en la carpeta del proyecto:
   - Terminal 1: npx decap-server
   - Terminal 2: npm run dev

2. Abrir en el navegador: http://localhost:4321/admin/

3. Con local_backend: true ya configurado, podes entrar directamente y empezar a crear productos.

## Opción 2: Producción (en Cloudflare Pages + Git)

Para que funcione en producción con Git Gateway:

### Paso 1: Subir el repositorio a GitHub/GitLab
Subir todo el proyecto a un repositorio Git.

### Paso 2: Configurar Cloudflare Pages
1. Ir a pages.cloudflare.com
2. Conectar con Git y seleccionar el repositorio
3. Build command: npm run build
4. Build output directory: dist
5. Deploy

### Paso 3: Habilitar Git Gateway
1. Configurar Netlify Identity o Decap CMS Auth
2. Habilitar Git Gateway
3. Invitar al email de tu clienta
4. Ella podrá loguearse en tusitio.com/admin/ con su email + contraseña

## Cómo subir productos

Una vez logueada en /admin/:

1. Click en "Productos" → "New Productos"
2. Completar: Título, Precio, Categoría, Talles, Colores, Imágenes, etc.
3. Marcar "Producto nuevo" o "Destacado" si corresponde
4. Click "Publish" → "Publish now"
5. El sitio se reconstruirá automáticamente en producción

## Notas importantes
- Las imágenes pueden subirse o usar URLs
- Los talles y colores se agregan con el botón +
- El panel está en: tu-dominio.com/admin/
