import { configured, supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { DEMO_SESSION_KEY, readDemoProducts, writeDemoProducts } from '../lib/demo-store';

type Product = { id: string; titulo: string; precio: number; precio_anterior: number | null; descripcion: string | null; categoria: string; talles: string[]; colores: string[]; imagen_url: string | null; secciones: string[]; destacado: boolean; nuevo: boolean; en_stock: boolean; created_at?: string };
const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
const temporaryCredentials = import.meta.env.DEV && import.meta.env.VITE_DEV_ADMIN_EMAIL && import.meta.env.VITE_DEV_ADMIN_PASSWORD
  ? { email: String(import.meta.env.VITE_DEV_ADMIN_EMAIL), password: String(import.meta.env.VITE_DEV_ADMIN_PASSWORD) }
  : null;

let currentUser: User | null = null;
let products: Product[] = [];
let demoMode = false;

function setMessage(el: HTMLElement | null, message: string, success = false) {
  if (!el) return;
  el.textContent = message; el.classList.toggle('success', success);
}
function formData() { const f = document.getElementById('product-form') as HTMLFormElement | null; return f ? new FormData(f) : null; }

async function isAdmin(user: User) {
  if (!supabase) return false;
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

function showDemoDashboard() {
  demoMode = true; currentUser = null;
  sessionStorage.setItem(DEMO_SESSION_KEY, 'active');
  const lp = document.getElementById('login-panel'); if (lp) lp.hidden = true;
  const db = document.getElementById('dashboard'); if (db) db.hidden = false;
  const heading = document.querySelector<HTMLElement>('.dashboard-heading .muted, .dashboard-intro');
  void loadProducts();
}

async function showDashboard(user: User) {
  demoMode = false; currentUser = user;
  try {
    if (!(await isAdmin(user))) {
      await supabase?.auth.signOut();
      const lp = document.getElementById('login-panel'); if (lp) lp.hidden = false;
      const db = document.getElementById('dashboard'); if (db) db.hidden = true;
      setMessage(byId<HTMLElement>('login-error'), 'Esta cuenta no tiene permisos de administración.'); return;
    }
    const lp = document.getElementById('login-panel'); if (lp) lp.hidden = true;
    const db = document.getElementById('dashboard'); if (db) db.hidden = false;
    await loadProducts();
  } catch (error) {
    const lp = document.getElementById('login-panel'); if (lp) lp.hidden = false;
    const db = document.getElementById('dashboard'); if (db) db.hidden = true;
    setMessage(byId<HTMLElement>('login-error'), error instanceof Error ? error.message : 'No se pudo validar el acceso.');
  }
}

function safeImage(url: string | null) {
  if (!url) return '';
  if (/^data:image\/(?:jpeg|png|webp|avif);base64,/i.test(url)) return url;
  try { const parsed = new URL(url, location.origin); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''; } catch { return ''; }
}

function renderProducts() {
  const countEl = byId<HTMLElement>('product-count');
  const list = byId<HTMLElement>('product-list');
  if (countEl) countEl.textContent = String(products.length);
  const statProducts = byId<HTMLElement>('stat-products'); if (statProducts) statProducts.textContent = String(products.length);
  const statStock = byId<HTMLElement>('stat-stock'); if (statStock) statStock.textContent = String(products.filter((p) => p.en_stock).length);
  const statFeatured = byId<HTMLElement>('stat-featured'); if (statFeatured) statFeatured.textContent = String(products.filter((p) => p.secciones?.includes('mas-vendidos') || p.destacado).length);
  const statNew = byId<HTMLElement>('stat-new'); if (statNew) statNew.textContent = String(products.filter((p) => p.secciones?.includes('novedades') || p.nuevo).length);

  const searchInput = byId<HTMLInputElement>('inventory-search');
  const query = searchInput ? searchInput.value.trim().toLocaleLowerCase('es-AR') : '';
  const visible = products.filter((p) => !query || `${p.titulo} ${p.categoria}`.toLocaleLowerCase('es-AR').includes(query));
  if (!list) return;
  if (!visible.length) {
    const empty = document.createElement('div'); empty.className = 'empty-state';
    empty.append(Object.assign(document.createElement('span'), { textContent: query ? '⌕' : '✳' }));
    empty.append(Object.assign(document.createElement('b'), { textContent: query ? 'No encontramos esa pieza' : 'Tu catálogo está esperando' }));
    empty.append(Object.assign(document.createElement('small'), { textContent: query ? 'Probá con otro nombre o categoría.' : 'Agregá tu primer producto para empezar.' }));
    list.replaceChildren(empty); return;
  }
  list.replaceChildren(...visible.map((product) => {
    const row = document.createElement('article'); row.className = 'product-row';
    const imageUrl = safeImage(product.imagen_url);
    const media = imageUrl ? Object.assign(document.createElement('img'), { src: imageUrl, alt: product.titulo }) : Object.assign(document.createElement('span'), { className: 'image-placeholder', textContent: '✿' });
    const info = document.createElement('div');
    const title = Object.assign(document.createElement('p'), { className: 'row-title', textContent: product.titulo });
    const sectionLabel = product.secciones?.length ? ` · ${product.secciones.length} sección${product.secciones.length === 1 ? '' : 'es'}` : '';
    const meta = Object.assign(document.createElement('p'), { className: 'row-meta', textContent: `${product.categoria.replaceAll('-', ' ')} · $${product.precio.toLocaleString('es-AR')}${sectionLabel} · ${product.en_stock ? 'En stock' : 'Agotado'}` });
    info.append(title, meta);
    const actions = document.createElement('div'); actions.className = 'row-actions';
    const edit = Object.assign(document.createElement('a'), { href: `/admin/producto/?id=${product.id}`, textContent: 'Editar' });
    edit.addEventListener('click', (e) => { /* allow navigation */ });
    const remove = Object.assign(document.createElement('button'), { type: 'button', className: 'delete', textContent: 'Eliminar' });
    remove.addEventListener('click', () => deleteProduct(product));
    actions.append(edit, remove);
    row.append(media, info, actions); return row;
  }));
}

async function loadProducts() {
  if (demoMode) { products = readDemoProducts() as Product[]; renderProducts(); return; }
  const list = byId<HTMLElement>('product-list'); if (list) list.innerHTML = '<div class="empty-state">Cargando catálogo…</div>';
  if (!supabase) return;
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) { if (list) list.innerHTML = ''; setMessage(byId<HTMLElement>('product-message'), error.message); return; }
  products = (data ?? []) as Product[]; renderProducts();
}

function resetForm() {
  const form = byId<HTMLFormElement>('product-form'); if (form) form.reset();
  const idInput = form?.elements.namedItem('id') as HTMLInputElement | null; if (idInput) idInput.value = '';
  const existing = form?.elements.namedItem('existing_image') as HTMLInputElement | null; if (existing) existing.value = '';
  const et = byId<HTMLElement>('editor-title'); if (et) et.textContent = 'Nuevo producto';
  const sb = byId<HTMLButtonElement>('save-button'); if (sb) sb.innerHTML = 'Guardar producto <span>→</span>';
  const ce = byId<HTMLButtonElement>('cancel-edit'); if (ce) ce.hidden = true;
  const ip = byId<HTMLImageElement>('image-preview'); if (ip) { ip.hidden = true; ip.removeAttribute('src'); }
  const enStock = form?.elements.namedItem('enStock') as HTMLInputElement | null; if (enStock) enStock.checked = true;
  setMessage(byId<HTMLElement>('product-message'), '');
}

function editProduct(product: Product) {
  const form = byId<HTMLFormElement>('product-form'); if (!form) return;
  const set = (name: string, value: string) => { const el = form.elements.namedItem(name) as HTMLInputElement | null; if (el) el.value = value; };
  set('id', product.id); set('existing_image', product.imagen_url ?? ''); set('titulo', product.titulo); set('precio', String(product.precio));
  set('precioAnterior', product.precio_anterior ? String(product.precio_anterior) : ''); set('categoria', product.categoria); set('descripcion', product.descripcion ?? ''); set('talles', product.talles.join(', ')); set('colores', product.colores.join(', '));
  const sections = product.secciones?.length ? product.secciones : [...(product.nuevo ? ['novedades'] : []), ...(product.destacado ? ['mas-vendidos'] : [])];
  form.querySelectorAll<HTMLInputElement>('input[name="secciones"]').forEach((input) => { input.checked = sections.includes(input.value); });
  const enStock = form.elements.namedItem('enStock') as HTMLInputElement | null; if (enStock) enStock.checked = product.en_stock;
  const ip = byId<HTMLImageElement>('image-preview'); if (product.imagen_url && ip) { ip.src = product.imagen_url; ip.hidden = false; }
  const et = byId<HTMLElement>('editor-title'); if (et) et.textContent = 'Editar producto';
  const sb = byId<HTMLButtonElement>('save-button'); if (sb) sb.innerHTML = 'Guardar cambios <span>→</span>';
  const ce = byId<HTMLButtonElement>('cancel-edit'); if (ce) ce.hidden = false;
}

async function deleteProduct(product: Product) {
  if (!confirm(`¿Eliminar “${product.titulo}” del catálogo?`)) return;
  if (demoMode) writeDemoProducts(products.filter((item) => item.id !== product.id));
  else {
    if (!supabase) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) { setMessage(byId<HTMLElement>('product-message'), error.message); return; }
  }
  if (!demoMode && product.imagen_url?.includes('/product-images/')) {
    const path = product.imagen_url.split('/product-images/')[1]?.split('?')[0];
    if (path && supabase) await supabase.storage.from('product-images').remove([decodeURIComponent(path)]);
  }
  const form = byId<HTMLFormElement>('product-form');
  const idInput = form?.elements.namedItem('id') as HTMLInputElement | null;
  if (idInput?.value === product.id) resetForm();
  setMessage(byId<HTMLElement>('product-message'), 'Producto eliminado.', true);
  await loadProducts();
}

// Auth init
if (temporaryCredentials) {
  const help = document.querySelector<HTMLElement>('.login-help');
  if (help) help.textContent = `Acceso temporal local: ${temporaryCredentials.email} · ${temporaryCredentials.password}. Guardado solo en este navegador; no es una cuenta de Supabase.`;
}

const loginForm = byId<HTMLFormElement>('login-form');
loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  const email = String(data.get('email'));
  const password = String(data.get('password'));
  if (temporaryCredentials && email === temporaryCredentials.email && password === temporaryCredentials.password) { showDemoDashboard(); return; }
  if (!configured || !supabase) { setMessage(byId<HTMLElement>('login-error'), 'El acceso real requiere configurar Supabase Auth.'); return; }
  setMessage(byId<HTMLElement>('login-error'), 'Verificando acceso…');
  const { data: result, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { setMessage(byId<HTMLElement>('login-error'), error.message); return; }
  await showDashboard(result.user);
});

const hasLogin = Boolean(document.getElementById('login-form'));
if (sessionStorage.getItem(DEMO_SESSION_KEY) && temporaryCredentials) showDemoDashboard();
else if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (sessionStorage.getItem(DEMO_SESSION_KEY) && temporaryCredentials) return;
    if (session?.user) void showDashboard(session.user);
    else {
      currentUser = null;
      if (!hasLogin) { window.location.href = '/admin/'; return; }
      const db = document.getElementById('dashboard'); if (db) db.hidden = true;
      const lp = document.getElementById('login-panel'); if (lp) lp.hidden = false;
    }
  });
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) void showDashboard(data.session.user);
    else if (!hasLogin) window.location.href = '/admin/';
  });
}

byId<HTMLButtonElement>('logout-button')?.addEventListener('click', async () => {
  if (demoMode) { sessionStorage.removeItem(DEMO_SESSION_KEY); demoMode = false; const db = document.getElementById('dashboard'); if (db) db.hidden = true; const lp = document.getElementById('login-panel'); if (lp) lp.hidden = false; currentUser = null; }
  else await supabase?.auth.signOut();
});
byId<HTMLButtonElement>('refresh-button')?.addEventListener('click', () => void loadProducts());
byId<HTMLInputElement>('inventory-search')?.addEventListener('input', renderProducts);
byId<HTMLButtonElement>('cancel-edit')?.addEventListener('click', resetForm);

const fileInput = (document.getElementById('product-form') as HTMLFormElement | null)?.elements.namedItem('imagen') as HTMLInputElement | null;
fileInput?.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  const ip = byId<HTMLImageElement>('image-preview');
  if (!file) { if (ip) ip.hidden = true; return; }
  if (file.size > 6 * 1024 * 1024) { fileInput.value = ''; setMessage(byId<HTMLElement>('product-message'), 'La imagen supera el máximo de 6 MB.'); return; }
  if (ip) { ip.src = URL.createObjectURL(file); ip.hidden = false; }
});

const productForm = byId<HTMLFormElement>('product-form');
productForm?.addEventListener('submit', async (event) => {
  event.preventDefault(); if (!currentUser && !demoMode) return;
  const fields = formData(); if (!fields) return;
  const id = String(fields.get('id') || crypto.randomUUID());
  const file = (fields.get('imagen') as File | null);
  const fileInputEl = productForm.elements.namedItem('imagen') as HTMLInputElement;
  const actualFile = fileInputEl?.files?.[0];
  const urlInput = String(fields.get('imagenUrl') || '').trim();
  let imageUrl = String(fields.get('existing_image') || '') || null;
  const saveButton = byId<HTMLButtonElement>('save-button'); if (saveButton) saveButton.disabled = true;
  setMessage(byId<HTMLElement>('product-message'), 'Guardando producto…');
  try {
    if (actualFile && demoMode) {
      if (actualFile.size > 3 * 1024 * 1024) throw new Error('Para el modo local, usá una imagen menor a 3 MB.');
      imageUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('No se pudo leer la imagen.')); reader.readAsDataURL(actualFile); });
    } else if (actualFile) {
      const extension = actualFile.name.split('.').pop()?.toLowerCase() || 'jpg'; const path = `${currentUser!.id}/${id}.${extension}`;
      const { error: uploadError } = await supabase!.storage.from('product-images').upload(path, actualFile, { upsert: true, contentType: actualFile.type });
      if (uploadError) throw uploadError;
      imageUrl = supabase!.storage.from('product-images').getPublicUrl(path).data.publicUrl;
    } else if (urlInput) {
      const parsed = new URL(urlInput); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('La URL de imagen debe comenzar con https://'); imageUrl = parsed.href;
    }
    const product = {
      id, titulo: String(fields.get('titulo')).trim(), precio: Number(fields.get('precio')),
      precio_anterior: fields.get('precioAnterior') ? Number(fields.get('precioAnterior')) : null,
      descripcion: String(fields.get('descripcion') || '').trim() || null, categoria: String(fields.get('categoria')),
      talles: String(fields.get('talles') || '').split(',').map((v) => v.trim()).filter(Boolean),
      colores: String(fields.get('colores') || '').split(',').map((v) => v.trim()).filter(Boolean), imagen_url: imageUrl,
      secciones: fields.getAll('secciones').map(String),
      nuevo: fields.getAll('secciones').includes('novedades'), destacado: fields.getAll('secciones').includes('mas-vendidos'), en_stock: fields.get('enStock') === 'on',
    };
    if (demoMode) {
      const localProduct = { ...product, descripcion: product.descripcion ?? '', created_at: products.find((item) => item.id === id)?.created_at ?? new Date().toISOString() } as Product;
      const updated = products.some((item) => item.id === id) ? products.map((item) => item.id === id ? localProduct : item) : [localProduct, ...products];
      writeDemoProducts(updated);
    } else {
      const { error } = await supabase!.from('products').upsert(product); if (error) throw error;
    }
    setMessage(byId<HTMLElement>('product-message'), 'Catálogo actualizado correctamente.', true);
    resetForm(); await loadProducts();
    // if on producto page and came with ?id, clean url
    if (new URLSearchParams(location.search).get('id')) history.replaceState({}, '', '/admin/producto/');
  } catch (error) { setMessage(byId<HTMLElement>('product-message'), error instanceof Error ? error.message : 'No se pudo guardar el producto.'); }
  finally { if (saveButton) saveButton.disabled = false; }
});

// Load product for editing if ?id= present
const editId = new URLSearchParams(location.search).get('id');
if (editId) {
  // ensure products loaded
  const tryEdit = async () => {
    if (!products.length) await loadProducts();
    const p = products.find((x) => x.id === editId);
    if (p) editProduct(p);
  };
  // delay to allow auth load
  setTimeout(() => { void tryEdit(); }, 800);
}

// Load products on pages that have product list
if (document.getElementById('product-list')) void loadProducts();
// If overview stats present but no list, still load for stats
if (document.getElementById('stat-products') && !document.getElementById('product-list')) void loadProducts();