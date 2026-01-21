// js/storage.js
// Estado global + persistência localStorage

import { DATA } from "./data.js";

const LS_KEYS = {
  CART: "fl_cart_v1",
  ORDERS: "fl_orders_v1",
  SCOPE: "fl_scope_v1",
  FILTERS: "fl_filters_v1",
  AUTH: "fl_auth_v1",
  PRODUCTS: "fl_products_v1",
};

export const State = {
  cart: {
    items: [], // [{productId, qty}]
    storeId: null, // força 1 loja por pedido
  },

  orders: [], // [{id, createdAt, storeId, items, subtotal, deliveryFee, total, statusIndex, paymethod, customer, address}]

  scope: {
    area: "1–2 bairros",
    niche: "Acessórios de celular",
    hours: "10h–20h",
    sla: "60–90 min",
  },

  filters: {
    search: "",
    category: "all",
    store: "all",
    sort: "relevance",
    lojaSelectedStoreId: "all",
    storeSearch: "",
    collapseCategories: false,
    collapseStores: false,
    collapseRules: false,
  },

  auth: {
    customer: { loggedIn: false, name: "", phone: "", email: "" },
    store: { loggedIn: false, storeId: "", operator: "", email: "" },
    admin: { loggedIn: false, name: "", email: "" },
  },

  // data-backed collections (seeded from DATA)
  products: Array.isArray(DATA.products) ? [...DATA.products] : [],
  stores: Array.isArray(DATA.stores) ? [...DATA.stores] : [],
  categories: Array.isArray(DATA.categories) ? [...DATA.categories] : [],
};

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadAllState() {
  const cart = safeParse(localStorage.getItem(LS_KEYS.CART), null);
  const orders = safeParse(localStorage.getItem(LS_KEYS.ORDERS), null);
  const scope = safeParse(localStorage.getItem(LS_KEYS.SCOPE), null);
  const filters = safeParse(localStorage.getItem(LS_KEYS.FILTERS), null);
  const auth = safeParse(localStorage.getItem(LS_KEYS.AUTH), null);
  const products = safeParse(localStorage.getItem(LS_KEYS.PRODUCTS), null);

  if (cart && Array.isArray(cart.items)) State.cart = cart;
  if (orders && Array.isArray(orders)) State.orders = orders;
  if (scope) State.scope = { ...State.scope, ...scope };
  if (filters) State.filters = { ...State.filters, ...filters };
  if (auth) State.auth = { ...State.auth, ...auth };
  if (products && Array.isArray(products)) State.products = products;

  // limpeza: remove itens inválidos (baseado no conjunto atual de products)
  State.cart.items = State.cart.items.filter((it) => State.products.some((p) => p.id === it.productId));
  if (State.cart.storeId && !State.stores.some((s) => s.id === State.cart.storeId)) {
    State.cart.storeId = null;
    State.cart.items = [];
  }

  // ensure collections are available (if DATA changed or localStorage had empties)
  if (!Array.isArray(State.products)) {
    State.products = Array.isArray(DATA.products) ? [...DATA.products] : [];
  }
  if (!Array.isArray(State.stores) || State.stores.length === 0) {
    State.stores = Array.isArray(DATA.stores) ? [...DATA.stores] : [];
  }
  if (!Array.isArray(State.categories) || State.categories.length === 0) {
    State.categories = Array.isArray(DATA.categories) ? [...DATA.categories] : [];
  }

  State.products = State.products.map((p) => ({
    ...p,
    available: p.available !== false,
  }));
  State.products = State.products.filter((p) => State.stores.some((s) => s.id === p.storeId));
}

export function saveAllState() {
  localStorage.setItem(LS_KEYS.CART, JSON.stringify(State.cart));
  localStorage.setItem(LS_KEYS.ORDERS, JSON.stringify(State.orders));
  localStorage.setItem(LS_KEYS.SCOPE, JSON.stringify(State.scope));
  localStorage.setItem(LS_KEYS.FILTERS, JSON.stringify(State.filters));
  localStorage.setItem(LS_KEYS.AUTH, JSON.stringify(State.auth));
  localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(State.products));
}

export function resetAllData() {
  localStorage.removeItem(LS_KEYS.CART);
  localStorage.removeItem(LS_KEYS.ORDERS);
  localStorage.removeItem(LS_KEYS.SCOPE);
  localStorage.removeItem(LS_KEYS.FILTERS);
  localStorage.removeItem(LS_KEYS.AUTH);
  localStorage.removeItem(LS_KEYS.PRODUCTS);

  // volta pro padrão em memória também
  State.cart = { items: [], storeId: null };
  State.orders = [];
  State.scope = {
    area: "1–2 bairros",
    niche: "Acessórios de celular",
    hours: "10h–20h",
    sla: "60–90 min",
  };
  State.filters = {
    search: "",
    category: "all",
    store: "all",
    sort: "relevance",
    lojaSelectedStoreId: "all",
    storeSearch: "",
    collapseCategories: false,
    collapseStores: false,
    collapseRules: false,
  };
  State.auth = {
    customer: { loggedIn: false, name: "", phone: "", email: "" },
    store: { loggedIn: false, storeId: "", operator: "", email: "" },
    admin: { loggedIn: false, name: "", email: "" },
  };

  // restore collections from DATA
  State.products = Array.isArray(DATA.products) ? [...DATA.products] : [];
  State.stores = Array.isArray(DATA.stores) ? [...DATA.stores] : [];
  State.categories = Array.isArray(DATA.categories) ? [...DATA.categories] : [];
}

/* Helper getters used across the app */
export function getProductById(id) {
  return State.products.find((p) => p.id === id) || null;
}

export function getStoreById(id) {
  return State.stores.find((s) => s.id === id) || null;
}

export function getCategoryById(id) {
  return State.categories.find((c) => c.id === id) || null;
}

export function getProducts() {
  return [...State.products];
}

export function getStores() {
  return [...State.stores];
}
