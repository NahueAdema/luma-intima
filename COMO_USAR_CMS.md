# Instrucciones para usar el panel de administración

## Desarrollo local (ahora mismo)

Para probar el CMS en local necesitas 2 terminales abiertas:

**Terminal 1 - Servidor del CMS:**
```bash
npx decap-server
```

**Terminal 2 - Servidor de Astro:**
```bash
npm run dev
```

Una vez ambos corriendo, abrir: [http://localhost:4321/admin/](http://localhost:4321/admin/)

Ya está configurado con `local_backend: true`, no necesita login con Git en local. Podés crear, editar y eliminar productos directamente.

## Cómo subir productos

1. Ir a `/admin/`
2. Click en **Productos** > **New Productos**
3. Completar todos los campos:
   - **Título**: Nombre del producto
   - **Precio**: Solo número (ej: 24990)
   - **Precio anterior**: Opcional, para mostrar oferta
   - **Descripción**: Descripción breve
   - **Categoría**: Seleccionar de la lista
   - **Talles disponibles**: Agregar cada talle con el botón +
   - **Colores disponibles**: Agregar cada color con el botón +
   - **Imágenes del producto**: Poner URLs de las imágenes (podés usar Unsplash)
   - **Producto destacado**: Marcar para mostrar en "Más Vendidos"
   - **Producto nuevo**: Marcar para mostrar badge "NUEVO"
   - **En stock**: Marcar si hay stock
   - **Material**: Opcional
   - **Instrucciones de cuidado**: Opcional
4. Click **Publish** > **Publish now**
5. Los productos se guardarán en `src/content/productos/` y aparecerán automáticamente en la tienda

## Producción (Cloudflare Pages)

Para que funcione en tu sitio publicado:

1. Subir todo a GitHub/GitLab
2. Conectar con Cloudflare Pages (Build: `npm run build`, Output: `dist`)
3. Configurar **Netlify Identity** + **Git Gateway** para autenticación
4. Invitar a tu clienta por email
5. Ella podrá entrar a `tudominio.com/admin/` con su usuario y contraseña

## Acceso directo
**Panel admin:** `/admin/`
**Tienda:** `/tienda/`
**Nosotras:** `/nosotras/`
**Contacto:** `/contacto/`
