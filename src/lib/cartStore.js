// Simple cart state using localStorage
const CART_KEY = 'petdining_cart';

export function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cart-updated'));
}

export function addToCart(product, qty = 1) {
  const items = getCart();
  const existing = items.find(i => i.sku === product.sku);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({
      sku: product.sku,
      product_name: product.name,
      price: product.wholesale_price,
      qty: Math.max(qty, product.min_order || 1),
      min_order: product.min_order || 1,
      image: product.image1,
    });
  }
  saveCart(items);
  return items;
}

export function updateCartQty(sku, qty) {
  const items = getCart();
  const item = items.find(i => i.sku === sku);
  if (item) {
    item.qty = qty;
  }
  saveCart(items);
  return items;
}

export function removeFromCart(sku) {
  const items = getCart().filter(i => i.sku !== sku);
  saveCart(items);
  return items;
}

export function clearCart() {
  saveCart([]);
}

export function getCartTotal(items) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

export function getCartItemCount(items) {
  return items.reduce((sum, i) => sum + i.qty, 0);
}