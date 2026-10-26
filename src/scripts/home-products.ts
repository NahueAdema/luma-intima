import { configured, supabase } from '../lib/supabase';
import { readDemoProducts, type DemoProduct } from '../lib/demo-store';

type Product = DemoProduct;
const samples = readDemoProducts();
let products = samples;
if (configured && supabase) {
  const { data, error } = await supabase.from('products').select('*').eq('en_stock', true).order('created_at', { ascending: false });
  if (!error && data?.length) products = data as Product[];
}

function card(product: Product, badge?: string) {
  const link = document.createElement('a'); link.className = 'product-card'; link.href = '/tienda/'; link.setAttribute('aria-label', `Ver ${product.titulo} en la tienda`);
  const media = document.createElement('div'); media.className = 'product-image-wrapper';
  if (badge) { const label = document.createElement('span'); label.className = 'product-badge'; label.textContent = badge; media.append(label); }
  if (product.imagen_url) { const image = document.createElement('img'); image.src = product.imagen_url; image.alt = product.titulo; image.className = 'product-image'; image.loading = 'lazy'; image.decoding = 'async'; media.append(image); }
  const details = document.createElement('div'); details.className = 'product-info';
  const name = document.createElement('h3'); name.className = 'product-name'; name.textContent = product.titulo;
  const price = document.createElement('p'); price.className = 'product-price'; price.textContent = `$${product.precio.toLocaleString('es-AR')}`;
  details.append(name, price); link.append(media, details); return link;
}

const newGrid = document.getElementById('home-new-products');
const bestGrid = document.getElementById('home-best-products');
if (newGrid) {
  const recent = products.filter((product) => product.nuevo || product.secciones?.includes('novedades')).slice(0, 5);
  newGrid.replaceChildren(...recent.map((product) => card(product, 'NOVEDAD')));
  newGrid.hidden = false;
}
if (bestGrid) {
  const favorites = products.filter((product) => product.destacado || product.secciones?.includes('mas-vendidos')).slice(0, 4);
  bestGrid.replaceChildren(...favorites.map((product) => card(product, 'FAVORITO')));
  bestGrid.hidden = false;
}
