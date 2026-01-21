// js/ui.js
// Centraliza seletores e helpers visuais

export const UI = {
  // Top actions
  searchInput: document.querySelector("#searchInput"),
  clearSearchBtn: document.querySelector("#clearSearchBtn"),
  openOrdersBtn: document.querySelector("#openOrdersBtn"),
  ordersBadge: document.querySelector("#ordersBadge"),
  openCartBtn: document.querySelector("#openCartBtn"),
  cartCount: document.querySelector("#cartCount"),
  topbarCenter: document.querySelector("#topbarCenter"),
  topbarActions: document.querySelector("#topbarActions"),
  userBox: document.querySelector("#userBox"),
  userMenuBtn: document.querySelector("#userMenuBtn"),
  userMenu: document.querySelector("#userMenu"),
  userRoleLabel: document.querySelector("#userRoleLabel"),
  userNameLabel: document.querySelector("#userNameLabel"),
  logoutBtn: document.querySelector("#logoutBtn"),

  // Scope
  scopeBtn: document.querySelector("#scopeBtn"),
  scopeModal: document.querySelector("#scopeModal"),
  closeScopeBtn: document.querySelector("#closeScopeBtn"),
  applyScopeBtn: document.querySelector("#applyScopeBtn"),
  scopeArea: document.querySelector("#scopeArea"),
  scopeNiche: document.querySelector("#scopeNiche"),
  scopeHours: document.querySelector("#scopeHours"),
  scopeSla: document.querySelector("#scopeSla"),
  pilotArea: document.querySelector("#pilotArea"),
  pilotSla: document.querySelector("#pilotSla"),
  pilotHours: document.querySelector("#pilotHours"),

  // Sidebar
  categoryList: document.querySelector("#categoryList"),
  storeList: document.querySelector("#storeList"),

  // Content
  productGrid: document.querySelector("#productGrid"),
  resultsHint: document.querySelector("#resultsHint"),
  sortSelect: document.querySelector("#sortSelect"),

  // KPI
  kpiAvgTime: document.querySelector("#kpiAvgTime"),
  kpiCancel: document.querySelector("#kpiCancel"),
  kpiTicket: document.querySelector("#kpiTicket"),
  viewMetricsBtn: document.querySelector("#viewMetricsBtn"),
  startDemoBtn: document.querySelector("#startDemoBtn"),

  // Overlay / cart
  overlay: document.querySelector("#overlay"),
  cartDrawer: document.querySelector("#cartDrawer"),
  closeCartBtn: document.querySelector("#closeCartBtn"),
  cartItems: document.querySelector("#cartItems"),
  subtotalValue: document.querySelector("#subtotalValue"),
  deliveryFeeValue: document.querySelector("#deliveryFeeValue"),
  totalValue: document.querySelector("#totalValue"),
  clearCartBtn: document.querySelector("#clearCartBtn"),
  checkoutBtn: document.querySelector("#checkoutBtn"),
  miniCartBar: document.querySelector("#miniCartBar"),
  miniCartItemsCount: document.querySelector("#miniCartItemsCount"),
  miniCartTotal: document.querySelector("#miniCartTotal"),
  miniCartEta: document.querySelector("#miniCartEta"),
  miniCartBtn: document.querySelector("#miniCartBtn"),

  // Checkout fields
  customerName: document.querySelector("#customerName"),
  customerPhone: document.querySelector("#customerPhone"),
  addressLine1: document.querySelector("#addressLine1"),
  addressDistrict: document.querySelector("#addressDistrict"),
  addressExtra: document.querySelector("#addressExtra"),
  paymethodRadios: document.querySelectorAll('input[name="paymethod"]'),

  // Orders modal
  ordersModal: document.querySelector("#ordersModal"),
  closeOrdersBtn: document.querySelector("#closeOrdersBtn"),
  ordersList: document.querySelector("#ordersList"),
  simulateNextStepBtn: document.querySelector("#simulateNextStepBtn"),
  resetOrdersBtn: document.querySelector("#resetOrdersBtn"),

  // Loja/Admin views
  storeSidebar: document.querySelector("#storeSidebar"),
  storeSidebarToggle: document.querySelector("#storeSidebarToggle"),
  storeSidebarName: document.querySelector("#storeSidebarName"),
  storeSidebarFooter: document.querySelector("#storeSidebarFooter"),
  storeNavButtons: document.querySelectorAll("[data-store-nav]"),
  storeSections: document.querySelectorAll(".store-section"),
  storeSelectLoja: document.querySelector("#storeSelectLoja"),
  storeKpis: document.querySelector("#storeKpis"),
  storeOrders: document.querySelector("#storeOrders"),
  storeTopProducts: document.querySelector("#storeTopProducts"),
  storeProductForm: document.querySelector("#storeProductForm"),
  storeProductName: document.querySelector("#storeProductName"),
  storeProductCategory: document.querySelector("#storeProductCategory"),
  storeProductPrice: document.querySelector("#storeProductPrice"),
  storeProductBadge: document.querySelector("#storeProductBadge"),
  storeProductImage: document.querySelector("#storeProductImage"),
  storeProductAvailable: document.querySelector("#storeProductAvailable"),
  storeProductsList: document.querySelector("#storeProductsList"),

  adminSeedDemo: document.querySelector("#adminSeedDemo"),
  adminClearAll: document.querySelector("#adminClearAll"),
  adminKpis: document.querySelector("#adminKpis"),
  adminOrders: document.querySelector("#adminOrders"),
  adminStores: document.querySelector("#adminStores"),

  // Toast
  toast: document.querySelector("#toast"),

  // Login forms
  loginCustomerForm: document.querySelector("#loginCustomerForm"),
  loginCustomerName: document.querySelector("#loginCustomerName"),
  loginCustomerPhone: document.querySelector("#loginCustomerPhone"),
  loginCustomerEmail: document.querySelector("#loginCustomerEmail"),
  loginCustomerBtn: document.querySelector("#loginCustomerBtn"),

  loginStoreForm: document.querySelector("#loginStoreForm"),
  loginStoreSelect: document.querySelector("#loginStoreSelect"),
  loginStoreOperator: document.querySelector("#loginStoreOperator"),
  loginStoreEmail: document.querySelector("#loginStoreEmail"),
  loginStoreBtn: document.querySelector("#loginStoreBtn"),

  loginAdminForm: document.querySelector("#loginAdminForm"),
  loginAdminEmail: document.querySelector("#loginAdminEmail"),
  loginAdminPass: document.querySelector("#loginAdminPass"),
  loginAdminBtn: document.querySelector("#loginAdminBtn"),
};

export const money = (value) =>
  (Number(value) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function show(el) {
  el?.classList.remove("hidden");
}
export function hide(el) {
  el?.classList.add("hidden");
}

export function toast(message) {
  if (!UI.toast) {
    alert(message);
    return;
  }
  UI.toast.textContent = message;
  UI.toast.classList.remove("hidden");
  UI.toast.classList.add("is-in");
  setTimeout(() => UI.toast.classList.remove("is-in"), 2200);
  setTimeout(() => UI.toast.classList.add("hidden"), 2600);
}

export function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function uid(prefix = "ORD") {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rnd = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}-${y}${m}${day}-${rnd}`;
}

export function nowISO() {
  return new Date().toISOString();
}

export function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
