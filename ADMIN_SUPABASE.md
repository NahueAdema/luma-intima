# Administración de Luma Íntima

El sitio se publica como archivos estáticos. El catálogo consulta Supabase desde el navegador y el panel `/admin/` usa Supabase Auth para iniciar sesión. La clave publishable es pública por diseño; la contraseña de base de datos y cualquier `service_role` deben permanecer secretas y nunca deben agregarse a variables `VITE_`.

## Preparar Supabase

1. En Supabase, abrí **Authentication → Users** y creá el usuario administrador con el email y contraseña que quieras usar.
2. Abrí **SQL Editor** y ejecutá [`supabase/setup.sql`](supabase/setup.sql). Crea la tabla de productos, la lista de administradores, las políticas RLS y el bucket público de imágenes.
3. En el SQL Editor, autorizá el usuario reemplazando el correo en esta consulta:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'tu@email.com'
   on conflict do nothing;
   ```

4. En el entorno local, definí `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env`. Para Cloudflare Pages, cargá esas mismas dos variables en **Settings → Environment variables** para Production y Preview, y volvé a desplegar.

La URL y publishable key ya se toman de `SUPABASE_URL` y `PUBLISHABLE_KEY` del `.env` local. El `.env` está excluido de Git. No configures `BD_PASSWORD`, `DIRECTUS_URL` ni una clave `service_role` en el frontend.

## Uso

Entrá a `/admin/`, iniciá sesión y cargá productos. El panel permite crear, editar y eliminar, subir una imagen o pegar una URL, actualizar precios, categoría, talles, colores, stock y publicar cada producto en varias secciones a la vez. Las secciones se pueden desmarcar en cualquier momento. `supabase/setup.sql` agrega `secciones` y migra las etiquetas anteriores. El catálogo público se actualiza al recargar `/tienda/` y muestra los productos disponibles.

Para probar el panel antes de crear Supabase Auth, ejecutá `astro dev --background`. El acceso temporal solo aparece en desarrollo, trabaja con datos de muestra guardados en el navegador y se elimina del build de producción. No crea un usuario real ni sincroniza cambios con Supabase. Las credenciales de prueba se definen localmente y no se publican.

Para compilar el despliegue estático de Cloudflare Pages: `npm run build`. La carpeta de salida es `dist/`.
