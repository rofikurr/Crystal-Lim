const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const cart = [];
// Persist product IDs only; never store addresses or payment data in the browser.
try {
  const saved = JSON.parse(localStorage.getItem('crystal-lim-cart-v1') || '[]');
  if (Array.isArray(saved)) for (const row of saved.slice(0, 6)) {
    const product = window.crystalCatalog.find(p => p.id === row.id);
    if (product && Number.isInteger(row.quantity) && row.quantity > 0 && row.quantity <= 10 && !cart.some(p => p.id === row.id)) {
      for (let i = 0; i < row.quantity; i++) cart.push({ id: product.id, name: product.name, price: product.price, image: product.image });
    }
  }
} catch { /* Storage can be disabled in private/file previews. */ }

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

// Keep storefront prices consistent with the cart, using Indonesian formatting.
qsa('.product').forEach(product => {
  qs('.product-info strong', product).textContent = rupiah.format(Number(product.dataset.price));
});

const drawer = qs('.cart-drawer');
const checkout = qs('.checkout-view');
const cartItems = qs('.cart-items');
const cartFooter = qs('.cart-footer');
const mobileBar = qs('.mobile-cart-bar');
let drawerOpener, checkoutOpener;
const previousInert = new Map();
function syncOverlayAccess() {
  for (const [el, inert] of previousInert) el.inert = inert;
  previousInert.clear();
  const active = checkout.classList.contains('open') ? checkout : drawer.classList.contains('open') ? drawer : null;
  drawer.inert = active !== drawer; checkout.inert = active !== checkout;
  if (active) for (const el of document.body.children) {
    if (el === active || ['SCRIPT','STYLE','LINK'].includes(el.tagName)) continue;
    previousInert.set(el, el.inert); el.inert = true;
  }
}
drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); drawer.setAttribute('aria-label', 'Keranjang belanja');
checkout.setAttribute('role', 'dialog'); checkout.setAttribute('aria-modal', 'true'); checkout.setAttribute('aria-label', 'Checkout');
syncOverlayAccess();
document.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const active = checkout.classList.contains('open') ? checkout : drawer.classList.contains('open') ? drawer : null;
  if (!active) return;
  const list = qsa('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]', active).filter(el => !el.closest('[hidden]'));
  const first = list[0], last = list.at(-1);
  if (event.shiftKey && (document.activeElement === first || !active.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && (document.activeElement === last || !active.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
});

function cartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price, 0);
}

function renderCart() {
  window.dispatchEvent(new Event('cart:changed'));
  const grouped = Object.values(cart.reduce((result, item, index) => {
    const id = item.id || window.crystalCatalog.find(p => p.name === item.name)?.id;
    if (!result[id]) result[id] = { ...item, id, index, quantity: 0 };
    result[id].quantity++; return result;
  }, {}));
  try { localStorage.setItem('crystal-lim-cart-v1', JSON.stringify(grouped.map(({id,quantity}) => ({id,quantity})))); } catch {}
  const count = cart.length;
  const total = cartSubtotal();
  qs('.cart-count').textContent = count;
  qs('.cart-button').setAttribute('aria-label', `Buka keranjang, ${count} barang`);
  qs('.mobile-cart-count').textContent = `${count} barang`;
  qs('.mobile-cart-total').textContent = rupiah.format(total);
  mobileBar.hidden = count === 0;

  if (!count) {
    cartItems.innerHTML = '<div class="empty-cart"><span>◇</span><h3>Keranjang masih kosong</h3><p>Pilih kristal yang paling menarik perhatianmu.</p></div>';
    cartFooter.hidden = true;
  } else {
    cartItems.innerHTML = grouped.map(item => `
      <div class="cart-item">
        <img src="${escapeHtml(item.image)}" alt="">
        <div><b>${escapeHtml(item.name)}</b><small>${rupiah.format(item.price)} / buah</small><div class="cart-quantity"><button data-cart-change="-1" data-index="${item.index}" aria-label="Kurangi ${escapeHtml(item.name)}">−</button><span aria-label="Jumlah">${item.quantity}</span><button data-cart-change="1" data-index="${item.index}" aria-label="Tambah ${escapeHtml(item.name)}" ${item.quantity >= 10 ? 'disabled' : ''}>+</button></div></div>
        <button class="remove-item" data-id="${escapeHtml(item.id)}" aria-label="Hapus ${escapeHtml(item.name)}">×</button>
      </div>`).join('');
    cartFooter.hidden = false;
    qs('.cart-total strong').textContent = rupiah.format(total);
  }

  qs('.summary-items').innerHTML = grouped.map(item => `
    <div class="summary-item"><img src="${escapeHtml(item.image)}" alt=""><b>${escapeHtml(item.name)} × ${item.quantity}</b><strong>${rupiah.format(item.price * item.quantity)}</strong></div>`).join('');
  qs('.summary-subtotal').textContent = rupiah.format(total);
  qs('.summary-total').textContent = rupiah.format(total);
}

function openDrawer() {
  drawerOpener = document.activeElement;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  syncOverlayAccess(); qs('.drawer-close').focus();
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  syncOverlayAccess(); drawerOpener?.focus();
}

function openCheckout() {
  if (!cart.length) return;
  checkoutOpener = drawer.classList.contains('open') ? drawerOpener : document.activeElement;
  closeDrawer();
  checkout.classList.add('open');
  checkout.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  checkout.scrollTop = 0;
  syncOverlayAccess();
  qs('.checkout-back').focus();
}

function closeCheckout() {
  checkout.classList.remove('open');
  checkout.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  syncOverlayAccess(); checkoutOpener?.focus();
  window.dispatchEvent(new Event('checkout:closed'));
}


qs('.cart-button').addEventListener('click', openDrawer);
qs('.mobile-cart-bar button').addEventListener('click', openDrawer);
qs('.drawer-close').addEventListener('click', closeDrawer);
qs('.drawer-backdrop').addEventListener('click', closeDrawer);
qs('.checkout-button').addEventListener('click', openCheckout);
qs('.start-cod')?.addEventListener('click', openCheckout);
qs('.checkout-back').addEventListener('click', closeCheckout);

cartItems.addEventListener('click', event => {
  const change = event.target.closest('[data-cart-change]');
  if (change) {
    const index = Number(change.dataset.index), item = cart[index];
    if (!item) return;
    if (change.dataset.cartChange === '-1') cart.splice(index, 1);
    else if (cart.filter(p => p.id === item.id).length < 10) cart.push({...item});
    renderCart(); qs('[data-cart-change]', cartItems)?.focus(); return;
  }
  const remove = event.target.closest('.remove-item');
  if (!remove) return;
  for (let i = cart.length - 1; i >= 0; i--) if (cart[i].id === remove.dataset.id) cart.splice(i, 1);
  renderCart();
  (qs('.remove-item', cartItems) || qs('.drawer-close')).focus();
});

const catalogProducts = qsa('.product');
const emptyResults = document.createElement('div');
emptyResults.className = 'empty-results'; emptyResults.hidden = true;
emptyResults.innerHTML = '<h3>Produk belum ditemukan</h3><p>Coba kata lain atau tampilkan semua koleksi.</p><button type="button">Reset pencarian & filter</button>';
qs('.product-grid').after(emptyResults);
emptyResults.querySelector('button').addEventListener('click', () => { qs('#search-input').value = ''; qs('.filter[data-filter="all"]').click(); });
qs('#result-count').parentElement.setAttribute('role', 'status');
function refreshCatalog() {
  const selected = qs('.filter.active')?.dataset.filter || 'all';
  const query = qs('#search-input').value.toLowerCase().trim();
  catalogProducts.forEach(product => {
    const productCategories = product.dataset.category ? product.dataset.category.split(',') : [];
    product.hidden = (selected !== 'all' && !productCategories.includes(selected)) || !product.dataset.name.toLowerCase().includes(query);
  });
  qs('#result-count').textContent = catalogProducts.filter(product => !product.hidden).length;
  emptyResults.hidden = catalogProducts.some(product => !product.hidden);
  qsa('.filter').forEach(item => item.setAttribute('aria-pressed', String(item.classList.contains('active'))));
}
qs('#product-sort').addEventListener('change', event => {
  const sorted = [...catalogProducts];
  if (event.target.value !== 'default') sorted.sort((a, b) => (Number(a.dataset.price) - Number(b.dataset.price)) * (event.target.value === 'low' ? 1 : -1));
  sorted.forEach(product => qs('.product-grid').append(product));
});
qsa('.filter').forEach(filter => filter.addEventListener('click', () => {
  qsa('.filter').forEach(item => item.classList.remove('active'));
  filter.classList.add('active');
  refreshCatalog();
}));

qsa('.category-card').forEach(card => card.addEventListener('click', () => {
  const target = qs(`.filter[data-filter="${card.dataset.filter}"]`);
  if (target) target.click();
}));

qsa('.wish').forEach(button => { button.setAttribute('aria-pressed', 'false'); button.addEventListener('click', () => {
  button.classList.toggle('saved');
  button.setAttribute('aria-pressed', String(button.classList.contains('saved')));
  button.textContent = button.classList.contains('saved') ? '♥' : '♡';
}); });

const categoryToggle = qs('.category-toggle');
const categoryMenu = qs('.category-menu');
categoryToggle?.addEventListener('click', () => {
  const willOpen = categoryMenu.hidden;
  categoryMenu.hidden = !willOpen;
  categoryToggle.setAttribute('aria-expanded', String(willOpen));
});

const slides = qsa('.hero-slide');
const dots = qsa('.slider-dots button');
let currentSlide = 0;
function showSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === currentSlide));
  dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === currentSlide));
}
qs('.slider-prev')?.addEventListener('click', () => showSlide(currentSlide - 1));
qs('.slider-next')?.addEventListener('click', () => showSlide(currentSlide + 1));
dots.forEach((dot, index) => dot.addEventListener('click', () => showSlide(index)));

const welcomeToggle = qs('.welcome-toggle');
const welcomeMore = qs('.welcome-more');
welcomeToggle?.addEventListener('click', () => {
  const willOpen = welcomeMore.hidden;
  welcomeMore.hidden = !willOpen;
  welcomeToggle.setAttribute('aria-expanded', String(willOpen));
  welcomeToggle.firstChild.textContent = willOpen ? 'Tampilkan lebih sedikit ' : 'Baca selengkapnya ';
});

const menuButton = qs('.menu-button');
const mobileMenu = qs('.mobile-menu');
menuButton.setAttribute('aria-controls', 'mobile-navigation');
function positionMobileMenu() {
  const top = Math.max(0, qs('.site-header').getBoundingClientRect().bottom) + 8;
  mobileMenu.style.top = `${top}px`;
  mobileMenu.style.maxHeight = `calc(100dvh - ${top + 16}px)`;
}
function closeMobileMenu(restoreFocus = false) {
  mobileMenu.hidden = true;
  menuButton.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Buka menu');
  qsa('details', mobileMenu).forEach(group => { group.open = false; });
  if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const willOpen = mobileMenu.hidden;
  if (!willOpen) return closeMobileMenu();
  positionMobileMenu();
  mobileMenu.hidden = false;
  menuButton.classList.add('open');
  menuButton.setAttribute('aria-expanded', 'true');
  menuButton.setAttribute('aria-label', 'Tutup menu');
  qs('a', mobileMenu).focus();
});
qsa('.mobile-menu a').forEach(link => link.addEventListener('click', () => closeMobileMenu()));
document.addEventListener('click', event => {
  if (!mobileMenu.hidden && !mobileMenu.contains(event.target) && !menuButton.contains(event.target)) closeMobileMenu();
});
document.addEventListener('focusin', event => {
  if (!mobileMenu.hidden && !mobileMenu.contains(event.target) && !menuButton.contains(event.target)) closeMobileMenu();
});
window.addEventListener('resize', () => { if (!mobileMenu.hidden) positionMobileMenu(); });
window.addEventListener('scroll', () => { if (!mobileMenu.hidden) positionMobileMenu(); }, { passive: true });

const searchPanel = qs('.search-panel');
function positionSearch() {
  if (!searchPanel.hidden) searchPanel.style.top = `${qs('.site-header').getBoundingClientRect().bottom + 8}px`;
}
window.addEventListener('scroll', positionSearch, {passive:true});
window.addEventListener('resize', positionSearch);
qsa('.search-toggle').forEach(toggle => toggle.addEventListener('click', () => {
  window.dispatchEvent(new CustomEvent('catalog:navigate', {detail: '#pilihan'}));
  closeMobileMenu();
  searchPanel.hidden = false;
  positionSearch();
  setTimeout(() => qs('#search-input').focus(), 0);
}));
qs('.search-close').addEventListener('click', () => { searchPanel.hidden = true; });
qs('#search-input').addEventListener('input', event => {
  refreshCatalog();
});


document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!mobileMenu.hidden) { event.preventDefault(); closeMobileMenu(true); return; }
  if (!searchPanel.hidden) { event.preventDefault(); searchPanel.hidden = true; qs('.search-toggle').focus(); return; }
  if (checkout.classList.contains('open')) { event.preventDefault(); closeCheckout(); }
  else if (drawer.classList.contains('open')) { event.preventDefault(); closeDrawer(); }
});

renderCart();
refreshCatalog();
