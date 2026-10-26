import { configured, supabase } from '../lib/supabase';
import { readDemoProducts, type DemoProduct } from '../lib/demo-store';

type Product = DemoProduct;
const root = document.querySelector<HTMLElement>('.collection-page')!;
const grid = document.getElementById('productos-grid')!;
const count = document.getElementById('productos-count')!;
const notice = document.getElementById('catalog-notice')!;
const buttons = [...document.querySelectorAll<HTMLButtonElement>('.shop-filter')];
const sort = document.getElementById('catalog-sort') as HTMLSelectElement;
const search = document.getElementById('catalog-search') as HTMLInputElement;
const dialog = document.getElementById('product-dialog') as HTMLDialogElement;
const dialogContent = document.getElementById('product-dialog-content')!;
const collection = root.dataset.collection || 'all';
let products: Product[] = [];
let activeCategory = root.dataset.defaultCategory || 'todos';
const favoritesKey = 'luma-favorites-v1';

const money = (value: number) => `$${value.toLocaleString('es-AR')}`;
const getFavorites = () => { try { return new Set<string>(JSON.parse(localStorage.getItem(favoritesKey) || '[]')); } catch { return new Set<string>(); } };
function addText(tag: string, className: string, text: string) {
  const el = document.createElement(tag); el.className = className; el.textContent = text; return el;
}

function showProduct(product: Product) {
  dialogContent.replaceChildren();
  const card = document.createElement('div'); card.className = 'dialog-product';

  const media = document.createElement('div'); media.className = 'dialog-media';
  if (product.imagen_url) {
    const image = document.createElement('img'); image.src = product.imagen_url; image.alt = product.titulo; image.loading = 'eager'; image.decoding = 'async';
    media.append(image);
  }
  const badges = document.createElement('div'); badges.className = 'dialog-badges';
  if (product.nuevo) badges.append(addText('span', 'catalog-badge', 'Nuevo'));
  if (product.destacado || product.secciones?.includes('mas-vendidos')) badges.append(addText('span', 'catalog-badge dark', 'Más elegido'));
  if (product.secciones?.includes('seleccion-luma')) badges.append(addText('span', 'catalog-badge dark', 'Selección Luma'));
  if (product.precio_anterior) badges.append(addText('span', 'catalog-badge', 'Precio especial'));
  if (badges.childElementCount) media.append(badges);
  card.append(media);

  const copy = document.createElement('div'); copy.className = 'dialog-copy';
  copy.append(addText('p', 'catalog-category', product.categoria.replaceAll('-', ' ')));
  const heading = document.createElement('div'); heading.className = 'dialog-heading';
  heading.append(addText('h2', 'catalog-title', product.titulo));
  const fav = document.createElement('button'); fav.className = 'catalog-fav dialog-fav'; fav.type = 'button'; fav.textContent = getFavorites().has(product.id) ? '♥' : '♡';
  fav.setAttribute('aria-label', `Guardar ${product.titulo} en favoritos`); fav.setAttribute('aria-pressed', String(getFavorites().has(product.id)));
  fav.addEventListener('click', () => {
    const next = getFavorites();
    if (next.has(product.id)) next.delete(product.id); else next.add(product.id);
    localStorage.setItem(favoritesKey, JSON.stringify([...next]));
    fav.setAttribute('aria-pressed', String(next.has(product.id)));
    fav.textContent = next.has(product.id) ? '♥' : '♡';
  });
  heading.append(fav); copy.append(heading);

  const price = document.createElement('p'); price.className = 'catalog-price dialog-price';
  if (product.precio_anterior) price.append(addText('span', 'catalog-old-price', money(product.precio_anterior)));
  price.append(document.createTextNode(money(product.precio)));
  copy.append(price);

  copy.append(addText('p', 'catalog-description', product.descripcion || 'Una pieza especial, elegida para acompañarte con comodidad y estilo.'));

  const meta = document.createElement('div'); meta.className = 'dialog-meta';
  if (product.talles?.length) meta.append(addText('p', 'catalog-meta', `Talles disponibles: ${product.talles.join(' · ')}`));
  if (product.colores?.length) meta.append(addText('p', 'catalog-meta', `Colores: ${product.colores.join(' · ')}`));
  meta.append(addText('p', 'catalog-meta', product.en_stock ? 'Disponible en stock' : 'Agotado temporalmente'));
  copy.append(meta);

  card.append(copy); dialogContent.append(card); dialog.showModal();
}

function render() {
  const query = search.value.trim().toLocaleLowerCase('es-AR');
  let visible = products.filter((product) => product.en_stock);
  if (activeCategory !== 'todos') visible = visible.filter((product) => product.categoria === activeCategory);
  if (collection === 'new') visible = visible.filter((product) => product.nuevo || product.secciones?.includes('novedades'));
  if (collection === 'best') visible = visible.filter((product) => product.destacado || product.secciones?.includes('mas-vendidos'));
  if (collection === 'sale') visible = visible.filter((product) => product.secciones?.includes('promociones'));
  if (collection === 'favorites') { const saved = getFavorites(); visible = visible.filter((product) => saved.has(product.id)); }
  if (query) visible = visible.filter((product) => `${product.titulo} ${product.categoria} ${product.descripcion} ${product.colores.join(' ')}`.toLocaleLowerCase('es-AR').includes(query));
  if (sort.value === 'price-up') visible.sort((a, b) => a.precio - b.precio);
  if (sort.value === 'price-down') visible.sort((a, b) => b.precio - a.precio);
  if (sort.value === 'name') visible.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
  if (sort.value === 'recent') visible.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  count.textContent = `${visible.length} ${visible.length === 1 ? 'pieza' : 'piezas'}${notice.hidden ? '' : ' · colección de muestra'}`;
  grid.replaceChildren();
  if (!visible.length) { const empty = addText('div', 'catalog-empty', query ? 'No encontramos piezas con esa búsqueda. Probá con otra palabra.' : 'Estamos preparando nuevas piezas para esta colección.'); grid.append(empty); return; }
  const favorites = getFavorites();
  visible.forEach((product, index) => {
    const card = document.createElement('article'); card.className = 'catalog-card'; card.style.animationDelay = `${Math.min(index * 45, 300)}ms`;
    const media = document.createElement('div'); media.className = 'catalog-media';
    if (product.imagen_url) { const image = document.createElement('img'); image.src = product.imagen_url; image.alt = product.titulo; image.loading = index < 4 ? 'eager' : 'lazy'; image.decoding = 'async'; media.append(image); }
    const badges = document.createElement('div'); badges.className = 'catalog-badges';
    if (product.nuevo) badges.append(addText('span', 'catalog-badge', 'Nuevo'));
    if (product.destacado || product.secciones?.includes('mas-vendidos')) badges.append(addText('span', 'catalog-badge dark', 'Más elegido'));
    if (product.secciones?.includes('seleccion-luma')) badges.append(addText('span', 'catalog-badge dark', 'Selección Luma'));
    if (product.precio_anterior) badges.append(addText('span', 'catalog-badge', 'Precio especial'));
    if (badges.childElementCount) media.append(badges);
    const favorite = document.createElement('button'); favorite.className = 'catalog-fav'; favorite.type = 'button'; favorite.textContent = '♡'; favorite.setAttribute('aria-label', `Guardar ${product.titulo} en favoritos`); favorite.setAttribute('aria-pressed', String(favorites.has(product.id)));
    if (favorites.has(product.id)) favorite.textContent = '♥';
    favorite.addEventListener('click', () => { const next = getFavorites(); if (next.has(product.id)) next.delete(product.id); else next.add(product.id); localStorage.setItem(favoritesKey, JSON.stringify([...next])); favorite.setAttribute('aria-pressed', String(next.has(product.id))); favorite.textContent = next.has(product.id) ? '♥' : '♡'; });
    media.append(favorite);
    const view = addText('button', 'catalog-view', 'Ver detalles'); view.type = 'button'; view.addEventListener('click', () => showProduct(product)); media.append(view);
    const info = document.createElement('div'); info.className = 'catalog-info';
    info.append(addText('p', 'catalog-category', product.categoria.replaceAll('-', ' ')), addText('h2', 'catalog-title', product.titulo));
    const price = document.createElement('div'); price.className = 'catalog-price';
    if (product.precio_anterior) price.append(addText('span', 'catalog-old-price', money(product.precio_anterior)));
    price.append(document.createTextNode(money(product.precio)));
    info.append(price);
    if (product.talles?.length) info.append(addText('p', 'catalog-meta', `Talles ${product.talles.join(' · ')}`));
    card.append(media, info); grid.append(card);
  });
}

buttons.forEach((button) => button.addEventListener('click', () => {
  activeCategory = button.dataset.category || 'todos';
  buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  render();
}));
sort.addEventListener('change', render);
search.addEventListener('input', render);
search.value = new URLSearchParams(window.location.search).get('q') || '';
document.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

if (configured && supabase) {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (!error && data?.length) products = data as Product[];
}
if (!products.length) { products = readDemoProducts(); notice.hidden = false; }
render();
