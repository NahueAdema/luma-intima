import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const productosCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/productos' }),
  schema: z.object({
    titulo: z.string(),
    precio: z.number(),
    precioAnterior: z.number().optional(),
    descripcion: z.string().optional(),
    categoria: z.enum(['conjuntos', 'bombachas', 'bodys', 'ropa-deportiva', 'sexshop', 'medias', 'boxers', 'promociones']),
    talles: z.array(z.string()).default([]),
    colores: z.array(z.string()).default([]),
    imagenes: z.array(z.string()).default([]),
    destacado: z.boolean().default(false),
    nuevo: z.boolean().default(false),
    enStock: z.boolean().default(true),
    material: z.string().optional(),
    cuidados: z.string().optional(),
    fecha: z.coerce.date().optional(),
  }),
});

export const collections = {
  'productos': productosCollection,
};
