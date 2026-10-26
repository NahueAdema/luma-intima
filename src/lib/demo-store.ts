export type DemoProduct = {
  id: string; titulo: string; precio: number; precio_anterior: number | null;
  descripcion: string; categoria: string; talles: string[]; colores: string[];
  imagen_url: string | null; secciones: string[]; destacado: boolean; nuevo: boolean; en_stock: boolean; created_at: string;
};

export const DEMO_PRODUCTS_KEY = 'luma-demo-products-v1';
export const DEMO_SESSION_KEY = 'luma-demo-admin-v1';

export const sampleProducts: DemoProduct[] = [
  { id: 'sample-1', titulo: 'Conjunto encaje negro', precio: 24990, precio_anterior: null, descripcion: 'Encaje delicado y calce pensado para sentirte cómoda.', categoria: 'conjuntos', talles: ['S','M','L','XL'], colores: ['Negro'], imagen_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=1000&auto=format&fit=crop', secciones: ['novedades','mas-vendidos'], destacado: true, nuevo: true, en_stock: true, created_at: '2026-10-23T12:00:00Z' },
  { id: 'sample-2', titulo: 'Body encaje premium', precio: 32990, precio_anterior: 39990, descripcion: 'Body de encaje floral con transparencias sutiles.', categoria: 'bodys', talles: ['S','M','L','XL'], colores: ['Negro','Nude'], imagen_url: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=1000&auto=format&fit=crop', secciones: ['mas-vendidos','seleccion-luma'], destacado: true, nuevo: false, en_stock: true, created_at: '2026-10-20T12:00:00Z' },
  { id: 'sample-3', titulo: 'Conjunto satén rosa', precio: 26990, precio_anterior: null, descripcion: 'Satén suave en un tono delicado, con terminaciones cuidadas.', categoria: 'conjuntos', talles: ['S','M','L'], colores: ['Rosa'], imagen_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1000&auto=format&fit=crop', secciones: ['novedades','mas-vendidos'], destacado: true, nuevo: true, en_stock: true, created_at: '2026-10-22T12:00:00Z' },
  { id: 'sample-4', titulo: 'Body encaje menta', precio: 28990, precio_anterior: null, descripcion: 'Una pieza versátil con encaje liviano y calce envolvente.', categoria: 'bodys', talles: ['M','L','XL'], colores: ['Menta'], imagen_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1000&auto=format&fit=crop', secciones: ['novedades'], destacado: false, nuevo: true, en_stock: true, created_at: '2026-10-21T12:00:00Z' },
  { id: 'sample-5', titulo: 'Conjunto satén rojo', precio: 29990, precio_anterior: null, descripcion: 'Textura satinada y detalles que elevan un clásico.', categoria: 'conjuntos', talles: ['S','M','L'], colores: ['Rojo'], imagen_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop', secciones: ['mas-vendidos','seleccion-luma'], destacado: true, nuevo: false, en_stock: true, created_at: '2026-10-18T12:00:00Z' },
  { id: 'sample-6', titulo: 'Conjunto tiras delicadas', precio: 25990, precio_anterior: null, descripcion: 'Tiras regulables y diseño ligero para sumar a tus favoritos.', categoria: 'conjuntos', talles: ['S','M'], colores: ['Negro'], imagen_url: 'https://images.unsplash.com/photo-1566479179817-c0fac1d2c6f6?q=80&w=1000&auto=format&fit=crop', secciones: ['novedades'], destacado: false, nuevo: true, en_stock: true, created_at: '2026-10-19T12:00:00Z' },
  { id: 'sample-7', titulo: 'Bombacha suave nude', precio: 10990, precio_anterior: 13990, descripcion: 'Microfibra suave con terminaciones delicadas para todos los días.', categoria: 'bombachas', talles: ['S','M','L','XL'], colores: ['Nude'], imagen_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop', secciones: ['promociones'], destacado: false, nuevo: false, en_stock: true, created_at: '2026-10-17T12:00:00Z' },
  { id: 'sample-8', titulo: 'Medias tul romántico', precio: 12990, precio_anterior: null, descripcion: 'Un detalle sutil de tul para completar tu conjunto.', categoria: 'medias', talles: ['Único'], colores: ['Negro'], imagen_url: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?q=80&w=1000&auto=format&fit=crop', secciones: ['novedades','seleccion-luma'], destacado: false, nuevo: true, en_stock: true, created_at: '2026-10-24T12:00:00Z' },
];

export function readDemoProducts(): DemoProduct[] {
  try {
    const saved = localStorage.getItem(DEMO_PRODUCTS_KEY);
    return saved ? JSON.parse(saved) as DemoProduct[] : sampleProducts.map((product) => ({ ...product, talles: [...product.talles], colores: [...product.colores], secciones: [...product.secciones] }));
  } catch { return sampleProducts.map((product) => ({ ...product })); }
}

export function writeDemoProducts(products: DemoProduct[]) {
  localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(products));
}
